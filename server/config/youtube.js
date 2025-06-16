const { google } = require('googleapis');
require('dotenv').config();

// YouTube OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// YouTube API scopes for uploading videos
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Generate YouTube OAuth URL for authentication
 * @param {string} state - State parameter for security
 * @returns {string} - OAuth authorization URL
 */
function getYouTubeAuthUrl(state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: YOUTUBE_SCOPES,
    state: state,
    prompt: 'consent' // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<Object>} - Token response
 */
async function getYouTubeTokens(code) {
  try {
    const response = await oauth2Client.getToken(code);
    const tokens = response.tokens;
    
    if (!tokens) {
      throw new Error('No tokens received from Google OAuth');
    }
    
    return { success: true, tokens };
  } catch (error) {
    console.error('Error getting YouTube tokens:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get YouTube channel information
 * @param {string} accessToken - YouTube access token
 * @returns {Promise<Object>} - Channel information
 */
async function getYouTubeChannelInfo(accessToken) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    const response = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0];
      return {
        success: true,
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnail: channel.snippet.thumbnails.default.url,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount
        }
      };
    } else {
      return { success: false, error: 'No YouTube channel found' };
    }
  } catch (error) {
    console.error('Error getting YouTube channel info:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload video to YouTube
 * @param {Object} tokens - YouTube tokens
 * @param {Object} videoData - Video data and metadata
 * @returns {Promise<Object>} - Upload result
 */
async function uploadVideoToYouTube(tokens, videoData) {
  try {
    oauth2Client.setCredentials({ 
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });
    
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const { Readable } = require('stream');
    
    // Create readable stream from buffer
    const videoStream = new Readable();
    videoStream.push(videoData.videoBuffer);
    videoStream.push(null); // End the stream
    
    console.log('🎬 Uploading video to YouTube...');
    console.log('📋 Video metadata:', {
      title: videoData.title,
      description: videoData.description?.substring(0, 100) + '...',
      tags: videoData.tags,
      bufferSize: videoData.videoBuffer ? videoData.videoBuffer.length : 0
    });
    
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: videoData.title || 'Untitled Video',
          description: videoData.description || 'Uploaded via NeoSync platform',
          tags: videoData.tags || [],
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: 'private' // Always private for creator review
        }
      },
      media: {
        body: videoStream
      }
    });
    
    console.log('✅ Video uploaded successfully:', response.data.id);
    
    return {
      success: true,
      video: {
        id: response.data.id,
        url: `https://www.youtube.com/watch?v=${response.data.id}`,
        title: response.data.snippet.title,
        description: response.data.snippet.description,
        publishedAt: response.data.snippet.publishedAt
      }
    };
  } catch (error) {
    console.error('❌ Error uploading video to YouTube:', error);
    
    // Handle specific YouTube API errors
    if (error.code === 403) {
      return { 
        success: false, 
        error: 'YouTube quota exceeded or insufficient permissions. Please try again later.' 
      };
    }
    if (error.code === 401) {
      return { 
        success: false, 
        error: 'YouTube authentication expired. Creator needs to reconnect their channel.' 
      };
    }
    if (error.code === 400) {
      return { 
        success: false, 
        error: 'Invalid video format or metadata. Please check file format and try again.' 
      };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Refresh YouTube access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - New token response
 */
async function refreshYouTubeToken(refreshToken) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const response = await oauth2Client.getAccessToken();
    
    return { 
      success: true, 
      accessToken: response.token 
    };
  } catch (error) {
    console.error('Error refreshing YouTube token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke YouTube access token
 * @param {string} accessToken - Access token to revoke
 * @returns {Promise<Object>} - Revocation result
 */
async function revokeYouTubeToken(accessToken) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    await oauth2Client.revokeCredentials();
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking YouTube token:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getYouTubeAuthUrl,
  getYouTubeTokens,
  getYouTubeChannelInfo,
  uploadVideoToYouTube,
  refreshYouTubeToken,
  revokeYouTubeToken
};
