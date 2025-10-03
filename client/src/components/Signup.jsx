import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiEndpoints } from '../utils/api';

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    userType: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const validate = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email address is invalid";
    if (!formData.userType) newErrors.userType = "User type is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      try {
        setIsLoading(true);
        setMessage(null);
        const userData = {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          userType: formData.userType,
          password: formData.password,
        };
        const response = await fetch(apiEndpoints.user.create(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (data.message === "User created successfully!") {
          setMessage({
            type: "success",
            text: "Registration successful! Redirecting to login...",
          });
          setFormData({
            username: "",
            fullName: "",
            email: "",
            userType: "",
            password: "",
            confirmPassword: "",
          });
          setTimeout(() => {
            navigate("/signin");
          }, 1000);
        } else {
          setMessage({
            type: "error",
            text: data.message || "Registration failed. Please try again.",
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: "An error occurred. Please try again later.",
        });
        console.error("Signup error:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <>
      {/* Custom animations */}
      <style jsx>{`
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-15px) translateX(10px);
          }
          50% {
            transform: translateY(-30px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(15px);
          }
        }
        
        @keyframes drift {
          0% {
            transform: translateX(-100px) translateY(0px);
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(-50px);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(100px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(100px) rotate(-360deg);
          }
        }
        
        @keyframes morphing {
          0%, 100% {
            border-radius: 50%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 0%;
            transform: rotate(90deg) scale(1.2);
          }
          50% {
            border-radius: 30%;
            transform: rotate(180deg) scale(0.8);
          }
          75% {
            border-radius: 10%;
            transform: rotate(270deg) scale(1.1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
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

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden">
        {/* Dynamic background gradient that follows mouse */}
        <div 
          className="absolute inset-0 opacity-30 transition-all duration-1000 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.2), transparent 50%)`
          }}
        />

        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400/30 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-floatSlow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-pink-400/25 rounded-full animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-yellow-400/35 rounded-full animate-float" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-green-400/40 rounded-full animate-floatSlow" style={{animationDelay: '3s'}}></div>

          {/* Drifting particles */}
          <div className="absolute top-10 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-drift" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-32 w-1 h-1 bg-blue-400/50 rounded-full animate-drift" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-56 w-2 h-2 bg-cyan-400/30 rounded-full animate-drift" style={{animationDelay: '6s'}}></div>
          <div className="absolute top-72 w-1.5 h-1.5 bg-pink-400/35 rounded-full animate-drift" style={{animationDelay: '9s'}}></div>

          {/* Twinkling stars */}
          <div className="absolute top-10 left-10 w-1 h-1 bg-white/60 rounded-full animate-twinkle" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-purple-300/80 rounded-full animate-twinkle" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-32 left-1/3 w-1.5 h-1.5 bg-blue-300/60 rounded-full animate-twinkle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-0.5 h-0.5 bg-pink-300/80 rounded-full animate-twinkle" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-yellow-300/60 rounded-full animate-twinkle" style={{animationDelay: '2.5s'}}></div>

          {/* Morphing particles */}
          <div className="absolute top-1/6 right-1/6 w-3 h-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 animate-morphing" style={{animationDelay: '0s'}}></div>
          <div className="absolute bottom-1/6 left-1/6 w-2.5 h-2.5 bg-gradient-to-r from-cyan-500/25 to-pink-500/25 animate-morphing" style={{animationDelay: '2s'}}></div>

          {/* Orbiting elements */}
          <div className="absolute top-1/4 left-1/4">
            <div className="w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-orbit" style={{animationDelay: '0s'}}></div>
          </div>
          <div className="absolute bottom-1/4 right-1/4">
            <div className="w-2 h-2 bg-blue-400/25 rounded-full animate-orbit" style={{animationDelay: '10s', animationDirection: 'reverse'}}></div>
          </div>
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/20 rotate-45 animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-blue-400/20 rounded-full animate-floatSlow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-cyan-400/20 rotate-12 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-pink-400/20 rounded-full animate-floatSlow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 right-10 w-4 h-4 bg-yellow-400/20 rotate-45 animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex justify-center items-center min-h-screen px-4 py-8">
          <div className={`w-full max-w-lg transition-all duration-700 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
            {/* Glassmorphism card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl hover:bg-white/8 transition-all duration-300 relative overflow-hidden">
              
              {/* Header */}
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  Create Account
                </h2>
                <p className="text-gray-400">
                  Join our NeoSync community today
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
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                {/* Username and Full Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Username*
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:bg-white/8 ${
                        errors.username ? "border-red-500/50" : "border-white/20"
                      }`}
                      placeholder="Enter username"
                    />
                    {errors.username && (
                      <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{errors.username}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Full Name*
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:bg-white/8 ${
                        errors.fullName ? "border-red-500/50" : "border-white/20"
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email Address*
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:bg-white/8 ${
                      errors.email ? "border-red-500/50" : "border-white/20"
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    User Type*
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-white/5 ${
                      formData.userType === "contentCreator" 
                        ? "border-purple-500/50 bg-purple-500/10" 
                        : "border-white/20 bg-white/5"
                    }`}>
                      <input
                        id="contentCreator"
                        name="userType"
                        type="radio"
                        value="contentCreator"
                        checked={formData.userType === "contentCreator"}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="contentCreator"
                        className="cursor-pointer flex items-center space-x-3"
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.userType === "contentCreator"
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-400"
                        }`}>
                          {formData.userType === "contentCreator" && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">Content Creator</div>
                          <div className="text-gray-400 text-sm">Create and upload content</div>
                        </div>
                      </label>
                    </div>

                    <div className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-white/5 ${
                      formData.userType === "editor" 
                        ? "border-purple-500/50 bg-purple-500/10" 
                        : "border-white/20 bg-white/5"
                    }`}>
                      <input
                        id="editor"
                        name="userType"
                        type="radio"
                        value="editor"
                        checked={formData.userType === "editor"}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="editor"
                        className="cursor-pointer flex items-center space-x-3"
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.userType === "editor"
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-400"
                        }`}>
                          {formData.userType === "editor" && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">Editor</div>
                          <div className="text-gray-400 text-sm">Edit and enhance content</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {errors.userType && (
                    <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.userType}</span>
                    </p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Password*
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:bg-white/8 ${
                        errors.password ? "border-red-500/50" : "border-white/20"
                      }`}
                      placeholder="Create password"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Confirm Password*
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:bg-white/8 ${
                        errors.confirmPassword ? "border-red-500/50" : "border-white/20"
                      }`}
                      placeholder="Confirm password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`relative w-full py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-102 overflow-hidden ${
                    isLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-purple-500/25"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-700 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link
                    to="/signin"
                    className="font-medium bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent hover:from-purple-300 hover:to-blue-400 transition-all duration-200"
                  >
                    Sign in here
                  </Link>
                </p>
                <div className="flex items-center justify-center mt-4 space-x-4 text-gray-500 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Secure Signup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <span>Quick Setup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;
