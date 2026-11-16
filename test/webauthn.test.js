const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const pool = require('../lib/db');
const { issueProof, verifyProof } = require('../lib/auth');
const { rpConfig } = require('../lib/webauthn');
const { invoke } = require('../test-support/http');
const { authenticator } = require('../test-support/authenticator');
const register = require('../api/webauthn-register');
const authenticate = require('../api/webauthn-authenticate');

process.env.JWT_SECRET = 'test-only-secret-not-a-production-key';
process.env.APP_ORIGIN = 'https://passbook.test';
process.env.WEBAUTHN_INVITE_CODE = 'test-only-invite';
const password = 'test-account-password';
const passwordHash = bcrypt.hashSync(password, 4);

function database(t, { device, format = 'legacy', counter = 0 } = {}) {
  const pending = new Set();
  const records = device ? new Map([[device.id, {
    public_key: format === 'legacy' ? device.spki : 'cose:' + Buffer.from(device.cose).toString('base64url'),
    counter, transports: '["internal"]',
  }]]) : new Map();
  t.mock.method(pool, 'query', async (sql, args) => {
    if (sql.includes('SELECT id, password_hash FROM users')) return { rows: [{ id: 12, password_hash: passwordHash }] };
    if (sql.includes('SELECT id FROM users')) return { rows: [{ id: 12 }] };
    if (sql.startsWith('SELECT credential_id')) return { rows: [...records].map(([credential_id, value]) => ({ credential_id, transports: value.transports })) };
    if (sql.startsWith('SELECT public_key')) return { rows: args[0] === 12 && records.has(args[1]) ? [records.get(args[1])] : [] };
    if (sql.startsWith('INSERT INTO webauthn_challenges')) { pending.add(args[1]); return { rowCount: 1 }; }
    if (sql.includes('RETURNING challenge')) return { rowCount: args[0] === 12 && pending.delete(args[1]) ? 1 : 0 };
    if (sql.startsWith('DELETE FROM webauthn_challenges')) return { rowCount: 0 };
    if (sql.startsWith('INSERT INTO webauthn_credentials')) {
      assert.equal(args[0], 12);
      records.set(args[1], { public_key: args[2], counter: args[3], transports: args[4] });
      return { rowCount: 1 };
    }
    if (sql.startsWith('UPDATE webauthn_credentials')) {
      const old = records.get(args[2]);
      if (!old || args[1] !== 12 || old.counter !== args[3]) return { rowCount: 0 };
      records.set(args[2], { ...old, counter: args[0] });
      return { rowCount: 1 };
    }
    assert.fail('Unexpected database operation');
  });
  return { records, pending };
}

async function beginAuth() {
  const start = await invoke(authenticate, { body: { action: 'start', username: 'alice' } });
  assert.equal(start.statusCode, 200);
  assert.equal(start.data.options.rpId, 'passbook.test');
  assert.equal(start.data.options.userVerification, 'required');
  return start.data;
}
function finishAuth(start, credential) {
  return invoke(authenticate, { body: { action: 'finish', username: 'alice', ceremonyToken: start.ceremonyToken, credential } });
}

test('a credential ID without a device signature no longer authenticates', async t => {
  const device = authenticator();
  database(t, { device });
  const start = await beginAuth();
  assert.equal((await finishAuth(start, { id: device.id, counter: 0 })).statusCode, 400);
  const unsigned = await invoke(authenticate, { body: { action: 'finish', username: 'alice', challenge: start.options.challenge, credential: { id: device.id } } });
  assert.equal(unsigned.statusCode, 401);
});

for (const kind of ['EC', 'RSA']) {
  test('real ' + kind + ' signatures authenticate existing DER/SPKI devices and reject replay', async t => {
    const device = authenticator(kind);
    const db = database(t, { device });
    const start = await beginAuth();
    const credential = device.assertion(start.options.challenge);
    const finish = await finishAuth(start, credential);
    assert.equal(finish.statusCode, 200, JSON.stringify(finish.data));
    assert.equal(verifyProof(finish.data.token, 'session').userId, 12);
    assert.equal(db.records.get(device.id).counter, 1);
    assert.equal((await finishAuth(start, credential)).statusCode, 401);
  });
}

for (const variant of ['signature', 'origin', 'rpID', 'challenge', 'verification', 'counter', 'credential-id']) {
  test('WebAuthn rejects an invalid ' + variant, async t => {
    const device = authenticator();
    database(t, { device, counter: 1 });
    const start = await beginAuth();
    const opts = { counter: 2 };
    if (variant === 'origin') opts.origin = 'https://attacker.test';
    if (variant === 'rpID') opts.rpID = 'attacker.test';
    if (variant === 'verification') opts.flags = 0x01;
    if (variant === 'counter') opts.counter = 1;
    const credential = device.assertion(variant === 'challenge' ? 'wrong-challenge' : start.options.challenge, opts);
    if (variant === 'signature') credential.response.signature = Buffer.alloc(64).toString('base64url');
    if (variant === 'credential-id') credential.id = credential.rawId = 'unknown-device';
    const finish = await finishAuth(start, credential);
    assert.equal(finish.statusCode, 401);
    assert.equal(finish.data.token, undefined);
  });
}

test('device registration requires the account password as well as the invitation code', async t => {
  const db = database(t);
  const start = await invoke(register, { body: { action: 'start', username: 'alice', password: 'wrong', inviteCode: process.env.WEBAUTHN_INVITE_CODE } });
  assert.equal(start.statusCode, 401);
  assert.equal(db.pending.size, 0);
  const noInvite = await invoke(register, { body: { action: 'start', username: 'alice', password } });
  assert.equal(noInvite.statusCode, 403);
});

test('verified registration stores the attested key and that key can authenticate', async t => {
  const device = authenticator();
  const db = database(t);
  const start = await invoke(register, { body: {
    action: 'start', username: 'alice', password, inviteCode: process.env.WEBAUTHN_INVITE_CODE,
  } });
  assert.equal(start.statusCode, 200);
  const credential = device.registration(start.data.options.challenge);
  const body = { action: 'finish', username: 'alice', ceremonyToken: start.data.ceremonyToken, credential };
  const finish = await invoke(register, { body });
  assert.equal(finish.statusCode, 200, JSON.stringify(finish.data));
  assert.equal(db.records.size, 1);
  assert.match(db.records.get(device.id).public_key, /^cose:/);
  assert.equal((await invoke(register, { body })).statusCode, 401);
  const authStart = await beginAuth();
  assert.equal((await finishAuth(authStart, device.assertion(authStart.options.challenge))).statusCode, 200);
});

test('authentication challenges cannot be reused to enroll an attacker device', async t => {
  const device = authenticator();
  const db = database(t, { device });
  const start = await beginAuth();
  const res = await invoke(register, { body: {
    action: 'finish', username: 'alice', ceremonyToken: start.ceremonyToken,
    credential: device.registration(start.options.challenge),
  } });
  assert.equal(res.statusCode, 401);
  assert.equal(db.records.size, 1);
});

test('registration rejects a response from another origin before storing a key', async t => {
  const device = authenticator();
  const db = database(t);
  db.pending.add('registration-challenge');
  const proof = issueProof({ userId: 12, username: 'alice', challenge: 'registration-challenge' }, 'webauthn-register');
  const res = await invoke(register, { body: {
    action: 'finish', username: 'alice', ceremonyToken: proof,
    credential: device.registration('registration-challenge', { origin: 'https://attacker.test' }),
  } });
  assert.equal(res.statusCode, 400);
  assert.equal(db.records.size, 0);
});

test('relying party identity comes from configuration, independently of request headers', () => {
  assert.deepEqual(rpConfig(), { rpID: 'passbook.test', origin: 'https://passbook.test' });
  process.env.APP_ORIGIN = 'http://attacker.test';
  assert.throws(() => rpConfig());
  process.env.APP_ORIGIN = 'https://passbook.test';
});
