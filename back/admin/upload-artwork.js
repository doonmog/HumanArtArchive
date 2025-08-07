const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Max 10 images per artwork
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

  router.post('/upload-artwork', verifyAdminToken, upload.array('images', 10), async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { artworkName, artistName, year, description, imageOrder } = req.body;
      const imageFiles = req.files;

      if (!artworkName || !imageFiles || imageFiles.length === 0) {
        return res.status(400).json({ message: 'Artwork name and at least one image are required' });
      }

      // Parse image order if provided
      let orderArray = [];
      if (imageOrder) {
        try {
          orderArray = JSON.parse(imageOrder);
        } catch (e) {
          // If parsing fails, use default order
          orderArray = imageFiles.map((_, index) => index);
        }
      } else {
        orderArray = imageFiles.map((_, index) => index);
      }

      let artistId = null;
      if (artistName && artistName.trim()) {
        const existingArtist = await client.query(
          'SELECT artist_id FROM artist WHERE name = $1',
          [artistName.trim()]
        );

        if (existingArtist.rows.length > 0) {
          artistId = existingArtist.rows[0].artist_id;
        } else {
          const newArtist = await client.query(
            'INSERT INTO artist (name) VALUES ($1) RETURNING artist_id',
            [artistName.trim()]
          );
          artistId = newArtist.rows[0].artist_id;
        }
      }

      const artworkResult = await client.query(
        'INSERT INTO artwork (artist_id, artwork_name, year, description) VALUES ($1, $2, $3, $4) RETURNING artwork_id',
        [artistId, artworkName, year ? parseInt(year) : null, description || null]
      );

      const artworkId = artworkResult.rows[0].artwork_id;

      // Insert all images with their display order
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const displayOrder = orderArray[i] !== undefined ? orderArray[i] + 1 : i + 1;
        
        const imageBuffer = imageFile.buffer;
        const fileSize = imageFile.size;
        const resolution = `${imageFile.originalname}`;

        await client.query(
          'INSERT INTO image (artwork_id, image, filesize, resolution, display_order) VALUES ($1, $2, $3, $4, $5)',
          [artworkId, imageBuffer, fileSize, resolution, displayOrder]
        );
      }

      await client.query('COMMIT');

      res.json({ 
        message: `Artwork uploaded successfully with ${imageFiles.length} image(s)`,
        artworkId: artworkId,
        imageCount: imageFiles.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Upload error:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Artwork name already exists' });
      }
      
      res.status(500).json({ message: 'Failed to upload artwork' });
    } finally {
      client.release();
    }
  });

  return router;
};