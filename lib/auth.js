const jwt = require('jsonwebtoken');
const ms = require('ms');
const { HttpError } = require('./http');

const issuer = 'passbook';

function timeout() {
  const value = ms(process.env.TOKEN_TIME || '1h');
  if (!Number.isFinite(value) || value < 1000) {
    throw new Error('Invalid TOKEN_TIME');
  }
  return value;
}

function sign(payload, audience, expiresIn) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256', issuer, audience, expiresIn,
  });
}

function verify(token, audience) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer, audience,
    });
    if (!Number.isSafeInteger(decoded.userId) || decoded.userId <= 0) throw new Error('Invalid user');
    return decoded;
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

function issueSession(userId) {
  return sign({ userId, lastActivityTime: Date.now() }, 'session', timeout() / 1000);
}

function authenticate(req) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) throw new HttpError(401, 'No token provided');
  const decoded = verify(match[1], 'session');
  const age = Date.now() - decoded.lastActivityTime;
  if (!Number.isFinite(age) || age < -1000 || age > timeout()) {
    throw new HttpError(401, 'Token expired due to inactivity');
  }
  return decoded;
}

function issueProof(payload, purpose) {
  return sign(payload, purpose, '5m');
}

function verifyProof(token, purpose) {
  if (typeof token !== 'string') throw new HttpError(401, 'Authentication proof required');
  return verify(token, purpose);
}

module.exports = { authenticate, issueSession, issueProof, verifyProof };
