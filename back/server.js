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
    const { rows } = await pool.query(`
      SELECT 
        a.artwork_id,
        a.artwork_name as title,
        ar.name as artist,
        a.year,
        a.description,
        CASE WHEN i.image_id IS NOT NULL THEN true ELSE false END as has_image
      FROM artwork a
      LEFT JOIN artist ar ON a.artist_id = ar.artist_id
      LEFT JOIN image i ON a.artwork_id = i.artwork_id AND i.display_order = 1
      ORDER BY a.artwork_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /image/:artworkId - Serve image for a specific artwork
app.get('/image/:artworkId', async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { rows } = await pool.query(
      'SELECT image FROM image WHERE artwork_id = $1 AND display_order = 1',
      [artworkId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageBuffer = rows[0].image;
    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/db-test', dbTestRoutes(pool));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});