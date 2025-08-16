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

  // Update tag name and description
  router.put('/manage-tags/update-tag/:tagId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { tagId } = req.params;
      const { name, description } = req.body;
      
      if (!tagId) {
        return res.status(400).json({ message: 'Tag ID is required' });
      }
      
      // Verify tag exists
      const tagResult = await client.query(
        'SELECT tag_id, group_id FROM tag WHERE tag_id = $1',
        [tagId]
      );
      
      if (tagResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      const groupId = tagResult.rows[0].group_id;
      
      // If name is being updated, check for duplicates in the same group
      if (name) {
        const duplicateCheck = await client.query(
          'SELECT tag_id FROM tag WHERE name = $1 AND group_id = $2 AND tag_id != $3',
          [name.trim(), groupId, tagId]
        );
        
        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({ message: 'Another tag with this name already exists in the group' });
        }
      }
      
      // Update tag name and/or description
      let updateQuery = 'UPDATE tag SET ';
      const updateValues = [];
      const updateFields = [];
      
      if (name !== undefined) {
        updateFields.push('name = $' + (updateValues.length + 1));
        updateValues.push(name.trim());
      }
      
      if (description !== undefined) {
        updateFields.push('description = $' + (updateValues.length + 1));
        updateValues.push(description?.trim() || null);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      
      updateQuery += updateFields.join(', ');
      updateQuery += ' WHERE tag_id = $' + (updateValues.length + 1);
      updateValues.push(tagId);
      
      await client.query(updateQuery, updateValues);
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag updated successfully',
        tagId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag update error:', error);
      res.status(500).json({ message: 'Failed to update tag' });
    } finally {
      client.release();
    }
  });

  // Update tag group name and/or description
  router.put('/manage-tags/update-tag-group/:groupId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { groupId } = req.params;
      const { name, description } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }
      
      // Verify group exists
      const groupResult = await client.query(
        'SELECT group_id, category_id FROM tag_group WHERE group_id = $1',
        [groupId]
      );
      
      if (groupResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag group not found' });
      }
      
      const categoryId = groupResult.rows[0].category_id;
      
      // If name is being updated, check for duplicates in the same category
      if (name) {
        const duplicateCheck = await client.query(
          'SELECT group_id FROM tag_group WHERE name = $1 AND category_id = $2 AND group_id != $3',
          [name.trim(), categoryId, groupId]
        );
        
        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({ message: 'Another tag group with this name already exists in the category' });
        }
      }
      
      // Update group name and/or description
      let updateQuery = 'UPDATE tag_group SET ';
      const updateValues = [];
      const updateFields = [];
      
      if (name !== undefined) {
        updateFields.push('name = $' + (updateValues.length + 1));
        updateValues.push(name.trim());
      }
      
      if (description !== undefined) {
        updateFields.push('description = $' + (updateValues.length + 1));
        updateValues.push(description?.trim() || null);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      
      updateQuery += updateFields.join(', ');
      updateQuery += ' WHERE group_id = $' + (updateValues.length + 1);
      updateValues.push(groupId);
      
      await client.query(updateQuery, updateValues);
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag group updated successfully',
        groupId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag group update error:', error);
      res.status(500).json({ message: 'Failed to update tag group' });
    } finally {
      client.release();
    }
  });

  // Delete tag group
  router.delete('/manage-tags/delete-tag-group/:groupId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { groupId } = req.params;
      
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }
      
      // Check if group exists
      const groupResult = await client.query(
        'SELECT group_id FROM tag_group WHERE group_id = $1',
        [groupId]
      );
      
      if (groupResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag group not found' });
      }
      
      // Check if group has tags
      const tagCount = await client.query(
        'SELECT COUNT(*) as count FROM tag WHERE group_id = $1',
        [groupId]
      );
      
      if (parseInt(tagCount.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete tag group that contains tags. Please delete all tags first.' 
        });
      }
      
      // Delete the tag group
      await client.query(
        'DELETE FROM tag_group WHERE group_id = $1',
        [groupId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag group deleted successfully',
        groupId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag group deletion error:', error);
      res.status(500).json({ message: 'Failed to delete tag group' });
    } finally {
      client.release();
    }
  });

  // Delete tag
  router.delete('/manage-tags/delete-tag/:tagId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { tagId } = req.params;
      
      if (!tagId) {
        return res.status(400).json({ message: 'Tag ID is required' });
      }
      
      // Check if tag exists
      const tagResult = await client.query(
        'SELECT tag_id FROM tag WHERE tag_id = $1',
        [tagId]
      );
      
      if (tagResult.rows.length === 0) {
        return res.status(404).json({ message: 'Tag not found' });
      }
      
      // Check if tag is used in any images
      const usageCount = await client.query(
        'SELECT COUNT(*) as count FROM image_tags WHERE tag_id = $1',
        [tagId]
      );
      
      if (parseInt(usageCount.rows[0].count) > 0) {
        return res.status(400).json({ 
          message: `Cannot delete tag as it is used in ${usageCount.rows[0].count} image(s). Please remove it from all images first.` 
        });
      }
      
      // Delete the tag
      await client.query(
        'DELETE FROM tag WHERE tag_id = $1',
        [tagId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Tag deleted successfully',
        tagId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tag deletion error:', error);
      res.status(500).json({ message: 'Failed to delete tag' });
    } finally {
      client.release();
    }
  });

  return router;
};