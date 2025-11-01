const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username, password, sessionId } = req.body;

    try {
      // 如果提供了sessionId，说明是第二步：验证二重认证
      if (sessionId) {
        // 检查二重认证状态
        const authResponse = await fetch(`https://web-auth-five.vercel.app/api/auth/status?sessionId=${sessionId}`);
        const authData = await authResponse.json();

        if (!authData.success || authData.data.status !== 'verified') {
          return res.status(401).json({ error: '二重认证未通过' });
        }

        // 从sessionId获取用户信息（需要临时存储）
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_TIME });
        return res.status(200).json({ token: jwtToken });
      }

      // 第一步：验证账号密码
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = rows[0];
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 账号密码正确，创建二重认证会话
      const authResponse = await fetch('https://web-auth-five.vercel.app/api/auth/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName: '密码管理器',
          clientTime: new Date().toISOString(),
          location: 'Asia/Shanghai',
          browserFingerprint: req.headers['user-agent'] || 'unknown',
          userAgent: req.headers['user-agent']
        })
      });

      const authData = await authResponse.json();

      if (!authData.success) {
        return res.status(500).json({ error: '创建认证会话失败' });
      }

      // 返回认证会话信息，需要用户进行二重认证
      res.status(200).json({
        requireAuth: true,
        sessionId: authData.data.sessionId,
        clientNumber: authData.data.clientNumber,
        expiresAt: authData.data.expiresAt
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};