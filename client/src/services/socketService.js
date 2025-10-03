import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentProjectId = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:4000', {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentProjectId = null;
    }
  }

  joinProject(projectId) {
    if (this.socket && projectId) {
      // Leave current project if any
      if (this.currentProjectId) {
        this.leaveProject(this.currentProjectId);
      }
      
      this.currentProjectId = projectId;
      this.socket.emit('join-project', projectId);
      console.log(`Joined project room: ${projectId}`);
    }
  }

  leaveProject(projectId) {
    if (this.socket && projectId) {
      this.socket.emit('leave-project', projectId);
      if (this.currentProjectId === projectId) {
        this.currentProjectId = null;
      }
      console.log(`Left project room: ${projectId}`);
    }
  }

  sendMessage(projectId, message, sender, messageType = 'text') {
    if (this.socket && projectId && message.trim()) {
      const messageData = {
        projectId,
        message: message.trim(),
        sender,
        timestamp: new Date().toISOString(),
        messageType
      };
      
      this.socket.emit('send-message', messageData);
      return messageData;
    }
    return null;
  }

  sendStatusUpdate(projectId, oldStatus, newStatus, updatedBy) {
    if (this.socket && projectId) {
      this.socket.emit('project-update', {
        projectId,
        updateType: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
        updatedBy
      });

      // Also send as a chat message
      this.sendMessage(
        projectId, 
        `Status updated from "${oldStatus}" to "${newStatus}"`, 
        updatedBy, 
        'status-update'
      );
    }
  }

  sendPriorityUpdate(projectId, oldPriority, newPriority, updatedBy) {
    if (this.socket && projectId) {
      this.socket.emit('project-update', {
        projectId,
        updateType: 'priority',
        oldValue: oldPriority,
        newValue: newPriority,
        updatedBy
      });

      // Also send as a chat message
      this.sendMessage(
        projectId, 
        `Priority changed from "${oldPriority}" to "${newPriority}"`, 
        updatedBy, 
        'priority-update'
      );
    }
  }

  startTyping(projectId, userName) {
    if (this.socket && projectId && userName) {
      this.socket.emit('typing-start', { projectId, userName });
    }
  }

  stopTyping(projectId, userName) {
    if (this.socket && projectId && userName) {
      this.socket.emit('typing-stop', { projectId, userName });
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('receive-message', callback);
    }
  }

  onProjectUpdate(callback) {
    if (this.socket) {
      this.socket.on('project-updated', callback);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  offMessage(callback) {
    if (this.socket) {
      this.socket.off('receive-message', callback);
    }
  }

  offProjectUpdate(callback) {
    if (this.socket) {
      this.socket.off('project-updated', callback);
    }
  }

  offTyping(callback) {
    if (this.socket) {
      this.socket.off('user-typing', callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;