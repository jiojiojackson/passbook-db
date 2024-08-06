const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const email = process.env.RECIPIENT_EMAIL;
    const vcodes = Math.floor(100000 + Math.random() * 900000); // 生成6位随机验证码
    const username = req.query.username;

    try {
      await pool.query('INSERT INTO vericodes (username, vcodes) VALUES ($1, $2)', [username, vcodes]);

      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: '验证码',
        text: `您的验证码是: ${code}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send('发送验证码失败');
        }
        res.status(200).send('验证码已发送');
      });
    } catch (error) {
      console.error('发送验证码失败', error);
      res.status(500).send('发送验证码失败');
    }
  } else if (req.method === 'POST') {
    const { userName, newPassword, verificationCode } = req.body;

    try {
      const { rows } = await pool.query('SELECT * FROM vericodes WHERE username = $1 AND vcodes = $2', [userName, verificationCode]);

      if (rows.length === 0) {
        return res.status(400).send('验证码错误');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, userName]);
      await pool.query('DELETE FROM vericodes WHERE username = $1', [userName]); // 删除已使用的验证码

      res.status(200).send('密码修改成功');
    } catch (error) {
      console.error('修改密码失败', error);
      res.status(500).send('修改密码失败');
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
