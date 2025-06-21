import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function CreatorProjects() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editProjectId = params.get('edit');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editors, setEditors] = useState([]);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    video: null,
    videoUrl: '',
    description: '',
    tags: '',
    editorEmail: '',
    thumbnail: null,
    thumbnailUrl: '',
    deadline: ''
  });

  const [errors, setErrors] = useState({});

  // Load user data from localStorage
  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect if not logged in
      navigate('/signin');
    }

    // Fetch available editors
    const fetchEditors = async () => {
      try {
        const response = await fetch('http://localhost:4000/userApi/editors', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEditors(data.editors || []);
        } else {
          // If API call fails, use mock data
          setEditors([
            { id: 1, name: 'Lisa Wong', email: 'lisa.wong@example.com' },
            { id: 2, name: 'James Miller', email: 'james.miller@example.com' },
            { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }
          ]);
        }
      } catch (error) {
        console.error("Error fetching editors:", error);
        // Fall back to mock data
        setEditors([
          { id: 1, name: 'Lisa Wong', email: 'lisa.wong@example.com' },
          { id: 2, name: 'James Miller', email: 'james.miller@example.com' },
          { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }
        ]);
      }
    };
    
    fetchEditors();
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [navigate]);

  useEffect(() => {
    // If editProjectId exists, fetch that project data
    if (editProjectId) {
      fetchProjectForEditing(editProjectId);
    }
  }, [editProjectId]);
  
  const fetchProjectForEditing = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/projectApi/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Populate form with project data
        setFormData({
          title: data.project.title,
          description: data.project.description,
          tags: data.project.tags.join(', '),
          editorEmail: data.project.editorEmail,
          deadline: new Date(data.project.deadline).toISOString().split('T')[0],
          // ...other fields
        });
      }
    } catch (error) {
      console.error('Error fetching project for editing:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load project for editing.'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Only allow video files
      if (!file.type.match('video.*')) {
        setErrors({
          ...errors,
          video: 'Please select a valid video file'
        });
        return;
      }

      // Check file size (limit to 100MB for example)
      if (file.size > 100 * 1024 * 1024) {
        setErrors({
          ...errors,
          video: 'Video size should be less than 100MB'
        });
        return;
      }

      setFormData({
        ...formData,
        video: file,
        videoUrl: URL.createObjectURL(file)
      });
      // Clear error if it exists
      if (errors.video) {
        setErrors({
          ...errors,
          video: null
        });
      }
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Only allow image files
      if (!file.type.match('image.*')) {
        setErrors({
          ...errors,
          thumbnail: 'Please select a valid image file'
        });
        return;
      }

      // Check file size (limit to 5MB for example)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          thumbnail: 'Image size should be less than 5MB'
        });
        return;
      }

      setFormData({
        ...formData,
        thumbnail: file,
        thumbnailUrl: URL.createObjectURL(file)
      });
      // Clear error if it exists
      if (errors.thumbnail) {
        setErrors({
          ...errors,
          thumbnail: null
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.video) newErrors.video = 'Video is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.tags.trim()) newErrors.tags = 'At least one tag is required';
    if (!formData.thumbnail) newErrors.thumbnail = 'Thumbnail is required';
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else if (formData.deadline < today) {
      newErrors.deadline = 'Deadline cannot be in the past';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      // Create a FormData object to send files and data together
      const projectFormData = new FormData();
      
      // Add files to FormData
      projectFormData.append('video', formData.video);
      projectFormData.append('thumbnail', formData.thumbnail);
      
      // Add other form fields
      projectFormData.append('title', formData.title);
      projectFormData.append('description', formData.description);
      projectFormData.append('tags', formData.tags);
      projectFormData.append('deadline', formData.deadline);
      projectFormData.append('userCreated', user.username);
      projectFormData.append('createdAt', new Date().toISOString());

      // Add editorEmail and status conditionally
      if (formData.editorEmail.trim()) {
        projectFormData.append('editorEmail', formData.editorEmail);
        projectFormData.append('status', 'Draft'); // If assigned to an editor directly
      } else {
        projectFormData.append('status', 'Unassigned'); // Changed from 'Draft'
      }

      // Create custom XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      // Setup progress event
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          // Update both progress bars with same value for simplicity
          setVideoUploadProgress(percentComplete);
          setThumbnailUploadProgress(percentComplete);
        }
      };
      
      xhr.onload = function() {
        try {
          const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          
          if (xhr.status === 201) {
            // Success
            console.log("Upload successful:", response);
            
            setMessage({
              type: 'success',
              text: 'Project created successfully!'
            });
            
            // Reset form
            setFormData({
              title: '',
              video: null,
              videoUrl: '',
              description: '',
              tags: '',
              editorEmail: '',
              thumbnail: null,
              thumbnailUrl: '',
              deadline: ''
            });
            
            // Reset progress bars
            setVideoUploadProgress(0);
            setThumbnailUploadProgress(0);
            
            // Reset file inputs
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
            
            // Redirect to projects list after a delay
            setTimeout(() => {
              navigate('/home');
            }, 2000);
          } else {
            // Error
            console.error("Upload failed with status:", xhr.status);
            console.error("Response:", response);
            
            if (xhr.status === 401) {
              setMessage({
                type: 'error',
                text: 'Authentication failed. Please login again.'
              });
              
              // Get a new token or redirect to login
              setTimeout(() => {
                navigate('/signin');
              }, 3000);
            } else {
              setMessage({
                type: 'error',
                text: response.message || `Failed with status: ${xhr.status}`
              });
            }
          }
        } catch (error) {
          console.error("Error parsing response:", error);
          setMessage({
            type: 'error',
            text: 'Error processing server response'
          });
        }
        setIsLoading(false);
      };
      
      xhr.onerror = function(e) {
        console.error("XHR error:", e);
        setMessage({
          type: 'error',
          text: 'Network error occurred during upload'
        });
        setIsLoading(false);
      };
      
      // First, open the connection
      xhr.open('POST', 'http://localhost:4000/projectApi/project');
      
      // Get the token - need to get a fresh copy in case it was updated
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({
          type: 'error',
          text: 'Authentication token not found. Please login again.'
        });
        setIsLoading(false);
        return;
      }
      
      // Debug token
      console.log("Using token:", token);
      
      // Set headers after opening the connection
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(projectFormData);

    } catch (error) {
      console.error('Error creating project:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Custom animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        @keyframes drift {
          0% { transform: translateX(0px); }
          100% { transform: translateX(100vw); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
        }
        
        @keyframes morphing {
          0%, 100% { border-radius: 50%; transform: rotate(0deg) scale(1); }
          25% { border-radius: 0%; transform: rotate(90deg) scale(1.1); }
          50% { border-radius: 50%; transform: rotate(180deg) scale(0.9); }
          75% { border-radius: 0%; transform: rotate(270deg) scale(1.1); }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-floatSlow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 25s linear infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .animate-orbit {
          animation: orbit 20s linear infinite;
        }
        
        .animate-morphing {
          animation: morphing 8s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
        {/* Dynamic background gradient that follows mouse */}
        <div 
          className="absolute inset-0 opacity-30 transition-all duration-1000 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2), transparent 50%)`
          }}
        />

        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-floatSlow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-pink-400/25 rounded-full animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-yellow-400/35 rounded-full animate-float" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-green-400/40 rounded-full animate-floatSlow" style={{animationDelay: '3s'}}></div>

          {/* Drifting particles */}
          <div className="absolute top-10 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-drift" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-32 w-1 h-1 bg-purple-400/50 rounded-full animate-drift" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-56 w-2 h-2 bg-cyan-400/30 rounded-full animate-drift" style={{animationDelay: '6s'}}></div>
          <div className="absolute top-72 w-1.5 h-1.5 bg-pink-400/35 rounded-full animate-drift" style={{animationDelay: '9s'}}></div>

          {/* Twinkling stars */}
          <div className="absolute top-10 left-10 w-1 h-1 bg-white/60 rounded-full animate-twinkle" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-blue-300/80 rounded-full animate-twinkle" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-32 left-1/3 w-1.5 h-1.5 bg-purple-300/60 rounded-full animate-twinkle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-0.5 h-0.5 bg-pink-300/80 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-yellow-300/60 rounded-full animate-twinkle" style={{animationDelay: '2.5s'}}></div>

          {/* Morphing particles */}
          <div className="absolute top-1/6 right-1/6 w-3 h-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-morphing" style={{animationDelay: '0s'}}></div>
          <div className="absolute bottom-1/6 left-1/6 w-2.5 h-2.5 bg-gradient-to-r from-cyan-500/25 to-pink-500/25 animate-morphing" style={{animationDelay: '2s'}}></div>

          {/* Orbiting elements */}
          <div className="absolute top-1/4 left-1/4">
            <div className="w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-orbit" style={{animationDelay: '0s'}}></div>
          </div>
          <div className="absolute bottom-1/4 right-1/4">
            <div className="w-2 h-2 bg-purple-400/25 rounded-full animate-orbit" style={{animationDelay: '10s', animationDirection: 'reverse'}}></div>
          </div>
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400/20 rotate-45 animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-purple-400/20 rounded-full animate-floatSlow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-cyan-400/20 rotate-12 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-pink-400/20 rounded-full animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 right-10 w-4 h-4 bg-yellow-400/20 rotate-45 animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex justify-center items-start min-h-screen px-4 pt-20 pb-8">
          <div className={`w-full max-w-4xl transition-all duration-700 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
            {/* Glassmorphism card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl hover:bg-white/8 transition-all duration-300 relative overflow-hidden">
              
              {/* Header */}
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  Create New Project
                </h2>
                <p className="text-gray-400">
                  Fill in the details to create a new content project
                </p>
              </div>

              {/* Message display */}
              {message && (
                <div
                  className={`p-4 rounded-xl mb-6 backdrop-blur-sm border animate-fadeInUp ${
                    message.type === "success" 
                      ? "bg-green-500/20 text-green-300 border-green-500/30" 
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {message.type === "success" ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </div>
                </div>
              )}
        
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                      Project Title*
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border ${errors.title ? 'border-red-400/50' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300`}
                      placeholder="Enter a descriptive title"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-400">{errors.title}</p>
                    )}
                  </div>
            
                  {/* Video Upload */}
                  <div>
                    <label htmlFor="video" className="block text-sm font-medium text-gray-300 mb-2">
                      Upload Video*
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                      <div className="space-y-1 text-center">
                        {formData.videoUrl ? (
                          <div>
                            <video 
                              src={formData.videoUrl} 
                              className="mx-auto h-48 w-auto rounded-lg" 
                              controls
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  video: null,
                                  videoUrl: ''
                                });
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-red-300 bg-red-500/20 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 transition-all duration-300"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-300">
                              <label
                                htmlFor="video-upload"
                                className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none transition-colors duration-300"
                              >
                                <span>Upload a video</span>
                                <input
                                  id="video-upload"
                                  name="video-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="video/*"
                                  ref={fileInputRef}
                                  onChange={handleVideoChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">MP4, WebM, OGG up to 100MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.video && (
                      <p className="mt-2 text-sm text-red-400">{errors.video}</p>
                    )}
                    {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                      <div className="mt-3">
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-white/10">
                          <div 
                            style={{ width: `${videoUploadProgress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploading: {videoUploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
            
                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                      Description*
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border ${errors.description ? 'border-red-400/50' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none`}
                      placeholder="Provide a detailed description of your project"
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-400">{errors.description}</p>
                    )}
                  </div>
            
                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                      Tags* (comma separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border ${errors.tags ? 'border-red-400/50' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300`}
                      placeholder="e.g. marketing, tutorial, product-demo"
                    />
                    {errors.tags && (
                      <p className="mt-2 text-sm text-red-400">{errors.tags}</p>
                    )}
                  </div>
            
                  {/* Editor Email */}
                  <div>
                    <label htmlFor="editorEmail" className="block text-sm font-medium text-gray-300 mb-2">
                      Assign Editor (Optional)
                    </label>
                    <select
                      id="editorEmail"
                      name="editorEmail"
                      value={formData.editorEmail}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border ${errors.editorEmail ? 'border-red-400/50' : 'border-white/20'} rounded-xl text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300`}
                    >
                      <option value="" className="bg-gray-800 text-white">Select an editor (optional)</option>
                      {editors.map((editor, index) => (
                        <option key={editor.id || index} value={editor.email} className="bg-gray-800 text-white">
                          {editor.name} ({editor.email})
                        </option>
                      ))}
                    </select>
                    {errors.editorEmail && (
                      <p className="mt-2 text-sm text-red-400">{errors.editorEmail}</p>
                    )}
                  </div>
            
                  {/* Thumbnail */}
                  <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-300 mb-2">
                      Thumbnail Image*
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                      <div className="space-y-1 text-center">
                        {formData.thumbnailUrl ? (
                          <div>
                            <img 
                              src={formData.thumbnailUrl} 
                              alt="Thumbnail preview" 
                              className="mx-auto h-32 w-auto object-cover rounded-lg" 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  thumbnail: null,
                                  thumbnailUrl: ''
                                });
                                if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                              }}
                              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-red-300 bg-red-500/20 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 transition-all duration-300"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-300">
                              <label
                                htmlFor="thumbnail-upload"
                                className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none transition-colors duration-300"
                              >
                                <span>Upload a thumbnail</span>
                                <input
                                  id="thumbnail-upload"
                                  name="thumbnail-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  ref={thumbnailInputRef}
                                  onChange={handleThumbnailChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.thumbnail && (
                      <p className="mt-2 text-sm text-red-400">{errors.thumbnail}</p>
                    )}
                    {thumbnailUploadProgress > 0 && thumbnailUploadProgress < 100 && (
                      <div className="mt-3">
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-white/10">
                          <div 
                            style={{ width: `${thumbnailUploadProgress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploading: {thumbnailUploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
            
                  {/* Deadline */}
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-2">
                      Deadline*
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      id="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 bg-white/10 border ${errors.deadline ? 'border-red-400/50' : 'border-white/20'} rounded-xl text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 [color-scheme:dark]`}
                    />
                    {errors.deadline && (
                      <p className="mt-2 text-sm text-red-400">{errors.deadline}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/home')}
                    className="px-6 py-3 border border-white/20 text-gray-300 font-medium rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 border border-transparent text-white font-medium rounded-xl ${
                      isLoading 
                        ? 'bg-gradient-to-r from-blue-400/50 to-purple-500/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Project...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreatorProjects;
