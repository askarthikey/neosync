import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Authentication state
  const isAuthenticated = localStorage.getItem("token") !== null;
  const user = isAuthenticated
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const isCreator = user?.userType === "contentCreator";
  const isEditor = user?.userType === "editor";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when navigating
  useEffect(() => {
    setDropdownOpen(false);
  }, [location]);

  // Navigation links based on user type
  const getNavigationLinks = () => {
    const commonLinks = [{ path: "/home", label: "Home" }];

    const creatorLinks = [
      { path: "/creator-projects", label: "Create Project" },
      { path: "/creator-display", label: "Projects" },
      { path: "/creator-assign", label: "Assign Editors" },
    ];

    const editorLinks = [
      { path: "/editor-discover", label: "Discover" },
      { path: "/editor-projects", label: "Assigned Projects" },
    ];

    if (isCreator) {
      return [...commonLinks, ...creatorLinks];
    } else if (isEditor) {
      return [...commonLinks, ...editorLinks];
    }

    return commonLinks;
  };

  const handleLogout = () => {
    // Set a flag in session storage to prevent multiple redirects
    if (sessionStorage.getItem("isLoggingOut")) {
      return; // Prevent duplicate logout attempts
    }
    sessionStorage.setItem("isLoggingOut", "true");

    // Create notification
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg transition-opacity duration-500 z-50";
    notification.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">Successfully logged out</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);

    // Clear auth data before navigating
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Use setTimeout to ensure auth data is cleared before navigation
    setTimeout(() => {
      // Use window.location for a full page refresh to clear any React Router state
      window.location.href = "/";

      // Remove the logout flag after navigation starts
      sessionStorage.removeItem("isLoggingOut");

      // Handle notification removal
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.opacity = "0";
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 500);
        }
      }, 2000);
    }, 50);
  };

  const navigationLinks = getNavigationLinks();

  return (
    <>
      {/* Custom styles for glassmorphic header */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(168, 85, 247, 0.4);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }
        
        @keyframes pulse-rainbow {
          0%, 100% {
            background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          }
          25% {
            background: linear-gradient(45deg, #8b5cf6, #ec4899);
          }
          50% {
            background: linear-gradient(45deg, #ec4899, #06b6d4);
          }
          75% {
            background: linear-gradient(45deg, #06b6d4, #10b981);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
        
        @keyframes wave-border {
          0% {
            border-image: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1;
          }
          25% {
            border-image: linear-gradient(135deg, transparent, rgba(168, 85, 247, 0.5), transparent) 1;
          }
          50% {
            border-image: linear-gradient(225deg, transparent, rgba(6, 182, 212, 0.5), transparent) 1;
          }
          75% {
            border-image: linear-gradient(315deg, transparent, rgba(236, 72, 153, 0.5), transparent) 1;
          }
          100% {
            border-image: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.5), transparent) 1;
          }
        }
        
        .shimmer-effect {
          position: relative;
          overflow: hidden;
        }
        
        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        
        .shimmer-effect:hover::after {
          animation: shimmer 0.8s ease-in-out;
        }
        
        .glow-on-hover:hover {
          animation: glow 2s ease-in-out infinite;
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .pulse-rainbow {
          animation: pulse-rainbow 4s ease-in-out infinite;
        }
        
        .sparkle-effect::before {
          content: '✨';
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 12px;
          animation: sparkle 2s ease-in-out infinite;
        }
        
        .wave-border {
          border: 2px solid transparent;
          animation: wave-border 3s linear infinite;
        }
        
        .glass-morphism {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.2),
            0 0 20px rgba(59, 130, 246, 0.3);
        }
        
        .gradient-text {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4);
          background-size: 300% 300%;
          animation: pulse-rainbow 3s ease-in-out infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Enhanced particle animations */
        .drift-animation {
          animation: drift-animation 8s ease-in-out infinite;
        }
        
        .spiral-animation {
          animation: spiral-animation 12s linear infinite;
        }
        
        .zigzag-animation {
          animation: zigzag-animation 10s ease-in-out infinite;
        }
        
        .morphing-animation {
          animation: morphing-animation 15s ease-in-out infinite;
        }
        
        .orb-float {
          animation: orb-float 8s ease-in-out infinite;
        }
        
        .orb-drift {
          animation: orb-drift 12s ease-in-out infinite;
        }
        
        .orb-spiral {
          animation: orb-spiral 20s linear infinite;
        }
        
        .aurora-primary {
          animation: aurora-primary 8s ease-in-out infinite;
        }
        
        .aurora-secondary {
          animation: aurora-secondary 10s ease-in-out infinite;
        }
        
        .aurora-tertiary {
          animation: aurora-tertiary 12s ease-in-out infinite;
        }
        
        .energy-wave-1 {
          animation: energy-wave-1 6s ease-in-out infinite;
        }
        
        .energy-wave-2 {
          animation: energy-wave-2 8s ease-in-out infinite;
        }
        
        .energy-wave-3 {
          animation: energy-wave-3 10s ease-in-out infinite;
        }
        
        @keyframes drift-animation {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0.3;
          }
          25% {
            transform: translateX(10px) translateY(-5px);
            opacity: 0.6;
          }
          50% {
            transform: translateX(-5px) translateY(-10px);
            opacity: 0.8;
          }
          75% {
            transform: translateX(-10px) translateY(5px);
            opacity: 0.4;
          }
          100% {
            transform: translateX(0) translateY(0);
            opacity: 0.3;
          }
        }
        
        @keyframes spiral-animation {
          0% {
            transform: rotate(0deg) translateX(0px) scale(1);
            opacity: 0.2;
          }
          25% {
            transform: rotate(90deg) translateX(8px) scale(1.2);
            opacity: 0.6;
          }
          50% {
            transform: rotate(180deg) translateX(0px) scale(0.8);
            opacity: 0.8;
          }
          75% {
            transform: rotate(270deg) translateX(-8px) scale(1.1);
            opacity: 0.4;
          }
          100% {
            transform: rotate(360deg) translateX(0px) scale(1);
            opacity: 0.2;
          }
        }
        
        @keyframes zigzag-animation {
          0%, 100% {
            transform: translateX(0) translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          16% {
            transform: translateX(6px) translateY(-3px) rotate(20deg);
            opacity: 0.5;
          }
          33% {
            transform: translateX(-4px) translateY(-6px) rotate(-15deg);
            opacity: 0.7;
          }
          50% {
            transform: translateX(8px) translateY(-4px) rotate(25deg);
            opacity: 0.8;
          }
          66% {
            transform: translateX(-6px) translateY(-2px) rotate(-20deg);
            opacity: 0.6;
          }
          83% {
            transform: translateX(4px) translateY(-5px) rotate(15deg);
            opacity: 0.4;
          }
        }
        
        @keyframes morphing-animation {
          0% {
            border-radius: 50%;
            transform: scale(1) rotate(0deg);
            opacity: 0.3;
          }
          25% {
            border-radius: 30%;
            transform: scale(1.3) rotate(90deg);
            opacity: 0.6;
          }
          50% {
            border-radius: 10%;
            transform: scale(0.8) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            border-radius: 40%;
            transform: scale(1.1) rotate(270deg);
            opacity: 0.5;
          }
          100% {
            border-radius: 50%;
            transform: scale(1) rotate(360deg);
            opacity: 0.3;
          }
        }
        
        @keyframes orb-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-15px) scale(1.2);
            opacity: 0.2;
          }
        }
        
        @keyframes orb-drift {
          0% {
            transform: translateX(0px) translateY(0px) scale(1);
            opacity: 0.15;
          }
          33% {
            transform: translateX(12px) translateY(-8px) scale(1.1);
            opacity: 0.25;
          }
          66% {
            transform: translateX(-8px) translateY(-12px) scale(0.9);
            opacity: 0.2;
          }
          100% {
            transform: translateX(0px) translateY(0px) scale(1);
            opacity: 0.15;
          }
        }
        
        @keyframes orb-spiral {
          0% {
            transform: rotate(0deg) translateX(15px) scale(1);
            opacity: 0.08;
          }
          25% {
            transform: rotate(90deg) translateX(15px) scale(1.3);
            opacity: 0.12;
          }
          50% {
            transform: rotate(180deg) translateX(15px) scale(0.8);
            opacity: 0.15;
          }
          75% {
            transform: rotate(270deg) translateX(15px) scale(1.1);
            opacity: 0.1;
          }
          100% {
            transform: rotate(360deg) translateX(15px) scale(1);
            opacity: 0.08;
          }
        }
        
        @keyframes aurora-primary {
          0%, 100% {
            opacity: 0.1;
            background: linear-gradient(45deg, 
              rgba(59, 130, 246, 0.1), 
              rgba(139, 92, 246, 0.1), 
              rgba(6, 182, 212, 0.1));
          }
          50% {
            opacity: 0.15;
            background: linear-gradient(45deg, 
              rgba(6, 182, 212, 0.15), 
              rgba(59, 130, 246, 0.1), 
              rgba(139, 92, 246, 0.1));
          }
        }
        
        @keyframes aurora-secondary {
          0%, 100% {
            opacity: 0.08;
            background: linear-gradient(-45deg, 
              rgba(139, 69, 19, 0.08), 
              rgba(236, 72, 153, 0.08), 
              rgba(16, 185, 129, 0.08));
          }
          50% {
            opacity: 0.12;
            background: linear-gradient(-45deg, 
              rgba(16, 185, 129, 0.12), 
              rgba(139, 69, 19, 0.08), 
              rgba(236, 72, 153, 0.08));
          }
        }
        
        @keyframes aurora-tertiary {
          0%, 100% {
            opacity: 0.06;
            background: linear-gradient(90deg, 
              rgba(99, 102, 241, 0.06), 
              rgba(244, 114, 182, 0.06), 
              rgba(20, 184, 166, 0.06));
          }
          50% {
            opacity: 0.1;
            background: linear-gradient(90deg, 
              rgba(20, 184, 166, 0.1), 
              rgba(99, 102, 241, 0.06), 
              rgba(244, 114, 182, 0.06));
          }
        }
        
        @keyframes energy-wave-1 {
          0% {
            transform: translateX(-100%) skewX(-15deg);
            opacity: 0;
          }
          50% {
            opacity: 0.05;
          }
          100% {
            transform: translateX(100%) skewX(-15deg);
            opacity: 0;
          }
        }
        
        @keyframes energy-wave-2 {
          0% {
            transform: translateX(100%) skewX(15deg);
            opacity: 0;
          }
          50% {
            opacity: 0.05;
          }
          100% {
            transform: translateX(-100%) skewX(15deg);
            opacity: 0;
          }
        }
        
        @keyframes energy-wave-3 {
          0% {
            transform: translateX(-100%) skewX(-10deg);
            opacity: 0;
          }
          50% {
            opacity: 0.05;
          }
          100% {
            transform: translateX(100%) skewX(-10deg);
            opacity: 0;
          }
        }
      `}</style>
      
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass-morphism shadow-2xl' 
          : 'bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-2xl border-b border-white/5'
      }`}>
        {/* Enhanced animated background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-1 h-1 bg-blue-400/40 rounded-full animate-ping float-animation" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-2 right-1/3 w-0.5 h-0.5 bg-purple-400/50 rounded-full animate-pulse sparkle-effect" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1 left-2/3 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-ping float-animation" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1 left-1/6 w-0.5 h-0.5 bg-pink-400/45 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-2 right-1/6 w-1 h-1 bg-yellow-400/35 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
          
          {/* Additional cosmic particles */}
          <div className="absolute top-1 left-1/2 w-0.5 h-0.5 bg-emerald-400/40 rounded-full animate-pulse drift-animation" style={{animationDelay: '0.8s'}}></div>
          <div className="absolute bottom-1 right-1/2 w-1 h-1 bg-rose-400/35 rounded-full animate-ping spiral-animation" style={{animationDelay: '1.2s'}}></div>
          <div className="absolute top-3 left-3/4 w-0.5 h-0.5 bg-violet-400/45 rounded-full animate-pulse zigzag-animation" style={{animationDelay: '2.5s'}}></div>
          <div className="absolute bottom-3 left-1/8 w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-ping morphing-animation" style={{animationDelay: '3s'}}></div>
          
          {/* Floating light streaks */}
          <div className="absolute top-0 left-1/5 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-pulse" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/15 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-0 left-3/5 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/18 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Floating orbs */}
          <div className="absolute top-2 left-1/3 w-3 h-3 bg-blue-500/10 rounded-full blur-sm animate-pulse orb-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute bottom-2 right-1/3 w-2 h-2 bg-purple-500/15 rounded-full blur-sm animate-ping orb-drift" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1 right-1/5 w-4 h-4 bg-pink-500/8 rounded-full blur-md animate-pulse orb-spiral" style={{animationDelay: '2.8s'}}></div>
        </div>
        
        {/* Enhanced Aurora effect background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 animate-pulse aurora-primary"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-violet-600/8 via-rose-600/8 to-emerald-600/8 animate-pulse aurora-secondary" style={{animationDelay: '1s'}}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/6 via-pink-600/6 to-teal-600/6 animate-pulse aurora-tertiary" style={{animationDelay: '2s'}}></div>
        </div>
        
        {/* Energy waves */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent energy-wave-1"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-500/5 to-transparent energy-wave-2" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent energy-wave-3" style={{animationDelay: '3s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                to={isAuthenticated ? "/home" : "/"}
                className="flex items-center space-x-3 group"
              >
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                  {/* Custom NeoSync logo - represents sync/collaboration */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Sync arrows representing collaboration */}
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 8v8"/>
                    <path d="M8 12h8"/>
                  </svg>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="font-bold text-xl text-white group-hover:text-blue-200 transition-colors duration-300">
                  Neo<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Sync</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation with glassmorphic styling */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-2">
                <nav className="flex space-x-2">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 shimmer-effect ${
                        location.pathname === link.path
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-400/30 shadow-lg shadow-blue-500/20"
                          : "text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 border border-transparent backdrop-blur-sm hover:scale-105"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* User Profile & Auth Buttons with glassmorphic styling */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="relative ml-3">
                  <div>
                    <button
                      ref={buttonRef}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center max-w-xs bg-white/10 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/20 transition-all duration-300 p-2 border border-white/20 hover:scale-105 group"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center h-8 w-8 rounded-lg font-semibold group-hover:scale-110 transition-transform duration-300">
                        {user?.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-200 hidden sm:block group-hover:text-white transition-colors duration-300">
                        {user?.fullName.split(" ")[0]}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`ml-1 h-4 w-4 text-gray-400 transition-all duration-300 group-hover:text-white ${dropdownOpen ? "transform rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Enhanced User Menu Dropdown */}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="origin-top-right absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl bg-black/90 backdrop-blur-xl ring-1 ring-white/20 divide-y divide-white/10 border border-white/20"
                    >
                      {/* User info section */}
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl">
                        <p className="text-sm text-gray-300">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">
                          {user?.email}
                        </p>
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-400/30">
                          {isCreator
                            ? "Content Creator"
                            : isEditor
                              ? "Editor"
                              : "User"}
                        </div>
                      </div>

                      {/* Quick Navigation Links with enhanced styling */}
                      <div className="py-2">
                        {isCreator && (
                          <>
                            <Link
                              to="/creator-projects"
                              className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg mx-2 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 group-hover:bg-blue-500/30 transition-colors duration-300">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-blue-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                              </div>
                              My Projects
                            </Link>
                            <Link
                              to="/creator-assign"
                              className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg mx-2 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3 group-hover:bg-purple-500/30 transition-colors duration-300">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-purple-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                              </div>
                              Assign Editors
                            </Link>
                          </>
                        )}

                        {isEditor && (
                          <>
                            <Link
                              to="/editor-discover"
                              className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg mx-2 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3 group-hover:bg-cyan-500/30 transition-colors duration-300">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-cyan-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              Discover Projects
                            </Link>
                            <Link
                              to="/editor-projects"
                              className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg mx-2 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3 group-hover:bg-green-500/30 transition-colors duration-300">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-green-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                                    clipRule="evenodd"
                                  />
                                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                                </svg>
                              </div>
                              My Assignments
                            </Link>
                          </>
                        )}

                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg mx-2 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mr-3 group-hover:bg-indigo-500/30 transition-colors duration-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-indigo-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          Your Profile
                        </Link>
                      </div>

                      {/* Sign Out with enhanced styling */}
                      <div className="py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 rounded-lg mx-2 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-3 group-hover:bg-red-500/30 transition-colors duration-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-red-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 3a1 1 0 00-1 1v12a1 1 0 002 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/signin"
                    className="inline-flex items-center px-6 py-2 border border-white/20 text-sm font-medium rounded-xl text-gray-300 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all duration-300 hover:scale-105 shimmer-effect"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shimmer-effect shadow-lg hover:shadow-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation Menu */}
        {isAuthenticated && (
          <div className="block md:hidden border-t border-white/10 bg-black/50 backdrop-blur-lg">
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
                    location.pathname === link.path
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-l-4 border-blue-500"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default Header;
