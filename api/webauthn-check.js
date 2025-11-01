const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 检查用户是否已绑定 WebAuthn 设备
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username } = req.body;

    try {
      const { rows: userRows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (userRows.length === 0) {
        return res.status(200).json({ hasWebAuthn: false });
      }

      const userId = userRows[0].id;

      const { rows: credentialRows } = await pool.query(
        'SELECT COUNT(*) as count FROM webauthn_credentials WHERE user_id = $1',
        [userId]
      );

      return res.status(200).json({ 
        hasWebAuthn: parseInt(credentialRows[0].count) > 0 
      });
    } catch (error) {
      console.error('WebAuthn check error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
