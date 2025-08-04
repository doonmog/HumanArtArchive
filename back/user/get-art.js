const express = require('express');
const { parseSearchQuery } = require('../searchParser');

module.exports = (pool) => {
  const router = express.Router();

  // GET /art?q=search_query - Find artwork using search syntax
  // Also supports legacy ?tags=tag1,tag2 for backward compatibility
  router.get('/art', async (req, res) => {
    try {
      const { q, tags } = req.query;
      
      let searchQuery = '';
      
      if (q !== undefined) {
        searchQuery = q;
      } else if (tags) {
        // Convert legacy tags format to search syntax
        const tagArray = tags.split(',').map(tag => tag.trim());
        searchQuery = tagArray.join(' AND ');
      }
      // If no search parameters provided, searchQuery remains empty string
      // which will return all artwork
      
      const { whereClause, parameters } = parseSearchQuery(searchQuery);
      
      // If no search query, return all artworks with all their images
      if (searchQuery.trim() === '') {
        const { rows } = await pool.query(`
          SELECT DISTINCT
            a.artwork_id,
            a.artwork_name as title,
            ar.name as artist,
            a.year,
            a.description,
            i.image_id,
            i.display_order,
            CASE WHEN i.image_id IS NOT NULL THEN true ELSE false END as has_image
          FROM artwork a
          LEFT JOIN artist ar ON a.artist_id = ar.artist_id
          LEFT JOIN image i ON a.artwork_id = i.artwork_id
          ORDER BY a.artwork_id, i.display_order
        `);
        
        return res.json({
          message: `Found ${rows.length} artwork(s)`,
          query: searchQuery,
          artworks: rows
        });
      }
      
      // For searches, use the updated search parser that works at image level
      const { rows } = await pool.query(`
        SELECT DISTINCT
          a.artwork_id,
          a.artwork_name as title,
          ar.name as artist,
          a.year,
          a.description,
          i2.image_id,
          i2.display_order,
          CASE WHEN i2.image_id IS NOT NULL THEN true ELSE false END as has_image
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        LEFT JOIN image i2 ON a.artwork_id = i2.artwork_id
        WHERE ${whereClause}
        ORDER BY a.artwork_id, i2.display_order
      `, parameters);
      
      res.json({
        message: `Found ${rows.length} artwork(s) matching query: ${searchQuery}`,
        query: searchQuery,
        artworks: rows
      });
    } catch (err) {
      console.error('Error searching artwork:', err);
      
      if (err.message.includes('Search syntax error')) {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
};