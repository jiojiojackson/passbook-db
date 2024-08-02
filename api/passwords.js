const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

module.exports = async (req, res) => {
  await authenticateToken(req, res, async () => {
    const { method } = req;

    switch (method) {
      case 'GET':
        try {
          const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1', [req.user.userId]);
          res.status(200).json(rows);
        } catch (error) {
          res.status(500).json({ error: 'Error fetching passwords' });
        }
        break;
      case 'POST':
        try {
          const { url, username, password, passremark } = req.body;
          const { rows } = await pool.query(
            'INSERT INTO passwords (user_id, url, username, password, remarks) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, url, username, password, passremark]
          );
          res.status(201).json(rows[0]);
        } catch (error) {
          res.status(500).json({ error: 'Error adding password' });
        }
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  });
};