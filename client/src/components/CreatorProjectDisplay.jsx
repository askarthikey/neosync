import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreatorProjectDisplay() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [statsData, setStatsData] = useState({
    total: 0,
    draft: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  
  // Animation state variables
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [editFormData, setEditFormData] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    projectId: null,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [closingProject, setClosingProject] = useState(false);
  const [, setCloseError] = useState(null);
  const [videoResponses, setVideoResponses] = useState([]);
  const [, setActiveVideoResponse] = useState(0);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Add these state variables in your CreatorProjectDisplay function
  const [reviews, setReviews] = useState([]);

  // Keep the existing rating variables, but rename for clarity
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingData, setRatingData] = useState({
    rating: 5,
    comments: '',
    projectId: null,
    editorEmail: null
  });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  // Add these state variables
  const [editCommentModalOpen, setEditCommentModalOpen] = useState(false);
  const [editCommentData, setEditCommentData] = useState({
    reviewId: null,
    comment: '' // Ensure comment is initialized with empty string
  });
  const [editingComment, setEditingComment] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);

  // Add this function with your other functions
  const fetchVideoResponses = async (projectId) => {
    setLoadingResponses(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/projectApi/project-responses/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch video responses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVideoResponses(data.responses || []);
        setActiveVideoResponse(data.responses && data.responses.length > 0 ? 0 : -1);
      } else {
        setVideoResponses([]);
      }
    } catch (err) {
      console.error('Error fetching video responses:', err);
      setVideoResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  // Add this function to fetch project reviews
  const fetchProjectReviews = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/projectApi/project-reviews/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project reviews');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching project reviews:', err);
      setReviews([]);
    }
  };

  // Function to handle opening the edit comment modal
  const handleOpenEditComment = (review) => {
    if (!review) return; // Guard clause if review is undefined
    
    setEditCommentData({
      reviewId: review._id || null,
      comment: review.comment || '' // Provide a fallback when comment is undefined
    });
    setEditCommentModalOpen(true);
  };

  // Function to handle updating a comment
  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (editingComment) return;
    
    setEditingComment(true);
    setReviewError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/projectApi/update-review/${editCommentData.reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment: editCommentData?.comment || '' // Added fallback
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update comment");
      }
      
      // Close the edit modal
      setEditCommentModalOpen(false);
      
      // Reset the form
      setEditCommentData({
        reviewId: null,
        comment: ''
      });
      
      // Refresh reviews for this project
      fetchProjectReviews(selectedProject._id);
      
    } catch (error) {
      console.error("Error updating comment:", error);
      setReviewError(error.message || "An error occurred while updating your comment");
    } finally {
      setEditingComment(false);
    }
  };

  // Function to open delete confirmation
  const handleConfirmDelete = (reviewId) => {
    setCommentToDelete(reviewId);
    setDeleteConfirmOpen(true);
  };

  // Function to delete a comment
  const handleDeleteComment = async () => {
    if (deletingComment || !commentToDelete) return;
    
    setDeletingComment(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/projectApi/delete-review/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }
      
      // Close the confirmation dialog
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
      
      // Refresh reviews for this project
      fetchProjectReviews(selectedProject._id);
      
    } catch (error) {
      console.error("Error deleting comment:", error);
      // Could add error handling UI here
    } finally {
      setDeletingComment(false);
    }
  };

  // Handle input changes in edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Handle form submission for project update
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    setUpdateLoading(true);
    setUpdateError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Process tags from comma-separated string to array
      const tagsArray = editFormData.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Prepare data for API
      const updatedData = {
        ...editFormData,
        tags: tagsArray
      };
      
      // Get the project ID
      const projectId = selectedProject ? selectedProject._id : projects.find(p => p.title === editFormData.title)?._id;
      
      if (!projectId) {
        throw new Error("Could not determine project ID");
      }
      
      const response = await fetch(`http://localhost:4000/projectApi/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update project");
      }
      
      // Close the edit modal
      setEditModalOpen(false);
      
      // Refresh projects list
      if (user) {
        fetchProjects(user.username);
      }
      
    } catch (error) {
      console.error("Error updating project:", error);
      setUpdateError(error.message || "An error occurred while updating the project");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Function to open the review modal
  const handleOpenReviewModal = () => {
    setReviewData({
      projectId: selectedProject._id,
      comment: ''
    });
    setReviewModalOpen(true);
  };

  // Rename the existing handleSubmitReview to handleSubmitRating
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (ratingSubmitting) return;
    
    setRatingSubmitting(true);
    setRatingError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/reviewApi/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: ratingData.projectId,
          editorEmail: ratingData.editorEmail,
          rating: ratingData.rating,
          comments: ratingData.comments,
          creatorUsername: user.username,
          closeProject: false // Don't close the project automatically
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }
      
      // Close the rating modal but keep project details open
      setRatingModalOpen(false);
      
      // Mark the project as rated in the UI
      if (selectedProject && selectedProject._id === ratingData.projectId) {
        setSelectedProject({
          ...selectedProject,
          hasRated: true
        });
      }
      
      // Refresh projects data with a slight delay
      setTimeout(() => {
        if (user) {
          fetchProjects(user.username);
        }
      }, 300);
      
    } catch (error) {
      console.error("Error submitting rating:", error);
      setRatingError(error.message || "An error occurred while submitting your rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Function to submit a review comment
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (submittingReview) return;
    
    setSubmittingReview(true);
    setReviewError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/projectApi/add-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: reviewData.projectId,
          comment: reviewData.comment,
          creatorUsername: user.username
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }
      
      // Close the review modal
      setReviewModalOpen(false);
      
      // Reset the form
      setReviewData({
        projectId: null,
        comment: ''
      });
      
      // Refresh reviews for this project
      fetchProjectReviews(selectedProject._id);
      
    } catch (error) {
      console.error("Error submitting comment:", error);
      setReviewError(error.message || "An error occurred while submitting your comment");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Function to open the rating modal
  const handleOpenRatingModal = (projectId, editorEmail) => {
    setRatingData({
      rating: 5,
      comments: '',
      projectId: projectId,
      editorEmail: editorEmail
    });
    setRatingModalOpen(true);
  };

  // Handle closing a project without rating
  const handleCloseProject = async (projectId) => {
    if (closingProject) return;

    setClosingProject(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:4000/projectApi/close-project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to close project");
      }

      // Update the selectedProject status to 'Closed' and mark as closed in the projects list
      setSelectedProject(prev =>
        prev && prev._id === projectId
          ? { ...prev, status: 'Closed' }
          : prev
      );
      setProjects(prev =>
        prev.map(p =>
          p._id === projectId ? { ...p, status: 'Closed' } : p
        )
      );

    } catch (error) {
      console.error("Error closing project:", error);
      setCloseError(error.message || "An error occurred while closing the project");
    } finally {
      setClosingProject(false);
    }
  };

  // Load user data and fetch projects
  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchProjects(parsedUser.username);
    } else {
      navigate('/signin');
    }
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [navigate]);

  // Fetch projects from API
  const fetchProjects = async (username) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/projectApi/user-projects?username=${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      
      // Process projects data
      const processedProjects = data.projects.map(async project => {
        // Calculate days remaining until deadline
        const deadlineDate = new Date(project.deadline);
        const currentDate = new Date();
        const timeDiff = deadlineDate - currentDate;
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // Calculate if project is overdue
        const isOverdue = daysRemaining < 0 && project.status !== 'Completed';
        
        // Extract completion percentage from status if available
        let completionPercentage = 0;
        if (project.status.includes('%')) {
          // Extract percentage from status string (e.g. "In Progress - 65%")
          const percentageMatch = project.status.match(/(\d+)%/);
          if (percentageMatch && percentageMatch[1]) {
            completionPercentage = parseInt(percentageMatch[1], 10);
          }
        } else if (project.status === 'Completed' || project.status === 'Closed') {
          completionPercentage = 100;
        } else if (project.status === 'Draft') {
          completionPercentage = 0;
        }

        // Determine project priority based on deadline and status
        let priority = 'medium';
        if (isOverdue) {
          priority = 'high';
        } else if (daysRemaining <= 10 && project.status !== 'Completed') {
          priority = 'high';
        } else if (daysRemaining <= 30 && project.status !== 'Completed') {
          priority = 'medium';
        } else {
          priority = 'low';
        }
        
        // Get editor name from email if name is not available
        const editorName = project.editorName || (project.editorEmail ? project.editorEmail.split('@')[0] : 'Not assigned');

        // Get editor rating if available
        if (project.editorEmail) {
          try {
            const editorDataResponse = await fetch(`http://localhost:4000/userApi/user-by-email?email=${encodeURIComponent(project.editorEmail)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (editorDataResponse.ok) {
              const editorData = await editorDataResponse.json();
              if (editorData.user) {
                project.editorRating = editorData.user.rating;
                project.editorTotalReviews = editorData.user.totalReviews;
              }
            }
          } catch (err) {
            console.error('Error fetching editor data:', err);
          }
        }

        // Check if the project has been rated
        try {
          if ((project.status === 'Completed' || project.status === 'Closed') && username) {
            const reviewResponse = await fetch(`http://localhost:4000/reviewApi/check-review?projectId=${project._id}&creatorUsername=${username}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              project.hasRated = reviewData.hasReview;
            }
          }
        } catch (err) {
          console.error('Error checking review status:', err);
          project.hasRated = false;
        }

        return {
          ...project,
          daysRemaining,
          isOverdue,
          completionPercentage,
          priority,
          editorName
        };
      });

      const resolvedProjects = await Promise.all(processedProjects);

      // Sort projects by priority (high to low) and then by deadline (closest first)
      resolvedProjects.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.daysRemaining - b.daysRemaining;
      });

      setProjects(resolvedProjects);
      
      // Calculate stats
      const stats = {
        total: resolvedProjects.length,
        draft: resolvedProjects.filter(p => p.status === 'Draft').length,
        inProgress: resolvedProjects.filter(p => 
          p.status.includes('In Progress') || 
          p.status.includes('Just started') ||
          p.status.includes('Good progress') ||
          p.status.includes('Almost there')
        ).length,
        completed: resolvedProjects.filter(p => p.status === 'Completed').length,
        closed: resolvedProjects.filter(p => p.status === 'Closed').length,
        overdue: resolvedProjects.filter(p => p.isOverdue && p.status !== 'Completed' && p.status !== 'Closed').length,
        unassigned: resolvedProjects.filter(p => !p.editorEmail && p.status === 'Draft').length
      };

      setStatsData(stats);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again later.');
      setIsLoading(false);
    }
  };

  // Filter projects based on active filter and search query
  const filteredProjects = projects.filter(project => {
    // Filter by status
    if (activeFilter === 'draft' && project.status !== 'Draft') return false;
    if (activeFilter === 'in-progress' && !project.status.includes('In Progress')) return false;
    if (activeFilter === 'completed' && project.status !== 'Completed') return false;
    if (activeFilter === 'closed' && project.status !== 'Closed') return false;
    if (activeFilter === 'overdue' && !project.isOverdue) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title.toLowerCase().includes(query);
      const matchesDescription = project.description.toLowerCase().includes(query);
      const matchesTags = project.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesEditor = project.editorName?.toLowerCase().includes(query) || 
                            project.editorEmail?.toLowerCase().includes(query);
      
      return matchesTitle || matchesDescription || matchesTags || matchesEditor;
    }
    
    return true;
  });

  // Format date to readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge styling based on status
  const getStatusStyles = (status) => {
    if (status === 'Draft') {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    } else if (status.includes('In Progress')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    } else if (status === 'Completed') {
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    } else if (status === "Closed"){
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Get priority badge styling
  const getPriorityStyles = (priority) => {
    if (priority === 'high') {
      return 'text-red-400';
    } else if (priority === 'medium') {
      return 'text-orange-400';
    }
    return 'text-green-400';
  };

  // Get deadline styling
  const getDeadlineStyles = (daysRemaining, status) => {
    if (status === 'Completed') {
      return 'text-green-400';
    } else if (daysRemaining < 0) {
      return 'text-red-400 font-medium';
    } else if (daysRemaining <= 3) {
      return 'text-orange-400 font-medium';
    }
    return 'text-gray-300';
  };

  // Handle project click to show details
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    
    // Fetch video responses and reviews when opening a project
    if (project._id) {
      if (project.status === 'Completed' || project.status === 'Closed' || project.status.includes('In Progress')) {
        fetchVideoResponses(project._id);
      } else {
        setVideoResponses([]);
      }
      if(project.status !== 'Draft' || project.status !== 'Unassigned')
        fetchProjectReviews(project._id);
    }
  };

  // Handle project edit
  const handleEditProject = (projectId) => {
    // Find the project to edit
    const projectToEdit = projects.find(p => p._id === projectId);
    
    if (!projectToEdit) {
      console.error('Project not found:', projectId);
      return;
    }
    
    // Set up the form data with current project values
    setEditFormData({
      _id: projectToEdit._id,
      title: projectToEdit.title,
      description: projectToEdit.description,
      status: projectToEdit.status,
      editorEmail: projectToEdit.editorEmail || '',
      deadline: new Date(projectToEdit.deadline).toISOString().split('T')[0],
      tags: projectToEdit.tags.join(', '),
      completionPercentage: projectToEdit.completionPercentage
    });
    
    // Open the edit modal
    setEditModalOpen(true);
  };

  // Handle contacting editor via email
  const handleContactEditor = (editorEmail, projectTitle) => {
    // Check if editor email is available
    if (!editorEmail) {
      alert('No editor assigned to this project yet.');
      return;
    }
    
    // Create email subject and body
    const subject = encodeURIComponent(`Regarding Project: ${projectTitle}`);
    const body = encodeURIComponent(`Hello,\n\nI'm contacting you regarding the project "${projectTitle}" that you're editing.\n\nBest regards,\n${user?.fullName || user?.username}`);
    
    // Open email client
    window.location.href = `mailto:${editorEmail}?subject=${subject}&body=${body}`;
  };

  // Create a new project
  const handleCreateProject = () => {
    navigate('/creator-projects');
  };

  // Close project details modal
  const closeProjectDetails = () => {
    setSelectedProject(null);
  };

  // Render loading state
  // Render loading state
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
                <p className="mt-6 text-gray-300 text-lg font-medium animate-pulse-glow">Loading your projects...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render error state
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
                <h3 className="text-xl font-bold text-red-300 mb-2">Error Loading Projects</h3>
                <p className="text-gray-300 mb-6">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchProjects(user.username)}
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
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(147, 51, 234, 0.2);
          }
          50% { 
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(147, 51, 234, 0.3);
          }
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
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .hover-lift:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .project-card {
          backdrop-filter: blur(16px);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .project-card:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.2);
          transform: translateY(-5px);
        }
        
        .filter-button {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .filter-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        .filter-button.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3));
          border: 1px solid rgba(59, 130, 246, 0.5);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          {/* Header with stats */}
          <div className={`bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl mb-8 hover:bg-white/8 transition-all duration-300 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  My Projects
                </h1>
                <p className="text-gray-300 text-lg">Manage and track all your content projects</p>
              </div>
              <button
                onClick={handleCreateProject}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>New Project</span>
              </button>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl font-bold text-white">{statsData.total}</div>
                <div className="text-sm text-gray-300">Total</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl font-bold text-orange-400">{statsData.total - statsData.closed - statsData.completed - statsData.inProgress - statsData.overdue - statsData.draft}</div>
                <div className="text-sm text-gray-300">Unassigned</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl font-bold text-blue-400">{statsData.inProgress}</div>
                <div className="text-sm text-gray-300">In Progress</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl font-bold text-green-400">{statsData.completed}</div>
                <div className="text-sm text-gray-300">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl font-bold text-gray-400">{statsData.closed}</div>
                <div className="text-sm text-gray-300">Closed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl font-bold text-red-400">{statsData.overdue}</div>
                <div className="text-sm text-gray-300">Overdue</div>
              </div>
            </div>
          </div>

          {/* Search and filters */}
          <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl mb-8 ${isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-6">
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', color: 'from-gray-500 to-gray-600' },
                  { key: 'draft', label: 'Draft', color: 'from-yellow-500 to-orange-500' },
                  { key: 'in-progress', label: 'In Progress', color: 'from-blue-500 to-blue-600' },
                  { key: 'completed', label: 'Completed', color: 'from-green-500 to-green-600' },
                  { key: 'closed', label: 'Closed', color: 'from-gray-500 to-gray-600' },
                  { key: 'overdue', label: 'Overdue', color: 'from-red-500 to-red-600' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`filter-button px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeFilter === filter.key
                        ? `active text-white bg-gradient-to-r ${filter.color}`
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full lg:w-80">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-16zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isVisible ? 'animate-slideInRight' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
              {filteredProjects.map((project, index) => (
                <div 
                  key={project._id} 
                  className="project-card rounded-2xl overflow-hidden hover-lift cursor-pointer group"
                  onClick={() => handleProjectClick(project)}
                  style={{animationDelay: `${0.1 * index}s`}}
                >
                  {/* Thumbnail with magical overlay */}
                  <div className="relative h-48 overflow-hidden">
                    {project.thumbnailUrl ? (
                      <img 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Magic gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Status and Priority badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-sm border ${getStatusStyles(project.status)} shadow-lg`}>
                        {project.status}
                      </span>
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-sm bg-white/10 border border-white/20 text-white ${getPriorityStyles(project.priority)} shadow-lg`}>
                        {project.priority === 'high' ? '🔥 High' : 
                         project.priority === 'medium' ? '⚡ Medium' : '💎 Low'}
                      </span>
                    </div>
                    
                    {/* Magical progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          project.completionPercentage === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                          project.completionPercentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' : 
                          project.completionPercentage >= 30 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                          'bg-gradient-to-r from-red-400 to-pink-500'
                        } animate-pulse-glow`} 
                        style={{ width: `${project.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Content section */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">{project.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">{project.description}</p>
                    
                    {/* Project details grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="space-y-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Editor</p>
                        <p className="font-medium text-white truncate">
                          {project.editorName || (project.editorEmail ? project.editorEmail.split('@')[0] : '🔍 Not assigned')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Deadline</p>
                        <p className={`font-medium ${getDeadlineStyles(project.daysRemaining, project.status)}`}>
                          {formatDate(project.deadline)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Magical tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-gray-300 border border-white/20 backdrop-blur-sm">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    {/* Completion indicator */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
                        <span className="text-xs text-gray-400">{project.completionPercentage}% Complete</span>
                      </div>
                      {project.daysRemaining > 0 ? (
                        <span className="text-xs text-green-400 font-medium">
                          {project.daysRemaining} days left
                        </span>
                      ) : project.daysRemaining === 0 ? (
                        <span className="text-xs text-yellow-400 font-medium">Due today!</span>
                      ) : (
                        <span className="text-xs text-red-400 font-medium">
                          {Math.abs(project.daysRemaining)} days overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty state with magical styling
            <div className={`bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl text-center ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.6s'}}>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-300 mb-2">No Projects Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? 
                  `No projects match "${searchQuery}". Try adjusting your search or filter.` : 
                  `You haven't created any projects yet. Create your first project to get started!`
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateProject}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Create Your First Project
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CreatorProjectDisplay;