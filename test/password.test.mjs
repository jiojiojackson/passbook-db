import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecurePassword } from '../src/utils/password.mjs';

test('generated passwords have the requested length and contain every character class', () => {
  for (let i = 0; i < 100; i++) {
    const value = generateSecurePassword(20);
    assert.equal(value.length, 20);
    for (const group of [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]) assert.match(value, group);
  }
});

test('password generator uses Web Crypto and rejects invalid length', t => {
  const spy = t.mock.method(globalThis.crypto, 'getRandomValues');
  generateSecurePassword();
  assert.ok(spy.mock.callCount() >= 20);
  for (const length of [0, 3, 1025, 5.5]) assert.throws(() => generateSecurePassword(length));
});
