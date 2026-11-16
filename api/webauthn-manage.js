const pool = require('../lib/db');
const { authenticate } = require('../lib/auth');
const { transports } = require('../lib/webauthn');
const { HttpError, prepareResponse, bodyOf, positiveId, sendError } = require('../lib/http');

module.exports = async (req, res) => {
  if (!prepareResponse(res, req.method, ['GET', 'DELETE'])) return;
  try {
    const { userId } = authenticate(req);
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT id, credential_id, created_at, last_used_at, transports FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC',
        [userId],
      );
      return res.status(200).json({
        credentials: rows.map(row => ({
          id: row.id,
          credentialId: row.credential_id.substring(0, 20) + '...',
          createdAt: row.created_at,
          lastUsedAt: row.last_used_at,
          transports: transports(row.transports),
        })),
      });
    }
    const credentialId = positiveId(bodyOf(req).credentialId);
    const { rowCount } = await pool.query(
      'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2',
      [credentialId, userId],
    );
    if (!rowCount) throw new HttpError(404, '凭证不存在');
    return res.status(200).json({ message: '凭证已删除' });
  } catch (error) {
    return sendError(res, error);
  }
};
