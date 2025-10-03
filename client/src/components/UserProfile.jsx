import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTubeAuth from "./YouTubeAuth";
import { apiEndpoints } from '../utils/api';
function UserProfile() {
  const [user, setUser] = useState(null);
  const [createdProjects, setCreatedProjects] = useState([]);
  const [editedProjects, setEditedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("created");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    bio: "",
    location: "",
    skills: [],
    profileImage: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const fileInputRef = useRef(null);
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    fetchUserData();
  }, [username, navigate]);
  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const profileResponse = await fetch(
        apiEndpoints.user.getByUsername(username || currentUser.username),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await profileResponse.json();
      setUser(userData.user);
      const createdProjectsResponse = await fetch(
        apiEndpoints.project.creatorProjects(userData.user.username),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (createdProjectsResponse.ok) {
        const createdProjectsData = await createdProjectsResponse.json();
        setCreatedProjects(createdProjectsData.projects || []);
      }
      const editedProjectsResponse = await fetch(
        apiEndpoints.project.editorProjectsByEmail(userData.user.email),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (editedProjectsResponse.ok) {
        const editedProjectsData = await editedProjectsResponse.json();
        setEditedProjects(editedProjectsData.projects || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load user profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };
  const openEditModal = () => {
    setEditFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      bio: user.bio || "",
      location: user.location || "",
      skills: user.skills || [],
      profileImage: user.profileImage || "",
    });
    setIsEditModalOpen(true);
  };
  const handleAddSkill = () => {
    if (newSkill.trim() && !editFormData.skills.includes(newSkill.trim())) {
      setEditFormData({
        ...editFormData,
        skills: [...editFormData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };
  const handleRemoveSkill = (skillToRemove) => {
    setEditFormData({
      ...editFormData,
      skills: editFormData.skills.filter((skill) => skill !== skillToRemove),
    });
  };
  const compressImage = (imageDataURL, maxWidth = 300) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageDataURL;
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result);

          setEditFormData({
            ...editFormData,
            profileImage: compressedImage,
          });
        } catch (error) {
          console.error("Error compressing image:", error);
          setUpdateMessage({
            type: "error",
            text: "Could not process the image. Please try a smaller image.",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUpdateMessage(null);
    try {
      const token = localStorage.getItem("token");
      const dataToSubmit = { ...editFormData };
      const response = await fetch(
        apiEndpoints.user.update(user.username),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSubmit),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setUpdateMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
        const updatedUser = {
          ...user,
          ...editFormData,
        };
        setUser(updatedUser);
        if (currentUser.username === user.username) {
          const localStorageUser = {
            ...currentUser,
            fullName: editFormData.fullName,
            bio: editFormData.bio,
            location: editFormData.location,
            skills: editFormData.skills,
            profileImage: editFormData.profileImage,
          };
          try {
            localStorage.setItem("user", JSON.stringify(localStorageUser));
          } catch (storageError) {
            console.error("LocalStorage quota exceeded:", storageError);
            localStorageUser.profileImage = null;
            localStorageUser.hasProfileImage = true;
            localStorage.setItem("user", JSON.stringify(localStorageUser));
          }
        }
        setTimeout(() => {
          fetchUserData();
        }, 500);

        // Close the modal after a delay
        setTimeout(() => {
          setIsEditModalOpen(false);
          setUpdateMessage(null);
        }, 2000);
      } else {
        setUpdateMessage({
          type: "error",
          text: data.message || "Failed to update profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateMessage({
        type: "error",
        text: "An error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const stats = {
    createdCount: createdProjects.length,
    editedCount: editedProjects.length,
    createdAssigned: createdProjects.filter(
      (p) => p.editorEmail && p.editorEmail.trim() !== "",
    ).length,
    createdCompleted: createdProjects.filter(
      (p) => p.status === "Completed" || p.status === "Closed",
    ).length,
    createdPending: createdProjects.filter(
      (p) =>
        p.editorEmail &&
        p.editorEmail.trim() !== "" &&
        p.status !== "Completed" &&
        p.status !== "Closed",
    ).length,
    editedCompleted: editedProjects.filter(
      (p) => p.status === "Completed" || p.status === "Closed",
    ).length,
    editedInProgress: editedProjects.filter(
      (p) =>
        p.status !== "Completed" &&
        p.status !== "Closed" &&
        (p.status === "In Progress" ||
          p.status.includes("Just started") ||
          p.status.includes("Good progress") ||
          p.status.includes("Almost there")),
    ).length,
    editedInReview: editedProjects.filter(
      (p) => p.status === "Completed" && !p.status.includes("Closed"),
    ).length,
    totalCompletedUnique: [...createdProjects, ...editedProjects]
      .filter((p) => p.status === "Completed" || p.status === "Closed")
      .filter(
        (project, index, self) =>
          index === self.findIndex((p) => p._id === project._id),
      ).length,
    daysAsMember: user?.createdAt
      ? Math.ceil(
          (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24),
        )
      : 0,
  };

  const renderCreatedProjects = () => {
    if (createdProjects.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {createdProjects.map((project) => (
            <div
              key={project._id}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden hover:scale-105 transition-all duration-300 group"
            >
              <div className="h-36 bg-gradient-to-br from-gray-800/50 to-gray-900/50 relative overflow-hidden">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-500 group-hover:text-gray-400 transition-colors duration-300"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium backdrop-blur-sm border ${
                    project.status === "Assigned" || project.status === "Completed"
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  }`}>
                    {project.status || "Unassigned"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {project.createdAt ? formatDate(project.createdAt) : "No date"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-center py-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <svg
              className="mx-auto h-16 w-16 text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">
              No projects created
            </h3>
            <p className="text-gray-400 mb-6">
              {currentUser.username === user.username
                ? "You haven't created any projects yet."
                : "This user hasn't created any projects yet."}
            </p>
            {currentUser.username === user.username && user.userType === "contentCreator" && (
              <button
                onClick={() => navigate("/creator-projects")}
                className="inline-flex items-center px-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-all duration-300 backdrop-blur-sm font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create a Project
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  const renderEditedProjects = () => {
    if (editedProjects.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {editedProjects.map((project) => (
            <div
              key={project._id}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden hover:scale-105 transition-all duration-300 group"
            >
              <div className="h-36 bg-gradient-to-br from-gray-800/50 to-gray-900/50 relative overflow-hidden">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-500 group-hover:text-gray-400 transition-colors duration-300"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Created by:</span>
                    <span className="text-sm font-medium text-white">
                      {project.userCreated || "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {project.assignedAt ? formatDate(project.assignedAt) : "No date"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-center py-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <svg
              className="mx-auto h-16 w-16 text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">
              No projects edited
            </h3>
            <p className="text-gray-400 mb-6">
              {currentUser.username === user.username
                ? "You haven't edited any projects yet."
                : "This user hasn't edited any projects yet."}
            </p>
            {currentUser.username === user.username && user.userType === "editor" && (
              <button
                onClick={() => navigate("/editor-discover")}
                className="inline-flex items-center px-6 py-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-all duration-300 backdrop-blur-sm font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
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
                Discover Projects
              </button>
            )}
          </div>
        </div>
      );
    }
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
                <p className="mt-6 text-gray-300 text-lg font-medium animate-pulse-glow">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (error || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
          <p className="font-medium">Error</p>
          <p>{error || "User not found"}</p>
        </div>
      </div>
    );
  }
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
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 relative overflow-hidden">
        {/* Floating particles background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-cyan-400/50 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
          <div className="absolute bottom-20 right-10 w-1 h-1 bg-yellow-400/40 rounded-full animate-float" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-3/4 left-20 w-2 h-2 bg-green-400/30 rounded-full animate-float" style={{animationDelay: '5s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          {/* Profile Header Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-8">
            {/* Cover Background */}
            <div className="h-48 bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-cyan-600/80 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {/* Profile Image */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl border-4 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName || user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {(user.fullName || user.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white/30 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse-glow"></div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">{user.fullName || user.username}</h1>
                    <p className="text-gray-300 text-lg mb-3">@{user.username}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium border border-white/30">
                        {user.userType === 'contentCreator' ? '🎬 Content Creator' : 
                         user.userType === 'editor' ? '✂️ Video Editor' : '👤 User'}
                      </span>
                      
                      {user.location && (
                        <span className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-gray-300 text-sm border border-white/20 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {user.location}
                        </span>
                      )}
                      
                      <span className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-gray-300 text-sm border border-white/20 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(user.createdAt) ? `Joined ${formatDate(user.createdAt)}` : 'Member'}
                      </span>
                    </div>

                    {/* Skills */}
                    {user.skills && user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30 backdrop-blur-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  {currentUser && currentUser.username === user.username && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={openEditModal}
                        className="px-6 py-3 bg-white/20 text-white rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm text-sm font-medium flex items-center gap-2 group"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="p-8 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  About
                </h3>
                <p className="text-gray-300 leading-relaxed">{user.bio}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Stats and Info */}
            <div className="space-y-6">
              {/* Statistics Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {user.userType === 'contentCreator' ? 'Creator Stats' : 
                   user.userType === 'editor' ? 'Editor Stats' : 'Profile Stats'}
                </h2>
                
                {user.userType === "contentCreator" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-purple-300 mb-1">{stats.createdCount}</p>
                      <p className="text-purple-200 text-sm">Projects Created</p>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-green-300 mb-1">{stats.createdAssigned}</p>
                      <p className="text-green-200 text-sm">Assigned</p>
                    </div>
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-blue-300 mb-1">{stats.createdCompleted}</p>
                      <p className="text-blue-200 text-sm">Completed</p>
                    </div>
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-yellow-300 mb-1">{stats.createdPending}</p>
                      <p className="text-yellow-200 text-sm">In Progress</p>
                    </div>
                  </div>
                ) : user.userType === "editor" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-500/20 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-indigo-300 mb-1">{stats.editedCount}</p>
                      <p className="text-indigo-200 text-sm">Projects Edited</p>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-green-300 mb-1">{stats.editedCompleted}</p>
                      <p className="text-green-200 text-sm">Completed</p>
                    </div>
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-blue-300 mb-1">{stats.editedInProgress}</p>
                      <p className="text-blue-200 text-sm">In Progress</p>
                    </div>
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-yellow-300 mb-1">{stats.editedInReview}</p>
                      <p className="text-yellow-200 text-sm">In Review</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-purple-300 mb-1">{stats.createdCount}</p>
                      <p className="text-purple-200 text-sm">Created</p>
                    </div>
                    <div className="bg-indigo-500/20 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-indigo-300 mb-1">{stats.editedCount}</p>
                      <p className="text-indigo-200 text-sm">Edited</p>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-green-300 mb-1">{stats.totalCompletedUnique}</p>
                      <p className="text-green-200 text-sm">Completed</p>
                    </div>
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 text-center group hover:scale-105 transition-transform duration-300">
                      <p className="text-3xl font-bold text-blue-300 mb-1">{stats.daysAsMember}</p>
                      <p className="text-blue-200 text-sm">Days Active</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300 text-sm">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-300 text-sm capitalize">{user.userType || "User"}</span>
                  </div>
                </div>
              </div>

              {/* YouTube Integration - Only for current user */}
              {currentUser && currentUser.username === user.username && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube Integration
                    </h3>
                    <YouTubeAuth user={user} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Content - Projects */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Tab Navigation */}
                {user.userType !== "contentCreator" && user.userType !== "editor" ? (
                  <div className="border-b border-white/10">
                    <nav className="flex">
                      <button
                        onClick={() => setActiveTab("created")}
                        className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-300 ${
                          activeTab === "created"
                            ? "bg-white/10 text-white border-b-2 border-blue-400"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Projects Created ({stats.createdCount})
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab("edited")}
                        className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-300 ${
                          activeTab === "edited"
                            ? "bg-white/10 text-white border-b-2 border-purple-400"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Projects Edited ({stats.editedCount})
                        </div>
                      </button>
                    </nav>
                  </div>
                ) : (
                  <div className="border-b border-white/10 bg-white/5">
                    <div className="py-4 px-6 text-center">
                      <h2 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
                        {user.userType === "contentCreator" ? (
                          <>
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Created Projects ({stats.createdCount})
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edited Projects ({stats.editedCount})
                          </>
                        )}
                      </h2>
                    </div>
                  </div>
                )}

                {/* Projects Content */}
                <div className="p-6">
                  {(() => {
                    if (user.userType === "contentCreator") {
                      return renderCreatedProjects();
                    } else if (user.userType === "editor") {
                      return renderEditedProjects();
                    } else {
                      return activeTab === "created" ? renderCreatedProjects() : renderEditedProjects();
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden border border-white/20">
            <div className="relative">
              {/* Header with gradient overlay */}
              <div className="h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    Edit Profile
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Form Content */}
              <form onSubmit={handleSubmitProfile}>
                <div className="px-6 py-4 max-h-[calc(95vh-200px)] overflow-y-auto bg-white/5 backdrop-blur-sm">
                {updateMessage && (
                  <div
                    className={`mb-4 p-3 rounded-xl backdrop-blur-sm border ${
                      updateMessage.type === "success"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/30"
                    }`}
                  >
                    {updateMessage.text}
                  </div>
                )}
                <div className="mb-6 flex flex-col items-center">
                  <div
                    className="h-24 w-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3 overflow-hidden cursor-pointer hover:bg-white/15 transition-all duration-200"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {editFormData.profileImage ? (
                      <img
                        src={editFormData.profileImage}
                        alt={editFormData.fullName || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {(editFormData.fullName || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-sm text-white/70 hover:text-white font-medium transition-all duration-200"
                  >
                    Change profile picture
                  </button>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-gray-400 cursor-not-allowed backdrop-blur-sm"
                    readOnly
                  />
                  <p className="mt-2 text-xs text-gray-400 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 inline-block border border-white/20">
                    Email cannot be changed
                  </p>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="bio"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editFormData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
                    placeholder="Tell others a bit about yourself..."
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="location"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={editFormData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="City, Country"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-white mb-2">
                    Skills
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-l-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Add a skill"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-r-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200 backdrop-blur-sm font-medium border-l-0"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editFormData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-white/70 hover:text-white text-sm font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-white/5 backdrop-blur-sm border-t border-white/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 bg-gray-500/20 text-gray-300 rounded-xl border border-gray-500/30 hover:bg-gray-500/30 transition-all duration-200 backdrop-blur-sm text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isSubmitting
                      ? "bg-gray-500/20 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-500/30"
                      : "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 backdrop-blur-sm"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default UserProfile;
