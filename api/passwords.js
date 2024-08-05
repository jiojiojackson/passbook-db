const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const express = require('express');
const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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

app.use(authenticateToken);

app.get('/api/passwords', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1', [req.user.userId]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching passwords' });
  }
});

app.get('/api/passwords/update/:id', async (req, res) => {
  const { id } = req.params;
  const { url, username, password, remarks } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE passwords SET url = $1, username = $2, password = $3, remarks = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [url, username, password, remarks, id, req.user.userId]
    );
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error updating password' });
  }
});

app.get('/api/passwords/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM passwords WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting password' });
  }
});

app.post('/api/passwords', async (req, res) => {
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
});

app.use((req, res) => {
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).send(`Method ${req.method} Not Allowed`);
});

module.exports = app;
