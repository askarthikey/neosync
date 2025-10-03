import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../utils/api';

const YouTubeAuth = ({ user }) => {
  const [youtubeStatus, setYoutubeStatus] = useState({
    isAuthenticated: false,
    channel: null,
    loading: true
  });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkYouTubeStatus();
  }, []);

  const checkYouTubeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiEndpoints.youtube.status(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setYoutubeStatus({
          isAuthenticated: data.isAuthenticated,
          channel: data.channel || null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error checking YouTube status:', error);
      setYoutubeStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const initiateYouTubeAuth = async () => {
    try {
      setAuthLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiEndpoints.youtube.init(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userType: user.userType })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to YouTube OAuth
        window.location.href = data.authUrl;
      } else {
        alert(data.message || 'Failed to initiate YouTube authentication');
      }
    } catch (error) {
      console.error('Error initiating YouTube auth:', error);
      alert('Error connecting to YouTube');
    } finally {
      setAuthLoading(false);
    }
  };

  const disconnectYouTube = async () => {
    if (!confirm('Are you sure you want to disconnect your YouTube channel?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiEndpoints.youtube.disconnect(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setYoutubeStatus({
          isAuthenticated: false,
          channel: null,
          loading: false
        });
        alert('YouTube channel disconnected successfully');
      } else {
        alert(data.message || 'Failed to disconnect YouTube channel');
      }
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      alert('Error disconnecting YouTube channel');
    }
  };

  if (youtubeStatus.loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2">Checking YouTube connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <svg className="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <h3 className="text-xl font-semibold text-gray-800">YouTube Integration</h3>
      </div>

      {youtubeStatus.isAuthenticated ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img 
              src={youtubeStatus.channel.thumbnail} 
              alt="Channel thumbnail"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h4 className="font-medium text-gray-800">{youtubeStatus.channel.title}</h4>
              <p className="text-sm text-gray-600">
                Connected on {new Date(youtubeStatus.channel.authenticatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-green-800 text-sm font-medium">
                YouTube channel connected! Editors can now upload videos to your channel.
              </span>
            </div>
          </div>

          <button
            onClick={disconnectYouTube}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Disconnect YouTube Channel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Connect your YouTube channel to allow editors to upload videos on your behalf with proper authorization.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-800 mb-2">What happens when you connect?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Editors can upload finished videos directly to your YouTube channel</li>
              <li>• Videos are uploaded as private initially for your review</li>
              <li>• You maintain full control over your channel</li>
              <li>• You can disconnect at any time</li>
            </ul>
          </div>

          {user.userType === 'contentCreator' ? (
            <button
              onClick={initiateYouTubeAuth}
              disabled={authLoading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
            >
              {authLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Connect YouTube Channel
                </>
              )}
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                Only content creators can connect YouTube channels. Editors will be able to upload videos on behalf of connected creators.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default YouTubeAuth;
