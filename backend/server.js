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
const { startDailyEmailScheduler, dispatchBatch } = require('./services/autoEmailBatchService');

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
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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

// Horizontal load balancing: Connect Socket.IO to Redis cluster if REDIS_URL is provided (Upstash / ElastiCache)
const { initRedisAdapter, getRedisClient } = require('./config/redis');
initRedisAdapter(io);

// Socket.IO rooms and stream management for exam monitoring
const MAX_PROCTOR_STREAMS = parseInt(process.env.MAX_PROCTOR_STREAMS || '4', 10);
const activeExamSessions = new Map(); // sessionId -> {studentId, examId, collegeId, status}
const proctorSubscriptions = new Map(); // socketId -> Set<studentId>
const studentSubscribers = new Map(); // studentId -> Set<socketId>
const studentThumbnails = new Map(); // examId -> Map(studentId -> { studentId, sessionId, imageData, faceCount, audioLevel, timestamp, isIncident })

// Automatic session memory sweeper for 50k-100k concurrent users (evicts inactive sessions > 1 hour)
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, session] of activeExamSessions.entries()) {
    if (new Date(session.lastHeartbeat || session.connectedAt).getTime() < cutoff) {
      activeExamSessions.delete(id);
    }
  }
  for (const [examId, thumbMap] of studentThumbnails.entries()) {
    for (const [studentId, thumb] of thumbMap.entries()) {
      if (thumb.timestamp < cutoff) {
        thumbMap.delete(studentId);
      }
    }
    if (thumbMap.size === 0) {
      studentThumbnails.delete(examId);
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
}, 120 * 1000).unref();

// Exam ownership cache with 5-minute TTL to minimize database queries during high concurrency
const examCollegeCache = new Map();
async function getExamCollegeId(examId) {
  if (!examId) return null;
  const cached = examCollegeCache.get(examId);
  if (cached && cached.expiresAt > Date.now()) return cached.collegeId;
  try {
    const { pool } = require('./config/database');
    const { rows } = await pool.query('SELECT college_id FROM exams WHERE id = $1', [examId]);
    if (rows.length > 0) {
      examCollegeCache.set(examId, { collegeId: rows[0].college_id, expiresAt: Date.now() + 5 * 60 * 1000 });
      return rows[0].college_id;
    }
  } catch (err) {
    logger.warn(`Failed to fetch exam college_id: ${err.message}`);
  }
  return null;
}

// Socket.IO authentication middleware (strict JWT verification)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || 
    (socket.handshake.headers?.authorization ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '') : null);

  if (!token) {
    logger.warn(`Socket connection rejected: No authentication token provided (${socket.id})`);
    return next(new Error('Authentication failed: Missing JWT token.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456');
    socket.user = decoded;
    next();
  } catch (e) {
    logger.warn(`Socket authentication error: ${e.message} (${socket.id})`);
    return next(new Error('Authentication failed: Invalid token.'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} (user: ${socket.user?.id || 'anonymous'}, role: ${socket.user?.role || 'none'})`);

  // Role and multi-tenant authorization helpers
  const isAdminSocket = () => {
    return socket.user && (socket.user.role === 'college_admin' || socket.user.role === 'super_admin');
  };

  const isAuthorizedAdminForExam = async (examId) => {
    if (!isAdminSocket()) return false;
    if (socket.user.role === 'super_admin') return true;
    const examCollegeId = await getExamCollegeId(examId);
    const adminCollegeId = socket.user.college_id || socket.user.id;
    return examCollegeId && String(examCollegeId) === String(adminCollegeId);
  };

  const isAuthorizedStudentForExam = async (examId, studentId) => {
    if (!socket.user || socket.user.role !== 'student') return false;
    // Reject identity spoofing: studentId must match verified token identity
    if (studentId && String(studentId) !== String(socket.user.id)) return false;
    // Verify college match
    const examCollegeId = await getExamCollegeId(examId);
    const studentCollegeId = socket.user.college_id;
    if (examCollegeId && studentCollegeId && String(examCollegeId) !== String(studentCollegeId)) {
      return false;
    }
    return true;
  };

  // Student joins exam room
  socket.on('join-exam', async ({ sessionId, examId, studentId, studentName }) => {
    if (!examId) return;

    let verifiedStudentId = studentId;
    if (socket.user && socket.user.role === 'student') {
      verifiedStudentId = socket.user.id;
      // Strict identity verification: reject spoofed studentId
      if (studentId && String(studentId) !== String(verifiedStudentId)) {
        logger.warn(`Rejected studentId spoofing attempt: token has ${verifiedStudentId} but payload had ${studentId}`);
        return socket.emit('error', { message: 'Unauthorized: Student identity mismatch.' });
      }
      const isAuth = await isAuthorizedStudentForExam(examId, verifiedStudentId);
      if (!isAuth) {
        logger.warn(`Rejected unauthorized student join on exam ${examId} by ${verifiedStudentId}`);
        return socket.emit('error', { message: 'Unauthorized: Student not authorized for this exam/college.' });
      }
    } else if (!isAdminSocket()) {
      return socket.emit('error', { message: 'Unauthorized: Valid student or admin credentials required.' });
    }

    socket.join(`exam-${examId}`);
    if (sessionId) socket.join(`session-${sessionId}`);
    if (verifiedStudentId) socket.join(`student-${verifiedStudentId}`);
    
    if (sessionId) {
      const sessPayload = {
        sessionId,
        studentId: verifiedStudentId,
        studentName: studentName || 'Candidate',
        examId,
        socketId: socket.id,
        status: 'active',
        connectedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
      };
      activeExamSessions.set(sessionId, sessPayload);

      const redis = getRedisClient();
      if (redis) {
        redis.hSet(`exam:${examId}:active_sessions`, sessionId, JSON.stringify(sessPayload)).catch(() => {});
        redis.expire(`exam:${examId}:active_sessions`, 7200).catch(() => {});
      }
    }

    // Inform student whether live streaming is requested by any existing proctor
    const isStreamRequested = (studentSubscribers.get(verifiedStudentId)?.size || 0) > 0;
    socket.emit('stream-requested', { studentId: verifiedStudentId, active: isStreamRequested });

    // Notify admin room
    const joinPayload = {
      sessionId,
      studentId: verifiedStudentId,
      studentName: studentName || 'Candidate',
      examId,
      timestamp: new Date().toISOString(),
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-joined', joinPayload);

    logger.info(`Student ${verifiedStudentId || 'unknown'} joined exam ${examId} (streaming: ${isStreamRequested})`);
  });

  // Admin joins monitoring room (supports both event names)
  const handleAdminJoin = async ({ examId, collegeId }) => {
    if (!examId) return;

    if (!isAdminSocket()) {
      logger.warn(`Unauthorized admin join attempt on exam ${examId} from socket ${socket.id}`);
      return socket.emit('monitoring-auth-error', { message: 'Unauthorized: Admin privileges required.' });
    }

    const isAuthorized = await isAuthorizedAdminForExam(examId);
    if (!isAuthorized) {
      logger.warn(`Cross-college monitoring rejected: Admin ${socket.user.id} tried to monitor unowned exam ${examId}`);
      return socket.emit('monitoring-auth-error', { message: 'Unauthorized: You do not have permission to monitor exams from another institution.' });
    }

    socket.join(`admin-exam-${examId}`);
    socket.join(`exam-monitoring-${examId}`);
    
    // Send current active sessions (merging local Map with Redis Cluster if available)
    let sessions = Array.from(activeExamSessions.entries())
      .filter(([, s]) => s.examId === examId)
      .map(([id, data]) => ({ sessionId: id, ...data }));
    
    const redis = getRedisClient();
    if (redis) {
      try {
        const clusterMap = await redis.hGetAll(`exam:${examId}:active_sessions`);
        if (clusterMap && Object.keys(clusterMap).length > 0) {
          sessions = Object.values(clusterMap).map(s => {
            try { return JSON.parse(s); } catch (_) { return null; }
          }).filter(Boolean);
        }
      } catch (_) {}
    }
    
    socket.emit('active-sessions', sessions);

    // Send latest candidate thumbnails for roster preview (capped to max 24 or incident items)
    const examThumbMap = studentThumbnails.get(examId);
    if (examThumbMap && examThumbMap.size > 0) {
      const initialThumbnails = {};
      let count = 0;
      examThumbMap.forEach((val, sid) => {
        if (count < 24 || val.isIncident) {
          initialThumbnails[sid] = val;
          count++;
        }
      });
      socket.emit('initial-candidate-thumbnails', { examId, thumbnails: initialThumbnails });
    }

    // Send proctor stream limits and configuration
    socket.emit('proctor-config', {
      maxStreams: MAX_PROCTOR_STREAMS,
      activeSubscriptions: Array.from(proctorSubscriptions.get(socket.id) || []),
    });

    logger.info(`Admin joined monitoring for exam ${examId}`);
  };

  socket.on('monitor-exam', handleAdminJoin);
  socket.on('join-exam-monitoring', handleAdminJoin);

  socket.on('leave-exam-monitoring', ({ examId }) => {
    if (!examId) return;
    socket.leave(`admin-exam-${examId}`);
    socket.leave(`exam-monitoring-${examId}`);
  });

  // ─── ON-DEMAND LIVE STREAMING SIGNALING & SUBSCRIPTION ───

  // Proctor subscribes to an authorized student's live video feed
  socket.on('subscribe-student-stream', async ({ examId, studentId, tileIndex }) => {
    if (!studentId) return;

    if (!isAdminSocket()) {
      logger.warn(`Unauthorized stream subscription attempt for student ${studentId} from socket ${socket.id}`);
      return socket.emit('stream-subscription-error', {
        studentId,
        tileIndex,
        message: 'Unauthorized: Proctor privileges required to view candidate video stream.',
      });
    }

    if (examId) {
      const isAuth = await isAuthorizedAdminForExam(examId);
      if (!isAuth) {
        logger.warn(`Cross-college stream subscription rejected for admin ${socket.user.id} on exam ${examId}`);
        return socket.emit('stream-subscription-error', {
          studentId,
          tileIndex,
          message: 'Unauthorized: Cross-college stream subscription is forbidden.',
        });
      }
    }

    let activeSubs = proctorSubscriptions.get(socket.id);
    if (!activeSubs) {
      activeSubs = new Set();
      proctorSubscriptions.set(socket.id, activeSubs);
    }

    // Enforce server-side 4-stream limit per proctor
    if (activeSubs.size >= MAX_PROCTOR_STREAMS && !activeSubs.has(studentId)) {
      return socket.emit('stream-subscription-error', {
        studentId,
        tileIndex,
        message: `Maximum limit reached: You can view at most ${MAX_PROCTOR_STREAMS} concurrent live video feeds. Please release an existing feed first.`,
      });
    }

    activeSubs.add(studentId);

    let subs = studentSubscribers.get(studentId);
    if (!subs) {
      subs = new Set();
      studentSubscribers.set(studentId, subs);
    }
    const wasEmptyLocal = subs.size === 0;
    subs.add(socket.id);

    const { addStreamSubscriber } = require('./config/redis');
    const clusterCount = await addStreamSubscriber(studentId, socket.id).catch(() => null);
    const wasEmpty = clusterCount !== null ? clusterCount === 1 : wasEmptyLocal;

    // Join dedicated room for this student's video stream
    socket.join(`stream-${studentId}`);

    // Signal student device to start transmitting frames
    io.to(`student-${studentId}`).emit('stream-requested', { studentId, active: true });
    if (wasEmpty) {
      logger.info(`Live video requested for student ${studentId} (1st subscriber: ${socket.id})`);
    } else {
      logger.info(`Shared stream subscription for student ${studentId} (total subscribers: ${clusterCount ?? subs.size})`);
    }

    socket.emit('stream-subscribed', {
      studentId,
      tileIndex,
      status: 'connecting',
      maxStreams: MAX_PROCTOR_STREAMS,
      activeCount: activeSubs.size,
    });
  });

  // Proctor unsubscribes from a student's live video feed
  socket.on('unsubscribe-student-stream', async ({ studentId, tileIndex }) => {
    if (!studentId) return;

    socket.leave(`stream-${studentId}`);

    const activeSubs = proctorSubscriptions.get(socket.id);
    if (activeSubs) {
      activeSubs.delete(studentId);
    }

    const { removeStreamSubscriber } = require('./config/redis');
    const remainingClusterCount = await removeStreamSubscriber(studentId, socket.id).catch(() => null);

    const subs = studentSubscribers.get(studentId);
    let isZeroRemaining = false;
    if (subs) {
      subs.delete(socket.id);
      if (subs.size === 0) {
        studentSubscribers.delete(studentId);
        isZeroRemaining = true;
      }
    }
    if (remainingClusterCount !== null) {
      isZeroRemaining = remainingClusterCount === 0;
    }

    if (isZeroRemaining) {
      // Zero active proctors watching across cluster: signal student device to halt video upload immediately
      io.to(`student-${studentId}`).emit('stream-requested', { studentId, active: false });
      logger.info(`Live video halted for student ${studentId} (0 subscribers)`);
    }

    socket.emit('stream-unsubscribed', {
      studentId,
      tileIndex,
      activeCount: activeSubs ? activeSubs.size : 0,
    });
  });

  // ─── WEBRTC SIGNALING RELAY (SECURE & AUTHORIZED) ───
  // Proctor initiates WebRTC offer to student
  socket.on('webrtc-offer', async ({ examId, studentId, sdp }) => {
    if (!studentId || !sdp) return;
    if (isAdminSocket()) {
      if (examId && !(await isAuthorizedAdminForExam(examId))) {
        return socket.emit('webrtc-error', { message: 'Unauthorized: Cross-college signaling forbidden.' });
      }
      io.to(`student-${studentId}`).emit('webrtc-offer', {
        proctorSocketId: socket.id,
        studentId,
        sdp,
      });
    }
  });

  // Student returns SDP answer
  socket.on('webrtc-answer', async ({ proctorSocketId, studentId, sdp }) => {
    if (!proctorSocketId || !sdp) return;
    const verifiedStudentId = (socket.user && socket.user.role === 'student') ? socket.user.id : studentId;
    io.to(proctorSocketId).emit('webrtc-answer', {
      studentId: verifiedStudentId,
      sdp,
    });
  });

  // ICE candidate exchange
  socket.on('webrtc-ice-candidate', async ({ targetSocketId, targetStudentId, candidate }) => {
    if (!candidate) return;
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    } else if (targetStudentId && isAdminSocket()) {
      io.to(`student-${targetStudentId}`).emit('webrtc-ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    }
  });

  // Camera feed stream: Transmitted ONLY when a proctor is actively subscribed!
  socket.on('camera-feed', async ({ examId, studentId, sessionId, imageData, timestamp }) => {
    if (!examId || !imageData) return;

    // Anchor student identity to verified token identity
    const verifiedStudentId = (socket.user && socket.user.role === 'student') ? socket.user.id : studentId;
    if (!verifiedStudentId) return;
    if (socket.user && socket.user.role === 'student' && studentId && String(studentId) !== String(socket.user.id)) {
      logger.warn(`Spoofed camera-feed frame rejected from student ${socket.user.id} pretending to be ${studentId}`);
      return;
    }

    let hasSubs = (studentSubscribers.get(verifiedStudentId)?.size || 0) > 0;
    if (!hasSubs) {
      const { getStreamSubscriberCount } = require('./config/redis');
      const clusterCount = await getStreamSubscriberCount(verifiedStudentId).catch(() => null);
      if (clusterCount !== null && clusterCount > 0) {
        hasSubs = true;
      }
    }

    if (!hasSubs) {
      // Inadvertent transmission with 0 subscribers: signal student to cease
      socket.emit('stream-requested', { studentId: verifiedStudentId, active: false });
      return;
    }

    const feedPayload = {
      examId,
      studentId: verifiedStudentId,
      sessionId,
      imageData,
      timestamp: timestamp || Date.now(),
    };

    // Volatile emit ONLY to subscribed proctors in room `stream-${verifiedStudentId}` (NOT the entire exam room!)
    io.to(`stream-${verifiedStudentId}`).volatile.emit('camera-feed', feedPayload);
  });

  // Background monitoring snapshot (incident evidence captures)
  socket.on('monitoring-snapshot', ({ examId, studentId, sessionId, imageData, faceCount, audioLevel, timestamp, isIncident }) => {
    if (!examId || !studentId || !imageData) return;

    const verifiedStudentId = (socket.user && socket.user.role === 'student') ? socket.user.id : studentId;

    if (isIncident) {
      if (!studentThumbnails.has(examId)) {
        studentThumbnails.set(examId, new Map());
      }
      const examThumbMap = studentThumbnails.get(examId);
      if (examThumbMap.size >= 80 && !examThumbMap.has(verifiedStudentId)) {
        const oldestKey = examThumbMap.keys().next().value;
        examThumbMap.delete(oldestKey);
      }
      examThumbMap.set(verifiedStudentId, {
        studentId: verifiedStudentId,
        sessionId,
        imageData,
        faceCount: typeof faceCount === 'number' ? faceCount : 1,
        audioLevel: typeof audioLevel === 'number' ? audioLevel : 0,
        timestamp: timestamp || Date.now(),
        isIncident: true,
      });

      const snapshotPayload = {
        examId,
        studentId: verifiedStudentId,
        sessionId,
        imageData,
        faceCount,
        audioLevel,
        timestamp: timestamp || Date.now(),
        isIncident: true,
      };
      // Relayed volatilely to monitoring room across cluster for incident review
      io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).volatile.emit('candidate-snapshot', snapshotPayload);
    }
  });

  // Student camera/hardware status update
  socket.on('camera-status-update', ({ examId, studentId, status, message }) => {
    if (!studentId) return;
    const state = status === 'active' ? 'live' : 'camera_unavailable';
    io.to(`stream-${studentId}`).emit('student-stream-state', {
      studentId,
      state,
      message,
      timestamp: Date.now(),
    });
    io.to(`admin-exam-${examId}`).emit('student-camera-status', {
      studentId,
      status,
      message,
      timestamp: Date.now(),
    });
  });

  // Student telemetry update (question progress, face count, audio level)
  socket.on('student-activity', ({ examId, studentId, sessionId, activity }) => {
    if (!examId || !studentId) return;

    const actPayload = {
      examId,
      studentId,
      sessionId,
      activity: {
        ...activity,
        lastSeen: new Date().toISOString(),
      },
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).volatile.emit('student-activity', actPayload);
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
  socket.on('send-warning', async ({ examId, studentId, message, severity, strike }) => {
    if (!await isAuthorizedAdminForExam(examId)) {
      return socket.emit('error', { message: 'Unauthorized: You are not authorized to issue warnings for this examination.' });
    }
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
  socket.on('terminate-exam', async ({ examId, studentId, reason }) => {
    if (!await isAuthorizedAdminForExam(examId)) {
      return socket.emit('error', { message: 'Unauthorized: You are not authorized to terminate candidates in this examination.' });
    }
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
  socket.on('broadcast-message', async ({ examId, title, message, urgency }) => {
    if (!await isAuthorizedAdminForExam(examId)) {
      return socket.emit('error', { message: 'Unauthorized: You are not authorized to broadcast announcements for this examination.' });
    }
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
    const redis = getRedisClient();
    if (redis && examId && sessionId) {
      redis.hGet(`exam:${examId}:active_sessions`, sessionId).then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.lastHeartbeat = new Date().toISOString();
            redis.hSet(`exam:${examId}:active_sessions`, sessionId, JSON.stringify(parsed)).catch(() => {});
          } catch (_) {}
        }
      }).catch(() => {});
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
    const redis = getRedisClient();
    if (redis && examId && sessionId) {
      redis.hDel(`exam:${examId}:active_sessions`, sessionId).catch(() => {});
    }
    const subPayload = {
      sessionId,
      studentId,
      examId,
      timestamp: new Date().toISOString(),
    };
    io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-submitted', subPayload);
  });

  // Disconnect handler with comprehensive cleanup of video subscriptions
  socket.on('disconnect', async () => {
    // 1. If disconnecting socket is a proctor, clean up all its active subscriptions
    const activeSubs = proctorSubscriptions.get(socket.id);
    if (activeSubs && activeSubs.size > 0) {
      const { removeStreamSubscriber } = require('./config/redis');
      for (const studentId of activeSubs) {
        const remainingClusterCount = await removeStreamSubscriber(studentId, socket.id).catch(() => null);
        const subs = studentSubscribers.get(studentId);
        let isZero = false;
        if (subs) {
          subs.delete(socket.id);
          if (subs.size === 0) {
            studentSubscribers.delete(studentId);
            isZero = true;
          }
        }
        if (remainingClusterCount !== null) {
          isZero = remainingClusterCount === 0;
        }
        if (isZero) {
          io.to(`student-${studentId}`).emit('stream-requested', { studentId, active: false });
          logger.info(`Live video stopped for student ${studentId} (proctor disconnected)`);
        }
      }
      proctorSubscriptions.delete(socket.id);
    }

    // 2. If disconnecting socket is an active student, notify proctors and clean up
    for (const [sessionId, data] of activeExamSessions.entries()) {
      if (data.socketId === socket.id) {
        const studentId = data.studentId;
        const examId = data.examId;

        // If any proctor was viewing this student, notify them
        io.to(`stream-${studentId}`).emit('student-stream-state', {
          studentId,
          state: 'disconnected',
          timestamp: Date.now(),
        });
        studentSubscribers.delete(studentId);

        const dcPayload = {
          sessionId,
          studentId,
          examId,
          timestamp: new Date().toISOString(),
        };
        io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).emit('student-disconnected', dcPayload);
        activeExamSessions.delete(sessionId);

        const redis = getRedisClient();
        if (redis && examId && sessionId) {
          redis.hDel(`exam:${examId}:active_sessions`, sessionId).catch(() => {});
        }
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

// Health check & Deep Cluster Observability Probe
app.get('/api/health', (req, res) => {
  const { pool } = require('./config/database');
  const { isRedisConnected } = require('./config/redis');
  const mem = process.memoryUsage();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: '1.2.0-brevo-rest-fix',
    emailEngine: 'Brevo HTTPS REST API (Port 443)',
    cluster: {
      redisClustering: isRedisConnected(),
      activeCandidates: activeExamSessions.size,
      activeLiveFeeds: studentSubscribers.size,
    },
    database: {
      poolTotal: pool?.totalCount || 0,
      poolIdle: pool?.idleCount || 0,
      poolWaiting: pool?.waitingCount || 0,
    },
    system: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    }
  });
});

// Diagnostic Email Route — tests emailService with Brevo HTTPS REST API & SMTP fallback
app.get('/api/test-email', async (req, res) => {
  const { sendStudentCredentials } = require('./services/emailService');
  const to = req.query.email || 'exam@nexifyforge.in';

  const config = {
    BREVO_API_KEY: process.env.BREVO_API_KEY ? '***SET***' : 'USING_EMBEDDED_FALLBACK',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '***SET***' : 'NOT SET',
    EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT || '587',
    EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT SET',
    EMAIL_FROM: process.env.EMAIL_FROM || 'Nexify Examina <exam@nexifyforge.in>',
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    console.log(`🧪 [/api/test-email] Triggering diagnostic email to: ${to}`);
    await sendStudentCredentials({
      name: 'Diagnostic Candidate',
      email: to,
      studentId: 'ES-DIAG-001',
      password: 'DiagPassword@123',
      collegeName: 'Diagnostic Institution',
      loginUrl: process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login',
      examName: 'System Health Verification',
      examKey: 'DIAGNOSTIC-KEY',
      isReset: false
    });

    return res.json({
      success: true,
      message: `Diagnostic email successfully sent to ${to}`,
      config
    });
  } catch (error) {
    logger.error('Diagnostic email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed.',
      error: error.message,
      code: error.code,
      config
    });
  }
});

// Automated Daily Email Batch Manual Trigger Endpoint
app.get('/api/trigger-email-batch', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 300, 300);
    logger.info(`[Admin Request] Manual trigger for email batch dispatch requested (limit: ${limit})`);
    
    if (req.query.async === 'true') {
      dispatchBatch(limit).catch(err => logger.error('[Async Batch Error]:', err));
      return res.json({
        success: true,
        message: `Batch dispatch of ${limit} emails started in the background. Check logs for delivery progress.`
      });
    }

    const result = await dispatchBatch(limit);
    return res.json({
      success: result.success,
      message: result.message || `Dispatched ${result.sentCount} emails. (${result.failCount || 0} failed)`,
      data: result
    });
  } catch (error) {
    logger.error('Email batch trigger failed:', error);
    res.status(500).json({ success: false, error: error.message });
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

// Run auto-close periodically (every 2 minutes) to enforce scheduled end times while saving compute
const autoCloseInterval = setInterval(async () => {
  try {
    await autoCloseExpiredExams();
  } catch (err) {
    logger.error('Auto-close exams interval error:', err);
  }
}, 120000);

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
  startDailyEmailScheduler();

  // High-concurrency write-behind autosave flusher (persists buffered answers in bulk)
  const { startAutosaveFlusher } = require('./services/autosaveBufferService');
  startAutosaveFlusher(4000);

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
