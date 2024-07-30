const { Pool } = require('pg');

// 创建数据库连接池
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { rows } = await pool.query('SELECT * FROM passwords');
        res.status(200).json(rows);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching passwords' });
      }
      break;
    case 'POST':
      try {
        const { url, username, password } = req.body;
        const { rows } = await pool.query(
          'INSERT INTO passwords (url, username, password) VALUES ($1, $2, $3) RETURNING *',
          [url, username, password]
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
};