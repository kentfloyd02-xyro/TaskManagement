const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Socket.io connection logic
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
  });

  socket.on('typing', ({ roomId, userName }) => {
    socket.to(roomId).emit('user_typing', { roomId, userName });
  });

  socket.on('stop_typing', ({ roomId }) => {
    socket.to(roomId).emit('user_stop_typing', { roomId });
  });

  // Collaborative Whiteboard Real-Time Events
  socket.on('whiteboard_draw', ({ roomId, drawData }) => {
    socket.to(roomId).emit('whiteboard_draw_update', { roomId, drawData });
  });

  socket.on('whiteboard_clear', ({ roomId }) => {
    socket.to(roomId).emit('whiteboard_cleared', { roomId });
  });

  socket.on('disconnect', () => {});
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reviewer', require('./routes/reviewerRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Planner API server is running smoothly!',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource endpoint not found.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const { startScheduleNotificationJob } = require('./services/scheduleNotificationJob');

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Student Planner Server] Running with Socket.io on http://localhost:${PORT}`);
  startScheduleNotificationJob(io);
});

