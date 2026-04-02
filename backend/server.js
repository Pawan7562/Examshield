// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const cron = require('node-cron');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const app = express();
const server = http.createServer(app);

// =====================================================
// SOCKET.IO for real-time monitoring
// =====================================================
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO rooms for exam monitoring
const activeExamSessions = new Map(); // sessionId -> {studentId, examId, collegeId, status}

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Student joins exam room
  socket.on('join-exam', ({ sessionId, examId, studentId, token }) => {
    // TODO: Verify JWT token for socket connections
    socket.join(`exam-${examId}`);
    socket.join(`session-${sessionId}`);
    
    activeExamSessions.set(sessionId, {
      studentId, examId, socketId: socket.id,
      status: 'active', connectedAt: new Date(),
    });

    // Notify admin room
    io.to(`admin-exam-${examId}`).emit('student-joined', {
      sessionId, studentId, timestamp: new Date(),
    });

    logger.info(`Student ${studentId} joined exam ${examId}`);
  });

  // Admin joins monitoring room
  socket.on('monitor-exam', ({ examId, collegeId }) => {
    socket.join(`admin-exam-${examId}`);
    
    // Send current active sessions
    const sessions = Array.from(activeExamSessions.entries())
      .filter(([, s]) => s.examId === examId)
      .map(([id, data]) => ({ sessionId: id, ...data }));
    
    socket.emit('active-sessions', sessions);
  });

  // Violation event
  socket.on('violation', ({ sessionId, examId, studentId, type, severity }) => {
    // Broadcast to admin monitoring this exam
    io.to(`admin-exam-${examId}`).emit('violation-alert', {
      sessionId, studentId, type, severity, timestamp: new Date(),
    });
  });

  // Heartbeat - student is still present
  socket.on('heartbeat', ({ sessionId }) => {
    if (activeExamSessions.has(sessionId)) {
      activeExamSessions.get(sessionId).lastHeartbeat = new Date();
    }
    io.to(`admin-exam-${activeExamSessions.get(sessionId)?.examId}`).emit('heartbeat', {
      sessionId, timestamp: new Date(),
    });
  });

  // Student submits exam
  socket.on('exam-submitted', ({ sessionId, examId }) => {
    if (activeExamSessions.has(sessionId)) {
      activeExamSessions.get(sessionId).status = 'submitted';
    }
    io.to(`admin-exam-${examId}`).emit('student-submitted', {
      sessionId, timestamp: new Date(),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Find and update the session
    for (const [sessionId, data] of activeExamSessions.entries()) {
      if (data.socketId === socket.id) {
        io.to(`admin-exam-${data.examId}`).emit('student-disconnected', {
          sessionId, studentId: data.studentId, timestamp: new Date(),
        });
        activeExamSessions.delete(sessionId);
        break;
      }
    }
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to controllers
app.set('io', io);

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 200 to 1000 requests
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased from 10 to 50 attempts
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// ROUTES
// =====================================================
const routes = require('./routes');
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Duplicate entry. Record already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// =====================================================
// CRON JOBS (TEMPORARILY DISABLED)
// =====================================================

// Send exam reminders 1 hour before
// cron.schedule('* * * * *', async () => {
//   try {
//     const { supabase } = require('./config/supabase');
//     const { sendExamReminder } = require('./services/emailService');
//     
//     logger.info('Exam reminder cron job running (mock)');
//   } catch (error) {
//     logger.error('Exam reminder cron error:', error);
//   }
// });

// Auto-close exams that have ended
// cron.schedule('*/5 * * * *', async () => {
//   try {
//     const { supabase } = require('./config/supabase');
//     // Simplified for development - just log the action
//     logger.info('Auto-close exams cron job running (mock)');
//   } catch (err) {
//     logger.error('Auto-close exams error:', err);
//   }
// });

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 ExamShield server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 Socket.IO enabled for real-time monitoring`);
});

module.exports = { app, io };
