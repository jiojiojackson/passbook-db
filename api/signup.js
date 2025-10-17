const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    try {
      // Check if username already exists
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

      if (userCheck.rows.length > 0) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Store user with password hash
      await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', 
        [username, passwordHash]);

      res.status(201).json({ 
        message: 'User registered successfully'
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
