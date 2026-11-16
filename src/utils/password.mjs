const groups = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '!@#$%^&*()_-+=<>?',
];

function randomIndex(size) {
  const sample = new Uint32Array(1);
  const limit = 2 ** 32 - (2 ** 32 % size);
  do {
    globalThis.crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return sample[0] % size;
}

export function generateSecurePassword(length = 20) {
  if (!Number.isInteger(length) || length < 4 || length > 1024) {
    throw new RangeError('Invalid password length');
  }
  const all = groups.join('');
  const chars = groups.map(group => group[randomIndex(group.length)]);
  while (chars.length < length) chars.push(all[randomIndex(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
