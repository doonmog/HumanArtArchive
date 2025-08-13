/**
 * Generate a thumbnail from an image buffer using jimp (lightweight alternative to Sharp)
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {number} maxWidth - Maximum width for thumbnail (default: 300)
 * @param {number} maxHeight - Maximum height for thumbnail (default: 300)
 * @param {number} quality - JPEG quality (0-100, default: 80)
 * @returns {Promise<Buffer>} - Thumbnail image buffer
 */
async function generateThumbnail(imageBuffer, maxWidth = 300, maxHeight = 300, quality = 80) {
  try {
    // Use jimp for image processing (lightweight alternative to Sharp)
    const Jimp = require('jimp');
    
    // Load image from buffer
    const image = await Jimp.read(imageBuffer);
    
    // Calculate new dimensions while maintaining aspect ratio
    const { width: newWidth, height: newHeight } = calculateThumbnailDimensions(
      image.bitmap.width, 
      image.bitmap.height, 
      maxWidth, 
      maxHeight
    );
    
    // Resize image with high quality algorithm
    image.resize(newWidth, newHeight, Jimp.RESIZE_LANCZOS);
    
    // Set JPEG quality
    image.quality(quality);
    
    // Convert to buffer
    const thumbnailBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    
    return thumbnailBuffer;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    // If thumbnail generation fails, return original image
    return imageBuffer;
  }
}

/**
 * Calculate thumbnail dimensions while maintaining aspect ratio
 * @param {number} originalWidth 
 * @param {number} originalHeight 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @returns {object} - New width and height
 */
function calculateThumbnailDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  let width = originalWidth;
  let height = originalHeight;
  
  // Calculate scaling factor
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const scalingFactor = Math.min(widthRatio, heightRatio);
  
  // Only scale down, never scale up
  if (scalingFactor < 1) {
    width = Math.round(originalWidth * scalingFactor);
    height = Math.round(originalHeight * scalingFactor);
  }
  
  return { width, height };
}

module.exports = {
  generateThumbnail,
  calculateThumbnailDimensions
};
