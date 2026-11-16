const pool = require('../lib/db');
const { authenticate, issueSession } = require('../lib/auth');
const { HttpError, prepareResponse, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    const { userId } = authenticate(req);
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!rows.length) throw new HttpError(401, 'Invalid token');
    return res.status(200).json({ token: issueSession(userId) });
  } catch (error) {
    return sendError(res, error);
  }
};
