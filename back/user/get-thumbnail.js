const express = require('express');
const { generateThumbnail } = require('../utils/thumbnailGenerator');

module.exports = (pool) => {
  const router = express.Router();

  // Cache for thumbnails to avoid regenerating the same thumbnails repeatedly
  const thumbnailCache = new Map();
  const CACHE_MAX_SIZE = 100; // Limit cache size to prevent memory issues

  router.get('/thumbnail/:imageId', async (req, res) => {
    try {
      const { imageId } = req.params;
      const { size = '500' } = req.query; // Allow size parameter, default to 500px
      
      const maxSize = Math.min(parseInt(size) || 500, 500); // Cap at 500px for performance
      const cacheKey = `${imageId}_${maxSize}`;
      
      // Check cache first
      if (thumbnailCache.has(cacheKey)) {
        const cachedThumbnail = thumbnailCache.get(cacheKey);
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(cachedThumbnail);
      }
      
      // Get original image from database
      const { rows } = await pool.query(
        'SELECT image FROM image WHERE image_id = $1',
        [imageId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      const originalImageBuffer = rows[0].image;
      
      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(originalImageBuffer, maxSize, maxSize);
      
      // Add to cache (with size limit)
      if (thumbnailCache.size >= CACHE_MAX_SIZE) {
        // Remove oldest entry
        const firstKey = thumbnailCache.keys().next().value;
        thumbnailCache.delete(firstKey);
      }
      thumbnailCache.set(cacheKey, thumbnailBuffer);
      
      // Send thumbnail
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(thumbnailBuffer);
      
    } catch (err) {
      console.error('Error serving thumbnail:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/thumbnail-by-artwork/:artworkId', async (req, res) => {
    try {
      const { artworkId } = req.params;
      const { size = '500' } = req.query;
      
      const maxSize = Math.min(parseInt(size) || 500, 500);
      
      // Get first image for the artwork
      const { rows } = await pool.query(
        'SELECT image_id, image FROM image WHERE artwork_id = $1 AND display_order = 1',
        [artworkId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      const { image_id: imageId, image: originalImageBuffer } = rows[0];
      const cacheKey = `${imageId}_${maxSize}`;
      
      // Check cache first
      if (thumbnailCache.has(cacheKey)) {
        const cachedThumbnail = thumbnailCache.get(cacheKey);
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(cachedThumbnail);
      }
      
      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(originalImageBuffer, maxSize, maxSize);
      
      // Add to cache
      if (thumbnailCache.size >= CACHE_MAX_SIZE) {
        const firstKey = thumbnailCache.keys().next().value;
        thumbnailCache.delete(firstKey);
      }
      thumbnailCache.set(cacheKey, thumbnailBuffer);
      
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(thumbnailBuffer);
      
    } catch (err) {
      console.error('Error serving thumbnail by artwork:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
