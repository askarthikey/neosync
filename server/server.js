const exp = require("express");
const mongoClient = require("mongodb").MongoClient;
const path = require("path");
const { uploadMiddleware } = require("./middlewares/fileUpload");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = exp();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Use environment variable
    methods: ["GET", "POST"]
  },
  // Performance optimizations
  transports: ['websocket', 'polling'], // Prefer WebSocket over polling
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB buffer
  // Compression for better performance
  compression: true,
  // Connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

const cors = require("cors");

app.use(cors());
app.use(exp.json());
app.use(uploadMiddleware);

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join a project room for real-time communication
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  // Leave a project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    const { projectId, message, sender, timestamp, messageType } = data;
    
    // Generate message data immediately
    const messageData = {
      project_id: projectId,
      message: message,
      sender: sender,
      message_type: messageType || 'text',
      created_at: new Date(timestamp || Date.now()),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Broadcast immediately for instant UX
    io.to(`project-${projectId}`).emit('receive-message', {
      ...messageData,
      socketId: socket.id
    });

    // Save to database asynchronously without blocking
    setImmediate(async () => {
      try {
        // Use existing connection pool from the main app
        const neosync = app.get('neosync');
        if (neosync) {
          const collection = neosync.collection('chat_messages');
          await collection.insertOne(messageData);
        }
      } catch (error) {
        console.error('Background message save error:', error);
        // Message was already broadcasted, so user experience isn't affected
      }
    });
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { projectId, userName } = data;
    socket.to(`project-${projectId}`).emit('user-typing', { userName, typing: true });
  });

  socket.on('typing-stop', (data) => {
    const { projectId, userName } = data;
    socket.to(`project-${projectId}`).emit('user-typing', { userName, typing: false });
  });

  // Handle status/priority updates
  socket.on('project-update', (data) => {
    const { projectId, updateType, oldValue, newValue, updatedBy } = data;
    
    io.to(`project-${projectId}`).emit('project-updated', {
      projectId,
      updateType, // 'status', 'priority', etc.
      oldValue,
      newValue,
      updatedBy,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    // Silent disconnect - reduce logging overhead
  });
});

// Make io available to routes
app.set('io', io);

mongoClient
  .connect(process.env.DB_URL)
  .then(async (client) => {
    const neosync = client.db("neosync");
    const usersCollection = neosync.collection("usersCollection");
    
    // Create indexes for chat performance
    const chatCollection = neosync.collection("chat_messages");
    try {
      // Index on project_id for faster chat queries
      await chatCollection.createIndex({ project_id: 1 });
      // Compound index for project_id and timestamp for efficient sorting
      await chatCollection.createIndex({ project_id: 1, created_at: -1 });
      console.log("Chat indexes created successfully");
    } catch (indexError) {
      console.log("Chat indexes may already exist:", indexError.message);
    }
    
    app.set("neosync", neosync);
    app.set("usersCollection", usersCollection);
    console.log("DB Connection Successful");
  })
  .catch((err) => console.log("Error in connection of database", err));

const userApp = require("./APIs/userApi");
const projectApp = require("./APIs/projectApi");
const notificationApi = require("./APIs/notificationApi");
const reviewApi = require("./APIs/reviewApi");
const youtubeApi = require("./APIs/youtubeApi");
const chatApi = require("./APIs/chatApi");

app.use("/userApi", userApp);
app.use("/projectApi", projectApp);
app.use("/notificationApi", notificationApi);
app.use("/reviewApi", reviewApi);
app.use("/youtubeApi", youtubeApi);
app.use("/chatApi", chatApi);

app.use((err, req, res, next) => {
  res.send({ message: "error", payload: err.message });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server is running on port ${port} with Socket.io`));
