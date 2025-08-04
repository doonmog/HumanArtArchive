const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  router.get('/artwork/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT 
          a.artwork_id,
          a.artwork_name as title,
          ar.name as artist,
          a.year,
          a.description
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        WHERE a.artwork_id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Artwork not found',
          message: `No artwork found with ID: ${id}`
        });
      }

      const artwork = result.rows[0];
      
      // Get all images for this artwork
      const imagesResult = await pool.query(`
        SELECT 
          i.image_id,
          i.display_order,
          CASE WHEN i.image IS NOT NULL THEN true ELSE false END as has_image
        FROM image i
        WHERE i.artwork_id = $1
        ORDER BY i.display_order
      `, [id]);

      artwork.images = imagesResult.rows;
      artwork.has_image = imagesResult.rows.length > 0 && imagesResult.rows.some(img => img.has_image);
      
      const tagsResult = await pool.query(`
        SELECT DISTINCT
          t.name as tag_name,
          tg.name as group_name
        FROM image i
        JOIN image_tags it ON i.image_id = it.image_id
        JOIN tag t ON it.tag_id = t.tag_id
        LEFT JOIN tag_group tg ON t.group_id = tg.group_id
        WHERE i.artwork_id = $1
        ORDER BY tg.name, t.name
      `, [id]);

      artwork.tags = tagsResult.rows;

      res.json({
        success: true,
        artwork: artwork
      });

    } catch (err) {
      console.error('Error fetching artwork details:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch artwork details'
      });
    }
  });

  return router;
};
