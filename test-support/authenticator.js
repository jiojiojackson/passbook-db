const crypto = require('node:crypto');
const { isoCBOR } = require('@simplewebauthn/server/helpers');
const { credentialPublicKey } = require('../lib/webauthn');

function authenticator(kind = 'EC') {
  const pair = kind === 'RSA'
    ? crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    : crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const idBytes = crypto.randomBytes(32);
  const id = idBytes.toString('base64url');
  const spki = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const cose = credentialPublicKey(spki);

  function clientData(type, challenge, origin) {
    return Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  }
  function authData(rpID, counter, flags) {
    const data = Buffer.alloc(37);
    crypto.createHash('sha256').update(rpID).digest().copy(data);
    data[32] = flags;
    data.writeUInt32BE(counter, 33);
    return data;
  }
  function assertion(challenge, { origin = 'https://passbook.test', rpID = 'passbook.test', counter = 1, flags = 0x05 } = {}) {
    const client = clientData('webauthn.get', challenge, origin);
    const data = authData(rpID, counter, flags);
    const signature = crypto.sign('sha256', Buffer.concat([data, crypto.createHash('sha256').update(client).digest()]), pair.privateKey);
    return {
      id, rawId: id, type: 'public-key', clientExtensionResults: {},
      response: {
        clientDataJSON: client.toString('base64url'),
        authenticatorData: data.toString('base64url'),
        signature: signature.toString('base64url'),
        userHandle: null,
      },
    };
  }
  function registration(challenge, { origin = 'https://passbook.test', rpID = 'passbook.test', flags = 0x45 } = {}) {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(idBytes.length);
    const data = Buffer.concat([authData(rpID, 0, flags), Buffer.alloc(16), length, idBytes, Buffer.from(cose)]);
    const attestation = isoCBOR.encode(new Map([
      ['fmt', 'none'], ['attStmt', new Map()], ['authData', new Uint8Array(data)],
    ]));
    return {
      id, rawId: id, type: 'public-key', clientExtensionResults: {},
      response: {
        clientDataJSON: clientData('webauthn.create', challenge, origin).toString('base64url'),
        attestationObject: Buffer.from(attestation).toString('base64url'),
        transports: ['internal'],
      },
    };
  }
  return { id, spki, cose, assertion, registration };
}
module.exports = { authenticator };
