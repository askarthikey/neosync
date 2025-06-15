const supabase = require('../config/supabase');
const path = require('path');

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} mimetype - File mime type
 * @param {string} bucket - Supabase storage bucket name
 * @param {string} folder - Folder path within bucket
 * @returns {Promise<{url: string, filename: string}>}
 */
async function uploadToSupabase(fileBuffer, fileName, mimetype, bucket, folder = '') {
  try {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(fileName);
    const uniqueFileName = `${path.basename(fileName, ext)}-${uniqueSuffix}${ext}`;
    
    // Create full path
    const fullPath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    return {
      url: urlData.publicUrl,
      filename: uniqueFileName,
      path: fullPath
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - File path in storage
 * @param {string} bucket - Supabase storage bucket name
 * @returns {Promise<void>}
 */
async function deleteFromSupabase(filePath, bucket) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
}

/**
 * Check if bucket exists, create if it doesn't
 * @param {string} bucketName - Name of the bucket
 * @returns {Promise<void>}
 */
async function ensureBucketExists(bucketName) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Error listing buckets: ${listError.message}`);
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['video/*', 'image/*'],
        fileSizeLimit: 1073741824 // 1GB
      });

      if (createError) {
        throw new Error(`Error creating bucket: ${createError.message}`);
      }
      
      console.log(`Created bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

module.exports = {
  uploadToSupabase,
  deleteFromSupabase,
  ensureBucketExists
};
