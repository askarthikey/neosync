import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { apiEndpoints } from '../utils/api';

function EditorDiscover() {
  const navigate = useNavigate();
  
  // State management
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingRequests, setPendingRequests] = useState([]);
  const { notifications, addNotifications } = useNotifications();

  // Categories for filtering
  const categories = [
    'all', 
    'technology', 
    'marketing',
    'music',
    'educational', 
    'promotional',
    'social',
    'kids',
  ];

  // Get user from localStorage on component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
      
      fetchUnassignedProjects();
      fetchEditorRequests();
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
      setError('Error loading user profile');
    }
  }, []);

  // Add this useEffect for polling
  useEffect(() => {
    // Check for updates every 30 seconds
    const intervalId = setInterval(() => {
      if (user && user.email) {
        fetchEditorRequests();
      }
    }, 30000);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Apply filters when categoryFilter or searchQuery changes
  useEffect(() => {
    if (projects.length > 0) {
      applyFilters();
    }
  }, [projects, categoryFilter, searchQuery]);

  // Fetch all unassigned projects
  const fetchUnassignedProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(apiEndpoints.project.unassignedProjects(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch projects: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.projects || !Array.isArray(data.projects)) {
        throw new Error('Invalid data format received from server');
      }
      
      // Calculate days since created for each project
      const processedProjects = data.projects.map(project => {
        const created = new Date(project.createdAt);
        const today = new Date();
        
        // Calculate days since creation
        const diffTime = today - created;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...project,
          daysSinceCreation: diffDays
        };
      });
      
      setProjects(processedProjects);
      setFilteredProjects(processedProjects);
      
    } catch (error) {
      console.error('Error fetching unassigned projects:', error);
      setError(error.message || 'Failed to load unassigned projects. Please try again later.');
      
      // Don't load mock data, just set projects to empty array
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update your fetchEditorRequests function
  const fetchEditorRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      try {
        const response = await fetch(apiEndpoints.project.accessRequests.editor(), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.warn('Editor requests endpoint not available yet');
          return; 
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.accessRequests)) {
          // Store pending requests
          const pending = data.accessRequests.filter(req => req.status === 'pending');
          setPendingRequests(pending);
          
          // Get approved requests and add to notifications context
          const approvedRequests = data.accessRequests.filter(req => 
            req.status === 'approved'
          );
          
          if (approvedRequests.length > 0) {
            addNotifications(approvedRequests);
          }
        }
      } catch (error) {
        console.warn('Error fetching editor requests:', error.message);
      }
    } catch (error) {
      console.error('Error in authentication:', error);
    }
  };

  // Update the isProjectRequested function
  const isProjectRequested = (projectId) => {
    if (!pendingRequests || pendingRequests.length === 0 || !projectId) {
      return false;
    }
    return pendingRequests.some(req => req.projectId === projectId);
  };

  // Apply filters based on categoryFilter and searchQuery
  const applyFilters = () => {
    let filtered = [...projects];
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.tags && project.tags.some(tag => 
          tag.toLowerCase().includes(categoryFilter.toLowerCase())
        )
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesDescription = project.description.toLowerCase().includes(query);
        const matchesTags = project.tags && project.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesCreator = 
          (project.creatorName ? project.creatorName.toLowerCase().includes(query) : false) || 
          (project.creatorEmail ? project.creatorEmail.toLowerCase().includes(query) : false);
        
        return matchesTitle || matchesDescription || matchesTags || matchesCreator;
      });
    }
    
    setFilteredProjects(filtered);
  };

  // Format date to display in a readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Update the formatTimeAgo function for more accurate display
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const created = new Date(dateString);
      if (isNaN(created.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffTime = now - created;
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Show appropriate time unit based on how long ago it was posted
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      
      // For older posts, show the actual date
      return `on ${formatDate(dateString)}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  // Handle project click to show details
  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  // Close project details modal
  const closeProjectDetails = () => {
    setSelectedProject(null);
  };

  // Modify the existing handleRequestAccess function
  const handleRequestAccess = async (projectId) => {
    // Keep existing validation code
    if (!user || !user.email) {
      setAccessMessage({
        type: 'error',
        text: 'You must be logged in to request access'
      });
      return;
    }
    
    setRequestingAccess(true);
    
    try {
      // Keep existing request code
      const token = localStorage.getItem('token');
      const requestMessage = document.getElementById('accessRequestMessage')?.value || 'I would like to edit this project.';
      
      const requestPayload = {
        editorEmail: user.email,
        editorName: user.name || user.email.split('@')[0],
        message: requestMessage,
        projectId: selectedProject._id,
        projectTitle: selectedProject.title,
        projectThumbnail: selectedProject.thumbnailUrl || '',
        creatorUsername: selectedProject.userCreated || ''
      };
      
      console.log('Sending request payload:', requestPayload);
      
      const response = await fetch(apiEndpoints.project.requestAccess(projectId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });
      
      // Get the response text for debugging
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Server response:', responseText);
        throw new Error(`Failed to request access: ${response.status} ${response.statusText}`);
      }
      
      // Parse the JSON response (if it's valid JSON)
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Invalid JSON response:', responseText);
        throw new Error('Invalid response from server', e);
      }
      
      // Add the new request to pendingRequests state
      const newRequest = {
        _id: data.requestId || `temp-${Date.now()}`,
        projectId: selectedProject._id,
        projectTitle: selectedProject.title,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setPendingRequests(prev => [...prev, newRequest]);
      
      setAccessMessage({
        type: 'success',
        text: 'Access request sent successfully! The creator will be notified.'
      });
      
      // Close modal after success
      setTimeout(() => {
        setSelectedProject(null);
        setAccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error requesting project access:', error);
      setAccessMessage({
        type: 'error',
        text: `Failed to request access: ${error.message}`
      });
    } finally {
      setRequestingAccess(false);
    }
  };

  // Return loading state
  if (isLoading) {
    return (
      <>
        {/* Custom animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>

        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400/50"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-purple-400/30"></div>
                </div>
                <p className="mt-6 text-gray-300 text-lg font-medium animate-pulse-glow">Discovering available projects...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Return error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(90deg);
          }
          50% {
            transform: translateY(-40px) rotate(180deg);
          }
          75% {
            transform: translateY(-20px) rotate(270deg);
          }
        }
        
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-25px) translateX(15px);
          }
          50% {
            transform: translateY(-50px) translateX(-15px);
          }
          75% {
            transform: translateY(-25px) translateX(20px);
          }
        }
        
        @keyframes drift {
          0% {
            transform: translateX(-100px) translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateX(25vw) translateY(-30px) rotate(90deg);
          }
          50% {
            transform: translateX(50vw) translateY(-60px) rotate(180deg);
          }
          75% {
            transform: translateX(75vw) translateY(-30px) rotate(270deg);
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(0px) rotate(360deg);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
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
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-floatSlow {
          animation: floatSlow 12s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 30s linear infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animate-pulse-custom {
          animation: pulse 4s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
        {/* Dynamic background gradient */}
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-1000 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(800px circle at 50% 50%, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.3), rgba(16, 185, 129, 0.2), transparent 60%)`
          }}
        />

        {/* Enhanced animated background particles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating particles with enhanced movement */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/40 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-floatSlow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-cyan-400/60 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-pink-400/30 rounded-full animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-yellow-400/40 rounded-full animate-float" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-green-400/50 rounded-full animate-floatSlow" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-1/5 left-2/3 w-2 h-2 bg-indigo-400/35 rounded-full animate-float" style={{animationDelay: '2.5s'}}></div>
          <div className="absolute bottom-1/3 right-1/5 w-1.5 h-1.5 bg-rose-400/45 rounded-full animate-floatSlow" style={{animationDelay: '4s'}}></div>

          {/* Complex drifting particles */}
          <div className="absolute top-10 w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-drift" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-32 w-1 h-1 bg-purple-400/60 rounded-full animate-drift" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-56 w-2 h-2 bg-cyan-400/40 rounded-full animate-drift" style={{animationDelay: '8s'}}></div>
          <div className="absolute top-72 w-1.5 h-1.5 bg-pink-400/45 rounded-full animate-drift" style={{animationDelay: '12s'}}></div>
          <div className="absolute top-24 w-1 h-1 bg-green-400/50 rounded-full animate-drift" style={{animationDelay: '16s'}}></div>
          <div className="absolute top-48 w-2.5 h-2.5 bg-yellow-400/35 rounded-full animate-drift" style={{animationDelay: '20s'}}></div>

          {/* Enhanced twinkling stars */}
          <div className="absolute top-10 left-10 w-1 h-1 bg-white/70 rounded-full animate-twinkle" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-blue-300/90 rounded-full animate-twinkle" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-32 left-1/3 w-1.5 h-1.5 bg-purple-300/70 rounded-full animate-twinkle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-0.5 h-0.5 bg-pink-300/90 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-yellow-300/70 rounded-full animate-twinkle" style={{animationDelay: '2.5s'}}></div>
          <div className="absolute top-16 left-3/4 w-1 h-1 bg-cyan-300/80 rounded-full animate-twinkle" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-28 right-1/6 w-0.5 h-0.5 bg-green-300/85 rounded-full animate-twinkle" style={{animationDelay: '3.5s'}}></div>
          <div className="absolute top-80 left-1/6 w-1.5 h-1.5 bg-indigo-300/65 rounded-full animate-twinkle" style={{animationDelay: '4s'}}></div>

          {/* Pulsing elements */}
          <div className="absolute top-1/8 left-1/8 w-3 h-3 bg-blue-400/30 rounded-full animate-pulse-custom" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/4 right-1/8 w-2 h-2 bg-purple-400/35 rounded-full animate-pulse-custom" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-3/8 left-1/4 w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-pulse-custom" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/8 right-1/4 w-4 h-4 bg-pink-400/25 rounded-full animate-pulse-custom" style={{animationDelay: '0.5s'}}></div>
        </div>

        {/* Floating geometric shapes with enhanced animations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-6 h-6 bg-blue-400/25 rotate-45 animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-8 h-8 bg-purple-400/25 rounded-full animate-floatSlow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-cyan-400/25 rotate-12 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-7 h-7 bg-pink-400/25 rounded-full animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 right-10 w-5 h-5 bg-yellow-400/25 rotate-45 animate-float" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/6 left-2/3 w-3 h-3 bg-green-400/30 rotate-30" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-1/6 right-3/4 w-6 h-6 bg-indigo-400/25 rounded-full" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Main content with glassmorphism */}
        <div className="relative z-10 max-w-7xl mx-auto pt-20 pb-6 sm:px-6 lg:px-8">
          {accessMessage && (
            <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center backdrop-blur-xl border ${
              accessMessage.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                {accessMessage.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <span>{accessMessage.text}</span>
            </div>
          )}

          {notifications.length > 0 ? (
            <div className="mb-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-300">Recently Approved Projects:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {notifications.slice(0, 2).map(notification => (
                    <div 
                      key={notification._id}
                      className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center backdrop-blur-sm"
                    >
                      {notification.projectThumbnail && (
                        <img 
                          src={notification.projectThumbnail} 
                          alt="" 
                          className="w-6 h-6 rounded object-cover mr-2"
                        />
                      )}
                      <span className="text-sm text-green-300 font-medium truncate max-w-xs">
                        {notification.projectTitle}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/editor-projects');
                        }}
                        className="ml-2 text-green-300 hover:text-green-100"
                        aria-label="View in dashboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {notifications.length > 2 && (
                    <button
                      onClick={() => navigate('/editor-projects')}
                      className="px-3 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 bg-purple-500/20 border border-purple-500/30 rounded-xl backdrop-blur-sm"
                    >
                      +{notifications.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Enhanced Header section with glassmorphism */}
          <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 transition-all duration-700 animate-fadeInUp overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
            <div className="relative px-8 py-10 sm:px-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0 flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
                    Discover Projects
                  </h1>
                  <p className="text-lg text-gray-300 mb-2">Find new projects to edit and collaborate on</p>
                  <p className="text-sm text-gray-400">
                    Browse through unassigned projects from content creators. Request access to projects you'd like to edit. 
                    Once approved by the creator, the project will appear in your "My Assigned Projects" section.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex flex-col w-full sm:w-auto mb-4 sm:mb-0">
              <div className="flex flex-wrap space-x-2">
                <span className="px-3 py-2 text-sm font-medium text-gray-300">Categories:</span>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium mb-2 sm:mb-0 backdrop-blur-sm border transition-all duration-200 ${
                      categoryFilter === category
                        ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                        : 'text-gray-300 hover:bg-white/10 border-white/20 hover:border-white/30'
                    }`}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-white/20 rounded-xl shadow-sm focus:ring-purple-500/50 focus:border-purple-500/50 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Enhanced Projects List */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredProjects.map(project => (
                <div 
                  key={project._id} 
                  className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-102 cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="relative h-48 bg-white/5">
                    {project.thumbnailUrl ? (
                      <img 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-xl text-xs font-medium backdrop-blur-sm border ${
                          isProjectRequested(project._id)
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}>
                          {isProjectRequested(project._id) ? 'Request Sent' : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Creator:</p>
                        <p className="font-medium truncate text-gray-300">
                          {project.userCreated || project.creatorName || (project.creatorEmail ? project.creatorEmail.split('@')[0] : 'Unknown')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Deadline:</p>
                        <p className="font-medium text-gray-300">
                          {formatDate(project.deadline)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tags && project.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags && project.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 backdrop-blur-sm">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-white/5 backdrop-blur-sm border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Posted {formatTimeAgo(project.createdAt)}</span>
                      </div>
                      <div className="text-purple-400 font-medium flex items-center">
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View Details
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No projects available</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || categoryFilter !== 'all' ? 
                  'Try adjusting your search or filters to find what you\'re looking for.' : 
                  'There are no unassigned projects available at the moment. Check back soon or contact a content creator to create new projects.'}
              </p>
            </div>
          )}

          {/* Enhanced Project Detail Modal */}
          {selectedProject && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20">
                <div className="relative">
                  <div className="h-48 sm:h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 relative">
                    {selectedProject.thumbnailUrl ? (
                      <img 
                        src={selectedProject.thumbnailUrl} 
                        alt={selectedProject.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 flex flex-col justify-end p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">{selectedProject.title}</h2>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {selectedProject.tags && selectedProject.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                          Unassigned
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={closeProjectDetails} 
                      className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto max-h-[50vh]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-300 mb-6">{selectedProject.description}</p>
                        
                        {selectedProject.requirements && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
                            <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                              <p className="text-gray-300">{selectedProject.requirements}</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedProject.videoUrl && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Preview Media</h3>
                            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                              <video 
                                src={selectedProject.videoUrl} 
                                className="w-full h-full object-contain" 
                                controls
                              ></video>
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Request Access</h3>
                          <p className="text-gray-400 mb-4">
                            Interested in editing this project? Send a message to the creator to request access.
                            Once approved, you'll be able to start editing.
                          </p>
                          
                          {isProjectRequested(selectedProject._id) ? (
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex items-center backdrop-blur-sm">
                              <svg className="h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="font-medium text-blue-300">Request Already Sent</p>
                                <p className="text-sm text-blue-400 mt-1">Your request is pending approval from the creator. You'll be notified when they respond.</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <textarea
                                id="accessRequestMessage"
                                className="w-full px-3 py-2 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-purple-500/50 focus:border-purple-500/50 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400"
                                rows={3}
                                placeholder="Introduce yourself and explain why you'd be a good fit for this project..."
                                disabled={requestingAccess}
                              ></textarea>
                              
                              <button
                                onClick={() => handleRequestAccess(selectedProject._id)}
                                disabled={requestingAccess}
                                className={`mt-2 py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 ${
                                  requestingAccess 
                                    ? 'bg-purple-500/40 cursor-not-allowed border-purple-500/30' 
                                    : 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 hover:border-purple-500/50'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50`}
                              >
                                {requestingAccess ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending Request...
                                  </>
                                ) : (
                                  'Request to Edit This Project'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                          <h3 className="font-medium text-white mb-3">Project Details</h3>
                          <dl className="space-y-2">
                            <div className="grid grid-cols-3 gap-1">
                              <dt className="text-sm font-medium text-gray-400">Creator:</dt>
                              <dd className="text-sm text-gray-300 col-span-2 truncate">
                                {selectedProject.userCreated ? (
                                  <span>{selectedProject.userCreated}</span>
                                ) : selectedProject.creatorEmail ? (
                                  <span>
                                    {selectedProject.creatorName || selectedProject.creatorEmail}
                                  </span>
                                ) : (
                                  <span>Unknown Creator</span>
                                )}
                              </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <dt className="text-sm font-medium text-gray-400">Status:</dt>
                              <dd className="text-sm text-gray-300 col-span-2">Unassigned</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <dt className="text-sm font-medium text-gray-400">Posted:</dt>
                              <dd className="text-sm text-gray-300 col-span-2">{formatDate(selectedProject.createdAt)}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <dt className="text-sm font-medium text-gray-400">Deadline:</dt>
                              <dd className="text-sm text-gray-300 col-span-2">
                                {formatDate(selectedProject.deadline)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div className="bg-yellow-500/20 rounded-xl p-4 backdrop-blur-sm border border-yellow-500/30">
                          <h3 className="font-medium text-yellow-300 mb-2">How It Works</h3>
                          <ul className="space-y-2 text-sm text-yellow-200">
                            <li className="flex items-start">
                              <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                              </svg>
                              <span>Request access to this project</span>
                            </li>
                            <li className="flex items-start">
                              <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                              </svg>
                              <span>Creator reviews your profile</span>
                            </li>
                            <li className="flex items-start">
                              <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 01-1.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>If approved, you can start editing!</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10 flex flex-wrap justify-end gap-3">
                    <button
                      onClick={closeProjectDetails}
                      className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-xl text-gray-300 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20 backdrop-blur-sm transition-all duration-200"
                    >
                      Close
                    </button>
                    
                    {!isProjectRequested(selectedProject._id) ? (
                      <button
                        onClick={() => handleRequestAccess(selectedProject._id)}
                        disabled={requestingAccess}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white backdrop-blur-sm transition-all duration-200 ${
                          requestingAccess 
                            ? 'bg-purple-500/40 cursor-not-allowed border-purple-500/30' 
                            : 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 hover:border-purple-500/50'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50`}
                      >
                        {requestingAccess ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Request...
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            Request Access
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2 border border-blue-500/30 text-sm font-medium rounded-xl text-blue-300 bg-blue-500/20 backdrop-blur-sm">
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Request Pending
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EditorDiscover;