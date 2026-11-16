const crypto = require('node:crypto');
const pool = require('./db');
const { HttpError } = require('./http');

function newChallenge() {
  return crypto.randomBytes(32).toString('base64url');
}

async function saveChallenge(userId, challenge, expiresAt = new Date(Date.now() + 300000)) {
  await pool.query('DELETE FROM webauthn_challenges WHERE expires_at <= NOW()');
  await pool.query(
    'INSERT INTO webauthn_challenges (user_id, challenge, expires_at) VALUES ($1, $2, $3)',
    [userId, challenge, expiresAt],
  );
}

async function consumeChallenge(userId, challenge) {
  const { rowCount } = await pool.query(
    'DELETE FROM webauthn_challenges WHERE user_id = $1 AND challenge = $2 AND expires_at > NOW() RETURNING challenge',
    [userId, challenge],
  );
  if (rowCount !== 1) throw new HttpError(401, 'Challenge invalid, expired, or already used');
}

module.exports = { newChallenge, saveChallenge, consumeChallenge };
