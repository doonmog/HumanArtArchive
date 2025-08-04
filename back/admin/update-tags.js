const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const result = await req.pool.query(
      'SELECT admin_id, username FROM admin WHERE admin_id = $1',
      [decoded.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = (pool) => {
  router.use((req, res, next) => {
    req.pool = pool;
    next();
  });

  router.post('/update-tags', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { artworkId, tags, applyToAllImages, imageId } = req.body;
      
      if (!artworkId || !tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ message: 'Artwork ID and at least one tag are required' });
      }
      
      // Verify artwork exists
      const artworkResult = await client.query(
        'SELECT artwork_id FROM artwork WHERE artwork_id = $1',
        [artworkId]
      );
      
      if (artworkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      
      // Get images for this artwork
      let imagesToTag = [];
      
      if (applyToAllImages) {
        // Apply to all images in the artwork
        const imagesResult = await client.query(
          'SELECT image_id FROM image WHERE artwork_id = $1',
          [artworkId]
        );
        
        imagesToTag = imagesResult.rows.map(row => row.image_id);
      } else if (imageId) {
        // Apply to specific image
        const imageResult = await client.query(
          'SELECT image_id FROM image WHERE image_id = $1 AND artwork_id = $2',
          [imageId, artworkId]
        );
        
        if (imageResult.rows.length === 0) {
          return res.status(404).json({ message: 'Image not found or does not belong to specified artwork' });
        }
        
        imagesToTag = [imageId];
      } else {
        return res.status(400).json({ message: 'Either applyToAllImages must be true or imageId must be provided' });
      }
      
      if (imagesToTag.length === 0) {
        return res.status(404).json({ message: 'No images found for this artwork' });
      }
      
      // Process each tag
      const addedTags = [];
      
      for (const tagInfo of tags) {
        let tagId;
        
        // Check if tag exists
        if (tagInfo.tagId) {
          // Use existing tag
          const tagResult = await client.query(
            'SELECT tag_id FROM tag WHERE tag_id = $1',
            [tagInfo.tagId]
          );
          
          if (tagResult.rows.length === 0) {
            return res.status(404).json({ message: `Tag with ID ${tagInfo.tagId} not found` });
          }
          
          tagId = tagInfo.tagId;
        } else if (tagInfo.name && tagInfo.groupId) {
          // Check if tag with this name already exists in the group
          const existingTagResult = await client.query(
            'SELECT tag_id FROM tag WHERE name = $1 AND group_id = $2',
            [tagInfo.name, tagInfo.groupId]
          );
          
          if (existingTagResult.rows.length > 0) {
            tagId = existingTagResult.rows[0].tag_id;
          } else {
            // Create new tag
            const newTagResult = await client.query(
              'INSERT INTO tag (group_id, name, description) VALUES ($1, $2, $3) RETURNING tag_id',
              [tagInfo.groupId, tagInfo.name, tagInfo.description || null]
            );
            
            tagId = newTagResult.rows[0].tag_id;
          }
        } else {
          return res.status(400).json({ message: 'Each tag must have either a tagId or both name and groupId' });
        }
        
        // Add tag to each image
        for (const imgId of imagesToTag) {
          // Check if tag is already applied to this image
          const existingImageTagResult = await client.query(
            'SELECT 1 FROM image_tags WHERE image_id = $1 AND tag_id = $2',
            [imgId, tagId]
          );
          
          if (existingImageTagResult.rows.length === 0) {
            // Add tag to image
            await client.query(
              'INSERT INTO image_tags (image_id, tag_id) VALUES ($1, $2)',
              [imgId, tagId]
            );
          }
        }
        
        addedTags.push(tagId);
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: `Successfully added ${addedTags.length} tags to ${imagesToTag.length} images`,
        tagIds: addedTags,
        imageIds: imagesToTag
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag update error:', error);
      res.status(500).json({ message: 'Failed to update tags' });
    } finally {
      client.release();
    }
  });
  
  // Create a new tag group
  router.post('/create-tag-group', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { categoryId, name, description } = req.body;
      
      if (!categoryId || !name) {
        return res.status(400).json({ message: 'Category ID and group name are required' });
      }
      
      // Verify category exists
      const categoryResult = await client.query(
        'SELECT category_id FROM category WHERE category_id = $1',
        [categoryId]
      );
      
      if (categoryResult.rows.length === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if tag group with this name already exists in the category
      const existingGroupResult = await client.query(
        'SELECT group_id FROM tag_group WHERE name = $1 AND category_id = $2',
        [name, categoryId]
      );
      
      if (existingGroupResult.rows.length > 0) {
        return res.status(409).json({ message: 'Tag group with this name already exists in the category' });
      }
      
      // Create new tag group
      const newGroupResult = await client.query(
        'INSERT INTO tag_group (category_id, name, description) VALUES ($1, $2, $3) RETURNING group_id, name',
        [categoryId, name.trim(), description?.trim() || null]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag group created successfully',
        group: {
          groupId: newGroupResult.rows[0].group_id,
          name: newGroupResult.rows[0].name,
          description: description?.trim() || null,
          categoryId: categoryId,
          tags: []
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag group creation error:', error);
      res.status(500).json({ message: 'Failed to create tag group' });
    } finally {
      client.release();
    }
  });
  
  // Remove tag from artwork/image
  router.post('/remove-tag', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { artworkId, tagId, imageId } = req.body;
      
      if (!artworkId || !tagId) {
        return res.status(400).json({ message: 'Artwork ID and tag ID are required' });
      }
      
      // Verify artwork exists
      const artworkResult = await client.query(
        'SELECT artwork_id FROM artwork WHERE artwork_id = $1',
        [artworkId]
      );
      
      if (artworkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      
      // Verify tag exists
      const tagResult = await client.query(
        'SELECT tag_id FROM tag WHERE tag_id = $1',
        [tagId]
      );
      
      if (tagResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      let removedCount = 0;
      
      if (imageId) {
        // Remove tag from specific image
        const imageResult = await client.query(
          'SELECT image_id FROM image WHERE image_id = $1 AND artwork_id = $2',
          [imageId, artworkId]
        );
        
        if (imageResult.rows.length === 0) {
          return res.status(404).json({ message: 'Image not found or does not belong to specified artwork' });
        }
        
        const deleteResult = await client.query(
          'DELETE FROM image_tag WHERE image_id = $1 AND tag_id = $2',
          [imageId, tagId]
        );
        
        removedCount = deleteResult.rowCount;
      } else {
        // Remove tag from all images in the artwork
        const deleteResult = await client.query(
          `DELETE FROM image_tag 
           WHERE tag_id = $1 
           AND image_id IN (
             SELECT image_id FROM image WHERE artwork_id = $2
           )`,
          [tagId, artworkId]
        );
        
        removedCount = deleteResult.rowCount;
      }
      
      await client.query('COMMIT');
      
      if (removedCount === 0) {
        return res.status(404).json({ message: 'Tag was not associated with the specified image(s)' });
      }
      
      res.json({
        message: `Tag removed successfully from ${removedCount} image(s)`,
        removedCount
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag removal error:', error);
      res.status(500).json({ message: 'Failed to remove tag' });
    } finally {
      client.release();
    }
  });

  // Get all available tag groups and tags for admin interface
  router.get('/tags', verifyAdminToken, async (req, res) => {
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

  return router;
};