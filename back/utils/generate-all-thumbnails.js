/**
 * Script to generate all thumbnails for the Human Art Archive
 * Processes up to 3 thumbnails simultaneously
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const { generateThumbnail } = require('./thumbnailGenerator');

// Create thumbnails directory if it doesn't exist
const THUMBNAIL_DIR = path.join(__dirname, '../thumbnails');
if (!fs.existsSync(THUMBNAIL_DIR)) {
  fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

// Connect to database
const pool = new Pool({
  host: 'db', // Always use Docker service name inside container
  port: 5432,
  database: process.env.POSTGRES_DB || 'db',
  user: process.env.POSTGRES_USER || 'user',
  password: process.env.POSTGRES_PASSWORD || 'password'
});

// Thumbnail sizes to generate
const THUMBNAIL_SIZES = [500, 800]; // 500px for grid view, 800px for dynamic view

// Queue system for parallel processing
class ThumbnailQueue {
  constructor(concurrency = 3) {
    this.queue = [];
    this.running = 0;
    this.concurrency = concurrency;
    this.completed = 0;
    this.failed = 0;
    this.total = 0;
  }

  add(task) {
    this.queue.push(task);
    this.total++;
    this.processNext();
  }

  async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();

    try {
      await task();
      this.completed++;
    } catch (error) {
      this.failed++;
      console.error('Error processing task:', error);
    } finally {
      this.running--;
      this.logProgress();
      this.processNext();
    }
  }

  logProgress() {
    const percent = Math.round((this.completed + this.failed) / this.total * 100);
    process.stdout.write(`\rProgress: ${this.completed} completed, ${this.failed} failed (${percent}% of ${this.total})`);
  }

  async waitForCompletion() {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.running === 0 && this.queue.length === 0) {
          clearInterval(checkInterval);
          console.log('\nAll thumbnails processed!');
          resolve();
        }
      }, 100);
    });
  }
}

// Get thumbnail file path for disk cache
function getThumbnailPath(id, size) {
  const hash = crypto.createHash('md5').update(`${id}_${size}`).digest('hex');
  return path.join(THUMBNAIL_DIR, `${hash}.jpg`);
}

// Main function
async function generateAllThumbnails() {
  console.log('Starting thumbnail generation...');
  
  try {
    // Get all images from database
    const { rows } = await pool.query('SELECT image_id, image FROM image');
    console.log(`Found ${rows.length} images to process`);
    
    const queue = new ThumbnailQueue(3); // Process 3 thumbnails at a time
    
    // Add each image and size combination to the queue
    for (const { image_id, image } of rows) {
      for (const size of THUMBNAIL_SIZES) {
        const thumbnailPath = getThumbnailPath(image_id, size);
        
        // Skip if thumbnail already exists
        if (fs.existsSync(thumbnailPath)) {
          continue;
        }
        
        // Add to queue
        queue.add(async () => {
          // Generate thumbnail
          const thumbnailBuffer = await generateThumbnail(image, size, size);
          
          // Save to disk
          fs.writeFileSync(thumbnailPath, thumbnailBuffer);
        });
      }
    }
    
    // Wait for all thumbnails to be generated
    await queue.waitForCompletion();
    
    console.log('Thumbnail generation complete!');
    console.log(`Generated ${queue.completed} thumbnails (${queue.failed} failed)`);
  } catch (error) {
    console.error('Error generating thumbnails:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the script
generateAllThumbnails();
