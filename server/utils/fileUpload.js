const supabase = require('../config/supabase');

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Name of the file
 * @param {string} bucket - Supabase storage bucket name
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function uploadFileToSupabase(fileBuffer, fileName, bucket, mimeType) {
  try {
    console.log(`🔄 Starting upload: ${fileName} to bucket: ${bucket}, size: ${fileBuffer.length} bytes, type: ${mimeType}`);
    
    // Ensure the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return { success: false, error: `Cannot access storage: ${listError.message}` };
    }
    
    const bucketExists = buckets.find(b => b.name === bucket);
    if (!bucketExists) {
      console.error(`❌ Bucket '${bucket}' does not exist`);
      return { success: false, error: `Bucket '${bucket}' does not exist` };
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true // Allow overwriting files with same name
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      console.error('❌ Upload details:', { bucket, fileName, mimeType, bufferSize: fileBuffer.length });
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`✅ Upload successful: ${fileName} -> ${urlData.publicUrl}`);

    return { 
      success: true, 
      data: { 
        path: data.path, 
        publicUrl: urlData.publicUrl,
        fileName 
      } 
    };
  } catch (error) {
    console.error('❌ Unexpected upload error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} fileName - Name of the file to delete
 * @param {string} bucket - Supabase storage bucket name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteFileFromSupabase(fileName, bucket) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the filename
 * @returns {string} - Unique filename
 */
function generateUniqueFileName(originalName, prefix = '') {
  const timestamp = Date.now();
  const randomNum = Math.round(Math.random() * 1e9);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `${prefix}${timestamp}-${randomNum}${extension}`;
}

/**
 * Validate file type
 * @param {string} mimeType - MIME type of the file
 * @param {string} fileType - Expected file type ('video' or 'image')
 * @returns {boolean} - Whether file type is valid
 */
function validateFileType(mimeType, fileType) {
  if (fileType === 'video') {
    return mimeType.startsWith('video/');
  } else if (fileType === 'image') {
    return mimeType.startsWith('image/');
  }
  return false;
}

/**
 * Validate file size
 * @param {number} fileSize - Size of the file in bytes
 * @param {string} fileType - Type of file ('video' or 'image')
 * @returns {boolean} - Whether file size is valid
 */
function validateFileSize(fileSize, fileType) {
  const maxVideoSize = 1000 * 1024 * 1024; // 1GB
  const maxImageSize = 500 * 1024 * 1024; // 500MB
  
  if (fileType === 'video') {
    return fileSize <= maxVideoSize;
  } else if (fileType === 'image') {
    return fileSize <= maxImageSize;
  }
  return false;
}

module.exports = {
  uploadFileToSupabase,
  deleteFileFromSupabase,
  generateUniqueFileName,
  validateFileType,
  validateFileSize
};
