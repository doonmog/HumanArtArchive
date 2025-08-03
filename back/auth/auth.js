const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (pool) => {
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const result = await pool.query(
        'SELECT admin_id, username, password_hash FROM admin WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const admin = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      await pool.query(
        'UPDATE admin SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1',
        [admin.admin_id]
      );

      const token = jwt.sign(
        { 
          adminId: admin.admin_id, 
          username: admin.username 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ 
        token,
        username: admin.username 
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/verify', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      const result = await pool.query(
        'SELECT admin_id, username FROM admin WHERE admin_id = $1',
        [decoded.adminId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      res.json({ 
        username: result.rows[0].username,
        adminId: result.rows[0].admin_id
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      console.error('Token verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
};
