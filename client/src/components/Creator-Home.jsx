import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiEndpoints } from '../utils/api';

function CreatorHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgressProjects: 0,
    closedProjects:0,
    completedProjects: 0,
    inReviewProjects: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [error, setError] = useState(null);
  
  // Enhanced creator tips
  const [creatorTips] = useState([
    "🎯 Define your target audience clearly before starting any content project.",
    "📊 Use analytics to understand what content resonates with your audience.",
    "⏰ Establish consistent publishing schedules to build audience expectations.",
    "🔄 Repurpose your best content across different platforms and formats.",
    "💬 Engage with your audience regularly to build a loyal community.",
    "📝 Always have a content calendar planned at least 2 weeks in advance.",
    "🎨 Invest time in creating eye-catching thumbnails and visuals.",
    "🎙️ Practice your delivery and speaking skills for video content."
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

    // Creator tip rotation
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % creatorTips.length);
    }, 10000);

    // Animation trigger for periodic effects
    const animationInterval = setInterval(() => {
      setAnimationTrigger(prev => !prev);
    }, 6000);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    // Get user details from local storage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        if (parsedUser.email) {
          fetchCreatorData(parsedUser.email);
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
  
  const fetchCreatorData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Get username from localStorage to avoid dependency on state
      const userData = JSON.parse(localStorage.getItem('user'));
      const username = userData?.username;
      
      if (!username) {
        throw new Error('Username not found');
      }
      
      // Use username from local storage, not from state
      const projectsResponse = await fetch(apiEndpoints.project.creatorProjects(username), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
      }
      
      const projectsData = await projectsResponse.json();
      const fetchedProjects = projectsData.projects || [];
      
      // Process and categorize projects
      const completedProjects = fetchedProjects.filter(p => p.status === 'Completed');
      const closedProjects = fetchedProjects.filter(p => p.status === 'Closed');
      const inProgressProjects = fetchedProjects.filter(p => 
        p.status === 'In Progress' || 
        p.status === 'Almost there' || 
        p.status === 'Good progress' || 
        p.status === 'Just started'
      );
      const inReviewProjects = fetchedProjects.filter(p => p.status === 'In Review');
      
      // Set project statistics
      setStats({
        totalProjects: fetchedProjects.length,
        inProgressProjects: inProgressProjects.length,
        closedProjects: closedProjects.length,
        completedProjects: completedProjects.length,
        inReviewProjects: inReviewProjects.length
      });
      
      // Format projects for display
      const formattedProjects = fetchedProjects.slice(0, 5).map(project => ({
        id: project._id,
        title: project.title,
        status: project.status || 'Draft',
        dueDate: project.deadline,
        editor: project.editorName || project.editorEmail || 'Not assigned', // Handle empty editor email
        progress: calculateProgress(project)
      }));
      
      setProjects(formattedProjects);
      
      // Calculate upcoming deadlines
      const upcomingProjects = fetchedProjects
        .filter(p => 
          p.status !== 'Completed' && 
          p.status !== 'Closed' && 
          p.deadline && 
          new Date(p.deadline) >= new Date()
        )
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3);
        
      const formattedDeadlines = upcomingProjects.map(project => ({
        id: project._id,
        title: project.title,
        deadline: project.deadline,
        daysRemaining: getDaysRemaining(project.deadline)
      }));
      
      setUpcomingDeadlines(formattedDeadlines);
      
    } catch (error) {
      console.error('Error fetching creator data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to calculate project progress
  const calculateProgress = (project) => {
    if (project.status === 'Completed') return 100;
    if (project.completionPercentage) return project.completionPercentage;
    
    // Estimate based on status
    switch (project.status) {
      case 'In Review': return 90;
      case 'Almost there': return 75;
      case 'Good progress': return 50;
      case 'Just started': return 25;
      case 'In Progress': return 40;
      default: return 10;
    }
  };
  
  // Calculate days remaining until deadline
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };
  
  // Format date as a string
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get deadline text
  const getDeadlineText = (daysRemaining) => {
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return 'Tomorrow';
    return `In ${daysRemaining} days`;
  };
  
  // Random writing tip
  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
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
    <>
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

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
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
          {/* Enhanced Creator Dashboard Header with live features */}
          <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 transition-all duration-700 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'} overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
            <div className="relative px-8 py-10 sm:px-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0 flex-1">
                  <div className="flex items-center mb-3">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mr-4">
                      Creator Dashboard
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
                  <Link to="/creator-projects" className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Content
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                  <Link to="/creator-display" className="group relative px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 shadow-lg transition-all duration-200 transform hover:scale-105 hover:bg-white/20">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      My Projects
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Creator Tips Banner */}
          {creatorTips.length > 0 && (
            <div className={`bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-500/30 mb-8 transition-all duration-700 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'} overflow-hidden`} style={{animationDelay: '0.15s'}}>
              <div className="relative px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-indigo-300 mb-1">⚡ Creator's Insight</h3>
                    <p className="text-white text-sm leading-relaxed">{creatorTips[currentTipIndex]}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex space-x-1">
                      {creatorTips.map((_, index) => (
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

          {/* Enhanced Project Statistics with glassmorphism */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-700 ${isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('total')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-blue-500/20 backdrop-blur-sm mr-4 group-hover:bg-blue-500/30 transition-all duration-300 ${hoveredCard === 'total' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Projects</p>
                  <p className="text-white text-3xl font-bold group-hover:text-blue-300 transition-colors duration-300">{stats.totalProjects}</p>
                  {hoveredCard === 'total' && (
                    <p className="text-xs text-blue-400 mt-1 animate-fadeInUp">All your content projects</p>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('progress')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-purple-500/20 backdrop-blur-sm mr-4 group-hover:bg-purple-500/30 transition-all duration-300 ${hoveredCard === 'progress' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">In Progress</p>
                  <p className="text-white text-3xl font-bold group-hover:text-purple-300 transition-colors duration-300">{stats.totalProjects-stats.completedProjects-stats.closedProjects}</p>
                  {hoveredCard === 'progress' && (
                    <p className="text-xs text-purple-400 mt-1 animate-fadeInUp">Currently being edited</p>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('closed')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-yellow-500/20 backdrop-blur-sm mr-4 group-hover:bg-yellow-500/30 transition-all duration-300 ${hoveredCard === 'closed' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Closed</p>
                  <p className="text-white text-3xl font-bold group-hover:text-yellow-300 transition-colors duration-300">{stats.closedProjects}</p>
                  {hoveredCard === 'closed' && (
                    <p className="text-xs text-yellow-400 mt-1 animate-fadeInUp">Published & complete</p>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden"
              onMouseEnter={() => setHoveredCard('completed')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-full bg-green-500/20 backdrop-blur-sm mr-4 group-hover:bg-green-500/30 transition-all duration-300 ${hoveredCard === 'completed' ? 'animate-pulse' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Completed</p>
                  <p className="text-white text-3xl font-bold group-hover:text-green-300 transition-colors duration-300">{stats.completedProjects}</p>
                  {hoveredCard === 'completed' && (
                    <p className="text-xs text-green-400 mt-1 animate-fadeInUp">Edited & ready</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid with glassmorphism */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-700 ${isVisible ? 'animate-slideInRight' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
            {/* Project Status */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
                <div className="px-8 py-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">My Projects</h2>
                    <Link to="/creator-display" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200">
                      View all projects
                    </Link>
                  </div>
                </div>
                <div className="overflow-hidden">
                  {projects.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            <th scope="col" className="px-8 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project</th>
                            <th scope="col" className="px-8 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-8 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Due Date</th>
                            <th scope="col" className="px-8 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Editor</th>
                            <th scope="col" className="px-8 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/5 divide-y divide-white/10">
                          {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-white/10 transition-colors duration-200">
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">{project.title}</div>
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full backdrop-blur-sm
                                  ${project.status === 'Completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                                    project.status === 'In Review' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                                    project.status === 'In Progress' || 
                                    project.status === 'Almost there' || 
                                    project.status === 'Good progress' || 
                                    project.status === 'Just started' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 
                                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                                  {project.status}
                                </span>
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-300">
                                {project.status === 'Completed' ? (
                                  <span className="text-green-400 font-medium">Completed</span>
                                ) : project.status === 'Closed' ? (
                                  <span className="text-blue-400 font-medium">Closed</span>
                                ) : (
                                  project.dueDate ? formatDate(project.dueDate) : 'No deadline'
                                )}
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-300">
                                {project.editor}
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="w-full bg-white/20 rounded-full h-2.5 backdrop-blur-sm">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      project.progress >= 100 ? 'bg-green-500' :
                                      project.progress >= 60 ? 'bg-blue-500' :
                                      project.progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${project.progress}%` }}>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{project.progress}% complete</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-300">No projects yet</h3>
                      <p className="mt-2 text-sm text-gray-400">Get started by creating a new project.</p>
                      <div className="mt-8">
                        <Link to="/creator-projects" className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Create new project
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

          {/* Project Timeline with glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mt-8">
            <div className="px-8 py-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Project Timeline</h2>
              </div>
            </div>
            <div className="p-8">
              {projects.length > 0 ? (
                <div className="space-y-6">
                  {/* Projects grouped by status */}
                  <div>
                    <h3 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">Current Month</h3>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 to-purple-500/50 ml-3"></div>
                      <ul className="space-y-6">
                        {projects.map(project => (
                          <li key={project.id} className="relative pl-12">
                            <div className="flex items-center mb-2">
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border shadow-lg
                                ${project.status === 'Completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                  project.status === 'In Review' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                                  project.status.includes('Progress') ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                  'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                                {project.status === 'Completed' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : project.status === 'In Review' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <h4 className="text-base font-medium text-white">{project.title}</h4>
                              <div className="ml-auto flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border
                                  ${project.status === 'Completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                    project.status === 'In Review' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                                    project.status.includes('Progress') ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                                    'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                                  {project.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                {project.editor}
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {project.dueDate ? formatDate(project.dueDate) : 'No deadline'}
                              </div>
                            </div>
                            <div className="mt-3 w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                              <div className={`h-2 rounded-full transition-all duration-300 ${
                                project.progress >= 100 ? 'bg-green-500' :
                                project.progress >= 60 ? 'bg-blue-500' :
                                project.progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} style={{ width: `${project.progress}%` }}></div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">No projects to display in timeline.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Editors, Deadlines, and Tips */}
        <div>
          {/* Your Editors with glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
            <div className="px-8 py-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Your Editors</h2>
            </div>
            <div className="px-8 py-6">
              {projects.some(p => p.editor && p.editor !== 'Not assigned' && p.editor !== '' && p.editor !== 'Unknown Editor') ? (
                <div className="space-y-4">
                  {/* Extract unique editors with improved filtering */}
                  {Array.from(
                    new Set(
                      projects
                        .filter(p => p.editor && p.editor !== 'Not assigned' && p.editor !== '' && p.editor !== 'Unknown Editor')
                        .map(p => p.editor)
                    )
                  ).map((editorName, index) => {
                    // Get all projects for this editor
                    const editorProjects = projects.filter(p => p.editor === editorName);
                    const completedCount = editorProjects.filter(p => p.status === 'Completed' || p.status === "Closed").length;
                    const inProgressCount = editorProjects.filter(p => p.status !== 'Completed' && p.status !== 'Closed').length;
                    const progressPercent = editorProjects.length > 0 
                      ? Math.round((completedCount / editorProjects.length) * 100) 
                      : 0;
                    
                    return (
                      <div key={index} className="flex items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 flex items-center justify-center font-medium text-lg mr-4 backdrop-blur-sm border border-indigo-500/30">
                          {editorName && editorName.charAt(0) ? editorName.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{editorName}</p>
                          <div className="flex items-center text-xs text-gray-400">
                            <span>{editorProjects.length} project{editorProjects.length !== 1 ? 's' : ''}</span>
                            <span className="mx-2">•</span>
                            <span>{completedCount} completed</span>
                            {inProgressCount > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{inProgressCount} in progress</span>
                              </>
                            )}
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2 mt-2 backdrop-blur-sm">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progressPercent === 100 ? 'bg-green-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6">
                    <Link to="/creator-projects" className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Assign a new project
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-white">No editors assigned</h3>
                  <p className="mt-1 text-sm text-gray-400">Assign editors to your projects to see them here.</p>
                  <div className="mt-6">
                    <Link to="/creator-projects" className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create a new project
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Deadlines with glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mt-8">
            <div className="px-8 py-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Upcoming Deadlines</h2>
            </div>
            <div className="px-8 py-6">
              {upcomingDeadlines.length > 0 ? (
                <div className="flow-root">
                  <ul className="divide-y divide-white/10">
                    {upcomingDeadlines.map(project => (
                      <li key={project.id} className="py-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{project.title}</p>
                          </div>
                          <p className={`text-sm font-medium ${
                            project.daysRemaining === 0 ? 'text-red-400' : 
                            project.daysRemaining <= 2 ? 'text-red-400' :
                            project.daysRemaining <= 5 ? 'text-orange-400' :
                            'text-gray-400'
                          }`}>
                            {getDeadlineText(project.daysRemaining)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">No upcoming deadlines.</p>
                </div>
              )}
            </div>
            {upcomingDeadlines.length > 0 && (
              <div className="px-8 py-4 bg-white/5 rounded-b-2xl">
                <Link to="/creator-display" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex justify-center items-center transition-colors duration-200">
                  View all deadlines
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>

    {/* Enhanced Floating Action Button with Creator Quick Actions */}
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
            to="/creator-projects"
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="New Content"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
          
          <Link
            to="/creator-display"
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="My Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </Link>

          <Link
            to="/creator-assign"
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="Assign Editor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <button
            className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-110"
            title="Scroll to Top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}

export default CreatorHome;