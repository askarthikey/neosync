const { uploadToSupabase, deleteFromSupabase } = require('./supabaseStorage');

/**
 * Custom Multer Storage Engine for Supabase
 */
class SupabaseStorage {
  constructor(options) {
    this.getBucket = options.bucket;
    this.getFolder = options.folder || (() => '');
    this.getFileName = options.filename || this._defaultFileName;
  }

  _defaultFileName(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = require('path').extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }

  _handleFile(req, file, cb) {
    const bucket = typeof this.getBucket === 'function' ? this.getBucket(req, file) : this.getBucket;
    const folder = typeof this.getFolder === 'function' ? this.getFolder(req, file) : this.getFolder;

    this.getFileName(req, file, async (err, filename) => {
      if (err) return cb(err);

      try {
        const chunks = [];
        
        file.stream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        file.stream.on('end', async () => {
          try {
            const fileBuffer = Buffer.concat(chunks);
            
            const result = await uploadToSupabase(
              fileBuffer,
              filename,
              file.mimetype,
              bucket,
              folder
            );

            cb(null, {
              bucket: bucket,
              key: result.path,
              path: result.path,
              filename: result.filename,
              url: result.url,
              size: fileBuffer.length,
              mimetype: file.mimetype
            });
          } catch (uploadError) {
            cb(uploadError);
          }
        });

        file.stream.on('error', (streamError) => {
          cb(streamError);
        });
      } catch (error) {
        cb(error);
      }
    });
  }

  _removeFile(req, file, cb) {
    if (file.key) {
      deleteFromSupabase(file.key, file.bucket)
        .then(() => cb(null))
        .catch(cb);
    } else {
      cb(null);
    }
  }
}

module.exports = function(options) {
  return new SupabaseStorage(options);
};
