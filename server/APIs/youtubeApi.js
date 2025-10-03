const express = require('express');
const { ObjectId } = require('mongodb');
const authMiddleware = require('../middlewares/auth');
const { validateFiles } = require('../middlewares/fileUpload');
const {
  getYouTubeAuthUrl,
  getYouTubeTokens,
  getYouTubeChannelInfo,
  uploadVideoToYouTube,
  refreshYouTubeToken
} = require('../config/youtube');

const router = express.Router();

/**
 * Initialize YouTube OAuth flow
 */
router.post('/auth/youtube/init', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const userType = req.body.userType || req.user.userType;
    
    // Only content creators can authenticate YouTube channels
    if (userType !== 'contentCreator') {
      return res.status(403).json({
        success: false,
        message: 'Only content creators can authenticate YouTube channels'
      });
    }
    
    // Generate state parameter for security (includes username)
    const state = Buffer.from(JSON.stringify({ 
      username, 
      timestamp: Date.now() 
    })).toString('base64');
    
    const authUrl = getYouTubeAuthUrl(state);
    
    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authenticate with YouTube'
    });
  } catch (error) {
    console.error('Error initializing YouTube auth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize YouTube authentication',
      error: error.message
    });
  }
});

/**
 * Handle YouTube OAuth callback
 */
router.get('/auth/youtube/callback', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle OAuth errors (access_denied, etc.)
    if (error) {
      console.error('❌ OAuth error:', error, error_description);
      const errorParams = new URLSearchParams({
        error: error,
        ...(error_description && { error_description })
      });
      return res.redirect(`${clientUrl}/youtube-auth-error?${errorParams}`);
    }
    
    if (!code || !state) {
      console.error('❌ Missing code or state parameter');
      const errorParams = new URLSearchParams({
        error: 'invalid_request',
        error_description: 'Missing authorization code or state parameter'
      });
      return res.redirect(`${clientUrl}/youtube-auth-error?${errorParams}`);
    }
    
    // Decode and verify state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (err) {
      console.error('❌ Invalid state parameter:', err);
      const errorParams = new URLSearchParams({
        error: 'invalid_request',
        error_description: 'Invalid state parameter'
      });
      return res.redirect(`${clientUrl}/youtube-auth-error?${errorParams}`);
    }
    
    const { username } = stateData;
    
    console.log('🔄 Attempting to exchange authorization code for tokens...');
    console.log('📝 Username from state:', username);
    
    // Exchange code for tokens
    const tokenResult = await getYouTubeTokens(code);
    console.log('🎯 Token exchange result:', { 
      success: tokenResult.success, 
      hasTokens: !!tokenResult.tokens,
      error: tokenResult.error 
    });
    
    if (!tokenResult.success) {
      console.error('❌ Token exchange failed:', tokenResult.error);
      const errorParams = new URLSearchParams({
        error: 'server_error',
        error_description: 'Failed to exchange authorization code for tokens'
      });
      return res.redirect(`${clientUrl}/youtube-auth-error?${errorParams}`);
    }
    
    // Get YouTube channel information
    const channelResult = await getYouTubeChannelInfo(tokenResult.tokens.access_token);
    if (!channelResult.success) {
      console.error('❌ Failed to get channel info:', channelResult.error);
      const errorParams = new URLSearchParams({
        error: 'server_error',
        error_description: 'Failed to get YouTube channel information. Make sure you have a YouTube channel.'
      });
      return res.redirect(`${clientUrl}/youtube-auth-error?${errorParams}`);
    }
    
    // Store YouTube credentials in database
    const db = req.app.get('neosync');
    const usersCollection = db.collection('usersCollection');
    
    await usersCollection.updateOne(
      { username },
      {
        $set: {
          youtubeAuth: {
            channelId: channelResult.channel.id,
            channelTitle: channelResult.channel.title,
            channelThumbnail: channelResult.channel.thumbnail,
            accessToken: tokenResult.tokens.access_token,
            refreshToken: tokenResult.tokens.refresh_token,
            expiryDate: tokenResult.tokens.expiry_date,
            authenticatedAt: new Date(),
            isActive: true
          }
        }
      }
    );
    
    console.log('✅ YouTube authentication successful for:', username);
    console.log('📺 Channel connected:', channelResult.channel.title);
    
    // Redirect to success page with channel information
    const successParams = new URLSearchParams({
      channel: channelResult.channel.title,
      status: 'success'
    });
    res.redirect(`${clientUrl}/youtube-auth-success?${successParams}`);
    
  } catch (error) {
    console.error('💥 Unexpected error in YouTube callback:', error);
    const errorParams = new URLSearchParams({
      error: 'server_error',
      error_description: 'An unexpected error occurred during authentication'
    });
    res.redirect(`${clientUrl}/youtube-auth-error?${errorParams}`);
  }
});

/**
 * Get YouTube channel status for a user
 */
router.get('/youtube/status', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    
    const db = req.app.get('neosync');
    const usersCollection = db.collection('usersCollection');
    
    const user = await usersCollection.findOne(
      { username },
      { projection: { youtubeAuth: 1 } }
    );
    
    if (!user || !user.youtubeAuth || !user.youtubeAuth.isActive) {
      return res.json({
        success: true,
        isAuthenticated: false,
        message: 'YouTube channel not connected'
      });
    }
    
    const { youtubeAuth } = user;
    
    res.json({
      success: true,
      isAuthenticated: true,
      channel: {
        id: youtubeAuth.channelId,
        title: youtubeAuth.channelTitle,
        thumbnail: youtubeAuth.channelThumbnail,
        authenticatedAt: youtubeAuth.authenticatedAt
      }
    });
  } catch (error) {
    console.error('Error getting YouTube status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get YouTube status',
      error: error.message
    });
  }
});

/**
 * Disconnect YouTube channel
 */
router.post('/youtube/disconnect', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    
    const db = req.app.get('neosync');
    const usersCollection = db.collection('usersCollection');
    
    await usersCollection.updateOne(
      { username },
      {
        $set: {
          'youtubeAuth.isActive': false,
          'youtubeAuth.disconnectedAt': new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: 'YouTube channel disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting YouTube:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect YouTube channel',
      error: error.message
    });
  }
});

/**
 * Upload video to YouTube (for editors with permission)
 */
router.post('/youtube/upload/:projectId', authMiddleware, validateFiles, async (req, res) => {
  try {
    console.log('🎬 YouTube upload request received');
    console.log('📋 Request params:', req.params);
    console.log('👤 User:', req.user?.username);
    console.log('📁 Files:', Object.keys(req.files || {}));
    console.log('📝 Body fields:', Object.keys(req.body));

    const { projectId } = req.params;
    const { title, description, tags, creatorUsername } = req.body;
    const editorUsername = req.user.username;
    
    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }
    
    // Get project details
    const db = req.app.get('neosync');
    const projectsCollection = db.collection('projectsCollection');
    const usersCollection = db.collection('usersCollection');
    
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      console.error('❌ Project not found:', projectId);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    console.log('📊 Project found:', { 
      title: project.title, 
      status: project.status,
      editorEmail: project.editorEmail,
      userCreated: project.userCreated
    });
    
    // Verify editor is assigned to this project
    if (project.editorEmail !== req.user.email) {
      console.error('❌ Editor not authorized:', { 
        projectEditor: project.editorEmail, 
        requestUser: req.user.email 
      });
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload for this project'
      });
    }
    
    // Get creator's YouTube credentials
    const creator = await usersCollection.findOne({ username: creatorUsername });
    if (!creator) {
      console.error('❌ Creator not found:', creatorUsername);
      return res.status(400).json({
        success: false,
        message: 'Project creator not found'
      });
    }
    
    if (!creator.youtubeAuth || !creator.youtubeAuth.isActive) {
      console.error('❌ Creator YouTube not connected:', { 
        hasAuth: !!creator.youtubeAuth,
        isActive: creator.youtubeAuth?.isActive
      });
      return res.status(400).json({
        success: false,
        message: 'Creator has not connected their YouTube channel'
      });
    }
    
    let youtubeTokens = {
      access_token: creator.youtubeAuth.accessToken,
      refresh_token: creator.youtubeAuth.refreshToken,
      expiry_date: creator.youtubeAuth.expiryDate
    };
    
    // Check if token needs refresh
    if (Date.now() >= youtubeTokens.expiry_date) {
      console.log('🔄 Token expired, refreshing...');
      const refreshResult = await refreshYouTubeToken(youtubeTokens.refresh_token);
      if (!refreshResult.success) {
        console.error('❌ Token refresh failed:', refreshResult.error);
        return res.status(401).json({
          success: false,
          message: 'YouTube token expired and refresh failed. Creator needs to re-authenticate.',
          error: refreshResult.error
        });
      }
      
      youtubeTokens = refreshResult.tokens;
      
      // Update tokens in database
      await usersCollection.updateOne(
        { username: creatorUsername },
        {
          $set: {
            'youtubeAuth.accessToken': youtubeTokens.access_token,
            'youtubeAuth.expiryDate': youtubeTokens.expiry_date
          }
        }
      );
      console.log('✅ Token refreshed successfully');
    }
     // Prepare video data
    console.log('📋 Preparing video upload data...');
    console.log('📁 Files received:', Object.keys(req.files || {}));
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }
    
    const videoFile = req.files.video;
    console.log('🎬 Video file details:', {
      name: videoFile.name,
      size: videoFile.size,
      mimetype: videoFile.mimetype
    });
    
    // Validate video file type
    const allowedVideoTypes = [
      'video/mp4', 'video/webm', 'video/avi', 'video/mov', 
      'video/wmv', 'video/flv', 'video/mkv'
    ];
    
    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported video format: ${videoFile.mimetype}. Supported formats: MP4, WebM, AVI, MOV, WMV, FLV, MKV`
      });
    }
    
    const videoData = {
      title: title || project.title || 'Untitled Video',
      description: description || project.description || 'Uploaded via NeoSync platform',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : (project.tags || []),
      videoBuffer: videoFile.data
    };
    
    console.log('🎯 Creator YouTube auth status:', {
      hasAuth: !!creator.youtubeAuth,
      isActive: creator.youtubeAuth?.isActive,
      channelTitle: creator.youtubeAuth?.channelTitle
    });

    // Upload to YouTube
    console.log('🚀 Starting YouTube upload...');
    const uploadResult = await uploadVideoToYouTube(youtubeTokens, videoData);    
    if (!uploadResult.success) {
      console.error('❌ YouTube upload failed:', uploadResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload video to YouTube',
        error: uploadResult.error
      });
    }
    
    console.log('✅ YouTube upload successful:', uploadResult.video.id);

    // Update project with YouTube video information
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          youtubeUpload: {
            videoId: uploadResult.video.id,
            videoUrl: uploadResult.video.url,
            uploadedBy: editorUsername,
            uploadedAt: new Date(),
            title: uploadResult.video.title,
            description: uploadResult.video.description
          },
          status: 'Published'
        }
      }
    );
    
    console.log('📊 Project updated with YouTube info');

    res.json({
      success: true,
      message: 'Video uploaded to YouTube successfully! It has been set to private for creator review.',
      youtube: uploadResult.video,
      project: {
        id: projectId,
        status: 'Published'
      }
    });
    
  } catch (error) {
    console.error('💥 Error uploading to YouTube:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video to YouTube',
      error: error.message
    });
  }
});

module.exports = router;
