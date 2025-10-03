import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiEndpoints } from '../utils/api';

function EditorHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [stats, setStats] = useState({
    assignedProjects: 0,
    reviewedProjects: 0,
    pendingReviews: 0,
    completedProjects: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [creatorFeedback, setCreatorFeedback] = useState([]);
  const [editorRatings, setEditorRatings] = useState({
    averageRating: 0,
    totalRatings: 0
  });
  
  // Enhanced productivity tips for editors
  const [productivityTips] = useState([
    "💡 Use keyboard shortcuts to speed up your editing workflow. Ctrl+Z for undo, Ctrl+F for find.",
    "🎯 Focus on one section at a time to maintain consistency and avoid overwhelming yourself.",
    "📝 Keep a style guide handy to ensure consistency across all your editing projects.",
    "⏰ Take regular breaks every 45-60 minutes to maintain focus and prevent eye strain.",
    "🔍 Read content aloud or use text-to-speech to catch errors your eyes might miss.",
    "✨ Always prioritize clarity over complexity - simple, clear language is more effective."
  ]);
  
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Real-time clock update
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Productivity tip rotation
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % productivityTips.length);
    }, 8000);

    // Animation trigger for periodic effects
    const animationInterval = setInterval(() => {
      setAnimationTrigger(prev => !prev);
    }, 5000);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    // Get user details from local storage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        if (parsedUser.email) {
          // Fetch all data needed for the dashboard
          fetchEditorData(parsedUser.email);
        } else {
          setError('User email not found in profile');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        setError('Error loading user profile');
        setIsLoading(false);
      }
    } else {
      // Redirect to login if no user data found
      navigate('/signin');
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
      clearInterval(tipInterval);
      clearInterval(animationInterval);
    };
  }, [navigate]);

  // Fetch all editor data
  const fetchEditorData = async (editorEmail) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch assigned projects
      const projectsResponse = await fetch(apiEndpoints.project.editorProjects(editorEmail), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
      }

      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || [];
      // Fetch creator feedback from the reviewCollection
      const feedbackResponse = await fetch(apiEndpoints.project.getCreatorFeedback(editorEmail), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let creatorFeedbackData = [];
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        creatorFeedbackData = feedbackData.reviews || [];
        console.log("Creator feedback data:", creatorFeedbackData);
      } else {
        console.error("Failed to fetch creator feedback:", feedbackResponse.status);
      }

      // Process creator feedback with project information
      const processedCreatorFeedback = creatorFeedbackData
        .filter(feedback => feedback && feedback._id) // Filter out any undefined or missing ID items
        .map(feedback => {
          // For MongoDB ObjectId comparison, convert to string if needed
          const projectId = typeof feedback.projectId === 'string' ? feedback.projectId : feedback.projectId?.toString();
          
          // Find matching project for additional details
          const relatedProject = projects.find(p => {
            const pId = typeof p._id === 'string' ? p._id : p._id?.toString();
            return pId === projectId;
          });
          
          return {
            id: feedback._id,
            projectId: projectId, // Store this as string to ensure proper navigation
            title: relatedProject?.title || "Unknown Project",
            creator: feedback.creatorUsername || "Project Creator",
            reviewedOn: feedback.createdAt || new Date().toISOString(),
            comment: feedback.comment || "",
            status: relatedProject?.status || "In Progress",
            rating: feedback.rating || 0
          };
        });

      // Additional validation before setting state
      const validFeedback = processedCreatorFeedback.filter(item => 
        item && item.id && item.projectId && item.title
      );

      console.log("Processed creator feedback:", validFeedback);

      // Sort by date (newest to oldest)
      validFeedback.sort((a, b) => new Date(b.reviewedOn) - new Date(a.reviewedOn));

      // Update the state with the first 5 valid items
      setCreatorFeedback(validFeedback.slice(0, 5));

      // Calculate statistics
      const closedProjects = projects.filter(p => p.status === 'Closed');
      const pendingReviewProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Completed' || p.feedback);
      const inProgressProjects = projects.filter(p => 
        p.status === 'In Progress' || 
        p.status.includes('Just started') || 
        p.status.includes('Good progress') || 
        p.status.includes('Almost there')
      );

      // Set statistics
      setStats({
        assignedProjects: projects.length,
        reviewedProjects: closedProjects.length,
        pendingReviews: pendingReviewProjects.length,
        inProgress: inProgressProjects.length
      });

      // Set recent assignments (most recently assigned first)
      const sortedByAssignedDate = [...projects].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 3);
      
      setRecentAssignments(sortedByAssignedDate.map(project => ({
        id: project._id,
        title: project.title,
        creator: project.userCreated || 'Unknown Creator',
        assignedDate: project.createdAt,
        deadline: project.deadline,
        status: project.status, // Add status property
        priority: getDaysRemaining(project.deadline) <= 10 ? 'High' : 
                 getDaysRemaining(project.deadline) <= 30 ? 'Medium' : 'Low'
      })));

      // Calculate upcoming deadlines
      const upcomingProjects = [...projects]
        .filter(p => (p.status !== 'Completed' && p.status !== 'Closed') && getDaysRemaining(p.deadline) >= 0)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3);
      
      setUpcomingDeadlines(upcomingProjects.map(project => ({
        id: project._id,
        title: project.title,
        deadline: project.deadline,
        priority: getDaysRemaining(project.deadline) <= 10 ? 'High' : 
                 getDaysRemaining(project.deadline) <= 30 ? 'Medium' : 'Low',
        daysRemaining: getDaysRemaining(project.deadline)
      })));

      // Fetch editor ratings from usersCollection
      const userRatingsResponse = await fetch(apiEndpoints.user.getEditorRatings(editorEmail), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userRatingsResponse.ok) {
        const userData = await userRatingsResponse.json();
        
        // Extract rating data from response
        setEditorRatings({
          averageRating: userData.averageRating || 0,
          totalRatings: userData.totalRatings || 0
        });
        
        console.log("Editor ratings data:", userData);
      } else {
        console.error("Failed to fetch editor ratings:", userRatingsResponse.status);
        // Fallback to project-based ratings if user ratings fail
      }

    } catch (error) {
      console.error('Error fetching editor data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate days remaining until deadline
  const getDaysRemaining = (deadline) => {
    if (!deadline) return 0;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
          {/* Dynamic background gradient */}
          <div 
            className="absolute inset-0 opacity-30 transition-all duration-1000 ease-out pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2), transparent 50%)`
            }}
          />

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
                <p className="mt-6 text-gray-300 text-lg font-medium animate-pulse-glow">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* Custom animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>

        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
          {/* Dynamic background gradient */}
          <div 
            className="absolute inset-0 opacity-30 transition-all duration-1000 ease-out pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(239, 68, 68, 0.3), rgba(147, 51, 234, 0.2), transparent 50%)`
            }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-2 h-2 bg-red-400/30 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-orange-400/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          </div>

          <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-8 px-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md w-full animate-shake">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-300 mb-2">Error Loading Dashboard</h3>
                <p className="text-gray-300 mb-6">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-pink-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 transition-all duration-300 shadow-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${(scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%` }}
        ></div>
      </div>
      
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
        
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(120px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(120px) rotate(-360deg);
          }
        }
        
        @keyframes morphing {
          0%, 100% {
            border-radius: 50%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 20%;
            transform: rotate(90deg) scale(1.3);
          }
          50% {
            border-radius: 0%;
            transform: rotate(180deg) scale(0.7);
          }
          75% {
            border-radius: 30%;
            transform: rotate(270deg) scale(1.1);
          }
        }
        
        @keyframes wave {
          0%, 100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateX(30px) translateY(-20px) rotate(15deg);
          }
          50% {
            transform: translateX(-20px) translateY(-40px) rotate(-10deg);
          }
          75% {
            transform: translateX(-35px) translateY(-15px) rotate(20deg);
          }
        }
        
        @keyframes zigzag {
          0% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateX(40px) translateY(-30px) rotate(45deg);
          }
          50% {
            transform: translateX(-30px) translateY(-60px) rotate(-30deg);
          }
          75% {
            transform: translateX(50px) translateY(-90px) rotate(60deg);
          }
          100% {
            transform: translateX(0px) translateY(-120px) rotate(0deg);
          }
        }
        
        @keyframes spiral {
          from {
            transform: rotate(0deg) translateX(80px) scale(0.5) rotate(0deg);
          }
          to {
            transform: rotate(720deg) translateX(200px) scale(1.2) rotate(-720deg);
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
        
        .animate-orbit {
          animation: orbit 25s linear infinite;
        }
        
        .animate-morphing {
          animation: morphing 10s ease-in-out infinite;
        }
        
        .animate-wave {
          animation: wave 15s ease-in-out infinite;
        }
        
        .animate-zigzag {
          animation: zigzag 20s ease-in-out infinite;
        }
        
        .animate-spiral {
          animation: spiral 18s ease-in-out infinite;
        }
        
        .animate-pulse-custom {
          animation: pulse 4s ease-in-out infinite;
        }
      `}</style>
      
        {/* Dynamic background gradient that follows mouse */}
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-1000 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.3), rgba(16, 185, 129, 0.2), transparent 60%)`
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

          {/* Wave motion particles */}
          <div className="absolute top-1/4 left-0 w-2 h-2 bg-blue-400/30 rounded-full animate-wave" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/3 left-10 w-1.5 h-1.5 bg-purple-400/35 rounded-full animate-wave" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-20 w-1 h-1 bg-cyan-400/40 rounded-full animate-wave" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-2/3 left-30 w-2.5 h-2.5 bg-pink-400/25 rounded-full animate-wave" style={{animationDelay: '6s'}}></div>
          <div className="absolute bottom-1/4 left-40 w-1.5 h-1.5 bg-yellow-400/30 rounded-full animate-wave" style={{animationDelay: '1s'}}></div>

          {/* Zigzag moving particles */}
          <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-zigzag" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-30 right-20 w-1 h-1 bg-purple-500/60 rounded-full animate-zigzag" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-50 left-1/3 w-2 h-2 bg-cyan-500/40 rounded-full animate-zigzag" style={{animationDelay: '6s'}}></div>
          <div className="absolute top-70 right-1/4 w-1.5 h-1.5 bg-pink-500/45 rounded-full animate-zigzag" style={{animationDelay: '9s'}}></div>

          {/* Spiral particles */}
          <div className="absolute top-1/5 left-1/5">
            <div className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-spiral" style={{animationDelay: '0s'}}></div>
          </div>
          <div className="absolute top-2/5 right-1/5">
            <div className="w-1 h-1 bg-purple-500/45 rounded-full animate-spiral" style={{animationDelay: '6s'}}></div>
          </div>
          <div className="absolute bottom-1/5 left-2/5">
            <div className="w-2 h-2 bg-cyan-500/35 rounded-full animate-spiral" style={{animationDelay: '12s'}}></div>
          </div>

          {/* Complex morphing particles */}
          <div className="absolute top-1/6 right-1/6 w-4 h-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-morphing" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/2 left-1/6 w-3 h-3 bg-gradient-to-r from-cyan-500/35 to-pink-500/35 animate-morphing" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-1/6 right-2/6 w-2.5 h-2.5 bg-gradient-to-r from-yellow-500/40 to-orange-500/40 animate-morphing" style={{animationDelay: '6s'}}></div>
          <div className="absolute top-3/4 left-3/4 w-3.5 h-3.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 animate-morphing" style={{animationDelay: '9s'}}></div>

          {/* Enhanced orbiting elements */}
          <div className="absolute top-1/4 left-1/4">
            <div className="w-2 h-2 bg-blue-400/35 rounded-full animate-orbit" style={{animationDelay: '0s'}}></div>
          </div>
          <div className="absolute top-1/3 right-1/3">
            <div className="w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-orbit" style={{animationDelay: '8s', animationDirection: 'reverse'}}></div>
          </div>
          <div className="absolute bottom-1/3 left-1/2">
            <div className="w-3 h-3 bg-cyan-400/25 rounded-full animate-orbit" style={{animationDelay: '16s'}}></div>
          </div>
          <div className="absolute top-1/5 right-1/5">
            <div className="w-1 h-1 bg-pink-400/45 rounded-full animate-orbit" style={{animationDelay: '4s'}}></div>
          </div>
          <div className="absolute bottom-1/5 left-1/5">
            <div className="w-2.5 h-2.5 bg-yellow-400/30 rounded-full animate-orbit" style={{animationDelay: '12s', animationDirection: 'reverse'}}></div>
          </div>

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
          <div className="absolute top-1/6 left-2/3 w-3 h-3 bg-green-400/30 rotate-30 animate-wave" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-1/6 right-3/4 w-6 h-6 bg-indigo-400/25 rounded-full animate-spiral" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Main content with glassmorphism */}
        <div className="relative z-10 max-w-7xl mx-auto pt-20 pb-6 sm:px-6 lg:px-8">
          {/* Enhanced Editor Dashboard Header with live clock and greeting */}
          <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 transition-all duration-700 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'} overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
            <div className="relative px-8 py-10 sm:px-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0 flex-1">
                  <div className="flex items-center mb-3">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mr-4">
                      Editor Dashboard
                    </h1>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-mono">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-lg text-gray-300">
                      {currentTime.getHours() < 12 ? '🌅 Good morning' : 
                       currentTime.getHours() < 17 ? '☀️ Good afternoon' : 
                       '🌙 Good evening'}, {user?.fullName || user?.username}!
                    </p>
                    <p className="text-sm text-gray-400">
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Link to="/editor-projects" className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      My Projects
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                  <Link to="/editor-discover" className="group relative px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 shadow-lg transition-all duration-200 transform hover:scale-105 hover:bg-white/20">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Discover Projects
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards with glassmorphism and hover effects */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-700 ${isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('assigned')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-blue-500/20 backdrop-blur-sm mr-4 group-hover:bg-blue-500/30 transition-all duration-300 ${hoveredCard === 'assigned' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Assigned Projects</p>
                  <p className="text-white text-3xl font-bold group-hover:text-blue-300 transition-colors duration-300">{stats.assignedProjects}</p>
                  {hoveredCard === 'assigned' && (
                    <p className="text-xs text-blue-400 mt-1 animate-fadeInUp">Projects assigned to You</p>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('reviewed')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-green-500/20 backdrop-blur-sm mr-4 group-hover:bg-green-500/30 transition-all duration-300 ${hoveredCard === 'reviewed' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Reviewed Projects</p>
                  <p className="text-white text-3xl font-bold group-hover:text-green-300 transition-colors duration-300">{stats.reviewedProjects}</p>
                  {hoveredCard === 'reviewed' && (
                    <p className="text-xs text-green-400 mt-1 animate-fadeInUp">Projects completed & approved</p>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('pending')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-yellow-500/20 backdrop-blur-sm mr-4 group-hover:bg-yellow-500/30 transition-all duration-300 ${hoveredCard === 'pending' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Pending Reviews</p>
                  <p className="text-white text-3xl font-bold group-hover:text-yellow-300 transition-colors duration-300">{stats.pendingReviews}</p>
                  {hoveredCard === 'pending' && (
                    <p className="text-xs text-yellow-400 mt-1 animate-fadeInUp">Awaiting creator feedback</p>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('progress')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-purple-500/20 backdrop-blur-sm mr-4 group-hover:bg-purple-500/30 transition-all duration-300 ${hoveredCard === 'progress' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">In Progress</p>
                  <p className="text-white text-3xl font-bold group-hover:text-purple-300 transition-colors duration-300">{stats.inProgress}</p>
                  {hoveredCard === 'progress' && (
                    <p className="text-xs text-purple-400 mt-1 animate-fadeInUp">Currently editing projects</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Tips Banner */}
          {productivityTips.length > 0 && (
            <div className={`bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-500/30 mb-8 transition-all duration-700 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'} overflow-hidden`} style={{animationDelay: '0.3s'}}>
              <div className="relative px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-indigo-300 mb-1">💡 Editor's Tip of the Moment</h3>
                    <p className="text-white text-sm leading-relaxed">{productivityTips[currentTipIndex]}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex space-x-1">
                      {productivityTips.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentTipIndex ? 'bg-indigo-400' : 'bg-indigo-600/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid with glassmorphism */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-700 ${isVisible ? 'animate-slideInRight' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
            {/* Recently Assigned Projects */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
                <div className="px-8 py-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Recently Assigned Projects</h2>
                    <Link to="/editor-projects" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200">
                      View all
                    </Link>
                  </div>
                </div>
                <div className="px-8 py-6">
                  {recentAssignments.length > 0 ? (
                    <div className="flow-root">
                      <ul className="divide-y divide-white/10">
                        {recentAssignments.map(project => (
                          <li key={project.id} className="py-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                                    {project.title.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <h3 className="text-base font-medium text-white">{project.title}</h3>
                                  <p className="text-sm text-gray-400">By {project.creator}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="text-right mr-4">
                                  <p className="text-sm text-gray-400">Due</p>
                                  <p className="text-sm font-medium text-white">{formatDate(project.deadline)}</p>
                                </div>
                                {project.status === 'Completed' || project.status === 'Closed' ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border
                                    ${project.status === 'Completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                    'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                                    {project.status}
                                  </span>
                                ) : (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border
                                    ${project.priority === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                                    project.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                                    'bg-green-500/20 text-green-300 border-green-500/30'}`}>
                                    {project.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">No recent assignments</h3>
                      <p className="mt-1 text-sm text-gray-400">Get started by checking out available projects.</p>
                      <div className="mt-8">
                        <Link to="/editor-projects" className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Assigned Projects
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Creator Feedback with enhanced glassmorphism */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mt-8 overflow-hidden">
                <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-purple-500/30 to-indigo-600/30 rounded-xl shadow-inner mr-4 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Creator Feedback on Your Work</h2>
                        <p className="text-sm text-gray-300 mt-1">See what content creators think about your edits</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-8 py-6 bg-gradient-to-b from-white/5 to-white/10">
                  {creatorFeedback.length > 0 ? (
                    <div className="flow-root">
                      <div className="relative">
                        {/* Enhanced timeline line with animation */}
                        <div className="absolute left-8 top-0 h-full w-0.5 bg-gradient-to-b from-purple-400/20 via-purple-400/50 to-purple-400/20">
                          <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-purple-400/60 to-purple-400/20 animate-pulse opacity-50"></div>
                        </div>
                        
                        <ul className="relative space-y-8">
                          {creatorFeedback
                            .filter(feedback => feedback && feedback.id)
                            .map((feedback) => {
                              const commentWords = feedback.comment?.split(' ').length || 0;
                              // Determine the status style
                              const statusStyles = {
                                'Closed': 'bg-green-500/20 text-green-300 border-green-500/30',
                                'In Review': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                                'In Progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                'default': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              };
                              const statusStyle = statusStyles[feedback.status] || statusStyles.default;
                              
                              return (
                                <li 
                                  key={feedback.id} 
                                  className="relative ml-12"
                                >
                                  {/* Enhanced interactive Timeline dot */}
                                  <div 
                                    className="absolute -left-16 w-10 h-10 rounded-full flex items-center justify-center 
                                      transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg
                                      bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-purple-300 backdrop-blur-sm border border-purple-500/30"
                                    title="Creator Feedback"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                  </div>
                                  
                                  {/* Enhanced feedback card with hover effect and time badge */}
                                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative group hover:bg-white/10">
                                    {/* Time badge with tooltip */}
                                    <div 
                                      className="absolute -top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 
                                        text-xs font-medium text-purple-300 shadow-sm hover:shadow transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-purple-500/30"
                                      title={`Received on ${formatDate(feedback.reviewedOn)}`}
                                    >
                                      {new Date(feedback.reviewedOn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-base font-bold text-white truncate max-w-[70%] group-hover:text-purple-300 transition-colors">
                                        {feedback.title || "Untitled Project"}
                                      </h3>
                                      <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                                        {formatDate(feedback.reviewedOn)}
                                      </span>
                                    </div>
                                    
                                    {/* Creator info with avatar */}
                                    <div className="flex items-center mt-1 mb-3">
                                      <div className="h-7 w-7 rounded-full bg-gradient-to-r from-purple-400/30 to-indigo-500/30 flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm border border-purple-500/30">
                                        {feedback.creator && feedback.creator.charAt(0).toUpperCase() || "C"}
                                      </div>
                                      <p className="text-sm text-gray-300 ml-3">From <span className="font-semibold text-white">{feedback.creator || "Creator"}</span></p>
                                    </div>
                                    
                                    {/* Comment with enhanced visual decoration */}
                                    <div className="mt-3">
                                      <div className="flex flex-wrap gap-2 items-center mb-3">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${statusStyle}`}>
                                          {feedback.status === 'Closed' ? 'Approved' : feedback.status || 'In Progress'}
                                        </span>
                                        
                                        <div className="flex items-center text-purple-400 ml-1">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                          </svg>
                                          <span className="text-xs font-medium ml-1 text-gray-400">
                                            {commentWords} {commentWords === 1 ? 'word' : 'words'}
                                          </span>
                                        </div>
                                        
                                        {/* Rating display with stars if available */}
                                        {feedback.rating > 0 && (
                                          <div className="flex items-center ml-1 bg-amber-500/20 px-2 py-1 rounded-full backdrop-blur-sm border border-amber-500/30">
                                            <svg className="h-3.5 w-3.5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-xs font-medium text-amber-300 ml-1">{feedback.rating.toFixed(1)}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Comment box with enhanced styling */}
                                      <div className="p-4 rounded-lg text-sm text-gray-300 border-l-2 transition-colors
                                        bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-l-purple-400/50 group-hover:border-l-purple-300 backdrop-blur-sm">
                                        <p className="line-clamp-3 italic">"{feedback.comment || 'No comment provided.'}"</p>
                                      </div>
                                    </div>
                                    
                                    {/* Improved action button */}
                                    <div className="mt-4 flex items-center justify-end">
                                      <Link 
                                        to={`/editor-projects?id=${String(feedback.projectId)}&action=open`} 
                                        className="inline-flex items-center px-4 py-2 border border-transparent
                                          bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white text-xs font-medium rounded-lg
                                          shadow-sm hover:from-purple-700 hover:to-indigo-700 hover:shadow transition-all duration-200 backdrop-blur-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        View Project
                                      </Link>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full 
                        flex items-center justify-center mb-6 shadow-inner backdrop-blur-sm border border-purple-500/30">
                        <svg className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No feedback yet</h3>
                      <p className="mt-1 text-sm text-gray-400 max-w-md mx-auto">
                        When content creators review your edited work, their feedback will appear here to help you improve.
                      </p>
                      <div className="mt-8">
                        <Link to="/editor-projects" 
                          className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm 
                            text-sm font-medium text-white bg-gradient-to-r from-purple-600/80 to-indigo-600/80
                            hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 backdrop-blur-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          View My Projects
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

        {/* Right Side - Performance and Schedule with glassmorphism */}
        <div>
          {/* Performance / Ratings with enhanced glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-amber-500/30 to-yellow-600/30 rounded-xl shadow-inner mr-4 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Editing Performance</h2>
                  <p className="text-sm text-gray-300 mt-1">Your rating from content creators</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-b from-white/5 to-white/10">
              <div className="text-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent mb-2">
                  {editorRatings.averageRating > 0 
                    ? editorRatings.averageRating.toFixed(1)
                    : "0.0"}
                </div>
                <div className="text-sm text-gray-300 font-medium">Average Rating</div>
                <div className="flex items-center justify-center mt-4 mb-6 space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`h-7 w-7 transition-all duration-200 ${
                        star <= Math.round(editorRatings.averageRating) 
                          ? 'text-amber-400 drop-shadow-lg transform hover:scale-110' 
                          : 'text-gray-500'
                      }`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                {/* Enhanced rating count card */}
                <div className="mt-6 py-6 px-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-500/30 shadow-inner backdrop-blur-sm">
                  <div className="flex items-center justify-center">
                    <div className="p-3 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 rounded-full shadow-inner mr-4 backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">{editorRatings.totalRatings}</span> 
                        <span className="text-sm font-normal text-gray-300 ml-2">Rating{editorRatings.totalRatings !== 1 ? 's' : ''} received</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Based on creator feedback</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Schedule with enhanced glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mt-8">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-orange-500/30 to-red-600/30 rounded-xl shadow-inner mr-4 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
                  <p className="text-sm text-gray-300 mt-1">Your project schedule</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 bg-gradient-to-b from-white/5 to-white/10">
              {upcomingDeadlines.length > 0 ? (
                <ul className="divide-y divide-white/10">
                  {upcomingDeadlines.map(project => (
                    <li key={project.id} className="py-4 group">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 mr-4">
                          <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors duration-200 truncate">
                            {project.title}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm border
                              ${project.priority === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                              project.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                              'bg-green-500/20 text-green-300 border-green-500/30'}`}>
                              {project.priority} Priority
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            project.daysRemaining === 0 ? 'text-red-400' : 
                            project.daysRemaining <= 3 ? 'text-orange-400' :
                            'text-green-400'
                          }`}>
                            {project.daysRemaining === 0 ? 'Due Today' : 
                             `${project.daysRemaining} days`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">remaining</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center backdrop-blur-sm border border-orange-500/30">
                    <svg className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8H8m0 0V7a2 2 0 012-2h4a2 2 0 012 2v4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">No upcoming deadlines</h3>
                  <p className="text-xs text-gray-400 mt-1">All caught up!</p>
                </div>
              )}
            </div>
            {upcomingDeadlines.length > 0 && (
              <div className="px-6 py-4 bg-gradient-to-r from-white/5 to-white/10 rounded-b-2xl border-t border-white/10">
                <Link to="/editor-projects" className="group flex items-center justify-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-all duration-200">
                  <span>View full schedule</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Enhanced Floating Action Button with Quick Actions */}
    <div className="fixed bottom-8 right-8 z-50">
      <div className="group relative">
        {/* Main FAB */}
        <button 
          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-110 flex items-center justify-center group-hover:rotate-45"
          onClick={() => setAnimationTrigger(!animationTrigger)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {/* Quick Action Buttons */}
        <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 space-y-3">
          <Link
            to="/editor-projects"
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="View Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </Link>
          
          <Link
            to="/editor-discover"
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="Discover New Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          <button
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="Quick Stats"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

export default EditorHome;
