// server.js — Configured for India Standard Time (IST — Asia/Kolkata)
// env loaded: 2026-09-29 (restart trigger)
process.env.TZ = 'Asia/Kolkata';

// Prevent Node.js autoSelectFamily timeout issues on Windows dual-stack networks
const net = require('net');
const dns = require('dns');
if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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
const jwt = require('jsonwebtoken');
const { formatIST } = require('./utils/timezone');

// Initialize logger with IST timestamps
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => formatIST(new Date(), 'full')
    }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const app = express();
const server = http.createServer(app);

// Trust proxy for Render/Vercel (Must be set for express-rate-limit)
app.set('trust proxy', 1);

// =====================================================
// SOCKET.IO for real-time monitoring
// =====================================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://collegeexam.vercel.app',
  'https://CollegeExam.vercel.app',
  'https://www.pkthenexgenexam.xyz',
  'https://pkthenexgenexam.xyz',
  'https://exam.nexifyforge.in',
  'https://www.exam.nexifyforge.in',
  'http://exam.nexifyforge.in',
  'http://www.exam.nexifyforge.in',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
  ...(process.env.APP_URL ? process.env.APP_URL.split(',') : []),
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
]
  .map(o => (typeof o === 'string' ? o.trim().replace(/\/$/, '') : ''))
  .filter(Boolean);

// CORS origin validation function — used by both Express CORS and Socket.IO
const corsOriginFn = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
  if (!origin) return callback(null, true);

  const cleanOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);

  // Allow trusted root domains and all their subdomains
  try {
    const { hostname } = new URL(cleanOrigin);
    if (
      hostname === 'nexifyforge.in' ||
      hostname.endsWith('.nexifyforge.in') ||
      hostname === 'pkthenexgenexam.xyz' ||
      hostname.endsWith('.pkthenexgenexam.xyz') ||
      hostname.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
  } catch (e) {
    // invalid URL format
  }

  logger.warn(`CORS blocked request from origin: ${origin}`);
  callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
};

const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Horizontal load balancing: Connect Socket.IO to Redis cluster if REDIS_URL is provided
const { initRedisAdapter } = require('./config/redis');
initRedisAdapter(io);

// Socket.IO rooms for exam monitoring
const activeExamSessions = new Map(); // sessionId -> {studentId, examId, collegeId, status}
const latestStudentFrames = new Map(); // examId -> Map(studentId -> { studentId, sessionId, imageData, timestamp })

// Automatic session memory sweeper for 50k-100k concurrent users (evicts inactive sessions > 1 hour)
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, session] of activeExamSessions.entries()) {
    if (new Date(session.lastHeartbeat || session.connectedAt).getTime() < cutoff) {
      activeExamSessions.delete(id);
    }
  }
  for (const [examId, framesMap] of latestStudentFrames.entries()) {
    for (const [studentId, frame] of framesMap.entries()) {
      if (frame.timestamp < cutoff) {
        framesMap.delete(studentId);
      }
    }
    if (framesMap.size === 0) {
      latestStudentFrames.delete(examId);
    }
  }
}, 10 * 60 * 1000).unref();

// Automatic scheduled exam lifecycle synchronizer (activates scheduled exams when start time arrives)
setInterval(async () => {
  try {
    const { supabase } = require('./config/supabase-clean');
    const { parseToIST } = require('./utils/timezone');
    const now = Date.now();

    // Find scheduled exams that should now be active
    const { data: upcomingExams } = await supabase
      .from('exams')
      .select('id, date_time, duration, status')
      .in('status', ['published', 'draft'])
      .not('date_time', 'is', null);

    if (Array.isArray(upcomingExams) && upcomingExams.length > 0) {
      for (const ex of upcomingExams) {
        const start = parseToIST(ex.date_time);
        if (!start) continue;
        const startTime = start.getTime();
        const endTime = startTime + (ex.duration || 60) * 60000;

        // If current time is past start time (with 30s early skew margin) and before end time:
        if (now >= startTime - 30000 && now <= endTime) {
          await supabase
            .from('exams')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', ex.id);
          logger.info(`Auto-activated scheduled exam ${ex.id} (start: ${ex.date_time})`);
        }
      }
    }
  } catch (_) {
    // Non-blocking background sync
  }
}, 30 * 1000).unref();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || 
    (socket.handshake.headers?.authorization ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '') : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456');
      socket.user = decoded;
    } catch (e) {
      logger.warn(`Socket authentication error: ${e.message}`);
    }
  }
  next();
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Student joins exam room
  socket.on('join-exam', ({ sessionId, examId, studentId, studentName }) => {
    socket.join(`exam-${examId}`);
    if (sessionId) socket.join(`session-${sessionId}`);
    if (studentId) socket.join(`student-${studentId}`);
    
    if (sessionId) {
      activeExamSessions.set(sessionId, {
        sessionId,
        studentId,
        studentName: studentName || 'Candidate',
        examId,
        socketId: socket.id,
        status: 'active',
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
      });
    }

    // Notify admin room
    const joinPayload = {
      sessionId,
      studentId,
      studentName: studentName || 'Candidate',
      examId,
      timestamp: new Date().toISOString(),
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-joined', joinPayload);

    logger.info(`Student ${studentId || 'unknown'} joined exam ${examId}`);
  });

  // Admin joins monitoring room (supports both event names)
  const handleAdminJoin = ({ examId, collegeId }) => {
    if (!examId) return;
    socket.join(`admin-exam-${examId}`);
    socket.join(`exam-monitoring-${examId}`);
    
    // Send current active sessions
    const sessions = Array.from(activeExamSessions.entries())
      .filter(([, s]) => s.examId === examId)
      .map(([id, data]) => ({ sessionId: id, ...data }));
    
    socket.emit('active-sessions', sessions);

    // Send latest cached camera frames for immediate zero-delay display
    const examFramesMap = latestStudentFrames.get(examId);
    if (examFramesMap && examFramesMap.size > 0) {
      const initialFrames = {};
      examFramesMap.forEach((val, sid) => {
        initialFrames[sid] = val.imageData;
      });
      socket.emit('initial-camera-feeds', { examId, frames: initialFrames });
    }

    logger.info(`Admin joined monitoring for exam ${examId}`);
  };

  socket.on('monitor-exam', handleAdminJoin);
  socket.on('join-exam-monitoring', handleAdminJoin);

  socket.on('leave-exam-monitoring', ({ examId }) => {
    if (!examId) return;
    socket.leave(`admin-exam-${examId}`);
    socket.leave(`exam-monitoring-${examId}`);
  });

  // Camera feed stream from student to proctor (optimized deduplicated broadcast)
  socket.on('camera-feed', ({ examId, studentId, sessionId, imageData, timestamp }) => {
    if (!examId || !studentId || !imageData) return;

    // Cache latest frame for zero-latency initial load on admin reconnects
    if (!latestStudentFrames.has(examId)) {
      latestStudentFrames.set(examId, new Map());
    }
    latestStudentFrames.get(examId).set(studentId, {
      studentId,
      sessionId,
      imageData,
      timestamp: timestamp || Date.now(),
    });

    const feedPayload = {
      examId,
      studentId,
      sessionId,
      imageData,
      timestamp: timestamp || Date.now(),
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).volatile.emit('camera-feed', feedPayload);
  });


  // Student telemetry update (question progress, face count, audio level)
  socket.on('student-activity', ({ examId, studentId, sessionId, activity }) => {
    const actPayload = {
      examId,
      studentId,
      sessionId,
      activity: {
        ...activity,
        lastSeen: new Date().toISOString(),
      },
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-activity', actPayload);
  });

  // Violation event
  socket.on('violation', ({ sessionId, examId, studentId, studentName, type, severity, description }) => {
    const violPayload = {
      sessionId,
      examId,
      studentId,
      studentName: studentName || 'Candidate',
      type,
      severity: severity || 'medium',
      description: description || type,
      timestamp: new Date().toISOString(),
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('violation-alert', violPayload);
  });

  // Admin sends direct warning to student
  socket.on('send-warning', ({ examId, studentId, message, severity, strike }) => {
    const warnPayload = {
      examId,
      studentId,
      message,
      severity: severity || 'medium',
      strike: strike || 1,
      timestamp: new Date().toISOString(),
    };
    io.to(`student-${studentId}`).emit('warning-received', warnPayload);
    io.to(`exam-${examId}`).emit('warning-received', warnPayload);
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('warning-sent', warnPayload);
  });

  // Admin terminates exam for student
  socket.on('terminate-exam', ({ examId, studentId, reason }) => {
    const termPayload = {
      examId,
      studentId,
      reason: reason || 'Exam terminated by proctor.',
      timestamp: new Date().toISOString(),
    };
    io.to(`student-${studentId}`).emit('exam-terminated', termPayload);
    io.to(`exam-${examId}`).emit('exam-terminated', termPayload);
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-terminated', termPayload);
  });

  // Admin broadcasts announcement to entire exam
  socket.on('broadcast-message', ({ examId, title, message, urgency }) => {
    const broadPayload = {
      examId,
      title: title || 'Proctor Announcement',
      message,
      urgency: urgency || 'normal',
      timestamp: new Date().toISOString(),
    };
    io.to(`exam-${examId}`).emit('broadcast-received', broadPayload);
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('broadcast-sent', broadPayload);
  });

  // Heartbeat - student is still present
  socket.on('heartbeat', ({ sessionId, examId, studentId }) => {
    if (activeExamSessions.has(sessionId)) {
      activeExamSessions.get(sessionId).lastHeartbeat = new Date();
    }
    const hbPayload = {
      sessionId,
      studentId,
      examId,
      timestamp: new Date().toISOString(),
    };
    if (examId) {
      io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('heartbeat', hbPayload);
    }
  });

  // Student submits exam
  socket.on('exam-submitted', ({ sessionId, examId, studentId }) => {
    if (activeExamSessions.has(sessionId)) {
      activeExamSessions.get(sessionId).status = 'submitted';
    }
    const subPayload = {
      sessionId,
      studentId,
      examId,
      timestamp: new Date().toISOString(),
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-submitted', subPayload);
  });

  // Disconnect
  socket.on('disconnect', () => {
    for (const [sessionId, data] of activeExamSessions.entries()) {
      if (data.socketId === socket.id) {
        const dcPayload = {
          sessionId,
          studentId: data.studentId,
          examId: data.examId,
          timestamp: new Date().toISOString(),
        };
        io.to(`admin-exam-${data.examId}`).to(`exam-monitoring-${data.examId}`).emit('student-disconnected', dcPayload);
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
// 1. CORS - MUST be first, before rate-limiters, to handle preflight OPTIONS correctly
const corsOptions = {
  origin: corsOriginFn,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count'],
};
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for ALL routes BEFORE rate limiters.
// Without this, rate-limiters can intercept OPTIONS and return 429 without CORS headers.
app.options('*', cors(corsOptions));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Rate limiting - optimized for 50k-100k users and shared college campus NAT IPs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // If request has Authorization header, isolate quota per user session rather than whole college IP
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return `auth_${auth.slice(-32)}`;
    }
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // accommodates full college campus batches logging in concurrently from same NAT IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const accountIdentifier = req.body?.student_id || req.body?.studentId || req.body?.email || req.body?.enrollment_number;
    if (accountIdentifier) {
      return `auth_id_${String(accountIdentifier).trim().toLowerCase()}`;
    }
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, message: 'Too many login attempts for this account. Please try again in 15 minutes.' },
});

const codeExecLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 code runs/submissions per candidate per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return `code_${auth.slice(-32)}`;
    }
    return req.ip;
  },
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, message: 'Code execution rate limit reached. Please wait a moment before running or submitting again.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/api/student/run-code', codeExecLimiter);
app.use('/api/student/submit-code', codeExecLimiter);
app.use('/api/code/', codeExecLimiter);

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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// Diagnostic Email Route — verifies SMTP/Resend connection then sends a real test email
app.get('/api/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const { Resend } = require('resend');
  const to = req.query.email || process.env.EMAIL_USER;

  const config = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '***SET***' : 'NOT SET',
    EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
    EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT SET',
    EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  if (!to) {
    return res.status(400).json({ success: false, message: 'Provide ?email=<address> or set EMAIL_USER env var.', config });
  }

  try {
    if (process.env.RESEND_API_KEY) {
      // Test Resend API
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        subject: '✅ ExamShield — Resend API Diagnostic',
        text: 'Resend API is working correctly.',
      });

      if (error) throw new Error(error.message);
      return res.json({ success: true, message: `Diagnostic email sent via Resend to ${to}`, messageId: data?.id, config });
    } else {
      // Test SMTP
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({ success: false, message: 'Email env vars not configured on this server.', config });
      }

      const port = parseInt(process.env.EMAIL_PORT) || 587;
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
      });

      await transporter.verify();
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: '✅ ExamShield — SMTP Diagnostic',
        text: `SMTP is working correctly. Server: ${process.env.EMAIL_HOST}:${port}`,
      });
      return res.json({ success: true, message: `Diagnostic email sent to ${to}`, messageId: info.messageId, config });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Email test failed.', error: error.message, code: error.code, config });
  }
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
// =====================================================
// EXAM LIFECYCLE MANAGEMENT (AUTO-CLOSE EXPIRED EXAMS)
// =====================================================
const { autoCloseExpiredExams } = require('./services/examLifecycleService');

// Run auto-close every 30 seconds to strictly enforce scheduled end times
const autoCloseInterval = setInterval(async () => {
  try {
    await autoCloseExpiredExams();
  } catch (err) {
    logger.error('Auto-close exams interval error:', err);
  }
}, 30000);

// =====================================================
// START SERVER & ENTERPRISE RELIABILITY GUARDS
// =====================================================
const PORT = process.env.PORT || 5000;

// Prevent race condition 502 Bad Gateway behind reverse proxies (Cloudflare, Render, Nginx, AWS)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, () => {
  logger.info(`🚀 CollegeExam server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 Socket.IO enabled for real-time monitoring`);

  // Pre-warm database pool for instant login response times
  const { pool } = require('./config/database');
  pool.query('SELECT 1').then(() => {
    logger.info('⚡ Database connection pool pre-warmed and ready for instant logins');
  }).catch((err) => {
    logger.warn(`Initial DB warm-up ping: ${err.message}`);
  });

  // Execute initial lifecycle sweep to close any expired exams and hanging sessions
  autoCloseExpiredExams().then((res) => {
    logger.info(`🛡️ Initial Exam Lifecycle sweep complete. (Closed: ${res?.closedExamsCount || 0}, Sessions: ${res?.autoSubmittedSessionsCount || 0})`);
  }).catch((err) => {
    logger.error('Initial auto-close exams error:', err);
  });
});

// Enterprise Graceful Shutdown (Zero dropped candidate submissions on deploy/restart)
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP & WebSocket server closed. Closing database connection pool...');
    try {
      const { pool } = require('./config/database');
      await pool.end();
      logger.info('Database pool closed gracefully.');
    } catch (err) {
      logger.error('Error closing database pool:', err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown due to 15s timeout.');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process-level Crash Guards: Prevent one bad request from taking down entire active exam
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

module.exports = { app, io };
