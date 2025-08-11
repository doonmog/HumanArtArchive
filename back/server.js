const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../db/.env') });


const getArtRoutes = require('./user/get-art.js');
const getImageRoutes = require('./user/get-image.js');
const getArtworkDetailsRoutes = require('./user/get-artwork-details.js');
const getTagsRoutes = require('./user/get-tags.js');
const getUsedTagsRoutes = require('./user/get-used-tags.js');
const authRoutes = require('./auth/auth.js');
const uploadArtworkRoutes = require('./admin/upload-artwork.js');
const updateTagsRoutes = require('./admin/update-tags.js');
const manageArtworkRoutes = require('./admin/manage-artwork.js');
const manageTagsRoutes = require('./admin/manage-tags.js');

const app = express();
const port = 3001;

app.set('trust proxy', 1);

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: 'db',
  port: 5432,
  database: 'db',
});

app.use(cors({
  origin: ['https://humanartarchive.com', 'https://www.humanartarchive.com'],
  credentials: true
}));
app.use(express.json());

const RATE_LIMIT_BYPASS_KEY = process.env.RATE_LIMIT_BYPASS_KEY;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting if valid bypass key is provided
  skip: (req, res) => {
    const bypassKey = req.headers['x-rate-limit-bypass'];
    return bypassKey === RATE_LIMIT_BYPASS_KEY;
  }
});

// Apply rate limiting to all requests
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// IMPORTANT: Route mounting for Nuxt proxy compatibility
// The Nuxt frontend has proxy rule: '/api/**': { proxy: 'http://back:3001/**' }
// This strips '/api' from requests before forwarding to backend.
// Example: Frontend calls '/api/art' -> Backend receives '/art'
// Therefore, all API routes must be mounted at root ('/') not '/api'
app.use('/', getArtRoutes(pool));
app.use('/', getImageRoutes(pool));
app.use('/', getArtworkDetailsRoutes(pool));
app.use('/', getTagsRoutes(pool));
app.use('/', getUsedTagsRoutes(pool));

app.use('/auth', authRoutes(pool));
app.use('/admin', uploadArtworkRoutes(pool));
app.use('/admin', updateTagsRoutes(pool));
app.use('/admin', manageArtworkRoutes(pool));
app.use('/admin', manageTagsRoutes(pool));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});