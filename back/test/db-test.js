const express = require('express');
const router = express.Router();

// This module exports a function that takes the database pool
// and returns a configured router.
module.exports = (pool) => {
  router.get('/', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      res.json({ success: true, data: result.rows[0] });
      client.release();
    } catch (err) {
      console.error('Database connection error:', err);
      res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  });

  return router;
};
