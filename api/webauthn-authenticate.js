const { Pool } = require('pg');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { action, username, credential, challenge } = req.body;

    try {
      // 开始认证流程
      if (action === 'start') {
        // 验证用户是否存在
        const { rows: userRows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userRows.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }

        const userId = userRows[0].id;

        // 检查用户是否有绑定的设备
        const { rows: credentialRows } = await pool.query(
          'SELECT credential_id FROM webauthn_credentials WHERE user_id = $1',
          [userId]
        );

        if (credentialRows.length === 0) {
          return res.status(404).json({ error: '未绑定设备' });
        }

        // 生成挑战值
        const challenge = crypto.randomBytes(32).toString('base64url');
        
        // 存储挑战值
        await pool.query(
          'INSERT INTO webauthn_challenges (user_id, challenge, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\')',
          [userId, challenge]
        );

        return res.status(200).json({
          challenge,
          allowCredentials: credentialRows.map(row => ({
            type: 'public-key',
            id: row.credential_id
          })),
          rpId: req.headers.host?.split(':')[0] || 'localhost'
        });
      }

      // 完成认证流程
      if (action === 'finish') {
        const { rows: userRows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userRows.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }

        const userId = userRows[0].id;

        // 验证挑战值
        const { rows: challengeRows } = await pool.query(
          'SELECT challenge FROM webauthn_challenges WHERE user_id = $1 AND challenge = $2 AND expires_at > NOW()',
          [userId, challenge]
        );

        if (challengeRows.length === 0) {
          return res.status(400).json({ error: '挑战值无效或已过期' });
        }

        // 验证凭证
        const { rows: credentialRows } = await pool.query(
          'SELECT public_key, counter FROM webauthn_credentials WHERE user_id = $1 AND credential_id = $2',
          [userId, credential.id]
        );

        if (credentialRows.length === 0) {
          return res.status(400).json({ error: '凭证无效' });
        }

        // 更新计数器
        await pool.query(
          'UPDATE webauthn_credentials SET counter = $1, last_used_at = NOW() WHERE user_id = $2 AND credential_id = $3',
          [credential.counter || 0, userId, credential.id]
        );

        // 清理挑战值
        await pool.query('DELETE FROM webauthn_challenges WHERE user_id = $1', [userId]);

        // 生成 JWT token
        const jwtToken = jwt.sign({ 
          userId: userId,
          lastActivityTime: Date.now()
        }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_TIME });

        return res.status(200).json({ 
          success: true, 
          token: jwtToken,
          message: 'WebAuthn 认证成功' 
        });
      }

      return res.status(400).json({ error: '无效的操作' });
    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
