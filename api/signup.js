const { Pool } = require('pg');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username } = req.body;

    try {
      // Check if username already exists
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

      if (userCheck.rows.length > 0) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `PassbookDB:${username}`
      });

      // Store user with TOTP secret
      await pool.query('INSERT INTO users (username, totp_secret) VALUES ($1, $2)', 
        [username, secret.base32]);

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      res.status(201).json({ 
        message: 'User registered successfully',
        secret: secret.base32,
        qrCode: qrCodeUrl
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
