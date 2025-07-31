const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const dbTestRoutes = require('./test/db-test.js');

const app = express();
const port = 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// GET /artworks
app.get('/artworks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM artwork');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.use('/db-test', dbTestRoutes(pool));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});