const crypto = require('node:crypto');
const { isoCBOR } = require('@simplewebauthn/server/helpers');

function rpConfig() {
  // Never trust Host/Origin headers to choose the relying party.
  const url = new URL(process.env.APP_ORIGIN || 'https://passbook-db.vercel.app');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('APP_ORIGIN must use HTTPS (except localhost)');
  }
  return { rpID: url.hostname, origin: url.origin };
}

function credentialPublicKey(stored) {
  if (stored.startsWith('cose:')) {
    return new Uint8Array(Buffer.from(stored.slice(5), 'base64url'));
  }
  // Older versions stored DER/SPKI keys. Convert in memory so existing devices
  // can still authenticate, now with their real signatures verified.
  const jwk = crypto.createPublicKey({
    key: Buffer.from(stored, 'base64'), format: 'der', type: 'spki',
  }).export({ format: 'jwk' });
  const bytes = name => new Uint8Array(Buffer.from(jwk[name], 'base64url'));
  if (jwk.kty === 'EC' && jwk.crv === 'P-256') {
    return isoCBOR.encode(new Map([[1, 2], [3, -7], [-1, 1], [-2, bytes('x')], [-3, bytes('y')]]));
  }
  if (jwk.kty === 'RSA') {
    return isoCBOR.encode(new Map([[1, 3], [3, -257], [-1, bytes('n')], [-2, bytes('e')]]));
  }
  throw new Error('Unsupported legacy credential key');
}

function validInvite(code) {
  const expected = process.env.WEBAUTHN_INVITE_CODE;
  if (!expected || typeof code !== 'string') return false;
  const digest = value => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(digest(code), digest(expected));
}

function transports(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter(t => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

module.exports = { rpConfig, credentialPublicKey, validInvite, transports };
