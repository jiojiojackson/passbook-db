const pool = require('../lib/db');
const { authenticate } = require('../lib/auth');
const { encrypt, decrypt } = require('../lib/encryption');
const { HttpError, prepareResponse, bodyOf, text, positiveId, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  try {
    const { userId } = authenticate(req);
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1', [userId]);
      return res.status(200).json(rows.map(row => ({ ...row, password: decrypt(row.password, userId) })));
    }
    if (req.method === 'DELETE') {
      const id = positiveId(req.query?.id);
      const result = await pool.query('DELETE FROM passwords WHERE id = $1 AND user_id = $2', [id, userId]);
      if (!result.rowCount) throw new HttpError(404, 'Password not found');
      return res.status(204).end();
    }
    const input = bodyOf(req);
    const { password, current_id } = input;
    const url = input.url ?? '';
    const username = input.username ?? '';
    const remarks = input.remarks ?? '';
    text(url, 'url', { min: 0, max: 500 });
    text(username, 'username', { min: 0, max: 255 });
    text(password, 'password', { max: 16384 });
    text(remarks, 'remarks', { min: 0, max: 16384 });
    const ciphertext = encrypt(password, userId);
    let result;
    if (req.method === 'POST') {
      result = await pool.query(
        'INSERT INTO passwords (user_id, url, username, password, remarks) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, url, username, ciphertext, remarks],
      );
    } else {
      result = await pool.query(
        'UPDATE passwords SET url = $1, username = $2, password = $3, remarks = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
        [url, username, ciphertext, remarks, positiveId(current_id), userId],
      );
    }
    if (!result.rows.length) throw new HttpError(404, 'Password not found');
    return res.status(req.method === 'POST' ? 201 : 200).json({ ...result.rows[0], password });
  } catch (error) {
    return sendError(res, error);
  }
};
