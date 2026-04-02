// services/liveMonitoringService.js
const { io } = require('socket.io');

class LiveMonitoringService {
  constructor() {
    this.activeMonitoringSessions = new Map(); // examId -> Set of admin sockets
    this.studentSessions = new Map(); // studentId -> socket
    this.examData = new Map(); // examId -> exam data
  }

  initialize(server) {
    this.io = new io(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    console.log('🔴 Live monitoring service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      // Admin joins exam monitoring
      socket.on('join-exam-monitoring', (data) => {
        const { examId, token } = data;
        
        // Verify admin token (simplified for demo)
        this.verifyAdminToken(token).then(isValid => {
          if (isValid) {
            socket.join(`exam-monitoring-${examId}`);
            
            if (!this.activeMonitoringSessions.has(examId)) {
              this.activeMonitoringSessions.set(examId, new Set());
            }
            this.activeMonitoringSessions.get(examId).add(socket.id);

            socket.emit('monitoring-joined', { examId });
            console.log(`👁️ Admin ${socket.id} joined monitoring for exam ${examId}`);
          } else {
            socket.emit('error', { message: 'Invalid admin token' });
          }
        });
      });

      // Admin leaves exam monitoring
      socket.on('leave-exam-monitoring', (data) => {
        const { examId } = data;
        
        socket.leave(`exam-monitoring-${examId}`);
        
        if (this.activeMonitoringSessions.has(examId)) {
          this.activeMonitoringSessions.get(examId).delete(socket.id);
        }

        socket.emit('monitoring-left', { examId });
        console.log(`👁️ Admin ${socket.id} left monitoring for exam ${examId}`);
      });

      // Student joins exam
      socket.on('join-exam', (data) => {
        const { examId, studentId, sessionId } = data;
        
        socket.join(`exam-${examId}`);
        socket.join(`student-${studentId}`);
        
        this.studentSessions.set(studentId, socket);
        
        // Notify admins
        this.broadcastToExamMonitoring(examId, 'student-joined', {
          examId,
          studentId,
          sessionId,
          timestamp: new Date().toISOString()
        });

        socket.emit('exam-joined', { examId, sessionId });
        console.log(`👨‍🎓 Student ${studentId} joined exam ${examId}`);
      });

      // Student activity updates
      socket.on('student-activity', (data) => {
        const { examId, studentId, activity } = data;
        
        // Broadcast to monitoring admins
        this.broadcastToExamMonitoring(examId, 'student-activity', {
          examId,
          studentId,
          activity,
          timestamp: new Date().toISOString()
        });

        console.log(`📊 Activity update for student ${studentId}:`, activity);
      });

      // Violation alerts
      socket.on('violation-alert', (data) => {
        const { examId, studentId, violation } = data;
        
        // Broadcast to monitoring admins
        this.broadcastToExamMonitoring(examId, 'violation-alert', {
          examId,
          studentId,
          studentName: violation.studentName,
          violation,
          timestamp: new Date().toISOString()
        });

        // Check for high-risk violations
        if (violation.severity === 'high') {
          this.broadcastToExamMonitoring(examId, 'high-risk-alert', {
            examId,
            studentId,
            studentName: violation.studentName,
            violation,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`⚠️ Violation alert for student ${studentId}:`, violation);
      });

      // Camera feed updates
      socket.on('camera-feed', (data) => {
        const { examId, studentId, imageData } = data;
        
        // Broadcast to monitoring admins
        this.broadcastToExamMonitoring(examId, 'camera-feed', {
          examId,
          studentId,
          imageData,
          timestamp: new Date().toISOString()
        });
      });

      // Admin sends warning
      socket.on('send-warning', (data) => {
        const { examId, studentId, message, severity } = data;
        
        // Send to student
        this.sendToStudent(studentId, 'warning-received', {
          examId,
          message,
          severity,
          timestamp: new Date().toISOString()
        });

        // Broadcast to other admins
        socket.to(`exam-monitoring-${examId}`).emit('warning-sent', {
          examId,
          studentId,
          message,
          severity,
          sentBy: socket.id,
          timestamp: new Date().toISOString()
        });

        console.log(`⚠️ Warning sent to student ${studentId}: ${message}`);
      });

      // Admin terminates student exam
      socket.on('terminate-exam', (data) => {
        const { examId, studentId, reason } = data;
        
        // Send to student
        this.sendToStudent(studentId, 'exam-terminated', {
          examId,
          reason,
          timestamp: new Date().toISOString()
        });

        // Broadcast to other admins
        socket.to(`exam-monitoring-${examId}`).emit('student-terminated', {
          examId,
          studentId,
          reason,
          terminatedBy: socket.id,
          timestamp: new Date().toISOString()
        });

        console.log(`🚫 Exam terminated for student ${studentId}: ${reason}`);
      });

      // Student submits exam
      socket.on('exam-submitted', (data) => {
        const { examId, studentId, sessionId } = data;
        
        // Broadcast to monitoring admins
        this.broadcastToExamMonitoring(examId, 'student-submitted', {
          examId,
          studentId,
          sessionId,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ Student ${studentId} submitted exam ${examId}`);
      });

      // Student disconnects
      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
        
        // Find and remove student session
        for (const [studentId, studentSocket] of this.studentSessions.entries()) {
          if (studentSocket.id === socket.id) {
            this.studentSessions.delete(studentId);
            
            // Notify admins
            for (const [examId, admins] of this.activeMonitoringSessions.entries()) {
              if (admins.has(socket.id)) {
                this.broadcastToExamMonitoring(examId, 'student-disconnected', {
                  studentId,
                  timestamp: new Date().toISOString()
                });
              }
            }
            break;
          }
        }

        // Remove from admin monitoring sessions
        for (const [examId, admins] of this.activeMonitoringSessions.entries()) {
          admins.delete(socket.id);
        }
      });
    });
  }

  // Helper methods
  async verifyAdminToken(token) {
    // In a real implementation, verify JWT token with admin role
    // For demo, we'll just return true
    return true;
  }

  broadcastToExamMonitoring(examId, event, data) {
    this.io.to(`exam-monitoring-${examId}`).emit(event, data);
  }

  sendToStudent(studentId, event, data) {
    this.io.to(`student-${studentId}`).emit(event, data);
  }

  // Public API methods
  emitViolationAlert(examId, studentId, violation) {
    this.broadcastToExamMonitoring(examId, 'violation-alert', {
      examId,
      studentId,
      violation,
      timestamp: new Date().toISOString()
    });
  }

  emitStudentActivity(examId, studentId, activity) {
    this.broadcastToExamMonitoring(examId, 'student-activity', {
      examId,
      studentId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  emitCameraFeed(examId, studentId, imageData) {
    this.broadcastToExamMonitoring(examId, 'camera-feed', {
      examId,
      studentId,
      imageData,
      timestamp: new Date().toISOString()
    });
  }

  getMonitoringStats(examId) {
    const adminCount = this.activeMonitoringSessions.get(examId)?.size || 0;
    return {
      activeAdmins: adminCount,
      totalConnected: this.io.engine.clientsCount
    };
  }
}

// Singleton instance
const liveMonitoringService = new LiveMonitoringService();

module.exports = liveMonitoringService;
