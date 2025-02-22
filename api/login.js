const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username, token } = req.body;

    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = rows[0];
      
      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: token
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid TOTP token' });
      }

      // Get current time in UTC seconds
      const nowInSeconds = Math.floor(Date.now() / 1000);
      
      // Create JWT with explicit UTC timestamps
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          iat: nowInSeconds,
          exp: nowInSeconds + (5 * 60), // 5 minutes from now in seconds
        }, 
        process.env.JWT_SECRET,
        { 
          // Don't auto-generate timestamps since we're setting them explicitly
          noTimestamp: true 
        }
      );
      
      res.status(200).json({ token: jwtToken });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};