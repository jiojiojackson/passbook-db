const jwt = require('jsonwebtoken');
const ms = require('ms');

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
      
      res.status(200).json({ message: 'Token is valid' });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
