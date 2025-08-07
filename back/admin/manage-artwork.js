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

  // Update artwork details
  router.put('/artwork/:artworkId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { artworkId } = req.params;
      const { artistName, artworkName, year, description } = req.body;
      
      if (!artworkId) {
        return res.status(400).json({ message: 'Artwork ID is required' });
      }
      
      // Verify artwork exists
      const artworkResult = await client.query(
        'SELECT artwork_id FROM artwork WHERE artwork_id = $1',
        [artworkId]
      );
      
      if (artworkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      
      let artistId = null;
      
      // Handle artist - create if doesn't exist, find if it does
      if (artistName && artistName.trim()) {
        const existingArtistResult = await client.query(
          'SELECT artist_id FROM artist WHERE name = $1',
          [artistName.trim()]
        );
        
        if (existingArtistResult.rows.length > 0) {
          artistId = existingArtistResult.rows[0].artist_id;
        } else {
          const newArtistResult = await client.query(
            'INSERT INTO artist (name) VALUES ($1) RETURNING artist_id',
            [artistName.trim()]
          );
          artistId = newArtistResult.rows[0].artist_id;
        }
      }
      
      // Update artwork
      const updateResult = await client.query(
        'UPDATE artwork SET artist_id = $1, artwork_name = $2, year = $3, description = $4 WHERE artwork_id = $5 RETURNING *',
        [artistId, artworkName || null, year || null, description || null, artworkId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Artwork updated successfully',
        artwork: updateResult.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Artwork update error:', error);
      res.status(500).json({ message: 'Failed to update artwork' });
    } finally {
      client.release();
    }
  });

  // Delete a specific image
  router.delete('/image/:imageId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { imageId } = req.params;
      
      if (!imageId) {
        return res.status(400).json({ message: 'Image ID is required' });
      }
      
      // Verify image exists and get artwork info
      const imageResult = await client.query(
        'SELECT i.image_id, i.artwork_id, a.artwork_name FROM image i LEFT JOIN artwork a ON i.artwork_id = a.artwork_id WHERE i.image_id = $1',
        [imageId]
      );
      
      if (imageResult.rows.length === 0) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      const artworkId = imageResult.rows[0].artwork_id;
      const artworkName = imageResult.rows[0].artwork_name;
      
      // Delete image tags first (foreign key constraint)
      await client.query(
        'DELETE FROM image_tags WHERE image_id = $1',
        [imageId]
      );
      
      // Delete the image
      await client.query(
        'DELETE FROM image WHERE image_id = $1',
        [imageId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Image deleted successfully',
        deletedImageId: imageId,
        artworkId,
        artworkName
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Image deletion error:', error);
      res.status(500).json({ message: 'Failed to delete image' });
    } finally {
      client.release();
    }
  });

  // Delete artwork and all associated images
  router.delete('/artwork/:artworkId', verifyAdminToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { artworkId } = req.params;
      
      if (!artworkId) {
        return res.status(400).json({ message: 'Artwork ID is required' });
      }
      
      // Verify artwork exists and get details
      const artworkResult = await client.query(
        'SELECT a.artwork_id, a.artwork_name, ar.name as artist_name FROM artwork a LEFT JOIN artist ar ON a.artist_id = ar.artist_id WHERE a.artwork_id = $1',
        [artworkId]
      );
      
      if (artworkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Artwork not found' });
      }
      
      const artworkInfo = artworkResult.rows[0];
      
      // Get all images for this artwork
      const imagesResult = await client.query(
        'SELECT image_id FROM image WHERE artwork_id = $1',
        [artworkId]
      );
      
      const imageIds = imagesResult.rows.map(row => row.image_id);
      
      // Delete all image tags for these images
      if (imageIds.length > 0) {
        const imagePlaceholders = imageIds.map((_, index) => `$${index + 1}`).join(', ');
        await client.query(
          `DELETE FROM image_tags WHERE image_id IN (${imagePlaceholders})`,
          imageIds
        );
      }
      
      // Delete all images for this artwork
      await client.query(
        'DELETE FROM image WHERE artwork_id = $1',
        [artworkId]
      );
      
      // Delete the artwork
      await client.query(
        'DELETE FROM artwork WHERE artwork_id = $1',
        [artworkId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Artwork and all associated images deleted successfully',
        deletedArtwork: {
          artworkId: artworkInfo.artwork_id,
          artworkName: artworkInfo.artwork_name,
          artistName: artworkInfo.artist_name,
          deletedImageCount: imageIds.length
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Artwork deletion error:', error);
      res.status(500).json({ message: 'Failed to delete artwork' });
    } finally {
      client.release();
    }
  });

  return router;
};