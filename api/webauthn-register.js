const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 验证邀请码
function verifyInviteCode(code) {
  const validCode = process.env.WEBAUTHN_INVITE_CODE;
  return validCode && code === validCode;
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { action, username, inviteCode, credential, challenge } = req.body;

    try {
      // 开始注册流程
      if (action === 'start') {
        // 验证邀请码
        if (!verifyInviteCode(inviteCode)) {
          return res.status(403).json({ error: '邀请码无效' });
        }

        // 验证用户是否存在
        const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (rows.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }

        const userId = rows[0].id;

        // 生成挑战值
        const challenge = crypto.randomBytes(32).toString('base64url');
        
        // 存储挑战值（临时，5分钟过期）
        await pool.query(
          'INSERT INTO webauthn_challenges (user_id, challenge, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'5 minutes\')',
          [userId, challenge]
        );

        return res.status(200).json({
          challenge,
          userId: userId.toString(),
          rpName: '密码管理器',
          rpId: req.headers.host?.split(':')[0] || 'localhost',
          userName: username,
          userDisplayName: username
        });
      }

      // 完成注册流程
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

        // 存储凭证
        await pool.query(
          `INSERT INTO webauthn_credentials 
           (user_id, credential_id, public_key, counter, transports, created_at) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            userId,
            credential.id,
            credential.publicKey,
            credential.counter || 0,
            JSON.stringify(credential.transports || [])
          ]
        );

        // 清理挑战值
        await pool.query('DELETE FROM webauthn_challenges WHERE user_id = $1', [userId]);

        return res.status(200).json({ success: true, message: '设备绑定成功' });
      }

      return res.status(400).json({ error: '无效的操作' });
    } catch (error) {
      console.error('WebAuthn registration error:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
