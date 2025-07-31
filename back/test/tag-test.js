const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // GET /tags/:artworkId - Get all tags for a specific artwork
  router.get('/tags/:artworkId', async (req, res) => {
    try {
      const { artworkId } = req.params;
      const { rows } = await pool.query(`
        SELECT 
          c.name as category,
          tg.name as tag_group,
          t.name as tag,
          t.description as tag_description
        FROM image_tags it
        JOIN image i ON it.image_id = i.image_id
        JOIN tag t ON it.tag_id = t.tag_id
        JOIN tag_group tg ON t.group_id = tg.group_id
        JOIN category c ON tg.category_id = c.category_id
        WHERE i.artwork_id = $1
        ORDER BY c.name, tg.name, t.name
      `, [artworkId]);
      
      if (rows.length === 0) {
        return res.json({ message: 'No tags found for this artwork', tags: [] });
      }
      
      res.json({ tags: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /tags - Get all available tags grouped by category and tag group
  router.get('/tags', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT 
          c.name as category,
          tg.name as tag_group,
          t.name as tag,
          t.description as tag_description
        FROM tag t
        JOIN tag_group tg ON t.group_id = tg.group_id
        JOIN category c ON tg.category_id = c.category_id
        ORDER BY c.name, tg.name, t.name
      `);
      
      res.json({ tags: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};