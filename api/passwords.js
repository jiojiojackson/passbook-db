const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');

// Read encryption key from environment variable
const encryptionKey = process.env.ENCRYPTION_KEY;
const algorithm = 'aes-256-cbc';

// Encryption function
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decryption function
const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

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

    switch (method) {
      case 'GET':
        try {
          const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1', [req.user.userId]);
          rows.forEach(row => row.password = decrypt(row.password)); // Decrypt passwords
          res.status(200).json(rows);
        } catch (error) {
          res.status(500).json({ error: 'Error fetching passwords' });
        }
        break;
      case 'POST':
        try {
          const { url, username, password, remarks } = req.body;
          const encryptedPassword = encrypt(password); // Encrypt password
          const { rows } = await pool.query(
            'INSERT INTO passwords (user_id, url, username, password, remarks) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, url, username, encryptedPassword, remarks]
          );
          rows[0].forEach(row => row.password = decrypt(row.password)); // Decrypt passwords
          res.status(201).json(rows[0]);
        } catch (error) {
          res.status(500).json({ error: 'Error adding password' });
        }
        break;
      case 'PUT':
        try {
          const { url, username, password, remarks, current_id } = req.body;
          const encryptedPassword = encrypt(password); // Encrypt password
          const { rows } = await pool.query(
            'UPDATE passwords SET url = $1, username = $2, password = $3, remarks = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [url, username, encryptedPassword, remarks, current_id, req.user.userId]
          );
          rows[0].forEach(row => row.password = decrypt(row.password)); // Decrypt passwords
          res.status(200).json(rows[0]);
        } catch (error) {
          res.status(500).json({ error: 'Error updating password' });
        }
        break;
      case 'DELETE':
        try {
          const id = req.query.id;
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
