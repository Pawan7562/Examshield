import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const LiveMonitoring = ({ examId, examName }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [violations, setViolations] = useState({});
  const [warningModal, setWarningModal] = useState({ open: false, studentId: null, message: '' });
  const [terminateModal, setTerminateModal] = useState({ open: false, studentId: null, reason: '' });
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, warnings: 0, terminated: 0 });
  const videoRefs = useRef({});

  useEffect(() => {
    // Initialize WebSocket connection for real-time monitoring
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('accessToken'),
        role: 'admin'
      }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to monitoring server');
      // Join exam room for real-time updates
      newSocket.emit('join-exam-monitoring', { examId });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from monitoring server');
    });

    // Real-time student activity updates
    newSocket.on('student-activity', (data) => {
      updateStudentActivity(data);
    });

    // Violation alerts
    newSocket.on('violation-alert', (data) => {
      handleViolationAlert(data);
    });

    // Camera feed updates
    newSocket.on('camera-feed', (data) => {
      updateCameraFeed(data);
    });

    // Exam status updates
    newSocket.on('exam-status-update', (data) => {
      updateExamStatus(data);
    });

    setSocket(newSocket);

    // Fetch initial student data
    fetchStudentData();

    return () => {
      newSocket.emit('leave-exam-monitoring', { examId });
      newSocket.disconnect();
    };
  }, [examId]);

  const fetchStudentData = async () => {
    try {
      const response = await adminAPI.getMonitoringData(examId);
      const data = response.data;
      
      setStudents(data.students || []);
      setViolations(data.violations || {});
      setStats({
        total: data.totalStudents || 0,
        active: data.activeStudents || 0,
        warnings: data.totalWarnings || 0,
        terminated: data.terminatedStudents || 0
      });
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      toast.error('Failed to load monitoring data');
    }
  };

  const updateStudentActivity = (data) => {
    setStudents(prev => prev.map(student => 
      student.id === data.studentId 
        ? { ...student, ...data.activity, lastSeen: new Date() }
        : student
    ));
  };

  const handleViolationAlert = (data) => {
    setViolations(prev => ({
      ...prev,
      [data.studentId]: [...(prev[data.studentId] || []), data.violation]
    }));
    
    // Show toast notification for serious violations
    if (data.violation.severity === 'high') {
      toast.error(`🚨 High-risk violation detected for ${data.studentName}`, {
        duration: 5000
      });
    }
  };

  const updateCameraFeed = (data) => {
    // Update video feed for student
    if (videoRefs.current[data.studentId]) {
      const videoElement = videoRefs.current[data.studentId];
      if (data.imageData) {
        videoElement.src = `data:image/jpeg;base64,${data.imageData}`;
      }
    }
  };

  const updateExamStatus = (data) => {
    setStats(prev => ({
      ...prev,
      ...data.stats
    }));
  };

  const sendWarning = () => {
    if (!warningModal.studentId || !warningModal.message.trim()) return;

    socket?.emit('send-warning', {
      examId,
      studentId: warningModal.studentId,
      message: warningModal.message,
      severity: 'medium'
    });

    toast.success('Warning sent to student');
    setWarningModal({ open: false, studentId: null, message: '' });
  };

  const terminateExam = () => {
    if (!terminateModal.studentId || !terminateModal.reason.trim()) return;

    socket?.emit('terminate-exam', {
      examId,
      studentId: terminateModal.studentId,
      reason: terminateModal.reason
    });

    toast.success('Exam terminated for student');
    setTerminateModal({ open: false, studentId: null, reason: '' });
  };

  const getActivityColor = (activity) => {
    if (!activity) return '#6b7280';
    
    switch (activity.status) {
      case 'active': return '#22c55e';
      case 'idle': return '#f59e0b';
      case 'suspicious': return '#ef4444';
      case 'terminated': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getActivityStatus = (activity) => {
    if (!activity) return 'Unknown';
    
    switch (activity.status) {
      case 'active': return 'Active';
      case 'idle': return 'Idle';
      case 'suspicious': return 'Suspicious';
      case 'terminated': return 'Terminated';
      default: return 'Unknown';
    }
  };

  const getViolationCount = (studentId) => {
    return violations[studentId]?.length || 0;
  };

  const getLatestViolation = (studentId) => {
    const studentViolations = violations[studentId] || [];
    return studentViolations[studentViolations.length - 1];
  };

  return (
    <div style={{ 
      background: '#0a0a0f', 
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: 12, 
      padding: 24,
      fontFamily: 'Sora, sans-serif',
      color: '#e2e8f0'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
            📹 Live Monitoring - {examName}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: connected ? '#22c55e' : '#ef4444',
              animation: connected ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{ fontSize: 12, color: connected ? '#22c55e' : '#ef4444' }}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{stats.total}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>Total Students</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>Active</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.warnings}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>Warnings</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{stats.terminated}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>Terminated</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Student Grid */}
        <div>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#a0aec0', 
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Student Activity ({students.length})
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 16,
            maxHeight: '600px',
            overflowY: 'auto',
            paddingRight: 8
          }}>
            {students.map(student => (
              <div 
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: selectedStudent?.id === student.id 
                    ? '2px solid #e94560' 
                    : '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: 8, 
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(233,69,96,0.3)';
                  e.target.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = selectedStudent?.id === student.id 
                    ? '#e94560' 
                    : 'rgba(255,255,255,0.06)';
                  e.target.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                {/* Status Indicator */}
                <div style={{ 
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getActivityColor(student.activity)
                }}></div>

                {/* Student Info */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#718096' }}>
                    {student.email} • {student.studentId}
                  </div>
                </div>

                {/* Activity Status */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: getActivityColor(student.activity),
                    background: `${getActivityColor(student.activity)}15`,
                    padding: '2px 8px',
                    borderRadius: 12
                  }}>
                    {getActivityStatus(student.activity)}
                  </span>
                  <span style={{ fontSize: 10, color: '#718096' }}>
                    {student.lastSeen ? 
                      new Date(student.lastSeen).toLocaleTimeString() : 
                      'No activity'
                    }
                  </span>
                </div>

                {/* Current Question */}
                {student.activity?.currentQuestion && (
                  <div style={{ 
                    fontSize: 11, 
                    color: '#718096', 
                    marginBottom: 8,
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 4
                  }}>
                    Question {student.activity.currentQuestion + 1} of {student.activity.totalQuestions}
                  </div>
                )}

                {/* Violations */}
                {getViolationCount(student.id) > 0 && (
                  <div style={{ 
                    fontSize: 11, 
                    color: '#ef4444',
                    marginBottom: 8,
                    padding: '4px 8px',
                    background: 'rgba(239,68,68,0.1)',
                    borderRadius: 4,
                    border: '1px solid rgba(239,68,68,0.3)'
                  }}>
                    ⚠️ {getViolationCount(student.id)} violation(s)
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWarningModal({ open: true, studentId: student.id, message: '' });
                    }}
                    style={{ 
                      flex: 1,
                      background: 'rgba(245,158,11,0.1)', 
                      border: '1px solid rgba(245,158,11,0.3)', 
                      borderRadius: 4, 
                      padding: '6px 8px', 
                      color: '#f59e0b', 
                      cursor: 'pointer', 
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    ⚠️ Warn
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTerminateModal({ open: true, studentId: student.id, reason: '' });
                    }}
                    style={{ 
                      flex: 1,
                      background: 'rgba(239,68,68,0.1)', 
                      border: '1px solid rgba(239,68,68,0.3)', 
                      borderRadius: 4, 
                      padding: '6px 8px', 
                      color: '#ef4444', 
                      cursor: 'pointer', 
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    🚫 Terminate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Student Details */}
        {selectedStudent && (
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: 8, 
            padding: 16,
            height: 'fit-content'
          }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#a0aec0', 
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Student Details
            </div>

            {/* Student Info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: 11, color: '#718096', marginBottom: 2 }}>
                {selectedStudent.email}
              </div>
              <div style={{ fontSize: 11, color: '#718096' }}>
                ID: {selectedStudent.studentId}
              </div>
            </div>

            {/* Camera Feed */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#718096', 
                marginBottom: 8 
              }}>
                📹 Camera Feed
              </div>
              <div style={{ 
                background: '#000', 
                borderRadius: 8, 
                height: 200, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <video
                  ref={el => videoRefs.current[selectedStudent.id] = el}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: 8
                  }}
                  autoPlay
                  muted
                />
                {!selectedStudent.activity?.cameraActive && (
                  <div style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    Camera Off
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#718096', 
                marginBottom: 8 
              }}>
                📊 Activity Timeline
              </div>
              <div style={{ fontSize: 11, color: '#718096' }}>
                {selectedStudent.activity ? (
                  <div>
                    <div>Started: {new Date(selectedStudent.activity.startTime).toLocaleTimeString()}</div>
                    <div>Current: Question {selectedStudent.activity.currentQuestion + 1}</div>
                    <div>Time: {selectedStudent.activity.timeSpent}s</div>
                    <div>Status: {getActivityStatus(selectedStudent.activity)}</div>
                  </div>
                ) : (
                  <div>No activity data available</div>
                )}
              </div>
            </div>

            {/* Violations */}
            {getViolationCount(selectedStudent.id) > 0 && (
              <div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: '#718096', 
                  marginBottom: 8 
                }}>
                  ⚠️ Violations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {violations[selectedStudent.id]?.map((violation, i) => (
                    <div 
                      key={i}
                      style={{ 
                        fontSize: 10, 
                        color: '#ef4444',
                        padding: '4px 8px',
                        background: 'rgba(239,68,68,0.1)',
                        borderRadius: 4,
                        border: '1px solid rgba(239,68,68,0.3)'
                      }}
                    >
                      {new Date(violation.timestamp).toLocaleTimeString()} - {violation.type}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning Modal */}
      {warningModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#0e0e1a',
            border: '1px solid rgba(233,69,96,0.3)',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 400
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
              Send Warning to Student
            </h3>
            <textarea
              value={warningModal.message}
              onChange={(e) => setWarningModal(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter warning message..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '12px',
                color: '#e2e8f0',
                fontSize: 14,
                fontFamily: 'Sora, sans-serif',
                resize: 'vertical',
                marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setWarningModal({ open: false, studentId: null, message: '' })}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '10px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendWarning}
                disabled={!warningModal.message.trim()}
                style={{
                  flex: 1,
                  background: warningModal.message.trim() ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                  border: warningModal.message.trim() ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px',
                  color: warningModal.message.trim() ? '#f59e0b' : '#6b7280',
                  cursor: warningModal.message.trim() ? 'pointer' : 'default',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {terminateModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#0e0e1a',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 400
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
              Terminate Student's Exam
            </h3>
            <p style={{ fontSize: 12, color: '#718096', marginBottom: 16 }}>
              This action cannot be undone. The student's exam will be immediately terminated and submitted.
            </p>
            <textarea
              value={terminateModal.reason}
              onChange={(e) => setTerminateModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for termination..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '12px',
                color: '#e2e8f0',
                fontSize: 14,
                fontFamily: 'Sora, sans-serif',
                resize: 'vertical',
                marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setTerminateModal({ open: false, studentId: null, reason: '' })}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '10px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={terminateExam}
                disabled={!terminateModal.reason.trim()}
                style={{
                  flex: 1,
                  background: terminateModal.reason.trim() ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  border: terminateModal.reason.trim() ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px',
                  color: terminateModal.reason.trim() ? '#ef4444' : '#6b7280',
                  cursor: terminateModal.reason.trim() ? 'pointer' : 'default',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Terminate Exam
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LiveMonitoring;
