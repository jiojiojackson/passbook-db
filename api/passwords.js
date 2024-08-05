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

  if (token == null) return res.status(401).send('Unauthorized');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Forbidden');
    req.user = user;
    next();
  });
};

module.exports = async (req, res) => {
  authenticateToken(req, res, async () => {
    const { method } = req;
    const { id } = req.params;

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
          const { url, username, password, remarks } = req.body;
          const { rows } = await pool.query(
            'INSERT INTO passwords (user_id, url, username, password, remarks) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, url, username, password, remarks]
          );
          res.status(201).json(rows[0]);
        } catch (error) {
          res.status(500).json({ error: 'Error adding password' });
        }
        break;
      case 'PUT':
        try {
          const { url, username, password, remarks } = req.body;
          const { rows } = await pool.query(
            'UPDATE passwords SET url = $1, username = $2, password = $3, remarks = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [url, username, password, remarks, id, req.user.userId]
          );
          res.status(200).json(rows[0]);
        } catch (error) {
          res.status(500).json({ error: 'Error updating password' });
        }
        break;
      case 'DELETE':
        try {
          await pool.query('DELETE FROM passwords WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
          res.status(204).send();
        } catch (error) {
          res.status(500).json({ error: 'Error deleting password' });
        }
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).send(`Method ${method} Not Allowed`);
    }
  });
};
