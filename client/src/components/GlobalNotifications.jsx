import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

function GlobalNotifications() {
  const navigate = useNavigate();
  const { 
    getVisibleNotifications, 
    dismissNotification, 
    showNotificationPanel,
    getVisibleToasts,
    dismissToast
  } = useNotifications();
  const [animatingOut, setAnimatingOut] = useState(new Set());
  
  // Get notifications and toasts
  const visibleNotifications = getVisibleNotifications();
  const visibleToasts = getVisibleToasts();
  
  // Don't render anything if no notifications/toasts
  if ((!showNotificationPanel || visibleNotifications.length === 0) && visibleToasts.length === 0) {
    return null;
  }

  const handleDismiss = (notificationId) => {
    setAnimatingOut(prev => new Set([...prev, notificationId]));
    
    // Delay the actual dismissal to allow animation
    setTimeout(() => {
      dismissNotification(notificationId);
      setAnimatingOut(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }, 300);
  };

  const handleToastDismiss = (toastId) => {
    setAnimatingOut(prev => new Set([...prev, `toast-${toastId}`]));
    
    setTimeout(() => {
      dismissToast(toastId);
      setAnimatingOut(prev => {
        const newSet = new Set(prev);
        newSet.delete(`toast-${toastId}`);
        return newSet;
      });
    }, 300);
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getToastColors = (type) => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-green-400 via-emerald-500 to-teal-500',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          button: 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
        };
      case 'error':
        return {
          gradient: 'from-red-400 via-rose-500 to-pink-500',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          button: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
        };
      case 'warning':
        return {
          gradient: 'from-yellow-400 via-orange-500 to-amber-500',
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          button: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30'
        };
      default:
        return {
          gradient: 'from-blue-400 via-cyan-500 to-indigo-500',
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          button: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
        };
    }
  };
  
  return (
    <div className="fixed top-20 right-6 max-w-sm z-40 space-y-4 pointer-events-none">
      {/* Toast Notifications */}
      {visibleToasts.map((toast) => {
        const colors = getToastColors(toast.type);
        return (
          <div 
            key={`toast-${toast.id}`} 
            className={`transform transition-all duration-300 ease-in-out pointer-events-auto ${
              animatingOut.has(`toast-${toast.id}`) 
                ? 'translate-x-full opacity-0 scale-95' 
                : 'translate-x-0 opacity-100 scale-100'
            }`}
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${colors.gradient}`}></div>
              
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center border ${colors.border}`}>
                      {getToastIcon(toast.type)}
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <p className="text-white text-sm leading-relaxed">{toast.message}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleToastDismiss(toast.id)}
                    className="ml-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-all duration-200"
                    aria-label="Dismiss"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Project Notifications */}
      {showNotificationPanel && visibleNotifications.map((notification) => (
        <div 
          key={notification._id} 
          className={`transform transition-all duration-300 ease-in-out pointer-events-auto ${
            animatingOut.has(notification._id) 
              ? 'translate-x-full opacity-0 scale-95' 
              : 'translate-x-0 opacity-100 scale-100'
          }`}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Success gradient header */}
            <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
            
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Access Granted! 🎉
                  </h3>
                  <div className="text-gray-300 mb-4">
                    <p>You've been approved to edit <span className="font-medium text-white">"{notification.projectTitle}"</span></p>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigate('/editor-dashboard');
                      handleDismiss(notification._id);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-300 rounded-xl border border-green-500/30 hover:bg-green-500/30 transition-all duration-200 backdrop-blur-sm text-sm font-medium group"
                  >
                    <span>View in dashboard</span>
                    <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <button 
                  onClick={() => handleDismiss(notification._id)}
                  className="ml-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
                  aria-label="Dismiss notification"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GlobalNotifications;