const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');

const dbTestRoutes = require('./test/db-test.js');
const getTestRoutes = require('./test/get-test.js');
const tagTestRoutes = require('./test/tag-test.js');
const getArtRoutes = require('./user/get-art.js');
const getImageRoutes = require('./user/get-image.js');

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

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/db-test', dbTestRoutes(pool));
app.use('/', getTestRoutes(pool));
app.use('/', tagTestRoutes(pool));
app.use('/', getArtRoutes(pool));
app.use('/', getImageRoutes(pool));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});