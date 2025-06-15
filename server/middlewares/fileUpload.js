const fileUpload = require('express-fileupload');

/**
 * Configure express-fileupload middleware
 */
const uploadMiddleware = fileUpload({
  useTempFiles: false,
  tempFileDir: '/tmp/',
  limits: { 
    fileSize: 1000 * 1024 * 1024 // 1GB max
  },
  abortOnLimit: true,
  responseOnLimit: 'File size exceeds limit'
});

/**
 * Validate uploaded files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Next middleware function
 */
function validateFiles(req, res, next) {
  if (!req.files) {
    return next();
  }

  const errors = [];
  
  if (req.files.video) {
    const videoFile = req.files.video;
    if (!videoFile.mimetype.startsWith('video/')) {
      errors.push('Video file must be a valid video format');
    }
    if (videoFile.size > 1000 * 1024 * 1024) { // 1GB
      errors.push('Video file must be under 1GB');
    }
  }
  
  if (req.files.thumbnail) {
    const thumbnailFile = req.files.thumbnail;
    if (!thumbnailFile.mimetype.startsWith('image/')) {
      errors.push('Thumbnail must be a valid image format');
    }
    if (thumbnailFile.size > 500 * 1024 * 1024) { // 500MB
      errors.push('Thumbnail must be under 500MB');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'File validation failed', 
      errors 
    });
  }
  
  next();
}

module.exports = {
  uploadMiddleware,
  validateFiles
};
