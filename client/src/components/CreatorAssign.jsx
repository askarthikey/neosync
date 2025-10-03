import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from '../utils/api';

function CreatorAssign() {
  const [accessRequests, setAccessRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const navigate = useNavigate();

  // Check if user is logged in and is a creator
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Redirect if not logged in or not a creator
    if (!user || user.userType !== "contentCreator") {
      navigate("/signin");
      return;
    }

    fetchAccessRequests();
  }, [navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time ago for display
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown date";

    try {
      const created = new Date(dateString);
      if (isNaN(created.getTime())) return "Invalid date";

      const now = new Date();
      const diffTime = now - created;
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60)
        return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
      if (diffHours < 24)
        return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      if (diffDays < 30)
        return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

      return `on ${formatDate(dateString)}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Unknown date";
    }
  };

  // Fetch access requests for this creator
  const fetchAccessRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        apiEndpoints.project.accessRequests.creator(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch access requests");
      }

      const data = await response.json();

      // Ensure we're handling the data structure correctly
      if (data.success && Array.isArray(data.accessRequests)) {
        // Filter for only pending requests to ensure we're showing the right state
        const pendingRequests = data.accessRequests.filter(
          (req) => req.status === "pending",
        );
        setAccessRequests(pendingRequests);
      } else {
        setAccessRequests([]);
      }
    } catch (error) {
      console.error("Error fetching access requests:", error);
      setError("Failed to load access requests. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Accept an editor's request
  const handleAcceptRequest = async (requestId) => {
    setProcessingId(requestId);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        apiEndpoints.project.accessRequests.approve(requestId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve request");
      }

      setStatusMessage({
        type: "success",
        text: "Editor has been assigned to the project successfully!",
      });

      // Update the local state to reflect the change
      setAccessRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: "approved" } : req,
        ),
      );

      // After a brief delay, remove the approved request from the list
      setTimeout(() => {
        setAccessRequests((prev) =>
          prev.filter((req) => req._id !== requestId),
        );

        // Clear status message after some time
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }, 1500);
    } catch (error) {
      console.error("Error approving request:", error);
      setStatusMessage({
        type: "error",
        text: error.message || "Failed to approve request. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject an editor's request
  const handleRejectRequest = async (requestId) => {
    setProcessingId(requestId);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        apiEndpoints.project.accessRequests.reject(requestId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject request");
      }

      setStatusMessage({
        type: "success",
        text: "Editor request has been rejected.",
      });

      // Update the local state to reflect the change
      setAccessRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: "rejected" } : req,
        ),
      );

      // After a brief delay, remove the rejected request from the list
      setTimeout(() => {
        setAccessRequests((prev) =>
          prev.filter((req) => req._id !== requestId),
        );

        // Clear status message after some time
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }, 1500);
    } catch (error) {
      console.error("Error rejecting request:", error);
      setStatusMessage({
        type: "error",
        text: error.message || "Failed to reject request. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // // View editor profile or details
  // const handleViewEditorProfile = (editorEmail) => {
  //   // You could navigate to a profile page or show a modal with editor details
  //   console.log("View editor profile:", editorEmail);
  // };

  // Show project details modal
  const handleViewProjectDetails = (request) => {
    setSelectedRequest(request);
  };

  // Close project details modal
  const closeProjectDetails = () => {
    setSelectedRequest(null);
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
                <p className="mt-6 text-gray-300 text-lg font-medium animate-pulse-glow">Loading access requests...</p>
              </div>
            </div>
          </div>
        </div>
      </>
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
          {/* Status messages */}
          {statusMessage && (
            <div
              className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center backdrop-blur-xl border ${
                statusMessage.type === "success"
                  ? "bg-green-500/20 border-green-500/30 text-green-300"
                  : "bg-red-500/20 border-red-500/30 text-red-300"
              }`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                {statusMessage.type === "success" ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Enhanced Header section with glassmorphism */}
          <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 transition-all duration-700 animate-fadeInUp overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
            <div className="relative px-8 py-10 sm:px-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0 flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
                    Editor Requests
                  </h1>
                  <p className="text-lg text-gray-300 mb-2">
                    Manage editor requests for your projects
                  </p>
                  <p className="text-sm text-gray-400">
                    Review requests from editors who want to work on your projects.
                    Approve requests to assign the project to the editor, or reject
                    requests if you prefer to find another editor.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-500/20 border-l-4 border-red-500 text-red-300 p-4 rounded-xl backdrop-blur-xl border border-red-500/30 shadow-xl">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Access requests list */}
          {accessRequests.length > 0 ? (
            <div className="space-y-6 mb-12">
              {accessRequests.map((request) => (
                <div
                  key={request._id}
                  className={`bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-102 ${
                    request.status === "pending"
                      ? "ring-2 ring-yellow-500/30"
                      : request.status === "approved"
                        ? "ring-2 ring-green-500/30"
                        : "ring-2 ring-gray-500/30"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Add thumbnail preview */}
                    <div className="w-full md:w-1/4 h-32 md:h-auto bg-white/5 relative overflow-hidden">
                      {request.projectThumbnail ? (
                        <img
                          src={request.projectThumbnail}
                          alt={request.projectTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    <div className="p-6 w-full md:w-3/4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="mb-4 md:mb-0">
                          <h2 className="text-xl font-semibold text-white">
                            {request.projectTitle}
                          </h2>
                          <p className="text-sm text-gray-400 mb-2">
                            Request received {formatTimeAgo(request.createdAt)}
                          </p>

                          <div className="flex items-center mb-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center text-purple-300 font-medium text-lg">
                              {request.editorName
                                ? request.editorName.charAt(0).toUpperCase()
                                : "E"}
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-white">
                                {request.editorName ||
                                  request.editorEmail.split("@")[0]}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {request.editorEmail}
                              </p>
                            </div>
                          </div>

                          {request.message && (
                            <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl text-gray-300 text-sm border border-white/10">
                              <p className="font-medium mb-1 text-blue-300">
                                Message from editor:
                              </p>
                              <p>{request.message}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:space-x-1">
                          <button
                            onClick={() => handleViewProjectDetails(request)}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/50 backdrop-blur-sm border border-indigo-500/30 transition-all duration-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            View Project
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        disabled={processingId === request._id}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl backdrop-blur-sm transition-all duration-200 ${
                          processingId === request._id
                            ? "bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/30"
                            : "text-red-300 bg-red-500/20 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 border border-red-500/30"
                        }`}
                      >
                        {processingId === request._id ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Decline Request
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        disabled={processingId === request._id}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl backdrop-blur-sm transition-all duration-200 ${
                          processingId === request._id
                            ? "bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/30"
                            : "text-white bg-green-500/20 hover:bg-green-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500/50 border border-green-500/30"
                        }`}
                      >
                        {processingId === request._id ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Assign Editor
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-blue-500/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-1">
                No pending requests
              </h3>
              <p className="text-gray-400 mb-6">
                You don't have any editor requests at the moment. When editors
                request access to your projects, they'll appear here.
              </p>
            </div>
          )}

          {/* Project details modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20">
                <div className="relative">
                  <div className="h-48 sm:h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 relative">
                    {selectedRequest.projectThumbnail ? (
                      <img
                        src={selectedRequest.projectThumbnail}
                        alt={selectedRequest.projectTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 flex flex-col justify-end p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            {selectedRequest.projectTitle}
                          </h2>
                        </div>
                        <span className="px-3 py-1 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-sm">
                          Pending Assignment
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={closeProjectDetails}
                      className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Editor Request
                      </h3>
                      <div className="bg-purple-500/20 p-4 rounded-xl backdrop-blur-sm border border-purple-500/30">
                        <div className="flex items-start mb-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 flex items-center justify-center text-purple-300 font-medium text-lg mr-3 backdrop-blur-sm border border-purple-500/30">
                            {selectedRequest.editorName
                              ? selectedRequest.editorName.charAt(0).toUpperCase()
                              : "E"}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">
                              {selectedRequest.editorName || "Unknown Editor"}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {selectedRequest.editorEmail}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              Requested {formatTimeAgo(selectedRequest.createdAt)}
                            </p>
                          </div>
                        </div>

                        {selectedRequest.message && (
                          <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                            <p className="text-sm font-medium text-blue-300 mb-1">
                              Message:
                            </p>
                            <p className="text-gray-300">
                              {selectedRequest.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10 flex flex-wrap justify-end gap-3">
                    <button
                      onClick={closeProjectDetails}
                      className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-xl text-gray-300 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20 backdrop-blur-sm transition-all duration-200"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => {
                        handleRejectRequest(selectedRequest._id);
                        closeProjectDetails();
                      }}
                      disabled={processingId === selectedRequest._id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-red-300 bg-red-500/20 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 border border-red-500/30 backdrop-blur-sm transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="-ml-1 mr-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Decline Request
                    </button>

                    <button
                      onClick={() => {
                        handleAcceptRequest(selectedRequest._id);
                        closeProjectDetails();
                      }}
                      disabled={processingId === selectedRequest._id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-green-500/20 hover:bg-green-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500/50 border border-green-500/30 backdrop-blur-sm transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="-ml-1 mr-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Assign Editor
                    </button>
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

export default CreatorAssign;
