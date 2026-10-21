// backend/socket/examSocketHandlers.js
// Production Socket.IO Handlers & Middleware for ExamShield

const jwt = require('jsonwebtoken');

function attachSocketHandlers(io, options = {}) {
  const logger = options.logger || console;
  const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
  const MAX_PROCTOR_STREAMS = parseInt(process.env.MAX_PROCTOR_STREAMS || '4', 10);

  // In-memory state tracking
  const activeExamSessions = new Map(); // sessionId -> {studentId, examId, collegeId, status}
  const proctorSubscriptions = new Map(); // socketId -> Set<studentId>
  const studentSubscribers = new Map(); // studentId -> Set<socketId>
  const studentThumbnails = new Map(); // examId -> Map(studentId -> { studentId, sessionId, imageData, faceCount, audioLevel, timestamp, isIncident })

  // Automatic session memory sweeper (evicts inactive sessions > 1 hour)
  const sweeperInterval = setInterval(() => {
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
  }, 10 * 60 * 1000);
  if (sweeperInterval.unref) sweeperInterval.unref();

  // Exam ownership cache with 5-minute TTL to minimize database queries during high concurrency
  const examCollegeCache = new Map();
  async function getExamCollegeId(examId) {
    if (!examId) return null;
    const cached = examCollegeCache.get(examId);
    if (cached && cached.expiresAt > Date.now()) return cached.collegeId;
    try {
      const { pool } = require('../config/database');
      if (pool) {
        const { rows } = await pool.query('SELECT college_id FROM exams WHERE id = $1', [examId]);
        if (rows.length > 0) {
          examCollegeCache.set(examId, { collegeId: rows[0].college_id, expiresAt: Date.now() + 5 * 60 * 1000 });
          return rows[0].college_id;
        }
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
      const decoded = jwt.verify(token, JWT_SECRET);
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
        activeExamSessions.set(sessionId, {
          sessionId,
          studentId: verifiedStudentId,
          studentName: studentName || 'Candidate',
          examId,
          socketId: socket.id,
          status: 'active',
          connectedAt: new Date(),
          lastHeartbeat: new Date(),
        });
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
      
      // Send current active sessions
      const sessions = Array.from(activeExamSessions.entries())
        .filter(([, s]) => s.examId === examId)
        .map(([id, data]) => ({ sessionId: id, ...data }));
      
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
      const wasEmpty = subs.size === 0;
      subs.add(socket.id);

      // Join dedicated room for this student's video stream
      socket.join(`stream-${studentId}`);

      // If first subscriber, signal student device to start transmitting frames
      if (wasEmpty) {
        io.to(`student-${studentId}`).emit('stream-requested', { studentId, active: true });
        logger.info(`Live video requested for student ${studentId} (1st subscriber: ${socket.id})`);
      } else {
        logger.info(`Shared stream subscription for student ${studentId} (total subscribers: ${subs.size})`);
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
    socket.on('unsubscribe-student-stream', ({ studentId, tileIndex }) => {
      if (!studentId) return;

      socket.leave(`stream-${studentId}`);

      const activeSubs = proctorSubscriptions.get(socket.id);
      if (activeSubs) {
        activeSubs.delete(studentId);
      }

      const subs = studentSubscribers.get(studentId);
      if (subs) {
        subs.delete(socket.id);
        if (subs.size === 0) {
          studentSubscribers.delete(studentId);
          // Zero active proctors watching: signal student device to halt video upload immediately
          io.to(`student-${studentId}`).emit('stream-requested', { studentId, active: false });
          logger.info(`Live video halted for student ${studentId} (0 subscribers)`);
        }
      }

      socket.emit('stream-unsubscribed', {
        studentId,
        tileIndex,
        activeCount: activeSubs ? activeSubs.size : 0,
      });
    });

    // Camera feed stream: Transmitted ONLY when a proctor is actively subscribed!
    socket.on('camera-feed', ({ examId, studentId, sessionId, imageData, timestamp }) => {
      if (!examId || !imageData) return;

      // Anchor student identity to verified token identity
      const verifiedStudentId = (socket.user && socket.user.role === 'student') ? socket.user.id : studentId;
      if (!verifiedStudentId) return;
      if (socket.user && socket.user.role === 'student' && studentId && String(studentId) !== String(socket.user.id)) {
        logger.warn(`Spoofed camera-feed frame rejected from student ${socket.user.id} pretending to be ${studentId}`);
        return;
      }

      const subs = studentSubscribers.get(verifiedStudentId);
      if (!subs || subs.size === 0) {
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

      // Volatile emit ONLY to subscribed proctors in room `stream-${verifiedStudentId}`
      io.to(`stream-${verifiedStudentId}`).volatile.emit('camera-feed', feedPayload);
    });

    // Incident evidence monitoring snapshot
    socket.on('monitoring-snapshot', ({ examId, studentId, sessionId, imageData, faceCount, audioLevel, timestamp, isIncident }) => {
      if (!examId || !studentId || !imageData) return;

      if (isIncident) {
        if (!studentThumbnails.has(examId)) {
          studentThumbnails.set(examId, new Map());
        }
        const examThumbMap = studentThumbnails.get(examId);
        if (examThumbMap.size >= 80 && !examThumbMap.has(studentId)) {
          const oldestKey = examThumbMap.keys().next().value;
          examThumbMap.delete(oldestKey);
        }
        examThumbMap.set(studentId, {
          studentId,
          sessionId,
          imageData,
          faceCount: typeof faceCount === 'number' ? faceCount : 1,
          audioLevel: typeof audioLevel === 'number' ? audioLevel : 0,
          timestamp: timestamp || Date.now(),
          isIncident: true,
        });

        // Check if any admin or proctor is watching
        const rooms = io.sockets.adapter?.rooms;
        const adminRoom = rooms ? rooms.get(`admin-exam-${examId}`) : null;
        const monitorRoom = rooms ? rooms.get(`exam-monitoring-${examId}`) : null;
        const hasAdmins = (adminRoom && adminRoom.size > 0) || (monitorRoom && monitorRoom.size > 0);

        if (hasAdmins) {
          const snapshotPayload = {
            examId,
            studentId,
            sessionId,
            imageData,
            faceCount,
            audioLevel,
            timestamp: timestamp || Date.now(),
            isIncident: true,
          };
          io.to(`admin-exam-${examId}`).to(`exam-monitoring-${examId}`).volatile.emit('candidate-snapshot', snapshotPayload);
        }
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

    // Student telemetry update
    socket.on('student-activity', ({ examId, studentId, sessionId, activity }) => {
      if (!examId || !studentId) return;

      const rooms = io.sockets.adapter?.rooms;
      const adminRoom = rooms ? rooms.get(`admin-exam-${examId}`) : null;
      const monitorRoom = rooms ? rooms.get(`exam-monitoring-${examId}`) : null;
      const hasAdmins = (adminRoom && adminRoom.size > 0) || (monitorRoom && monitorRoom.size > 0);

      if (hasAdmins) {
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
      }
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

    // Heartbeat
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

    // Disconnect handler with comprehensive cleanup of video subscriptions
    socket.on('disconnect', () => {
      const activeSubs = proctorSubscriptions.get(socket.id);
      if (activeSubs && activeSubs.size > 0) {
        for (const studentId of activeSubs) {
          const subs = studentSubscribers.get(studentId);
          if (subs) {
            subs.delete(socket.id);
            if (subs.size === 0) {
              studentSubscribers.delete(studentId);
              io.to(`student-${studentId}`).emit('stream-requested', { studentId, active: false });
              logger.info(`Live video stopped for student ${studentId} (proctor disconnected)`);
            }
          }
        }
        proctorSubscriptions.delete(socket.id);
      }

      for (const [sessionId, data] of activeExamSessions.entries()) {
        if (data.socketId === socket.id) {
          const studentId = data.studentId;
          const examId = data.examId;

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
          break;
        }
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return {
    activeExamSessions,
    proctorSubscriptions,
    studentSubscribers,
    studentThumbnails,
  };
}

module.exports = { attachSocketHandlers };
