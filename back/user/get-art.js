const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // GET /art?tags=tag1,tag2 - Find artwork by tags
  router.get('/art', async (req, res) => {
    try {
      const { tags } = req.query;
      
      if (!tags) {
        return res.status(400).json({ error: 'Tags parameter is required' });
      }
      
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      
      if (tagArray.length === 0) {
        return res.status(400).json({ error: 'At least one tag must be provided' });
      }
      
      // Create placeholders for the IN clause
      const placeholders = tagArray.map((_, index) => `$${index + 1}`).join(',');
      
      const { rows } = await pool.query(`
        SELECT DISTINCT
          a.artwork_id,
          a.artwork_name as title,
          ar.name as artist,
          a.year,
          a.description,
          CASE WHEN i.image_id IS NOT NULL THEN true ELSE false END as has_image
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        LEFT JOIN image i ON a.artwork_id = i.artwork_id AND i.display_order = 1
        WHERE a.artwork_id IN (
          SELECT DISTINCT i2.artwork_id
          FROM image i2
          JOIN image_tags it ON i2.image_id = it.image_id
          JOIN tag t ON it.tag_id = t.tag_id
          WHERE LOWER(t.name) IN (${placeholders})
        )
        ORDER BY a.artwork_id
      `, tagArray);
      
      res.json({
        message: `Found ${rows.length} artwork(s) with tags: ${tags}`,
        artworks: rows
      });
    } catch (err) {
      console.error('Error searching artwork by tags:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};