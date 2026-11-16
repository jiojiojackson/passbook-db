const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const pool = require('../lib/db');
const { issueSession, issueProof, verifyProof } = require('../lib/auth');
const { decrypt } = require('../lib/encryption');
const { invoke } = require('../test-support/http');
const login = require('../api/login');
const signup = require('../api/signup');
const passwords = require('../api/passwords');
const refresh = require('../api/refresh-token');
const manage = require('../api/webauthn-manage');

process.env.JWT_SECRET = 'test-only-secret-not-a-production-key';
process.env.TOKEN_TIME = '1h';
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
const password = 'test-account-password';
const hash = bcrypt.hashSync(password, 4);

test('a verified external session alone cannot log into an arbitrary account', async t => {
  t.mock.method(pool, 'query', () => assert.fail('Must reject before querying'));
  t.mock.method(globalThis, 'fetch', () => assert.fail('Must not query external session'));
  const res = await invoke(login, { body: { username: 'victim', sessionId: 'verified-session' } });
  assert.equal(res.statusCode, 401);
});

test('invalid password never creates a second-factor session', async t => {
  t.mock.method(pool, 'query', async () => ({ rows: [{ id: 12, password_hash: hash }] }));
  t.mock.method(globalThis, 'fetch', () => assert.fail('Wrong password must not reach auth service'));
  const res = await invoke(login, { body: { username: 'alice', password: 'wrong-password' } });
  assert.equal(res.statusCode, 401);
});

test('second-factor proof is bound to account and session, and can be used once', async t => {
  const pending = new Set();
  t.mock.method(pool, 'query', async (sql, args) => {
    if (sql.includes('SELECT id, password_hash')) return { rows: [{ id: 12, password_hash: hash }] };
    if (sql.includes('SELECT id FROM users WHERE id')) return { rows: args[0] === 12 && args[1] === 'alice' ? [{ id: 12 }] : [] };
    if (sql.startsWith('INSERT INTO webauthn_challenges')) { pending.add(args[1]); return { rowCount: 1 }; }
    if (sql.includes('RETURNING challenge')) return { rowCount: args[0] === 12 && pending.delete(args[1]) ? 1 : 0 };
    if (sql.startsWith('DELETE FROM webauthn_challenges')) return { rowCount: 0 };
    assert.fail('Unexpected database operation');
  });
  t.mock.method(globalThis, 'fetch', async url => ({
    ok: true,
    json: async () => String(url).includes('/create')
      ? { success: true, data: { sessionId: 'owned-session', clientNumber: 123, expiresAt: new Date(Date.now() + 300000).toISOString() } }
      : { success: true, data: { status: 'verified' } },
  }));
  const start = await invoke(login, { body: { username: 'alice', password } });
  assert.equal(start.statusCode, 200);
  const proof = verifyProof(start.data.loginProof, 'login-2fa');
  assert.equal(proof.userId, 12);
  const finishBody = { username: 'alice', sessionId: start.data.sessionId, loginProof: start.data.loginProof };
  assert.equal((await invoke(login, { body: { ...finishBody, username: 'bob' } })).statusCode, 401);
  assert.equal((await invoke(login, { body: { ...finishBody, sessionId: 'other-session' } })).statusCode, 401);
  const finish = await invoke(login, { body: finishBody });
  assert.equal(finish.statusCode, 200);
  assert.equal(verifyProof(finish.data.token, 'session').userId, 12);
  assert.equal((await invoke(login, { body: finishBody })).statusCode, 401);
});

test('unverified second-factor session cannot complete login', async t => {
  t.mock.method(pool, 'query', async () => ({ rows: [{ id: 12 }] }));
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ success: true, data: { status: 'pending' } }) }));
  const proof = issueProof({ userId: 12, sessionId: 's', challenge: 'c' }, 'login-2fa');
  assert.equal((await invoke(login, { body: { username: 'alice', sessionId: 's', loginProof: proof } })).statusCode, 401);
});

test('vault and device management reject intermediate proofs and unauthenticated access', async t => {
  t.mock.method(pool, 'query', () => assert.fail('Unauthorized access must not reach the database'));
  for (const handler of [passwords, manage]) {
    assert.equal((await invoke(handler, { method: 'GET' })).statusCode, 401);
    assert.equal((await invoke(handler, { method: 'GET', token: issueProof({ userId: 12 }, 'login-2fa') })).statusCode, 401);
  }
});

test('vault writes are encrypted and every CRUD query is scoped to the authenticated account', async t => {
  const token = issueSession(12);
  let record;
  t.mock.method(pool, 'query', async (sql, args) => {
    if (sql.startsWith('INSERT INTO passwords')) {
      assert.equal(args[0], 12);
      assert.match(args[3], /^v2:/);
      assert.equal(decrypt(args[3], 12), 'stored-secret');
      record = { id: 77, user_id: 12, password: args[3] };
      return { rows: [record] };
    }
    if (sql.startsWith('SELECT')) {
      assert.match(sql, /WHERE user_id = \$1/);
      assert.deepEqual(args, [12]);
      return { rows: [record] };
    }
    if (sql.startsWith('UPDATE')) {
      assert.match(sql, /AND user_id = \$6/);
      assert.equal(args[5], 12);
      return { rows: [] };
    }
    if (sql.startsWith('DELETE')) {
      assert.match(sql, /AND user_id = \$2/);
      assert.deepEqual(args, [77, 12]);
      return { rowCount: 0 };
    }
    assert.fail('Unexpected query');
  });
  const added = await invoke(passwords, { token, body: { url: 'https://example.com', username: null, password: 'stored-secret', remarks: null } });
  assert.equal(added.statusCode, 201);
  assert.equal(added.data.password, 'stored-secret');
  const list = await invoke(passwords, { method: 'GET', token });
  assert.equal(list.data[0].password, 'stored-secret');
  const update = await invoke(passwords, { method: 'PUT', token, body: { current_id: 999, password: 'replacement' } });
  assert.equal(update.statusCode, 404);
  assert.equal((await invoke(passwords, { method: 'DELETE', token, query: { id: '77' } })).statusCode, 404);
});

test('registration validates password byte length before bcrypt or database writes', async t => {
  t.mock.method(pool, 'query', () => assert.fail('Invalid input must not reach the database'));
  for (const body of [undefined, {}, { username: 'a', password: 'short' }, { username: 'a', password: '密'.repeat(25) }]) {
    assert.equal((await invoke(signup, { body })).statusCode, 400);
  }
});

test('session refresh returns 401 for invalid, expired, or deleted-account sessions', async t => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }));
  assert.equal((await invoke(refresh, { token: 'invalid' })).statusCode, 401);
  assert.equal((await invoke(refresh, { token: issueSession(12) })).statusCode, 401);
});

test('sensitive endpoints disallow unsupported methods and disable caching', async () => {
  const handlers = [login, signup, passwords, refresh, manage, require('../api/validate-token'),
    require('../api/webauthn-register'), require('../api/webauthn-authenticate'), require('../api/webauthn-check')];
  for (const handler of handlers) {
    const res = await invoke(handler, { method: 'PATCH' });
    assert.equal(res.statusCode, 405);
    assert.match(res.headers['cache-control'], /no-store/);
    assert.ok(res.headers.allow);
  }
});
