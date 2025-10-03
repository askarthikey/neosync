import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { apiEndpoints } from '../utils/api';

const ProjectChat = ({ project, currentUser, isCreator = false }) => {
  const { sendMessage, onMessage, offMessage, onTyping, offTyping, startTyping, stopTyping, isConnected, joinProject, leaveProject } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);

  const currentUserName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Anonymous';

  // Load chat messages from database (background loading)
  const loadMessagesInBackground = async (projectId) => {
    if (!projectId) return;
    
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      // Load only recent messages (last 30) for faster initial load
      const response = await fetch(apiEndpoints.chat.getMessages(projectId, 30, 0), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Only update if we don't have conflicting real-time messages
        setMessages(prevMessages => {
          const newMessages = data.messages || [];
          // Merge with existing real-time messages, avoiding duplicates
          const mergedMessages = [...newMessages];
          
          // Add any real-time messages that aren't in the loaded history
          prevMessages.forEach(msg => {
            if (!newMessages.some(newMsg => newMsg.id === msg.id)) {
              mergedMessages.push(msg);
            }
          });
          
          // Sort by timestamp
          return mergedMessages.sort((a, b) => 
            new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp)
          );
        });
      } else {
        console.error('Failed to load chat messages');
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initialize chat immediately when project changes
  useEffect(() => {
    if (project?._id) {
      // Mark chat as ready immediately
      setChatReady(true);
      // Load messages immediately without delay
      loadMessagesInBackground(project._id);
    } else {
      setChatReady(false);
    }
  }, [project?._id]);

  // Join project room when component mounts (immediate for real-time messaging)
  useEffect(() => {
    if (project?._id && isConnected) {
      joinProject(project._id);
      
      return () => {
        leaveProject(project._id);
      };
    }
  }, [project?._id, isConnected, joinProject, leaveProject]);

  // Set up message listeners
  useEffect(() => {
    const handleMessage = (messageData) => {
      // Check if message already exists to avoid duplicates
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === messageData.id);
        if (exists) return prev;
        return [...prev, messageData];
      });
    };

    const handleTyping = ({ userName, typing }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (typing) {
          newSet.add(userName);
        } else {
          newSet.delete(userName);
        }
        return newSet;
      });
    };

    onMessage(handleMessage);
    onTyping(handleTyping);

    return () => {
      offMessage(handleMessage);
      offTyping(handleTyping);
    };
  }, [onMessage, offMessage, onTyping, offTyping]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && project?._id && chatReady) {
      sendMessage(project._id, newMessage, currentUserName, 'text');
      setNewMessage('');
      handleStopTyping();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      startTyping(project._id, currentUserName);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(project._id, currentUserName);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const getMessageIcon = (messageType) => {
    switch (messageType) {
      case 'status-update':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'priority-update':
        return (
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getMessageStyles = (messageType) => {
    switch (messageType) {
      case 'status-update':
        return 'bg-blue-500/10 border-blue-400/30 text-blue-200';
      case 'priority-update':
        return 'bg-orange-500/10 border-orange-400/30 text-orange-200';
      default:
        return 'bg-white/10 border-white/20 text-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle both timestamp formats (created_at from DB and timestamp from socket)
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isSystemMessage = (messageType) => {
    return ['status-update', 'priority-update'].includes(messageType);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Project Chat
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-xs ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}
      >
        {/* Background loading indicator */}
        {isLoadingHistory && messages.length === 0 && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <div className="animate-spin h-3 w-3 border border-blue-400/50 border-t-blue-400 rounded-full"></div>
              <span className="text-blue-300 text-xs">Loading chat history...</span>
            </div>
          </div>
        )}
        
        {!isLoadingHistory && messages.length === 0 ? (
          <div className="text-center py-4">
            <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400 text-sm">Ready to chat! Send your first message.</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === currentUserName ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-xl backdrop-blur-sm border ${
                  msg.sender === currentUserName 
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-100' 
                    : getMessageStyles(msg.messageType)
                }`}>
                {/* System message styling */}
                {isSystemMessage(msg.messageType) ? (
                  <div className="flex items-center gap-2">
                    {getMessageIcon(msg.messageType)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        by {msg.sender} • {formatTime(msg.timestamp || msg.created_at)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {msg.sender !== currentUserName && (
                      <p className="text-xs font-medium opacity-70 mb-1">{msg.sender}</p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {formatTime(msg.timestamp || msg.created_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          </>
        )}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-500/20 border border-gray-400/30 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-300">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onBlur={handleStopTyping}
            placeholder={isConnected && chatReady ? "Type a message..." : isConnected ? "Chat loading..." : "Connecting..."}
            disabled={!isConnected || !chatReady}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || !chatReady}
            className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 hover:border-purple-500/50 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;