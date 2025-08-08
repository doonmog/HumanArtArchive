const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  router.use((req, res, next) => {
    req.pool = pool;
    next();
  });

  // Get only tags that are associated with at least one artwork
  router.get('/used-tags', async (req, res) => {
    try {
      // Get all categories with their tag groups and tags that are used in at least one artwork
      const result = await pool.query(`
        SELECT 
          c.category_id, 
          c.name as category_name, 
          c.description as category_description,
          tg.group_id, 
          tg.name as group_name, 
          tg.description as group_description,
          t.tag_id, 
          t.name as tag_name, 
          t.description as tag_description
        FROM category c
        JOIN tag_group tg ON c.category_id = tg.category_id
        JOIN tag t ON tg.group_id = t.group_id
        JOIN image_tags it ON t.tag_id = it.tag_id
        JOIN image i ON it.image_id = i.image_id
        JOIN artwork a ON i.artwork_id = a.artwork_id
        GROUP BY c.category_id, c.name, c.description, tg.group_id, tg.name, tg.description, t.tag_id, t.name, t.description
        ORDER BY c.name, tg.name, t.name
      `);
      
      // Organize into hierarchical structure
      const categories = [];
      const categoryMap = new Map();
      const groupMap = new Map();
      
      for (const row of result.rows) {
        // Process category
        if (!categoryMap.has(row.category_id)) {
          const category = {
            categoryId: row.category_id,
            name: row.category_name,
            description: row.category_description,
            groups: []
          };
          categories.push(category);
          categoryMap.set(row.category_id, category);
        }
        
        // Skip if no group (empty category)
        if (!row.group_id) continue;
        
        // Process group
        if (!groupMap.has(row.group_id)) {
          const group = {
            groupId: row.group_id,
            name: row.group_name,
            description: row.group_description,
            tags: []
          };
          categoryMap.get(row.category_id).groups.push(group);
          groupMap.set(row.group_id, group);
        }
        
        // Skip if no tag (empty group)
        if (!row.tag_id) continue;
        
        // Process tag
        const tag = {
          tagId: row.tag_id,
          name: row.tag_name,
          description: row.tag_description
        };
        groupMap.get(row.group_id).tags.push(tag);
      }
      
      res.json({ categories });
      
    } catch (error) {
      console.error('Error fetching used tags:', error);
      res.status(500).json({ message: 'Failed to fetch used tags' });
    }
  });

  return router;
};
