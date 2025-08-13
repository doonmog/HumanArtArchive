const express = require('express');
const { generateThumbnail } = require('../utils/thumbnailGenerator');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create thumbnails directory if it doesn't exist
const THUMBNAIL_DIR = path.join(__dirname, '../thumbnails');
if (!fs.existsSync(THUMBNAIL_DIR)) {
  try {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating thumbnails directory:', err);
  }
}

module.exports = (pool) => {
  const router = express.Router();

  // In-memory cache for recently accessed thumbnails
  const thumbnailCache = new Map();
  const CACHE_MAX_SIZE = 50; // Reduced memory cache size
  
  // Request throttling queue
  const pendingRequests = new Map();
  const MAX_CONCURRENT_GENERATIONS = 3; // Maximum concurrent thumbnail generations
  let activeGenerations = 0;
  
  // Process the next thumbnail in the queue
  function processQueue() {
    if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) return;
    
    // Find the next request to process
    for (const [key, { resolve, imageBuffer, size }] of pendingRequests.entries()) {
      pendingRequests.delete(key);
      activeGenerations++;
      
      // Generate the thumbnail
      generateThumbnail(imageBuffer, size, size)
        .then(thumbnailBuffer => {
          resolve(thumbnailBuffer);
          activeGenerations--;
          processQueue(); // Process next request
        })
        .catch(err => {
          console.error('Error in queued thumbnail generation:', err);
          resolve(imageBuffer); // Fall back to original image
          activeGenerations--;
          processQueue(); // Process next request
        });
      
      break;
    }
  }
  
  // Queue a thumbnail generation request
  function queueThumbnailGeneration(imageBuffer, size) {
    return new Promise(resolve => {
      const key = crypto.randomBytes(8).toString('hex');
      pendingRequests.set(key, { resolve, imageBuffer, size });
      processQueue();
    });
  }
  
  // Get thumbnail file path for disk cache
  function getThumbnailPath(id, size) {
    const hash = crypto.createHash('md5').update(`${id}_${size}`).digest('hex');
    return path.join(THUMBNAIL_DIR, `${hash}.jpg`);
  }

  router.get('/thumbnail/:imageId', async (req, res) => {
    try {
      const { imageId } = req.params;
      const { size = '500' } = req.query; // Allow size parameter, default to 500px
      
      const maxSize = Math.min(parseInt(size) || 500, 500); // Cap at 500px for performance
      const cacheKey = `${imageId}_${maxSize}`;
      const thumbnailPath = getThumbnailPath(imageId, maxSize);
      
      // Check in-memory cache first (fastest)
      if (thumbnailCache.has(cacheKey)) {
        const cachedThumbnail = thumbnailCache.get(cacheKey);
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(cachedThumbnail);
      }
      
      // Check disk cache next (still fast)
      if (fs.existsSync(thumbnailPath)) {
        try {
          const thumbnailBuffer = fs.readFileSync(thumbnailPath);
          
          // Add to in-memory cache
          if (thumbnailCache.size >= CACHE_MAX_SIZE) {
            const firstKey = thumbnailCache.keys().next().value;
            thumbnailCache.delete(firstKey);
          }
          thumbnailCache.set(cacheKey, thumbnailBuffer);
          
          res.set('Content-Type', 'image/jpeg');
          res.set('Cache-Control', 'public, max-age=86400');
          return res.send(thumbnailBuffer);
        } catch (err) {
          console.error('Error reading cached thumbnail:', err);
          // Continue to generate if read fails
        }
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
      
      // Generate thumbnail with throttling
      const thumbnailBuffer = await queueThumbnailGeneration(originalImageBuffer, maxSize);
      
      // Save to disk cache
      try {
        fs.writeFileSync(thumbnailPath, thumbnailBuffer);
      } catch (err) {
        console.error('Error writing thumbnail to disk cache:', err);
      }
      
      // Add to in-memory cache
      if (thumbnailCache.size >= CACHE_MAX_SIZE) {
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
      const thumbnailPath = getThumbnailPath(imageId, maxSize);
      
      // Check in-memory cache first (fastest)
      if (thumbnailCache.has(cacheKey)) {
        const cachedThumbnail = thumbnailCache.get(cacheKey);
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(cachedThumbnail);
      }
      
      // Check disk cache next (still fast)
      if (fs.existsSync(thumbnailPath)) {
        try {
          const thumbnailBuffer = fs.readFileSync(thumbnailPath);
          
          // Add to in-memory cache
          if (thumbnailCache.size >= CACHE_MAX_SIZE) {
            const firstKey = thumbnailCache.keys().next().value;
            thumbnailCache.delete(firstKey);
          }
          thumbnailCache.set(cacheKey, thumbnailBuffer);
          
          res.set('Content-Type', 'image/jpeg');
          res.set('Cache-Control', 'public, max-age=86400');
          return res.send(thumbnailBuffer);
        } catch (err) {
          console.error('Error reading cached thumbnail:', err);
          // Continue to generate if read fails
        }
      }
      
      // Generate thumbnail with throttling
      const thumbnailBuffer = await queueThumbnailGeneration(originalImageBuffer, maxSize);
      
      // Save to disk cache
      try {
        fs.writeFileSync(thumbnailPath, thumbnailBuffer);
      } catch (err) {
        console.error('Error writing thumbnail to disk cache:', err);
      }
      
      // Add to in-memory cache
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
