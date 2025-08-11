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
      
      const { whereClause, parameters, partialMatch, tagQueries } = parseSearchQuery(searchQuery);
      
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
      // Handle partial matching if requested and there are tag queries
      if (partialMatch && tagQueries.length > 0) {
        // We'll collect all results and their scores
        let allResults = [];
        let seenArtworkIds = new Set();
        let totalItems = 0;
        
        // Helper function to get combinations of tags
        const getCombinations = (arr, size) => {
          if (size > arr.length) return [];
          if (size === arr.length) return [arr];
          if (size === 1) return arr.map(el => [el]);
          
          const combinations = [];
          for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombinations = getCombinations(arr.slice(i + 1), size - 1);
            for (const tailCombination of tailCombinations) {
              combinations.push([head, ...tailCombination]);
            }
          }
          return combinations;
        };
        
        // Helper function to search for artworks with a specific tag combination
        const searchWithTags = async (tags, matchScore) => {
          if (tags.length === 0) return [];
          
          const searchQuery = tags.join(' AND ');
          const { whereClause: searchWhereClause, parameters: searchParameters } = parseSearchQuery(searchQuery);
          
          const query = `
            SELECT DISTINCT
              a.artwork_id,
              a.artwork_name as title,
              ar.name as artist,
              a.year,
              a.description,
              i2.image_id,
              i2.display_order,
              CASE WHEN i2.image_id IS NOT NULL THEN true ELSE false END as has_image,
              ${matchScore} as match_score
            FROM artwork a
            LEFT JOIN artist ar ON a.artist_id = ar.artist_id
            LEFT JOIN image i2 ON a.artwork_id = i2.artwork_id
            WHERE ${searchWhereClause}
            ORDER BY a.artwork_id, i2.display_order
          `;
          
          const result = await pool.query(query, searchParameters);
          return result.rows;
        };
        
        // Start with full tag count and work down recursively
        for (let tagCount = tagQueries.length; tagCount >= 1; tagCount--) {
          const combinations = getCombinations(tagQueries, tagCount);
          let foundNewResults = false;
          
          for (const tagCombination of combinations) {
            const results = await searchWithTags(tagCombination, tagCount);
            
            // Add results that haven't been seen before
            results.forEach(row => {
              if (!seenArtworkIds.has(row.artwork_id)) {
                allResults.push(row);
                seenArtworkIds.add(row.artwork_id);
                foundNewResults = true;
              }
            });
          }
          
          // If we found results at this level and we have enough results, we can stop
          // This prevents excessive searching when we already have good matches
          if (foundNewResults && allResults.length >= limitNum) {
            break;
          }
        }
        
        // Sort results by match score (descending) and then by artwork_id
        allResults.sort((a, b) => {
          if (b.match_score !== a.match_score) {
            return b.match_score - a.match_score;
          }
          return a.artwork_id - b.artwork_id;
        });
        
        // Apply pagination to the combined results
        totalItems = allResults.length;
        const totalPages = Math.ceil(totalItems / limitNum);
        const paginatedResults = allResults.slice(offset, offset + limitNum);
        
        return res.json({
          message: `Found ${totalItems} artwork(s) matching query: ${searchQuery} (page ${pageNum} of ${totalPages})`,
          query: searchQuery,
          artworks: paginatedResults,
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
      
      // Standard search (no partial matching)
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