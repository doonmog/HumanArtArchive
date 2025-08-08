const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  router.use((req, res, next) => {
    req.pool = pool;
    next();
  });

  // Get all available tag groups and tags for public interface
  router.get('/tags', async (req, res) => {
    try {
      // Get all categories with their tag groups and tags
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
        LEFT JOIN tag_group tg ON c.category_id = tg.category_id
        LEFT JOIN tag t ON tg.group_id = t.group_id
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
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: 'Failed to fetch tags' });
    }
  });

  // Get tag information by name or group-tag pair
  router.get('/tag-by-name/:name', async (req, res) => {
    try {
      const { name } = req.params;
      
      if (!name) {
        return res.status(400).json({ message: 'Tag name is required' });
      }
      
      // Check if this is a group-tag pair (contains a hyphen)
      if (name.includes('-')) {
        // Parse the group-tag pair, handling quoted strings
        let inQuotes = false;
        let hyphenPos = -1;
        
        for (let i = 0; i < name.length; i++) {
          if (name[i] === '"') {
            inQuotes = !inQuotes;
          } else if (name[i] === '-' && !inQuotes) {
            hyphenPos = i;
            break;
          }
        }
        
        // If we found a valid hyphen separator
        if (hyphenPos !== -1) {
          const groupName = name.substring(0, hyphenPos).trim();
          const tagName = name.substring(hyphenPos + 1).trim();
          
          // Remove quotes if they exist
          const cleanGroupName = groupName.startsWith('"') && groupName.endsWith('"') ? 
            groupName.substring(1, groupName.length - 1) : groupName;
            
          const cleanTagName = tagName.startsWith('"') && tagName.endsWith('"') ? 
            tagName.substring(1, tagName.length - 1) : tagName;
          
          const result = await pool.query(`
            SELECT 
              t.tag_id,
              t.name,
              t.description,
              tg.name as group_name,
              c.name as category_name,
              CONCAT(tg.name, '-', t.name) as full_tag_name
            FROM tag t
            JOIN tag_group tg ON t.group_id = tg.group_id
            JOIN category c ON tg.category_id = c.category_id
            WHERE LOWER(tg.name) = LOWER($1) AND LOWER(t.name) = LOWER($2)
            ORDER BY tg.name, t.name
          `, [cleanGroupName, cleanTagName]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tag not found' });
          }
          
          // Return all matching tags
          return res.json({ tags: result.rows });
        }
      }
      
      // Default case: search by tag name only
      const result = await pool.query(`
        SELECT 
          t.tag_id,
          t.name,
          t.description,
          tg.name as group_name,
          c.name as category_name,
          CONCAT(tg.name, '-', t.name) as full_tag_name
        FROM tag t
        JOIN tag_group tg ON t.group_id = tg.group_id
        JOIN category c ON tg.category_id = c.category_id
        WHERE LOWER(t.name) = LOWER($1)
        ORDER BY tg.name, t.name
      `, [name]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      // Return all matching tags instead of just the first one
      res.json({ tags: result.rows });
      
    } catch (error) {
      console.error('Error fetching tag by name:', error);
      res.status(500).json({ message: 'Failed to fetch tag information' });
    }
  });

  return router;
};
