// src/pages/student/ExamRoom.js — Production-Grade Exam Interface
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ─── Inject Global Styles ───────────────────────────────────────────────────────
if (!document.getElementById('examroom-styles')) {
  const s = document.createElement('style');
  s.id = 'examroom-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    @keyframes er-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
    @keyframes er-fade-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes er-slide-down { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes er-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
    @keyframes er-glow-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0.3)} }
    .er-enter { animation: er-fade-in 0.25s ease both; }
    .er-banner { animation: er-slide-down 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
    .er-shake { animation: er-shake 0.4s ease; }
    .er-warning-ring { animation: er-glow-red 1.5s infinite; }
  `;
  document.head.appendChild(s);
}

// ─── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  accent: '#e94560',
  accentDark: '#b81c3a',
  green: '#22c55e',
  yellow: '#f59e0b',
  red: '#ef4444',
  text: '#e2e8f0',
  muted: '#64748b',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ─── Reusable Toast Helpers (react-hot-toast v2 compatible) ────────────────────
const notify = {
  warn: (msg) => toast(msg, {
    icon: '⚠️',
    style: {
      background: '#1a1a2e',
      color: '#fbbf24',
      border: '1px solid rgba(251,191,36,0.35)',
      fontWeight: 600,
      fontFamily: C.fontFamily,
    },
    duration: 5000,
  }),
  error: (msg) => toast.error(msg, {
    style: {
      background: '#1a1a2e',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.35)',
      fontFamily: C.fontFamily,
    },
    duration: 6000,
  }),
  success: (msg) => toast.success(msg, {
    style: {
      background: '#1a1a2e',
      color: '#4ade80',
      border: '1px solid rgba(34,197,94,0.35)',
      fontFamily: C.fontFamily,
    },
    duration: 4000,
  }),
  info: (msg) => toast(msg, {
    icon: 'ℹ️',
    style: {
      background: '#1a1a2e',
      color: '#93c5fd',
      border: '1px solid rgba(147,197,253,0.3)',
      fontFamily: C.fontFamily,
    },
    duration: 4000,
  }),
};

// ─── Tab Warning Overlay Component ─────────────────────────────────────────────
function TabWarningOverlay({ count, onDismiss }) {
  if (count === 0) return null;
  const isFinal = count >= 3;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: isFinal ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }}>
      <div className="er-banner" style={{
        background: isFinal
          ? 'linear-gradient(135deg, #1a0000, #2d0000)'
          : 'linear-gradient(135deg, #1a1200, #2d2000)',
        border: `2px solid ${isFinal ? '#ef4444' : '#f59e0b'}`,
        borderRadius: 20,
        padding: '40px 48px',
        maxWidth: 520,
        width: '90%',
        textAlign: 'center',
        boxShadow: `0 0 60px ${isFinal ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)'}`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {isFinal ? '🚨' : '⚠️'}
        </div>
        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          color: isFinal ? '#fca5a5' : '#fcd34d',
          margin: '0 0 12px',
          fontFamily: C.fontFamily,
        }}>
          {isFinal ? 'Exam Terminated!' : `Tab Switch Warning (${count}/3)`}
        </h2>
        <p style={{
          fontSize: 14,
          color: '#94a3b8',
          lineHeight: 1.7,
          margin: '0 0 24px',
          fontFamily: C.fontFamily,
        }}>
          {isFinal
            ? 'You have exceeded the maximum number of tab switches. Your exam is being auto-submitted.'
            : count === 2
              ? 'This is your final warning. One more tab switch will automatically submit your exam.'
              : 'Switching tabs or windows is not allowed during the exam. This violation has been recorded.'}
        </p>
        {!isFinal && (
          <button
            onClick={onDismiss}
            style={{
              padding: '12px 32px',
              background: count === 2
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: C.fontFamily,
            }}
          >
            I Understand — Continue Exam
          </button>
        )}
        <div style={{ marginTop: 16, fontSize: 12, color: '#4a5568', fontFamily: C.fontFamily }}>
          Violations are logged and reviewed by your institution
        </div>
      </div>
    </div>
  );
}

// ─── ExamRoom Component ─────────────────────────────────────────────────────────
export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Core State ──
  const [phase, setPhase] = useState('key');
  const [examData, setExamData] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [examKey, setExamKey] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Proctoring State ──
  const [violationCount, setViolationCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [faceAlert, setFaceAlert] = useState(null); // null | 'no_face' | 'multiple_faces'

  // ── Refs ──
  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const submittedRef = useRef(false);
  const sessionRef = useRef(null);

  // Keep session ref current
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ─── Fullscreen ───────────────────────────────────────────────────────────────
  const enterFullScreen = useCallback(() => {
    try {
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (fn) {
        fn.call(el)
          .then(() => setIsFullscreen(true))
          .catch(() => {}); // Silently ignore — user may deny fullscreen
      }
    } catch (_) {}
  }, []);

  const exitFullScreen = useCallback(() => {
    // Only call exitFullscreen if document is actually in fullscreen
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
    if (isCurrentlyFullscreen) {
      const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      try {
        if (fn) {
          fn.call(document).catch(() => {}); // catch async Promise rejection
        }
      } catch (_) {}
    }
    setIsFullscreen(false);
  }, []);

  // ─── Exam Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submittedRef.current) return;
    if (!autoSubmit && !window.confirm('Submit exam? This cannot be undone.')) return;

    submittedRef.current = true;
    setSubmitted(true);
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
        notify.success('🎉 Exam submitted successfully!');
        setResult(response.data);
        setPhase('submitted');
        setTimeout(exitFullScreen, 1500);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      notify.error('Submission failed. Please try again.');
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
        notify.error('🚨 Too many proctoring violations. Exam is being submitted.');
        handleSubmit(true);
      }
      return next;
    });
    // Auto-clear face alert after 5 seconds
    setTimeout(() => setFaceAlert(null), 5000);
  }, [handleSubmit]);

  // ─── Tab Switch Detection (production-level) ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;

    let isBlurred = false;
    let effectStartTime = Date.now();

    const recordViolation = () => {
      // Grace period: ignore blur during the first 3 seconds of entering the exam room (fullscreen transition)
      if (Date.now() - effectStartTime < 3000) return;

      tabSwitchCountRef.current += 1;
      setTabSwitchCount(tabSwitchCountRef.current);

      // Emit socket event
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
        // Student came back — show the warning banner
        const n = tabSwitchCountRef.current;
        if (n > 0 && n < 3) {
          setShowTabWarning(true);
        } else if (n >= 3 && !submittedRef.current) {
          // Auto-submit
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

  // ─── Fullscreen Change ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;
    const check = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs && phase === 'exam' && !submittedRef.current) {
        notify.warn('Please return to full-screen mode for secure exam environment');
      }
    };
    document.addEventListener('fullscreenchange', check);
    document.addEventListener('webkitfullscreenchange', check);
    return () => {
      document.removeEventListener('fullscreenchange', check);
      document.removeEventListener('webkitfullscreenchange', check);
    };
  }, [phase]);

  // ─── Context Menu / Key Block ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;
    const onCtx = (e) => { e.preventDefault(); return false; };
    const onKey = (e) => {
      const blocked = ['c','v','x','a','s','r','n','t','w','i','p','u','j','k'];
      if ((e.ctrlKey || e.metaKey) && blocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        notify.warn(`Keyboard shortcut "${e.key.toUpperCase()}" is disabled during exam`);
      }
      // Block F-keys except F11 (fullscreen toggle)
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

  // ─── Socket.IO ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const wsUrl = process.env.REACT_APP_WS_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://examshield-d5i2.onrender.com');
    const socket = io(wsUrl, { auth: { token }, reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => console.log('🔗 Proctoring server connected'));
    socket.on('violation_update', (data) => {
      if (data.sessionId === sessionRef.current?.id) {
        setViolationCount(data.violationCount ?? 0);
        notify.warn(`Proctoring alert: ${data.type?.replace(/_/g, ' ')}`);
      }
    });
    socket.on('exam_terminated', (data) => {
      if (data.sessionId === sessionRef.current?.id) {
        notify.error(`Exam terminated: ${data.reason}`);
        handleSubmit(true);
      }
    });

    return () => socket.disconnect();
  }, [examId]); // eslint-disable-line

  // ─── Auto-save ────────────────────────────────────────────────────────────────
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
        }).catch(() => {});
      });
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [phase, session, submitted, answers, questions, examId]);

  // ─── Fetch Exam Info ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (examId && phase === 'key') {
      studentAPI.getExamDetails(examId)
        .then(r => { if (r.success) setExamData(r.data); })
        .catch(() => {});
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
    }).catch(() => {});
  }, [questions, session, examId]);

  // ─── Start Exam ───────────────────────────────────────────────────────────────
  const handleStartExam = useCallback(async () => {
    const key = examKey.trim();
    if (!key) { notify.warn('Please enter your exam key'); return; }
    
    // Call enterFullScreen SYNCHRONOUSLY here to prevent browser blocking it
    enterFullScreen();
    
    setIsStartingExam(true);
    try {
      const response = await studentAPI.startExam(examId, { examKey: key });
      if (response.success) {
        const data = response.data || response;
        setSession(data.session);
        setQuestions(data.questions || []);
        const secs = data.timeRemaining
          || (data.exam?.duration ? Number(data.exam.duration) * 60 : 0)
          || 3600;
        setTimeSeconds(secs);
        setPhase('exam');
        notify.success('✅ Exam started! Good luck!');
      } else {
        exitFullScreen(); // Exits if it failed
        notify.error(response.message || 'Invalid exam key. Please try again.');
      }
    } catch (err) {
      exitFullScreen(); // Exits if it failed
      console.error('Start exam error:', err);
      notify.error(err?.message || 'Failed to start exam. Check your key and try again.');
    } finally {
      setIsStartingExam(false);
    }
  }, [examKey, examId, enterFullScreen, exitFullScreen]);

  // ─── Security Status Colors ───────────────────────────────────────────────────
  const answeredCount = questions.filter(q => !!answers[q.id]).length;
  const fsColor = isFullscreen ? C.green : C.yellow;
  const tabColor = tabSwitchCount === 0 ? C.green : tabSwitchCount < 3 ? C.yellow : C.red;
  const vioColor = violationCount === 0 ? C.green : violationCount < 3 ? C.yellow : C.red;

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: KEY ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'key') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 0%, rgba(233,69,96,0.08) 0%, ${C.bg} 70%)`,
        fontFamily: C.fontFamily,
        padding: '1rem',
      }}>
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '44px 40px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Icon */}
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #e94560, #b81c3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(233,69,96,0.4)',
            fontSize: 30,
          }}>🔒</div>

          <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, letterSpacing: '-0.5px' }}>
            ExamShield
          </h1>
          <p style={{ textAlign: 'center', fontSize: 14, color: C.muted, marginBottom: 32 }}>
            {examData?.exam?.title ? `"${examData.exam.title}"` : 'Enter your exam key to begin'}
          </p>

          {/* Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
              Exam Key
            </label>
            <input
              type="text"
              value={examKey}
              onChange={e => setExamKey(e.target.value.toUpperCase())}
              placeholder="e.g.  EXAM-2024-XYZ"
              disabled={isStartingExam}
              onKeyDown={e => e.key === 'Enter' && handleStartExam()}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.outline = 'none'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#f1f5f9',
                fontSize: 16, fontFamily: 'inherit',
                letterSpacing: '3px', transition: 'border-color 0.2s',
              }}
              autoFocus
            />
          </div>

          {/* Button */}
          <button
            onClick={handleStartExam}
            disabled={isStartingExam || !examKey.trim()}
            style={{
              width: '100%', padding: '14px',
              background: isStartingExam || !examKey.trim()
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #e94560, #b81c3a)',
              border: 'none', borderRadius: 10,
              color: isStartingExam || !examKey.trim() ? C.muted : '#fff',
              fontSize: 15, fontWeight: 700, cursor: isStartingExam || !examKey.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: examKey.trim() && !isStartingExam ? '0 4px 20px rgba(233,69,96,0.4)' : 'none',
            }}
          >
            {isStartingExam ? '⏳  Validating Key...' : '🚀  Start Exam'}
          </button>

          {/* Info */}
          <div style={{ marginTop: 24, padding: 16, background: 'rgba(233,69,96,0.05)', border: '1px solid rgba(233,69,96,0.15)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 10 }}>📋 Before You Begin</div>
            {[
              'Allow camera access — required for AI proctoring',
              'Exam enters full-screen mode automatically',
              'Tab switching is monitored (max 3 switches allowed)',
              'Answers auto-save every 30 seconds',
              'Ensure stable internet throughout the exam',
            ].map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: '#718096', lineHeight: 1.8 }}>• {t}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: SUBMITTED ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'submitted') {
    const pct = result?.percentage ?? 0;
    const passed = pct >= 40;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.06) 0%, ${C.bg} 70%)`,
        fontFamily: C.fontFamily, padding: '1rem',
      }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: 44, width: '100%', maxWidth: 520,
          textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 34,
            boxShadow: '0 8px 32px rgba(34,197,94,0.35)',
          }}>✅</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.green, marginBottom: 8 }}>Exam Submitted!</h1>
          <p style={{ fontSize: 14, color: C.muted }}>Your answers have been recorded and are being graded.</p>
          {result && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 12, margin: '28px 0',
            }}>
              {[
                { label: 'Your Score', value: result.score ?? '—' },
                { label: 'Total Marks', value: result.totalMarks ?? '—' },
                { label: 'Percentage', value: `${pct}%`, color: passed ? C.green : C.red },
                { label: 'Result', value: passed ? '✅ Passed' : '❌ Failed', color: passed ? C.green : C.red },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '14px 10px',
                }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: C.muted, fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color || '#f1f5f9' }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/student/dashboard')}
            style={{
              width: '100%', padding: 14,
              background: 'linear-gradient(135deg, #e94560, #b81c3a)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: EXAM ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const currentQuestion = questions[currentQ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.fontFamily, color: C.text }}>

      {/* ── Tab Switch Warning Overlay ── */}
      {showTabWarning && (
        <TabWarningOverlay
          count={tabSwitchCount}
          onDismiss={() => setShowTabWarning(false)}
        />
      )}

      {/* ── Face Detection Alert Banner ── */}
      {faceAlert && (
        <div className="er-banner" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 8000,
          background: faceAlert === 'multiple_faces'
            ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
            : 'linear-gradient(135deg, #78350f, #92400e)',
          borderBottom: `2px solid ${faceAlert === 'multiple_faces' ? '#ef4444' : '#f59e0b'}`,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>{faceAlert === 'multiple_faces' ? '🚨' : '👁️'}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
            {faceAlert === 'multiple_faces'
              ? 'MULTIPLE PERSONS DETECTED — Only the exam taker should be visible'
              : 'FACE NOT VISIBLE — Please ensure your face is in the camera frame'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Violation Recorded</span>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        position: 'sticky',
        top: faceAlert ? 48 : 0,
        zIndex: 100,
        background: 'rgba(8,8,16,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        transition: 'top 0.3s ease',
      }}>
        <div style={{
          maxWidth: 1440,
          margin: '0 auto',
          height: 60,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: C.accent,
              boxShadow: `0 0 8px ${C.accent}`,
              animation: 'er-pulse 2s infinite',
            }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.3px' }}>ExamShield</span>
            {examData?.exam?.title && (
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                — {examData.exam.title}
              </span>
            )}
          </div>

          {/* Status Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Fullscreen */}
            <StatusChip color={fsColor} label={isFullscreen ? 'Full-screen' : 'Windowed'} />
            {/* Tab Switches */}
            <StatusChip
              color={tabColor}
              label={`Tabs: ${tabSwitchCount}/3`}
              pulse={tabSwitchCount > 0}
            />
            {/* Violations */}
            <StatusChip
              color={vioColor}
              label={`Alerts: ${violationCount}`}
              pulse={violationCount > 0}
            />
            {/* Timer */}
            {timeSeconds > 0 && <Timer seconds={timeSeconds} onExpire={() => handleSubmit(true)} />}
            {/* Submit */}
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitted}
              style={{
                padding: '8px 18px',
                background: submitted ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #e94560, #b81c3a)',
                border: 'none',
                borderRadius: 8,
                color: submitted ? C.muted : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: submitted ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: submitted ? 'none' : '0 2px 12px rgba(233,69,96,0.4)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {submitted ? '✅ Submitted' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: '220px 1fr 220px',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* ── Left: Question Navigator ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 16,
          position: 'sticky', top: 80,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>
            Questions ({questions.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 16 }}>
            {questions.map((q, i) => {
              const isCur = i === currentQ;
              const isAns = !!answers[q.id];
              return (
                <button
                  key={q.id || i}
                  onClick={() => setCurrentQ(i)}
                  title={`Q${i + 1}`}
                  style={{
                    aspectRatio: '1',
                    border: isCur
                      ? '2px solid #e94560'
                      : isAns ? '1.5px solid rgba(34,197,94,0.5)' : `1.5px solid ${C.border}`,
                    borderRadius: 7,
                    background: isCur
                      ? 'rgba(233,69,96,0.15)'
                      : isAns ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                    color: isCur ? '#e94560' : isAns ? '#22c55e' : '#475569',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'inherit', padding: 0,
                    transition: 'all 0.15s',
                  }}
                >{i + 1}</button>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { color: 'rgba(233,69,96,0.15)', border: '2px solid #e94560', label: 'Current' },
              { color: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.5)', label: `Answered (${answeredCount})` },
              { color: 'rgba(255,255,255,0.02)', border: `1.5px solid ${C.border}`, label: 'Skipped' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, border: item.border, flexShrink: 0 }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Center: Question ── */}
        <div>
          {currentQuestion ? (
            <div key={currentQ} className="er-enter" style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '28px 32px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Top accent bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #e94560, #7c3aed)',
              }} />

              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(233,69,96,0.12)', border: '1.5px solid rgba(233,69,96,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: C.accent, flexShrink: 0,
                  }}>{currentQ + 1}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>
                    Question {currentQ + 1} of {questions.length}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '3px 10px', background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`, borderRadius: 20,
                    fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase',
                  }}>
                    {currentQuestion.type === 'mcq' ? 'MCQ' : currentQuestion.type === 'subjective' ? 'Descriptive' : 'Coding'}
                  </span>
                  <span style={{
                    padding: '3px 10px', background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20,
                    fontSize: 11, color: '#a78bfa', fontWeight: 700,
                  }}>
                    {currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
              </div>

              {/* Question body */}
              {currentQuestion.type === 'mcq' && (
                <MCQQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ''}
                  onAnswer={(opt) => handleAnswer(currentQuestion.id, opt)}
                />
              )}
              {currentQuestion.type === 'subjective' && (
                <SubjectiveQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ''}
                  onAnswer={(text) => handleAnswer(currentQuestion.id, text)}
                />
              )}
              {currentQuestion.type === 'coding' && (
                <CodingQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ''}
                  onAnswer={(code) => handleAnswer(currentQuestion.id, code)}
                />
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
                <button
                  onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  style={navArrowStyle(currentQ === 0)}
                >← Previous</button>
                <span style={{ fontSize: 12, color: '#334155' }}>
                  {answeredCount} / {questions.length} answered
                </span>
                <button
                  onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
                  disabled={currentQ === questions.length - 1}
                  style={navArrowStyle(currentQ === questions.length - 1)}
                >Next →</button>
              </div>
            </div>
          ) : (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '60px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <p style={{ color: C.muted, marginTop: 12 }}>No questions available for this exam.</p>
            </div>
          )}
        </div>

        {/* ── Right: Proctoring ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, position: 'sticky', top: 80, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${C.border}`,
            fontSize: 10, fontWeight: 700, color: '#334155',
            textTransform: 'uppercase', letterSpacing: '1px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: C.green, animation: 'er-pulse 2s infinite',
            }} />
            Live Proctoring
          </div>
          <ProfessionalProctoring
            sessionId={session?.id}
            examId={examId}
            studentId={user?.id}
            onViolation={handleFaceViolation}
            currentQuestion={currentQ + 1}
            totalQuestions={questions.length}
          />
        </div>
      </div>
    </div>
  );
}

// ─── StatusChip helper ──────────────────────────────────────────────────────────
function StatusChip({ color, label, pulse }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 12px',
      background: `${color}14`,
      border: `1px solid ${color}30`,
      borderRadius: 20,
      fontSize: 12, color, fontWeight: 600,
      fontFamily: "'Inter', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', background: color,
        animation: pulse ? 'er-pulse 1.5s infinite' : 'none',
      }} />
      {label}
    </div>
  );
}

// ─── Nav arrow button style ─────────────────────────────────────────────────────
function navArrowStyle(disabled) {
  return {
    padding: '10px 22px',
    background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    color: disabled ? '#334155' : '#94a3b8',
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Inter', sans-serif",
    pointerEvents: disabled ? 'none' : 'auto',
    transition: 'all 0.15s',
  };
}
