// src/pages/student/ExamRoom.js — Professional Online Examination & Monitoring Environment
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfessionalProctoring from '../../components/ProfessionalProctoring';
import MCQQuestion from '../../components/MCQQuestion';
import SubjectiveQuestion from '../../components/SubjectiveQuestion';
import CodingQuestion from '../../components/CodingQuestion';
import Timer from '../../components/Timer';
import { parseToIST, formatIST } from '../../utils/timezone';
import './ExamRoom.css';
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Info,
  X,
  Send,
  HelpCircle,
  User,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';

// ─── Toast Notification Helpers ───────────────────────────────────────────────
const notify = {
  warn: (msg) => toast(msg, {
    icon: '⚠️',
    style: {
      background: '#fffbeb',
      color: '#b45309',
      border: '1.5px solid #fde68a',
      fontWeight: 600,
      fontSize: '0.88rem',
      borderRadius: '10px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
    },
    duration: 5000,
  }),
  error: (msg) => toast.error(msg, {
    style: {
      background: '#fef2f2',
      color: '#b91c1c',
      border: '1.5px solid #fecaca',
      fontWeight: 600,
      fontSize: '0.88rem',
      borderRadius: '10px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
    },
    duration: 6000,
  }),
  success: (msg) => toast.success(msg, {
    style: {
      background: '#f0fdf4',
      color: '#15803d',
      border: '1.5px solid #bbf7d0',
      fontWeight: 600,
      fontSize: '0.88rem',
      borderRadius: '10px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
    },
    duration: 4000,
  }),
  info: (msg) => toast(msg, {
    icon: 'ℹ️',
    style: {
      background: '#eff6ff',
      color: '#1d4ed8',
      border: '1.5px solid #bfdbfe',
      fontWeight: 600,
      fontSize: '0.88rem',
      borderRadius: '10px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
    },
    duration: 4000,
  }),
};

// ─── Tab Warning Overlay Component ─────────────────────────────────────────────
function TabWarningOverlay({ count, onDismiss }) {
  if (count === 0) return null;
  const isFinal = count >= 3;
  return (
    <div className="er-modal-backdrop" style={{ zIndex: 9999 }}>
      <div className="er-modal-card" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div
          className="er-modal-icon-wrap"
          style={{
            background: isFinal ? '#fef2f2' : '#fffbeb',
            color: isFinal ? '#ef4444' : '#f59e0b',
          }}
        >
          {isFinal ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
        </div>
        <h2 className="er-modal-title" style={{ color: isFinal ? '#dc2626' : '#d97706' }}>
          {isFinal ? 'Examination Terminated' : `Tab Switch Warning (${count}/3)`}
        </h2>
        <p className="er-modal-subtitle" style={{ marginTop: 8 }}>
          {isFinal
            ? 'You have exceeded the maximum permissible tab/window switches. Your exam is being automatically submitted.'
            : count === 2
              ? 'This is your FINAL warning. One more navigation away from this window will automatically submit your exam.'
              : 'Switching away from the examination window is strictly prohibited. This security violation has been logged.'}
        </p>

        <div style={{
          marginTop: 20,
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '0.82rem',
          color: '#64748b'
        }}>
          All security telemetry is recorded and verified by your institution's examination committee.
        </div>

        {!isFinal && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={onDismiss}
              className="er-btn-save-next"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: 44,
                background: count === 2
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: 'none'
              }}
            >
              I Understand — Return to Exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ExamRoom Component ───────────────────────────────────────────────────
export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Core State ──
  const [phase, setPhase] = useState('key'); // 'key' | 'waiting' | 'exam' | 'submitted'
  const [examData, setExamData] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [reviewed, setReviewed] = useState({}); // { [qId]: boolean }
  const [currentQ, setCurrentQ] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [examKey, setExamKey] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Modals State ──
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // ── Proctoring State ──
  const [violationCount, setViolationCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [faceAlert, setFaceAlert] = useState(null); // null | 'no_face' | 'multiple_faces'
  const [proctorWarning, setProctorWarning] = useState(null);
  const [broadcastAlert, setBroadcastAlert] = useState(null);

  // ── Refs ──
  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const submittedRef = useRef(false);
  const sessionRef = useRef(null);

  // Keep session ref current
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ─── Fullscreen Handlers ──────────────────────────────────────────────────────
  const enterFullScreen = useCallback(() => {
    try {
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (fn) {
        fn.call(el)
          .then(() => setIsFullscreen(true))
          .catch(() => { });
      }
    } catch (_) { }
  }, []);

  const exitFullScreen = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
    if (isCurrentlyFullscreen) {
      const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      try {
        if (fn) fn.call(document).catch(() => { });
      } catch (_) { }
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullScreen = () => {
    if (isFullscreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  };

  // ─── Exam Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submittedRef.current) return;

    submittedRef.current = true;
    setSubmitted(true);
    setShowSubmitModal(false);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);

    try {
      const response = await studentAPI.submitExam(examId, {
        sessionId: sessionRef.current?.id,
        autoSubmit,
        violationCount,
        tabSwitchCount: tabSwitchCountRef.current,
        terminationReason: autoSubmit ? 'auto_submit' : 'manual',
        submissionTime: new Date().toISOString(),
      });

      if (response.success) {
        notify.success('Exam submitted successfully!');
        setResult(response.data);
        setPhase('submitted');
        setTimeout(exitFullScreen, 1200);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      notify.error('Submission encountered an issue. Please try again.');
      submittedRef.current = false;
      setSubmitted(false);
    }
  }, [examId, violationCount, exitFullScreen]);

  // ─── Face Violation Handler (from ProfessionalProctoring) ────────────────────
  const handleFaceViolation = useCallback((type) => {
    setFaceAlert(type);
    setViolationCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        notify.error('Too many proctoring violations recorded. Exam is being auto-submitted.');
        handleSubmit(true);
      }
      return next;
    });
    setTimeout(() => setFaceAlert(null), 5000);
  }, [handleSubmit]);

  // ─── Tab Switch Detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;

    let isBlurred = false;
    let effectStartTime = Date.now();

    const recordViolation = () => {
      // Grace period: ignore blur during the first 3 seconds of entering the exam room (fullscreen transition)
      if (Date.now() - effectStartTime < 3000) return;

      tabSwitchCountRef.current += 1;
      setTabSwitchCount(tabSwitchCountRef.current);

      if (socketRef.current && sessionRef.current) {
        socketRef.current.emit('violation', {
          sessionId: sessionRef.current.id,
          type: 'tab_switch',
          details: `Tab/Window switch #${tabSwitchCountRef.current}`,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleHide = () => {
      if (!isBlurred) {
        isBlurred = true;
        recordViolation();
      }
    };

    const handleShow = () => {
      if (isBlurred) {
        isBlurred = false;
        const n = tabSwitchCountRef.current;
        if (n > 0 && n < 3) {
          setShowTabWarning(true);
        } else if (n >= 3 && !submittedRef.current) {
          handleSubmit(true);
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleHide();
      else if (document.visibilityState === 'visible') handleShow();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleHide);
    window.addEventListener('focus', handleShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleHide);
      window.removeEventListener('focus', handleShow);
    };
  }, [phase, handleSubmit]);

  // ─── Fullscreen Event Listener ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;
    const check = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs && phase === 'exam' && !submittedRef.current) {
        notify.warn('Exam must be taken in Full-Screen mode.');
      }
    };
    document.addEventListener('fullscreenchange', check);
    document.addEventListener('webkitfullscreenchange', check);
    return () => {
      document.removeEventListener('fullscreenchange', check);
      document.removeEventListener('webkitfullscreenchange', check);
    };
  }, [phase]);

  // ─── Context Menu & Shortcut Blocker ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;
    const onCtx = (e) => { e.preventDefault(); return false; };
    const onKey = (e) => {
      const blocked = ['c', 'v', 'x', 'a', 's', 'r', 'n', 't', 'w', 'i', 'p', 'u', 'j', 'k'];
      if ((e.ctrlKey || e.metaKey) && blocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        notify.warn(`Shortcut "${e.key.toUpperCase()}" is disabled during examination`);
      }
      if (/^F\d+$/.test(e.key) && e.key !== 'F11') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('keydown', onKey);
    };
  }, [phase]);

  // ─── Socket.IO Real-time Proctoring ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam' || !session) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = process.env.REACT_APP_WS_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://examshield-1-an7c.onrender.com');
    const socket = io(wsUrl, { auth: { token }, reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Proctoring connection established for session:', session.id);
      socket.emit('join-exam', {
        sessionId: session.id,
        examId,
        studentId: user?.id,
        studentName: user?.name || 'Candidate',
      });
    });

    // Heartbeat every 12s
    const hbInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', {
          sessionId: session.id,
          examId,
          studentId: user?.id,
        });
      }
    }, 12000);

    // Official Warning received from proctor
    socket.on('warning-received', (data) => {
      if (!data.studentId || data.studentId === user?.id) {
        setProctorWarning(data);
        notify.warn(`PROCTOR WARNING: ${data.message}`);
      }
    });

    // Broadcast announcement received from proctor
    socket.on('broadcast-received', (data) => {
      setBroadcastAlert(data);
      setTimeout(() => setBroadcastAlert(null), 14000);
    });

    // Immediate Termination from proctor
    socket.on('exam-terminated', (data) => {
      if (!data.studentId || data.studentId === user?.id) {
        notify.error(`Exam Terminated by Proctor: ${data.reason || 'Policy Violation'}`);
        handleSubmit(true);
      }
    });

    socket.on('violation_update', (data) => {
      if (data.sessionId === sessionRef.current?.id) {
        setViolationCount(data.violationCount ?? 0);
      }
    });

    return () => {
      clearInterval(hbInterval);
      socket.disconnect();
    };
  }, [phase, session, examId, user?.id, user?.name, handleSubmit]);

  // ─── Periodic Auto-save ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam' || !session || submitted) return;
    autoSaveRef.current = setInterval(() => {
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (!answer) return;
        const q = questions.find(q => q.id === questionId);
        if (!q) return;
        studentAPI.saveAnswer(examId, {
          sessionId: session.id, questionId,
          ...(q.type === 'mcq' ? { selectedOption: answer } :
            q.type === 'coding' ? { codeSubmission: answer } :
              { answerText: answer }),
        }).catch(() => { });
      });
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [phase, session, submitted, answers, questions, examId]);

  // ─── Fetch Exam Details ───────────────────────────────────────────────────────
  useEffect(() => {
    if (examId && phase === 'key') {
      studentAPI.getExamDetails(examId)
        .then(r => {
          if (r.success && r.data) {
            setExamData(r.data);
            const key = r.data.exam?.exam_code || r.data.exam?.exam_key;
            if (key) {
              setExamKey(String(key).trim().toUpperCase());
            }
          }
        })
        .catch(() => { });
    }
  }, [examId, phase]);

  // ─── Answer Handler ───────────────────────────────────────────────────────────
  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    const q = questions.find(q => q.id === questionId);
    if (!q || !session) return;
    studentAPI.saveAnswer(examId, {
      sessionId: session.id, questionId,
      ...(q.type === 'mcq' ? { selectedOption: answer } :
        q.type === 'coding' ? { codeSubmission: answer } :
          { answerText: answer }),
    }).catch(() => { });
  }, [questions, session, examId]);

  // ─── Clear Answer ─────────────────────────────────────────────────────────────
  const handleClearAnswer = (questionId) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    notify.info('Choice cleared');
  };

  // ─── Toggle Review Flag ───────────────────────────────────────────────────────
  const toggleReview = (questionId) => {
    setReviewed(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // ─── Start Exam Logic ─────────────────────────────────────────────────────────
  const triggerBackendStart = useCallback(async (keyToUse) => {
    setIsStartingExam(true);
    try {
      const response = await studentAPI.startExam(examId, { examKey: keyToUse });
      if (response.success) {
        const data = response.data || response;
        setSession(data.session);
        setQuestions(data.questions || []);
        const secs = data.timeRemaining
          || (data.exam?.duration ? Number(data.exam.duration) * 60 : 0)
          || 3600;
        setTimeSeconds(secs);
        setPhase('exam');
        notify.success('Exam session initiated. Good luck!');
      } else {
        if (response.message && response.message.includes('Exam accessible from')) {
          notify.error('Waiting for server scheduled start authorization...');
        } else {
          exitFullScreen();
          setPhase('key');
          notify.error(response.message || 'Invalid exam key. Please verify and try again.');
        }
      }
    } catch (err) {
      if (err?.message && err.message.includes('Exam accessible from')) {
        notify.error('Waiting for server authorization... retrying shortly.');
      } else {
        exitFullScreen();
        setPhase('key');
        console.error('Start exam error:', err);
        notify.error(err?.message || 'Failed to start exam. Check your key and try again.');
      }
    } finally {
      setIsStartingExam(false);
    }
  }, [examId, exitFullScreen]);

  const handleStartExam = useCallback(() => {
    const key = examKey.trim();
    if (!key) { notify.warn('Please enter your exam security key'); return; }

    enterFullScreen();

    if (examData?.exam?.date_time) {
      const start = parseToIST(examData.exam.date_time);
      if (start && Date.now() < start.getTime()) {
        setPhase('waiting');
        return;
      }
    }

    triggerBackendStart(key);
  }, [examKey, examData, enterFullScreen, triggerBackendStart]);

  // Waiting Room Auto-Start Effect (Strictly anchored to IST)
  useEffect(() => {
    if (phase !== 'waiting' || !examData?.exam?.date_time || isStartingExam) return;

    const start = parseToIST(examData.exam.date_time);
    if (!start) return;
    const targetTime = start.getTime();

    const checkAndTrigger = () => {
      if (Date.now() >= targetTime) {
        triggerBackendStart(examKey.trim());
      }
    };

    const interval = setInterval(checkAndTrigger, 3000);
    checkAndTrigger();

    return () => clearInterval(interval);
  }, [phase, examData, examKey, triggerBackendStart, isStartingExam]);

  // ─── Computed Statistics ──────────────────────────────────────────────────────
  const answeredCount = useMemo(() => {
    return questions.filter(q => !!answers[q.id]).length;
  }, [questions, answers]);

  const reviewedCount = useMemo(() => {
    return questions.filter(q => !!reviewed[q.id]).length;
  }, [questions, reviewed]);

  const unansweredCount = useMemo(() => {
    return questions.length - answeredCount;
  }, [questions, answeredCount]);

  const progressPercentage = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);

  // ─── Navigation Handlers ──────────────────────────────────────────────────────
  const handleSaveAndNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // Last question - prompt submit modal
      setShowSubmitModal(true);
    }
  };

  const handleMarkAndNext = () => {
    const qId = questions[currentQ]?.id;
    if (qId) {
      setReviewed(prev => ({ ...prev, [qId]: true }));
    }
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: KEY ENTRY SCREEN ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'key') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '24px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '44px 40px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1.5px solid #e2e8f0',
        }}>
          {/* Logo & Lock Badge */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 24px rgba(10, 116, 218, 0.25)',
            }}>
              <Shield size={32} />
            </div>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: '0 0 6px'
            }}>
              ExamShield Assessment
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              {examData?.exam?.title ? examData.exam.title : 'Secure Online Examination Portal'}
            </p>
          </div>

          {/* Student Profile Identity Chip */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              marginBottom: 24
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#0a74da',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                  {user.name || 'Candidate'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                  ID: {user.roll_number || user.enrollment_number || user.email || 'ES-STUDENT'}
                </div>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '3px 8px',
                borderRadius: 6
              }}>
                Verified
              </span>
            </div>
          )}

          {/* Exam Key Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8
            }}>
              Enter Examination Access Key
            </label>
            <input
              type="text"
              value={examKey}
              onChange={e => setExamKey(e.target.value.toUpperCase())}
              placeholder="e.g. EXAM-8942-ABC"
              disabled={isStartingExam}
              onKeyDown={e => e.key === 'Enter' && handleStartExam()}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 12,
                color: '#0f172a',
                fontSize: '1.05rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                letterSpacing: '2px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#0a74da';
                e.target.style.boxShadow = '0 0 0 3px rgba(10, 116, 218, 0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
            />
          </div>

          {/* Start Exam Button */}
          <button
            onClick={handleStartExam}
            disabled={isStartingExam || !examKey.trim()}
            style={{
              width: '100%',
              height: 48,
              background: isStartingExam || !examKey.trim()
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
              border: 'none',
              borderRadius: 12,
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isStartingExam || !examKey.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: examKey.trim() && !isStartingExam ? '0 4px 14px rgba(10, 116, 218, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isStartingExam ? (
              <span>Validating Examination Credentials...</span>
            ) : (
              <>
                <Send size={18} />
                <span>Verify Key & Enter Examination</span>
              </>
            )}
          </button>

          {/* Security & Instructions Checklist */}
          <div style={{
            marginTop: 24,
            padding: '16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 10
            }}>
              <Info size={14} color="#0a74da" />
              <span>Examination Security Protocol</span>
            </div>
            {[
              'Webcam permission required for continuous AI proctoring',
              'Exam automatically locks into full-screen mode',
              'Tab/window switches monitored (Max 3 switches before auto-submit)',
              'Answers auto-save every 30 seconds to the cloud',
            ].map((rule, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: '0.8rem',
                color: '#64748b',
                lineHeight: 1.5,
                marginBottom: 6
              }}>
                <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: WAITING ROOM ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'waiting') {
    const scheduledTime = parseToIST(examData?.exam?.date_time) || new Date();

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        padding: '24px'
      }}>
        <div className="er-modal-card" style={{ maxWidth: 520, textAlign: 'center' }}>
          <div className="er-modal-icon-wrap" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={32} />
          </div>
          <h1 className="er-modal-title">Waiting Room</h1>
          <p className="er-modal-subtitle">
            You have verified your credentials for <strong>{examData?.exam?.title || 'the examination'}</strong>.
            The exam will launch automatically once the scheduled start time arrives.
          </p>

          <div style={{
            margin: '24px 0',
            padding: '20px',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 14,
            display: 'inline-block',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#b45309',
              marginBottom: 6
            }}>
              Scheduled Start Time (IST)
            </div>
            <div style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#0f172a',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {formatIST(scheduledTime, 'timeOnlySeconds')}
            </div>
            <div style={{ marginTop: 6, fontSize: '0.92rem', color: '#475569', fontWeight: 600 }}>
              📅 {formatIST(scheduledTime, 'dateOnly')} (India Standard Time)
            </div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#64748b' }}>
              Keep this browser tab open. Do not refresh or close.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: SUBMITTED (RESULT / CONFIRMATION) ─────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'submitted') {
    const pct = result?.percentage ?? 0;
    const passed = pct >= 40;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '24px'
      }}>
        <div className="er-modal-card" style={{ maxWidth: 540, textAlign: 'center' }}>
          <div className="er-modal-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={36} />
          </div>
          <h1 className="er-modal-title" style={{ color: '#065f46' }}>
            Exam Successfully Submitted
          </h1>
          <p className="er-modal-subtitle">
            Your responses and proctoring telemetry have been verified and sealed in the examination records.
          </p>

          {result && (
            <div className="er-summary-grid">
              <div className="er-summary-item">
                <span className="er-summary-label">Marks Awarded</span>
                <span className="er-summary-value" style={{ color: '#0a74da' }}>
                  {result.score ?? 'Pending'} / {result.totalMarks ?? '—'}
                </span>
              </div>
              <div className="er-summary-item">
                <span className="er-summary-label">Percentage</span>
                <span className="er-summary-value" style={{ color: passed ? '#10b981' : '#f59e0b' }}>
                  {pct}%
                </span>
              </div>
              <div className="er-summary-item">
                <span className="er-summary-label">Status</span>
                <span className="er-summary-value" style={{ color: passed ? '#10b981' : '#64748b' }}>
                  {passed ? 'Passed' : 'Completed'}
                </span>
              </div>
              <div className="er-summary-item">
                <span className="er-summary-label">Proctoring Status</span>
                <span className="er-summary-value" style={{ color: violationCount === 0 ? '#10b981' : '#f59e0b' }}>
                  {violationCount === 0 ? 'Clear (0 flags)' : `${violationCount} alerts`}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/student/dashboard')}
            className="er-btn-save-next"
            style={{ width: '100%', height: 46, justifyContent: 'center', fontSize: '0.92rem' }}
          >
            Return to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: ACTIVE EXAM ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const currentQuestion = questions[currentQ];
  const isCurrentAnswered = !!answers[currentQuestion?.id];
  const isCurrentReviewed = !!reviewed[currentQuestion?.id];

  return (
    <div className="er-shell">
      {/* ── Security Tab Warning Dialog ── */}
      {showTabWarning && (
        <TabWarningOverlay
          count={tabSwitchCount}
          onDismiss={() => setShowTabWarning(false)}
        />
      )}

      {/* ── Face Detection Alert Banner ── */}
      {faceAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 8000,
          background: faceAlert === 'multiple_faces' ? '#ef4444' : '#f59e0b',
          color: '#ffffff',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {faceAlert === 'multiple_faces' ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
          <span>
            {faceAlert === 'multiple_faces'
              ? 'MULTIPLE PERSONS DETECTED — Only the registered student may be visible'
              : 'FACE NOT VISIBLE — Please face your camera directly to avoid disqualification'}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: 'auto' }}>
            Flag logged
          </span>
        </div>
      )}

      {/* ── Broadcast Announcement Banner from Proctor ── */}
      {broadcastAlert && (
        <div style={{
          position: 'fixed',
          top: faceAlert ? 44 : 0,
          left: 0,
          right: 0,
          zIndex: 8500,
          background: 'linear-gradient(90deg, #0284c7, #0369a1)',
          color: '#ffffff',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: '1.1rem' }}>📢</span>
          <span>
            <strong>EXAM COMMITTEE NOTICE:</strong> {broadcastAlert.message}
          </span>
          <button
            onClick={() => setBroadcastAlert(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '2px 8px',
              cursor: 'pointer',
              marginLeft: 'auto',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Official Proctor Warning Modal ── */}
      {proctorWarning && (
        <div className="er-modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="er-modal-card" style={{ maxWidth: 480, textAlign: 'center', border: '2px solid #ef4444' }}>
            <div className="er-modal-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <ShieldAlert size={36} />
            </div>
            <h2 className="er-modal-title" style={{ color: '#dc2626' }}>
              Official Proctoring Warning (Strike {proctorWarning.strike || 1}/3)
            </h2>
            <div style={{
              margin: '16px 0',
              padding: '14px 18px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 10,
              color: '#9f1239',
              fontSize: '0.92rem',
              fontWeight: 600,
              textAlign: 'left',
              lineHeight: 1.45
            }}>
              "{proctorWarning.message}"
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px' }}>
              Your examination window is actively monitored. Exceeding permissible strikes will cause immediate automatic disqualification.
            </p>
            <button
              onClick={() => setProctorWarning(null)}
              className="er-btn-save-next"
              style={{ width: '100%', justifyContent: 'center', height: 44, background: '#dc2626', color: '#fff' }}
            >
              I Acknowledge & Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          1. TOP NAVIGATION COCKPIT
          ═════════════════════════════════════════════════════════════════════════ */}
      <header className="er-navbar">
        {/* Brand & Exam Title */}
        <div className="er-nav-brand">
          <div className="er-brand-logo">
            <Shield size={24} />
            <span>ExamShield</span>
          </div>
          <span className="er-brand-badge">Secure Exam</span>
          <div className="er-nav-exam-title">
            <span className="er-exam-title-text">
              {examData?.exam?.title || 'Examination Session'}
            </span>
            <span className="er-exam-subject-tag">
              {examData?.exam?.subject || 'Comprehensive Assessment'}
            </span>
          </div>
        </div>

        {/* Candidate Identity Chip */}
        <div className="er-nav-candidate">
          <div className="er-candidate-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <div className="er-candidate-details">
            <span className="er-candidate-name">{user?.name || 'Candidate'}</span>
            <span className="er-candidate-id">
              {user?.roll_number || user?.enrollment_number || user?.email || 'ID: ES-STD'}
            </span>
          </div>
        </div>

        {/* Security Telemetry & Controls */}
        <div className="er-nav-controls">
          {/* Fullscreen status & toggle */}
          <button
            onClick={toggleFullScreen}
            className="er-chip er-chip-fullscreen"
            style={{ cursor: 'pointer', border: 'none' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            <span>{isFullscreen ? 'Full-Screen' : 'Windowed'}</span>
          </button>

          {/* Tab Switch Counter Pill */}
          <div className={`er-chip ${tabSwitchCount === 0 ? 'er-chip-proctor' : tabSwitchCount < 3 ? 'er-chip-warning' : 'er-chip-danger'}`}>
            <div className={`er-chip-dot ${tabSwitchCount > 0 ? 'er-chip-pulse' : ''}`} />
            <span>Tabs: {tabSwitchCount}/3</span>
          </div>

          {/* Violation / Alert Pill */}
          {violationCount > 0 && (
            <div className="er-chip er-chip-danger">
              <ShieldAlert size={14} />
              <span>Flags: {violationCount}</span>
            </div>
          )}

          {/* Live Countdown Timer */}
          {timeSeconds > 0 && (
            <Timer seconds={timeSeconds} onExpire={() => handleSubmit(true)} />
          )}

          {/* Submit Exam Trigger */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitted}
            className="er-btn-submit-exam"
          >
            <Send size={15} />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════════════
          2. PROGRESS & METADATA SUB-BAR
          ═════════════════════════════════════════════════════════════════════════ */}
      <div className="er-subbar">
        {/* Progress bar */}
        <div className="er-progress-summary">
          <span className="er-progress-text">
            Progress: <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> Answered ({progressPercentage}%)
          </span>
          <div className="er-progress-bar-wrap">
            <div
              className="er-progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats breakdown pills */}
        <div className="er-subbar-stats">
          <div className="er-stat-pill">
            <span className="er-stat-badge badge-answered">{answeredCount}</span>
            <span>Answered</span>
          </div>
          <div className="er-stat-pill">
            <span className="er-stat-badge badge-review">{reviewedCount}</span>
            <span>For Review</span>
          </div>
          <div className="er-stat-pill">
            <span className="er-stat-badge badge-unanswered">{unansweredCount}</span>
            <span>Unanswered</span>
          </div>

          {/* Exam Instructions modal trigger */}
          <button
            onClick={() => setShowInstructionsModal(true)}
            className="er-btn-instructions"
          >
            <HelpCircle size={14} />
            <span>Instructions</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          3. MAIN EXAM CONTENT: TWO COLUMN SPLIT (QUESTION CANVAS + SIDE PANEL)
          ═════════════════════════════════════════════════════════════════════════ */}
      {currentQuestion?.type === 'coding' ? (
        // Full width IDE layout for Coding Questions
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="er-q-number-badge">Q{currentQ + 1}</span>
              <span className="er-q-type-badge">Coding Challenge</span>
              <span className="er-q-marks-badge">{currentQuestion.marks || 5} Marks</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="er-btn-prev"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={handleSaveAndNext}
                className="er-btn-save-next"
              >
                {currentQ === questions.length - 1 ? 'Review & Submit' : 'Next'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', height: 'calc(100vh - 130px)', position: 'relative' }}>
            <CodingQuestion
              question={currentQuestion}
              answer={answers[currentQuestion.id] || ''}
              onAnswer={(code) => handleAnswer(currentQuestion.id, code)}
            />
            {/* Live Camera & Voice Proctoring PiP HUD */}
            <ProfessionalProctoring
              sessionId={session?.id}
              examId={examId}
              studentId={user?.id}
              onViolation={handleFaceViolation}
              currentQuestion={currentQ + 1}
              totalQuestions={questions.length}
              mode="pip"
              pipCorner="bottom-left"
              socket={socketRef.current}
            />
          </div>
        </div>
      ) : (
        // Standard MCQ & Subjective Layout
        <main className="er-main-content">
          {/* ── Left Question Canvas ── */}
          <div className="er-question-pane">
            {currentQuestion ? (
              <div className="er-question-card">
                {/* Question Top Header */}
                <div className="er-question-header">
                  <div className="er-q-meta-left">
                    <span className="er-q-number-badge">
                      Question {currentQ + 1}
                    </span>
                    <span className="er-q-type-badge">
                      {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Descriptive'}
                    </span>
                    <span className="er-q-marks-badge">
                      +{currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  <div className="er-q-actions-right">
                    {/* Mark for review toggle */}
                    <button
                      onClick={() => toggleReview(currentQuestion.id)}
                      className={`er-btn-flag-review ${isCurrentReviewed ? 'active' : ''}`}
                      title="Flag question to review later"
                    >
                      <Flag size={14} />
                      <span>{isCurrentReviewed ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>

                    {/* Clear selection */}
                    <button
                      onClick={() => handleClearAnswer(currentQuestion.id)}
                      disabled={!isCurrentAnswered}
                      className="er-btn-clear-choice"
                      title="Clear your answer for this question"
                    >
                      <RotateCcw size={14} />
                      <span>Clear Response</span>
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="er-question-body">
                  {currentQuestion.type === 'mcq' ? (
                    <MCQQuestion
                      question={currentQuestion}
                      answer={answers[currentQuestion.id] || ''}
                      onAnswer={(opt) => handleAnswer(currentQuestion.id, opt)}
                    />
                  ) : (
                    <SubjectiveQuestion
                      question={currentQuestion}
                      answer={answers[currentQuestion.id] || ''}
                      onAnswer={(text) => handleAnswer(currentQuestion.id, text)}
                    />
                  )}
                </div>

                {/* Question Action Footer */}
                <div className="er-question-footer">
                  <button
                    onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                    disabled={currentQ === 0}
                    className="er-btn-prev"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <div className="er-footer-right-actions">
                    <button
                      onClick={handleMarkAndNext}
                      className="er-btn-mark-next"
                    >
                      <Flag size={15} />
                      <span>Mark for Review & Next</span>
                    </button>

                    <button
                      onClick={handleSaveAndNext}
                      className="er-btn-save-next"
                    >
                      <span>{currentQ === questions.length - 1 ? 'Review & Submit' : 'Save & Next'}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="er-question-card" style={{ padding: '60px', textAlign: 'center' }}>
                <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: 8 }}>
                  No Question Available
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  There are currently no examination items loaded for this section.
                </p>
              </div>
            )}
          </div>

          {/* ── Right Side Panel: Proctoring & Question Palette ── */}
          <aside className="er-side-panel">
            {/* Live Proctoring Webcam Box */}
            <div className="er-proctor-box">
              <div className="er-proctor-header">
                <div className="er-proctor-title">
                  <Shield size={14} color="#0a74da" />
                  <span>AI Proctoring Stream</span>
                </div>
                <span className="er-proctor-status-tag">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  Monitoring Active
                </span>
              </div>
              <div className="er-proctor-feed-wrap">
                <ProfessionalProctoring
                  sessionId={session?.id}
                  examId={examId}
                  studentId={user?.id}
                  onViolation={handleFaceViolation}
                  currentQuestion={currentQ + 1}
                  totalQuestions={questions.length}
                  socket={socketRef.current}
                />
              </div>
            </div>

            {/* Question Palette Box */}
            <div className="er-palette-box">
              <div className="er-palette-title">
                <span>Question Palette</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  {answeredCount}/{questions.length} Done
                </span>
              </div>

              {/* Grid of question buttons */}
              <div className="er-palette-grid">
                {questions.map((q, idx) => {
                  const isCur = idx === currentQ;
                  const isAns = !!answers[q.id];
                  const isRev = !!reviewed[q.id];

                  let statusClass = 'status-unanswered';
                  if (isAns && isRev) {
                    statusClass = 'status-answered-review';
                  } else if (isRev) {
                    statusClass = 'status-review';
                  } else if (isAns) {
                    statusClass = 'status-answered';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => setCurrentQ(idx)}
                      className={`er-palette-btn ${statusClass} ${isCur ? 'current' : ''}`}
                      title={`Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend */}
              <div className="er-palette-legend">
                <div className="er-legend-item">
                  <div className="er-legend-icon icon-answered" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="er-legend-item">
                  <div className="er-legend-icon icon-answered-review" />
                  <span>Answered & Marked for Review</span>
                </div>
                <div className="er-legend-item">
                  <div className="er-legend-icon icon-review" />
                  <span>Marked for Review ({reviewedCount})</span>
                </div>
                <div className="er-legend-item">
                  <div className="er-legend-icon icon-unanswered" />
                  <span>Not Answered ({unansweredCount})</span>
                </div>
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          4. SUBMIT CONFIRMATION MODAL
          ═════════════════════════════════════════════════════════════════════════ */}
      {showSubmitModal && (
        <div className="er-modal-backdrop">
          <div className="er-modal-card">
            <div className="er-modal-header">
              <div className="er-modal-icon-wrap" style={{ background: '#eff6ff', color: '#0a74da' }}>
                <Send size={28} />
              </div>
              <h2 className="er-modal-title">Ready to Submit Examination?</h2>
              <p className="er-modal-subtitle">
                Please verify your answers summary before submitting. Once submitted, your examination cannot be reopened or edited.
              </p>
            </div>

            {/* Summary statistics grid */}
            <div className="er-summary-grid">
              <div className="er-summary-item">
                <span className="er-summary-label">Total Questions</span>
                <span className="er-summary-value">{questions.length}</span>
              </div>
              <div className="er-summary-item">
                <span className="er-summary-label">Answered</span>
                <span className="er-summary-value" style={{ color: '#10b981' }}>{answeredCount}</span>
              </div>
              <div className="er-summary-item">
                <span className="er-summary-label">Unanswered</span>
                <span className="er-summary-value" style={{ color: '#ef4444' }}>{unansweredCount}</span>
              </div>
              <div className="er-summary-item">
                <span className="er-summary-label">Marked for Review</span>
                <span className="er-summary-value" style={{ color: '#8b5cf6' }}>{reviewedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 10,
                color: '#b45309',
                fontSize: '0.82rem',
                marginBottom: 20
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>You have <strong>{unansweredCount} unanswered questions</strong>. They will be marked with 0 score.</span>
              </div>
            )}

            <div className="er-modal-actions">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="er-modal-btn-cancel"
              >
                Back to Exam
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitted}
                className="er-modal-btn-confirm"
              >
                {submitted ? 'Submitting...' : 'Yes, Submit Examination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          5. EXAM INSTRUCTIONS SLIDE-OVER / MODAL
          ═════════════════════════════════════════════════════════════════════════ */}
      {showInstructionsModal && (
        <div className="er-modal-backdrop">
          <div className="er-modal-card er-instructions-modal">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle size={22} color="#0a74da" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Examination Instructions & Rules
                </h3>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="er-instructions-content">
              <h4>1. General Navigation</h4>
              <ul>
                <li>Use the <strong>Save & Next</strong> button to save your response and navigate to the next question.</li>
                <li>You can jump directly to any question by clicking its number in the <strong>Question Palette</strong> on the right.</li>
                <li>Use <strong>Mark for Review & Next</strong> if you want to flag a question to review before final submission.</li>
                <li>For multiple-choice questions, you can use keyboard keys <strong>A-D</strong> or <strong>1-4</strong> to select choices instantly.</li>
              </ul>

              <h4>2. Question Palette Color Indicators</h4>
              <ul>
                <li><strong style={{ color: '#10b981' }}>Green:</strong> You have answered the question.</li>
                <li><strong style={{ color: '#8b5cf6' }}>Purple:</strong> You have flagged the question for review.</li>
                <li><strong style={{ color: '#64748b' }}>Light Gray:</strong> You have not answered the question.</li>
              </ul>

              <h4>3. AI Proctoring & Anti-Cheating Protocol</h4>
              <ul>
                <li>Maintain a centered position within your webcam frame throughout the session.</li>
                <li>Switching browser tabs, opening new windows, or minimizing the browser is strictly recorded. A maximum of <strong>3 tab switches</strong> is allowed before automatic disqualification.</li>
                <li>Keyboard shortcuts for copy/paste/refresh are blocked by the security system.</li>
                <li>Ensure a quiet, well-lit environment without unauthorized individuals present in the room.</li>
              </ul>
            </div>

            <div style={{ paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="er-btn-save-next"
                style={{ width: '100%', height: 42, justifyContent: 'center' }}
              >
                Close & Continue Examination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
