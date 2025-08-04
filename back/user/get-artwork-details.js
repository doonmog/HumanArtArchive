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
      
      // Get tags for a specific image (if image_id provided) or the first image
      const { image_id } = req.query;
      let targetImageId = image_id;
      
      // If no specific image requested, use the first image
      if (!targetImageId && artwork.images.length > 0) {
        targetImageId = artwork.images[0].image_id;
      }
      
      let tagsResult = { rows: [] };
      if (targetImageId) {
        tagsResult = await pool.query(`
          SELECT DISTINCT
            t.tag_id,
            t.name as tag_name,
            tg.name as group_name,
            c.name as category
          FROM image_tags it
          JOIN tag t ON it.tag_id = t.tag_id
          LEFT JOIN tag_group tg ON t.group_id = tg.group_id
          LEFT JOIN category c ON tg.category_id = c.category_id
          WHERE it.image_id = $1
          ORDER BY c.name, tg.name, t.name
        `, [targetImageId]);
      }

      artwork.tags = tagsResult.rows;
      artwork.current_image_id = targetImageId;

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
