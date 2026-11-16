const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { encrypt, decrypt } = require('../lib/encryption');

process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

test('legacy AES-CBC records remain readable with the existing key', () => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
  const original = '旧密码🔐 example-long-password';
  const value = iv.toString('hex') + ':' + Buffer.concat([cipher.update(original, 'utf8'), cipher.final()]).toString('hex');
  assert.equal(decrypt(value, 12), original);
});

test('new records use randomized authenticated encryption and preserve Unicode', () => {
  for (const value of ['secret', '密码🔐', '', 'x'.repeat(16384)]) {
    const a = encrypt(value, 12);
    const b = encrypt(value, 12);
    assert.match(a, /^v2:/);
    assert.notEqual(a, b);
    assert.equal(decrypt(a, 12), value);
  }
});

test('tampering, truncation, wrong key, and cross-account ciphertext are rejected', () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const value = encrypt('secret', 12);
  const parts = value.split(':');
  parts[3] = (parts[3][0] === '0' ? '1' : '0') + parts[3].slice(1);
  assert.throws(() => decrypt(parts.join(':'), 12));
  assert.throws(() => decrypt(value.slice(0, -1), 12));
  assert.throws(() => decrypt(value, 13));
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  assert.throws(() => decrypt(value, 12));
  process.env.ENCRYPTION_KEY = originalKey;
});

test('invalid encryption configuration fails closed', () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = 'invalid';
  assert.throws(() => encrypt('secret', 12));
  process.env.ENCRYPTION_KEY = originalKey;
});
