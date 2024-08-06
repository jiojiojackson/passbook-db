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
    const { username, password } = req.body;

    try {
      // Check if username already exists
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

      if (userCheck.rows.length > 0) {
        res.status(409).json({ error: 'Username already exists' }); // 409 Conflict status code
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
