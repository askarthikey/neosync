import React, { createContext, useState, useEffect, useContext } from "react";
import { apiEndpoints } from '../utils/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(true);
  const [toasts, setToasts] = useState([]); // New state for toast notifications

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem("approvedProjects");
      const storedDismissed = localStorage.getItem("dismissedNotifications");
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
      if (storedDismissed) {
        setDismissedNotifications(JSON.parse(storedDismissed));
      }
    } catch (error) {
      console.error("Error loading notifications from storage:", error);
    }
    fetchNotifications();
  }, []);

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    toasts.forEach(toast => {
      if (!toast.dismissed) {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration || 5000);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        apiEndpoints.project.accessRequests.editor(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && Array.isArray(data.accessRequests)) {
        const approvedRequests = data.accessRequests.filter(
          (req) => req.status === "approved",
        );
        if (approvedRequests.length > 0) {
          addNotifications(approvedRequests);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const addNotifications = (newNotifications) => {
    if (!Array.isArray(newNotifications) || newNotifications.length === 0)
      return;
    setNotifications((prevNotifications) => {
      const existingIds = new Set(prevNotifications.map((n) => n._id));
      const mergedNotifications = [
        ...prevNotifications,
        ...newNotifications.filter((n) => !existingIds.has(n._id)),
      ];
      localStorage.setItem(
        "approvedProjects",
        JSON.stringify(mergedNotifications),
      );
      return mergedNotifications;
    });
  };

  const dismissNotification = (notificationId) => {
    setDismissedNotifications((prevDismissed) => {
      const updatedDismissed = [...prevDismissed, notificationId];
      localStorage.setItem(
        "dismissedNotifications",
        JSON.stringify(updatedDismissed),
      );
      return updatedDismissed;
    });
  };

  const getVisibleNotifications = () => {
    return notifications.filter(
      (notification) => !dismissedNotifications.includes(notification._id),
    );
  };

  // Toast notification functions
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      dismissed: false,
      timestamp: new Date()
    };
    
    setToasts(prevToasts => [...prevToasts, toast]);
    return id;
  };

  const dismissToast = (toastId) => {
    setToasts(prevToasts => 
      prevToasts.map(toast => 
        toast.id === toastId ? { ...toast, dismissed: true } : toast
      )
    );
    
    // Remove dismissed toasts after animation
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
    }, 300);
  };

  const getVisibleToasts = () => {
    return toasts.filter(toast => !toast.dismissed);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        dismissedNotifications,
        showNotificationPanel,
        toasts,
        addNotifications,
        dismissNotification,
        getVisibleNotifications,
        setShowNotificationPanel,
        fetchNotifications,
        showToast,
        dismissToast,
        getVisibleToasts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
