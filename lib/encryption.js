const crypto = require('node:crypto');

function key() {
  if (!/^[a-f\d]{64}$/i.test(process.env.ENCRYPTION_KEY || '')) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hexadecimal key');
  }
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
}

function encrypt(value, userId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(`passbook:${userId}`));
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v2', iv.toString('hex'), cipher.getAuthTag().toString('hex'), ciphertext.toString('hex')].join(':');
}

function decrypt(value, userId) {
  const parts = value.split(':');
  if (parts[0] === 'v2') {
    const [, iv, tag, ciphertext] = parts;
    if (parts.length !== 4 || !/^[a-f\d]{24}$/i.test(iv) || !/^[a-f\d]{32}$/i.test(tag) || !/^(?:[a-f\d]{2})*$/i.test(ciphertext)) {
      throw new Error('Invalid ciphertext');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from(`passbook:${userId}`));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'hex')), decipher.final()]).toString('utf8');
  }
  // Read legacy records without changing their key or rewriting stored data.
  const [iv, ciphertext] = parts;
  if (parts.length !== 2 || !/^[a-f\d]{32}$/i.test(iv) || !/^(?:[a-f\d]{32})+$/i.test(ciphertext)) {
    throw new Error('Invalid legacy ciphertext');
  }
  const decipher = crypto.createDecipheriv('aes-256-cbc', key(), Buffer.from(iv, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'hex')), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
