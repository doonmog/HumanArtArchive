const express = require('express');
const { parseSearchQuery } = require('../searchParser');

module.exports = (pool) => {
  const router = express.Router();

  // GET /art?q=search_query&page=1&limit=60 - Find artwork using search syntax with pagination
  // Also supports legacy ?tags=tag1,tag2 for backward compatibility
  router.get('/art', async (req, res) => {
    try {
      const { q, tags, page = 1, limit = 60 } = req.query;
      
      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(Math.max(1, parseInt(limit) || 60), 240); // Cap at 240
      const offset = (pageNum - 1) * limitNum;
      
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
      
      // If no search query, return all artworks with all their images (paginated)
      if (searchQuery.trim() === '') {
        // Get total count for pagination info
        const countResult = await pool.query(`
          SELECT COUNT(DISTINCT CASE WHEN i.image_id IS NOT NULL THEN CONCAT(a.artwork_id, '-', i.image_id) ELSE a.artwork_id::text END) as total
          FROM artwork a
          LEFT JOIN image i ON a.artwork_id = i.artwork_id
        `);
        const totalItems = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalItems / limitNum);
        
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
          LIMIT $1 OFFSET $2
        `, [limitNum, offset]);
        
        return res.json({
          message: `Found ${totalItems} artwork(s) (page ${pageNum} of ${totalPages})`,
          query: searchQuery,
          artworks: rows,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems,
            itemsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        });
      }
      
      // For searches, use the updated search parser that works at image level (paginated)
      // Get total count for pagination info
      const countQuery = `
        SELECT COUNT(DISTINCT CASE WHEN i2.image_id IS NOT NULL THEN CONCAT(a.artwork_id, '-', i2.image_id) ELSE a.artwork_id::text END) as total
        FROM artwork a
        LEFT JOIN artist ar ON a.artist_id = ar.artist_id
        LEFT JOIN image i2 ON a.artwork_id = i2.artwork_id
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, parameters);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limitNum);
      
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
        LIMIT $${parameters.length + 1} OFFSET $${parameters.length + 2}
      `, [...parameters, limitNum, offset]);
      
      res.json({
        message: `Found ${totalItems} artwork(s) matching query: ${searchQuery} (page ${pageNum} of ${totalPages})`,
        query: searchQuery,
        artworks: rows,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
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