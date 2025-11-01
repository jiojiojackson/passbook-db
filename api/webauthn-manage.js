const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 验证 JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = async (req, res) => {
  // 验证用户身份
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: '无效的 token' });
  }

  const userId = decoded.userId;

  if (req.method === 'GET') {
    // 获取用户的所有 WebAuthn 凭证
    try {
      const { rows } = await pool.query(
        `SELECT id, credential_id, created_at, last_used_at, transports 
         FROM webauthn_credentials 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );

      return res.status(200).json({ 
        credentials: rows.map(row => ({
          id: row.id,
          credentialId: row.credential_id.substring(0, 20) + '...',
          createdAt: row.created_at,
          lastUsedAt: row.last_used_at,
          transports: JSON.parse(row.transports || '[]')
        }))
      });
    } catch (error) {
      console.error('Get credentials error:', error);
      return res.status(500).json({ error: '服务器错误' });
    }
  } else if (req.method === 'DELETE') {
    // 删除指定的凭证
    const { credentialId } = req.body;

    if (!credentialId) {
      return res.status(400).json({ error: '缺少凭证 ID' });
    }

    try {
      const result = await pool.query(
        'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2',
        [credentialId, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: '凭证不存在' });
      }

      return res.status(200).json({ message: '凭证已删除' });
    } catch (error) {
      console.error('Delete credential error:', error);
      return res.status(500).json({ error: '服务器错误' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
