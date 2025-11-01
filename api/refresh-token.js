const jwt = require('jsonwebtoken');
const ms = require('ms');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 检查最后活动时间
      const lastActivityTime = decoded.lastActivityTime || 0;
      const currentTime = Date.now();
      const tokenTimeout = ms(process.env.TOKEN_TIME || '1h');
      
      if (currentTime - lastActivityTime > tokenTimeout) {
        return res.status(401).json({ error: 'Token expired due to inactivity' });
      }
      
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // 更新最后活动时间
      const newToken = jwt.sign({ 
        userId: decoded.userId,
        lastActivityTime: currentTime
      }, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_TIME });
      
      res.status(200).json({ token: newToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
