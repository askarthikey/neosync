// API utility functions for consistent URL handling
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

// API endpoint builders
export const apiEndpoints = {
  // User API
  user: {
    create: () => `${API_BASE_URL}/userApi/user`,
    login: () => `${API_BASE_URL}/userApi/login`,
    getByEmail: (email) => `${API_BASE_URL}/userApi/user-by-email?email=${encodeURIComponent(email)}`,
    getByUsername: (username) => `${API_BASE_URL}/userApi/user/${username}`,
    update: (username) => `${API_BASE_URL}/userApi/user/${username}/update`,
    getEditors: () => `${API_BASE_URL}/userApi/editors`,
    getEditorRatings: (email) => `${API_BASE_URL}/userApi/editor-ratings?email=${encodeURIComponent(email)}`,
  },

  // Project API
  project: {
    editorProjects: (email) => `${API_BASE_URL}/projectApi/editor-projects?email=${encodeURIComponent(email)}`,
    unassignedProjects: () => `${API_BASE_URL}/projectApi/unassigned-projects`,
    userProjects: (username) => `${API_BASE_URL}/projectApi/user-projects?username=${username}`,
    creatorProjects: (username) => `${API_BASE_URL}/projectApi/projects/creator/${username}`,
    editorProjectsByEmail: (email) => `${API_BASE_URL}/projectApi/projects/editor/${email}`,
    getProject: (projectId) => `${API_BASE_URL}/projectApi/project/${projectId}`,
    updateStatus: (projectId) => `${API_BASE_URL}/projectApi/project/${projectId}/status`,
    updatePriority: (projectId) => `${API_BASE_URL}/projectApi/project/${projectId}/priority`,
    addVideoResponse: (projectId) => `${API_BASE_URL}/projectApi/add-video-response/${projectId}`,
    getResponses: (projectId) => `${API_BASE_URL}/projectApi/project-responses/${projectId}`,
    getReviews: (projectId) => `${API_BASE_URL}/projectApi/project-reviews/${projectId}`,
    addReview: () => `${API_BASE_URL}/projectApi/add-review`,
    updateReview: (reviewId) => `${API_BASE_URL}/projectApi/update-review/${reviewId}`,
    deleteReview: (reviewId) => `${API_BASE_URL}/projectApi/delete-review/${reviewId}`,
    closeProject: (projectId) => `${API_BASE_URL}/projectApi/close-project/${projectId}`,
    reopenProject: (projectId) => `${API_BASE_URL}/projectApi/reopen-project/${projectId}`,
    grantYouTubeAccess: (projectId) => `${API_BASE_URL}/projectApi/grant-youtube-access/${projectId}`,
    revokeYouTubeAccess: (projectId) => `${API_BASE_URL}/projectApi/revoke-youtube-access/${projectId}`,
    requestAccess: (projectId) => `${API_BASE_URL}/projectApi/project/${projectId}/request-access`,
    createProject: () => `${API_BASE_URL}/projectApi/project`,
    checkYouTubeAccess: (projectId) => `${API_BASE_URL}/projectApi/check-youtube-access/${projectId}`,
    getCreatorFeedback: (email) => `${API_BASE_URL}/projectApi/creator-feedback-for-editor?email=${encodeURIComponent(email)}`,
    
    // Access requests
    accessRequests: {
      creator: () => `${API_BASE_URL}/projectApi/access-requests/creator`,
      editor: () => `${API_BASE_URL}/projectApi/access-requests/editor`,
      approve: (requestId) => `${API_BASE_URL}/projectApi/access-requests/${requestId}/approve`,
      reject: (requestId) => `${API_BASE_URL}/projectApi/access-requests/${requestId}/reject`,
    }
  },

  // Review API
  review: {
    submit: () => `${API_BASE_URL}/reviewApi/submit-review`,
    check: (projectId, creatorUsername) => `${API_BASE_URL}/reviewApi/check-review?projectId=${projectId}&creatorUsername=${creatorUsername}`,
  },

  // YouTube API
  youtube: {
    status: () => `${API_BASE_URL}/youtubeApi/youtube/status`,
    init: () => `${API_BASE_URL}/youtubeApi/auth/youtube/init`,
    disconnect: () => `${API_BASE_URL}/youtubeApi/youtube/disconnect`,
    upload: (projectId) => `${API_BASE_URL}/youtubeApi/youtube/upload/${projectId}`,
  },

  // Chat API
  chat: {
    getMessages: (projectId, limit = 30, offset = 0) => `${API_BASE_URL}/chatApi/project/${projectId}/messages?limit=${limit}&offset=${offset}`,
    sendMessage: (projectId) => `${API_BASE_URL}/chatApi/project/${projectId}/messages`,
    deleteMessages: (projectId) => `${API_BASE_URL}/chatApi/project/${projectId}/messages`,
  },

  // File URLs
  file: {
    video: (videoUrl) => `${SERVER_URL}${videoUrl}`,
  }
};

export default apiEndpoints;