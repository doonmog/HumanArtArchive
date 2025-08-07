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

  router.post('/manage-tags/create-tag-group', verifyAdminToken, async (req, res) => {
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

  // Create a new tag
  router.post('/manage-tags/create-tag', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { groupId, name, description } = req.body;
      
      if (!groupId || !name) {
        return res.status(400).json({ message: 'Group ID and tag name are required' });
      }
      
      // Verify group exists
      const groupResult = await client.query(
        'SELECT group_id FROM tag_group WHERE group_id = $1',
        [groupId]
      );
      
      if (groupResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag group not found' });
      }
      
      // Check if tag with this name already exists in the group
      const existingTagResult = await client.query(
        'SELECT tag_id FROM tag WHERE name = $1 AND group_id = $2',
        [name, groupId]
      );
      
      if (existingTagResult.rows.length > 0) {
        return res.status(409).json({ message: 'Tag with this name already exists in the group' });
      }
      
      // Create new tag
      const newTagResult = await client.query(
        'INSERT INTO tag (group_id, name, description) VALUES ($1, $2, $3) RETURNING tag_id, name',
        [groupId, name.trim(), description?.trim() || null]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag created successfully',
        tag: {
          tagId: newTagResult.rows[0].tag_id,
          name: newTagResult.rows[0].name,
          description: description?.trim() || null,
          groupId: groupId
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag creation error:', error);
      res.status(500).json({ message: 'Failed to create tag' });
    } finally {
      client.release();
    }
  });

  // Update tag description
  router.put('/manage-tags/update-tag/:tagId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { tagId } = req.params;
      const { description } = req.body;
      
      if (!tagId) {
        return res.status(400).json({ message: 'Tag ID is required' });
      }
      
      // Verify tag exists
      const tagResult = await client.query(
        'SELECT tag_id FROM tag WHERE tag_id = $1',
        [tagId]
      );
      
      if (tagResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      // Update tag description
      await client.query(
        'UPDATE tag SET description = $1 WHERE tag_id = $2',
        [description?.trim() || null, tagId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag description updated successfully',
        tagId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag update error:', error);
      res.status(500).json({ message: 'Failed to update tag description' });
    } finally {
      client.release();
    }
  });

  // Update tag group description
  router.put('/manage-tags/update-tag-group/:groupId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { groupId } = req.params;
      const { description } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }
      
      // Verify group exists
      const groupResult = await client.query(
        'SELECT group_id FROM tag_group WHERE group_id = $1',
        [groupId]
      );
      
      if (groupResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag group not found' });
      }
      
      // Update group description
      await client.query(
        'UPDATE tag_group SET description = $1 WHERE group_id = $2',
        [description?.trim() || null, groupId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag group description updated successfully',
        groupId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag group update error:', error);
      res.status(500).json({ message: 'Failed to update tag group description' });
    } finally {
      client.release();
    }
  });

  return router;
};