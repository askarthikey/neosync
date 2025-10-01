import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

const YouTubeUpload = ({ project, onUploadSuccess }) => {
  const { showToast } = useNotifications();
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
  const [uploadError, setUploadError] = useState(null);
  const [creatorYouTubeStatus, setCreatorYouTubeStatus] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [youtubeAccessStatus, setYoutubeAccessStatus] = useState(null);

  // Check YouTube access permissions
  React.useEffect(() => {
    const checkYouTubeAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/projectApi/check-youtube-access/${project._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setYoutubeAccessStatus(data);
        } else {
          setYoutubeAccessStatus({ hasAccess: false, timeRemaining: 0 });
        }
      } catch (error) {
        console.error('Error checking YouTube access:', error);
        setYoutubeAccessStatus({ hasAccess: false, timeRemaining: 0 });
      }
    };

    if (project._id) {
      checkYouTubeAccess();
    }
  }, [project._id]);

  // Check if creator has connected YouTube account
  React.useEffect(() => {
    const checkCreatorYouTubeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        // Note: This would need a new endpoint to check another user's YouTube status
        // For now, we'll assume it's connected and handle errors during upload
        setCreatorYouTubeStatus({ isAuthenticated: true });
      } catch (error) {
        console.error('Error checking creator YouTube auth:', error);
        setCreatorYouTubeStatus({ isAuthenticated: false });
      } finally {
        setCheckingAuth(false);
      }
    };

    checkCreatorYouTubeAuth();
  }, [project.userCreated]);

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
      setUploadError('Please select a video file');
      showToast('Please select a video file', 'error');
      return;
    }

    if (!uploadData.title.trim()) {
      setUploadError('Please enter a video title');
      showToast('Please enter a video title', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Preparing upload...');
      setUploadError(null);

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
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('Uploading to:', `http://localhost:4000/youtubeApi/youtube/upload/${project._id}`);
      console.log('Project data:', { 
        id: project._id, 
        userCreated: project.userCreated,
        title: uploadData.title 
      });

      const response = await fetch(`http://localhost:4000/youtubeApi/youtube/upload/${project._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (data.success) {
        setUploadProgress('Upload completed successfully!');
        showToast(`Video uploaded to YouTube successfully!`, 'success');
        
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
      const errorMessage = error.message || 'Failed to upload to YouTube';
      setUploadError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center mr-4 border border-red-500/30">
          <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Upload to YouTube</h3>
          <p className="text-gray-300 text-sm mt-1">Share your project with the world</p>
        </div>
      </div>

      {checkingAuth ? (
        <div className="flex items-center justify-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-3"></div>
            <span className="text-gray-300">Checking permissions...</span>
          </div>
        </div>
      ) : !youtubeAccessStatus?.hasAccess ? (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h4 className="text-xl font-semibold text-red-300 mb-3">YouTube Access Required</h4>
          <p className="text-red-200 mb-4">
            The project creator must grant YouTube upload permission before you can upload videos to their channel.
          </p>
          <div className="bg-red-500/20 rounded-xl p-4 border border-red-400/30">
            <h5 className="font-medium text-red-300 mb-2">How to get access:</h5>
            <ol className="text-sm text-red-200 space-y-1 text-left">
              <li>1. Contact the project creator to request YouTube access</li>
              <li>2. Creator will grant 1-hour temporary access from their project dashboard</li>
              <li>3. Return here to upload once access is granted</li>
            </ol>
          </div>
        </div>
      ) : (
        <>
          {/* Access granted - show upload interface */}
          <div className="mb-6 bg-green-500/10 backdrop-blur-sm border border-green-400/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-green-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                YouTube Access Granted
              </h4>
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-lg">
                {Math.floor(youtubeAccessStatus.timeRemaining / 60)} min left
              </span>
            </div>
            <p className="text-green-200 text-sm">
              You have permission to upload to <strong>{project.userCreated}</strong>'s YouTube channel. 
              Access expires in {Math.floor(youtubeAccessStatus.timeRemaining / 60)} minutes.
            </p>
          </div>

          {/* Enhanced info about YouTube authentication */}
          <div className="mb-8 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              YouTube Upload Information:
            </h4>
            <ul className="text-sm text-blue-200 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Video will be uploaded to <strong className="text-white">{project.userCreated}</strong>'s YouTube channel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Videos are uploaded as private for creator review</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Upload may take several minutes depending on file size</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Access will expire automatically after the time limit</span>
              </li>
            </ul>
          </div>

      <form onSubmit={handleUploadToYouTube} className="space-y-6">{/* Enhanced Error Display */}
        {uploadError && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h5 className="font-medium text-red-300 mb-1">Upload Error</h5>
                <p className="text-sm text-red-200">{uploadError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Video File input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video File *
          </label>
          <div className="relative">
            <input
              type="file"
              name="video"
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploading || !youtubeAccessStatus?.hasAccess}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all backdrop-blur-sm disabled:opacity-50"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Supported formats: MP4, AVI, MOV, WMV (max 1GB)
          </p>
        </div>

        {/* Enhanced Thumbnail input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Custom Thumbnail (Optional)
          </label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || !youtubeAccessStatus?.hasAccess}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all backdrop-blur-sm disabled:opacity-50"
          />
          <p className="text-xs text-gray-400 mt-2">
            JPG, PNG (max 2MB, recommended: 1280x720)
          </p>
        </div>

        {/* Enhanced Title input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Video Title *
          </label>
          <input
            type="text"
            name="title"
            value={uploadData.title}
            onChange={handleInputChange}
            disabled={uploading || !youtubeAccessStatus?.hasAccess}
            maxLength="100"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400/50 transition-all backdrop-blur-sm disabled:opacity-50"
            placeholder="Enter video title"
            required
          />
          <p className="text-xs text-gray-400 mt-2">
            {uploadData.title.length}/100 characters
          </p>
        </div>

        {/* Enhanced Description input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Description
          </label>
          <textarea
            name="description"
            value={uploadData.description}
            onChange={handleInputChange}
            disabled={uploading || !youtubeAccessStatus?.hasAccess}
            rows="4"
            maxLength="1000"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 transition-all backdrop-blur-sm disabled:opacity-50 resize-none"
            placeholder="Enter video description"
          />
          <p className="text-xs text-gray-400 mt-2">
            {uploadData.description.length}/1000 characters
          </p>
        </div>

        {/* Enhanced Tags input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={uploadData.tags}
            onChange={handleInputChange}
            disabled={uploading || !youtubeAccessStatus?.hasAccess}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all backdrop-blur-sm disabled:opacity-50"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-400 mt-2">
            Separate tags with commas
          </p>
        </div>

        {/* Enhanced Upload Progress */}
        {uploading && (
          <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-blue-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-blue-300 font-medium">{uploadProgress}</p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300" style={{width: '45%'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Upload Button */}
        <button
          type="submit"
          disabled={uploading || !files.video || !youtubeAccessStatus?.hasAccess}
          className="w-full px-6 py-4 bg-gradient-to-r from-red-600/90 to-red-700/90 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-semibold text-lg transition-all duration-200 backdrop-blur-sm border border-red-500/30 hover:border-red-500/50 disabled:from-gray-600/50 disabled:to-gray-700/50 disabled:border-gray-500/30 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
              Uploading...
            </span>
          ) : !youtubeAccessStatus?.hasAccess ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Access Required
            </span>
          ) : !files.video ? (
            'Select Video File First'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Upload to YouTube
            </span>
          )}
        </button>
      </form>

          {/* Enhanced Info section */}
          <div className="mt-8 bg-yellow-500/10 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6">
            <h4 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Important Notes:
            </h4>
            <ul className="text-sm text-yellow-200 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Videos are uploaded as private initially</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>The content creator can review and publish the video</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Make sure the creator has connected their YouTube channel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Upload may take several minutes depending on file size</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default YouTubeUpload;
