const pool = require('../lib/db');
const { prepareResponse, bodyOf, text, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['POST'])) return;
  try {
    const { username } = bodyOf(req);
    text(username, 'username', { max: 255 });
    const { rows } = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM webauthn_credentials c JOIN users u ON u.id = c.user_id WHERE u.username = $1) AS present',
      [username],
    );
    return res.status(200).json({ hasWebAuthn: rows[0].present });
  } catch (error) {
    return sendError(res, error);
  }
};
