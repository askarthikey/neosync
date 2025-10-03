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
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

const cors = require("cors");

app.use(cors());
app.use(exp.json());
app.use(uploadMiddleware);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a project room for real-time communication
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.id} joined project room: project-${projectId}`);
  });

  // Leave a project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${socket.id} left project room: project-${projectId}`);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    const { projectId, message, sender, timestamp, messageType } = data;
    
    // Broadcast the message to all users in the project room
    io.to(`project-${projectId}`).emit('receive-message', {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      message,
      sender,
      timestamp,
      messageType, // 'text', 'status-update', 'priority-update', etc.
      socketId: socket.id
    });
    
    console.log(`Message sent to project-${projectId}:`, { message, sender, messageType });
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
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

mongoClient
  .connect(process.env.DB_URL)
  .then((client) => {
    const neosync = client.db("neosync");
    const usersCollection = neosync.collection("usersCollection");
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

app.use("/userApi", userApp);
app.use("/projectApi", projectApp);
app.use("/notificationApi", notificationApi);
app.use("/reviewApi", reviewApi);
app.use("/youtubeApi", youtubeApi);

app.use((err, req, res, next) => {
  res.send({ message: "error", payload: err.message });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server is running on port ${port} with Socket.io`));
