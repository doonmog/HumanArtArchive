const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  router.get('/image/:artworkId', async (req, res) => {
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
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(imageBuffer);
    } catch (err) {
      console.error('Error serving image:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
