const { generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const pool = require('../lib/db');
const { issueSession, issueProof, verifyProof } = require('../lib/auth');
const { saveChallenge, consumeChallenge } = require('../lib/challenges');
const { rpConfig, credentialPublicKey, transports } = require('../lib/webauthn');
const { HttpError, prepareResponse, bodyOf, text, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    const { action, username, credential, ceremonyToken } = bodyOf(req);
    text(username, 'username', { max: 255 });
    const { rpID, origin } = rpConfig();
    if (action === 'start') {
      const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (!rows.length) throw new HttpError(404, '未绑定设备');
      const userId = rows[0].id;
      const { rows: credentials } = await pool.query('SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1', [userId]);
      if (!credentials.length) throw new HttpError(404, '未绑定设备');
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: credentials.map(row => ({ id: row.credential_id, transports: transports(row.transports) })),
        userVerification: 'required',
      });
      await saveChallenge(userId, options.challenge);
      return res.status(200).json({
        options,
        ceremonyToken: issueProof({ userId, username, challenge: options.challenge }, 'webauthn-authenticate'),
      });
    }

    if (action !== 'finish') throw new HttpError(400, '无效的操作');
    const proof = verifyProof(ceremonyToken, 'webauthn-authenticate');
    if (proof.username !== username || typeof proof.challenge !== 'string') {
      throw new HttpError(401, 'Invalid authentication session');
    }
    if (!credential || typeof credential.id !== 'string' || !credential.response) {
      throw new HttpError(400, '完整的设备签名响应为必填项');
    }
    const { rows } = await pool.query(
      'SELECT public_key, counter, transports FROM webauthn_credentials WHERE user_id = $1 AND credential_id = $2',
      [proof.userId, credential.id],
    );
    if (rows.length !== 1) throw new HttpError(401, '凭证无效');
    const stored = rows[0];
    await consumeChallenge(proof.userId, proof.challenge);
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: proof.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: {
          id: credential.id,
          publicKey: credentialPublicKey(stored.public_key),
          counter: Number(stored.counter),
          transports: transports(stored.transports),
        },
      });
    } catch {
      throw new HttpError(401, '设备签名验证失败');
    }
    if (!verification.verified) throw new HttpError(401, '设备签名验证失败');
    const update = await pool.query(
      'UPDATE webauthn_credentials SET counter = $1, last_used_at = NOW() WHERE user_id = $2 AND credential_id = $3 AND counter = $4',
      [verification.authenticationInfo.newCounter, proof.userId, credential.id, stored.counter],
    );
    if (update.rowCount !== 1) throw new HttpError(401, '设备凭证已变更，请重试');
    return res.status(200).json({ success: true, token: issueSession(proof.userId), message: 'WebAuthn 认证成功' });
  } catch (error) {
    return sendError(res, error);
  }
};
