import React, { useState } from 'react';

const YouTubeUpload = ({ project, onUploadSuccess }) => {
  const [uploadData, setUploadData] = useState({
    title: project.title || '',
    description: project.description || '',
    tags: project.tags ? project.tags.join(', ') : ''
  });
  const [files, setFiles] = useState({
    video: null,
    thumbnail: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
    }
  };

  const handleUploadToYouTube = async (e) => {
    e.preventDefault();
    
    if (!files.video) {
      alert('Please select a video file');
      return;
    }

    if (!uploadData.title.trim()) {
      alert('Please enter a video title');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Preparing upload...');

      const formData = new FormData();
      formData.append('video', files.video);
      if (files.thumbnail) {
        formData.append('thumbnail', files.thumbnail);
      }
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('tags', uploadData.tags);
      formData.append('creatorUsername', project.userCreated);

      setUploadProgress('Uploading to YouTube...');

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/youtubeApi/youtube/upload/${project._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadProgress('Upload completed successfully!');
        alert(`Video uploaded to YouTube successfully!\nVideo URL: ${data.youtube.url}`);
        
        // Reset form
        setFiles({ video: null, thumbnail: null });
        setUploadData({
          title: project.title || '',
          description: project.description || '',
          tags: project.tags ? project.tags.join(', ') : ''
        });
        
        if (onUploadSuccess) {
          onUploadSuccess(data.youtube);
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading to YouTube:', error);
      alert(`Failed to upload to YouTube: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <svg className="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <h3 className="text-xl font-semibold text-gray-800">Upload to YouTube</h3>
      </div>

      <form onSubmit={handleUploadToYouTube} className="space-y-4">
        {/* Video File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video File *
          </label>
          <input
            type="file"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: MP4, AVI, MOV, WMV (max 1GB)
          </p>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Thumbnail (Optional)
          </label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG (max 2MB, recommended: 1280x720)
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Title *
          </label>
          <input
            type="text"
            name="title"
            value={uploadData.title}
            onChange={handleInputChange}
            disabled={uploading}
            maxLength="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter video title"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {uploadData.title.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={uploadData.description}
            onChange={handleInputChange}
            disabled={uploading}
            rows="4"
            maxLength="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter video description"
          />
          <p className="text-xs text-gray-500 mt-1">
            {uploadData.description.length}/1000 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={uploadData.tags}
            onChange={handleInputChange}
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 font-medium">{uploadProgress}</span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          type="submit"
          disabled={uploading || !files.video}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload to YouTube'}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Videos are uploaded as private initially</li>
          <li>• The content creator can review and publish the video</li>
          <li>• Make sure the creator has connected their YouTube channel</li>
          <li>• Upload may take several minutes depending on file size</li>
        </ul>
      </div>
    </div>
  );
};

export default YouTubeUpload;
