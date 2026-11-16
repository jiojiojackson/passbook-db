const bcrypt = require('bcryptjs');
const pool = require('../lib/db');
const { issueSession, issueProof, verifyProof } = require('../lib/auth');
const { newChallenge, saveChallenge, consumeChallenge } = require('../lib/challenges');
const { HttpError, prepareResponse, bodyOf, text, sendError } = require('../lib/http');

const authBase = 'https://web-auth-five.vercel.app';

async function authRequest(path, options = {}) {
  const response = await fetch(new URL(path, authBase), { ...options, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new HttpError(502, '认证服务暂时不可用');
  return response.json();
}

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    const { username, password, sessionId, loginProof, timezone } = bodyOf(req);
    text(username, 'username', { max: 255 });

    if (sessionId) {
      text(sessionId, 'sessionId', { max: 1024 });
      const proof = verifyProof(loginProof, 'login-2fa');
      if (proof.sessionId !== sessionId || typeof proof.challenge !== 'string') {
        throw new HttpError(401, 'Invalid authentication session');
      }
      const { rows } = await pool.query('SELECT id FROM users WHERE id = $1 AND username = $2', [proof.userId, username]);
      if (rows.length !== 1) throw new HttpError(401, 'Invalid credentials');

      const path = `/api/auth/status?${new URLSearchParams({ sessionId })}`;
      const authData = await authRequest(path);
      if (authData.success !== true || authData.data?.status !== 'verified') {
        throw new HttpError(401, '二重认证未通过');
      }

      // Bind the verified external session to the password-verified account, once.
      await consumeChallenge(proof.userId, proof.challenge);
      return res.status(200).json({ token: issueSession(proof.userId) });
    }

    text(password, 'password', { max: 1024 });
    const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const authData = await authRequest('/api/auth/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: '密码管理器',
        clientTime: new Date().toISOString(),
        location: typeof timezone === 'string' ? timezone.slice(0, 100) : 'Unknown',
        browserFingerprint: req.headers['user-agent'] || 'unknown',
        userAgent: req.headers['user-agent'],
      }),
    });
    const data = authData.data;
    const expiry = Math.min(new Date(data?.expiresAt).getTime(), Date.now() + 300000);
    if (authData.success !== true || typeof data?.sessionId !== 'string' || !Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new HttpError(502, '创建认证会话失败');
    }
    const challenge = newChallenge();
    await saveChallenge(user.id, challenge, new Date(expiry));
    return res.status(200).json({
      requireAuth: true,
      sessionId: data.sessionId,
      clientNumber: data.clientNumber,
      expiresAt: new Date(expiry).toISOString(),
      loginProof: issueProof({ userId: user.id, sessionId: data.sessionId, challenge }, 'login-2fa'),
    });
  } catch (error) {
    return sendError(res, error);
  }
};
