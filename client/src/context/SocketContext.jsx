import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  useEffect(() => {
    // Connect to socket when provider mounts
    const socket = socketService.connect();
    
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial connection state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socketService.disconnect();
    };
  }, []);

  const joinProject = (projectId) => {
    socketService.joinProject(projectId);
    setCurrentProjectId(projectId);
  };

  const leaveProject = (projectId) => {
    socketService.leaveProject(projectId);
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
    }
  };

  const value = {
    isConnected,
    currentProjectId,
    socketService,
    joinProject,
    leaveProject,
    sendMessage: socketService.sendMessage.bind(socketService),
    sendStatusUpdate: socketService.sendStatusUpdate.bind(socketService),
    sendPriorityUpdate: socketService.sendPriorityUpdate.bind(socketService),
    startTyping: socketService.startTyping.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
    onMessage: socketService.onMessage.bind(socketService),
    onProjectUpdate: socketService.onProjectUpdate.bind(socketService),
    onTyping: socketService.onTyping.bind(socketService),
    offMessage: socketService.offMessage.bind(socketService),
    offProjectUpdate: socketService.offProjectUpdate.bind(socketService),
    offTyping: socketService.offTyping.bind(socketService)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;