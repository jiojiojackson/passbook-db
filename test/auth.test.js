const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { authenticate, issueSession, issueProof, verifyProof } = require('../lib/auth');
const { invoke } = require('../test-support/http');
const validate = require('../api/validate-token');

process.env.JWT_SECRET = 'test-only-secret-not-a-production-key';
process.env.TOKEN_TIME = '1h';

const request = token => ({ headers: { authorization: 'Bearer ' + token } });
const signed = (payload, extra = {}) => jwt.sign(payload, process.env.JWT_SECRET, {
  issuer: 'passbook', audience: 'session', expiresIn: '1h', ...extra,
});

test('normal sessions are time limited and identify their account', () => {
  const token = issueSession(12);
  assert.equal(authenticate(request(token)).userId, 12);
  assert.equal(jwt.decode(token).aud, 'session');
  assert.ok(jwt.decode(token).exp > jwt.decode(token).iat);
});

test('intermediate login and registration proofs cannot access the vault', () => {
  for (const purpose of ['login-2fa', 'webauthn-register', 'webauthn-authenticate']) {
    const token = issueProof({ userId: 12, challenge: 'test-challenge' }, purpose);
    assert.equal(verifyProof(token, purpose).userId, 12);
    assert.throws(() => authenticate(request(token)), { status: 401 });
    assert.throws(() => verifyProof(token, purpose + '-other'), { status: 401 });
  }
});

test('expired, forged, wrong-algorithm, and malformed sessions are rejected', () => {
  const payload = { userId: 12, lastActivityTime: Date.now() };
  for (const token of [
    signed(payload, { expiresIn: -1 }),
    signed(payload, { algorithm: 'HS384' }),
    signed(payload, { issuer: 'other-app' }),
    signed({ ...payload, userId: '12' }),
    signed({ userId: 12 }),
    signed({ ...payload, lastActivityTime: Date.now() - 3600001 }),
    signed({ ...payload, lastActivityTime: Date.now() + 60000 }),
    issueSession(12) + 'forged',
    'not-a-token',
  ]) assert.throws(() => authenticate(request(token)), { status: 401 });
  assert.throws(() => authenticate({ headers: {} }), { status: 401 });
  assert.throws(() => verifyProof(undefined, 'login-2fa'), { status: 401 });
});

test('invalid timeout configuration never creates an unlimited session', () => {
  process.env.TOKEN_TIME = 'invalid';
  assert.throws(() => issueSession(12));
  process.env.TOKEN_TIME = '1h';
});

test('token validation returns 401 and no-store for invalid sessions', async () => {
  const res = await invoke(validate, { token: 'invalid' });
  assert.equal(res.statusCode, 401);
  assert.match(res.headers['cache-control'], /no-store/);
  const valid = await invoke(validate, { token: issueSession(12) });
  assert.equal(valid.statusCode, 200);
});
