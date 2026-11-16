const bcrypt = require('bcryptjs');
const { generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');
const pool = require('../lib/db');
const { issueProof, verifyProof } = require('../lib/auth');
const { saveChallenge, consumeChallenge } = require('../lib/challenges');
const { rpConfig, validInvite } = require('../lib/webauthn');
const { HttpError, prepareResponse, bodyOf, text, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    const { action, username, password, inviteCode, credential, ceremonyToken } = bodyOf(req);
    text(username, 'username', { max: 255 });
    const { rpID, origin } = rpConfig();
    if (action === 'start') {
      text(password, 'password', { max: 1024 });
      if (!validInvite(inviteCode)) throw new HttpError(403, '邀请码无效');
      const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
      const user = rows[0];
      if (!user || !await bcrypt.compare(password, user.password_hash)) {
        throw new HttpError(401, 'Invalid credentials');
      }
      const { rows: existing } = await pool.query('SELECT credential_id FROM webauthn_credentials WHERE user_id = $1', [user.id]);
      const options = await generateRegistrationOptions({
        rpName: 'Passbook 密码管理器',
        rpID,
        userID: new Uint8Array(Buffer.from(String(user.id))),
        userName: username,
        attestationType: 'none',
        supportedAlgorithmIDs: [-7, -257],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'discouraged',
          userVerification: 'required',
        },
        excludeCredentials: existing.map(row => ({ id: row.credential_id })),
      });
      await saveChallenge(user.id, options.challenge);
      return res.status(200).json({
        options,
        ceremonyToken: issueProof({ userId: user.id, username, challenge: options.challenge }, 'webauthn-register'),
      });
    }

    if (action !== 'finish') throw new HttpError(400, '无效的操作');
    const proof = verifyProof(ceremonyToken, 'webauthn-register');
    if (proof.username !== username || typeof proof.challenge !== 'string') {
      throw new HttpError(401, 'Invalid registration session');
    }
    if (!credential || typeof credential.id !== 'string' || !credential.response) {
      throw new HttpError(400, '完整的设备注册响应为必填项');
    }
    await consumeChallenge(proof.userId, proof.challenge);
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: proof.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
        supportedAlgorithmIDs: [-7, -257],
      });
    } catch {
      throw new HttpError(400, '设备注册验证失败');
    }
    if (!verification.verified || !verification.registrationInfo) {
      throw new HttpError(400, '设备注册验证失败');
    }
    const verified = verification.registrationInfo.credential;
    await pool.query(
      'INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [proof.userId, verified.id, 'cose:' + Buffer.from(verified.publicKey).toString('base64url'), verified.counter, JSON.stringify(verified.transports || [])],
    );
    return res.status(200).json({ success: true, message: '设备绑定成功' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: '设备已绑定' });
    return sendError(res, error);
  }
};
