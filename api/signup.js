const bcrypt = require('bcryptjs');
const pool = require('../lib/db');
const { HttpError, prepareResponse, bodyOf, text, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    const { username, password } = bodyOf(req);
    text(username, 'username', { max: 255 });
    text(password, 'password', { min: 8, max: 72 });
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new HttpError(400, 'Password must not exceed 72 UTF-8 bytes');
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Username already exists' });
    return sendError(res, error);
  }
};
