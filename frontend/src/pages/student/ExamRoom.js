// src/pages/student/ExamRoom.js
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
import ExamKeyModal from '../../components/ExamKeyModal';

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ─── Main ExamRoom Component ──────────────────────────────────────────────────
export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phase, setPhase] = useState('key'); // key | loading | exam | submitted
  const [examData, setExamData] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [warningMsg, setWarningMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  const [isStartingExam, setIsStartingExam] = useState(false);

  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  const violationRef = useRef(violationCount);
  violationRef.current = violationCount;

  // Setup Socket
  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    
    // Cleanup full screen on component unmount
    return () => {
      socket.disconnect();
      
      // Exit full screen and cleanup
      const exitFullScreen = () => {
        try {
          // Check if document is in full screen mode before attempting to exit
          if (document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.mozFullScreenElement || 
              document.msFullscreenElement) {
            
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            }
          }
        } catch (error) {
          console.log('Exit full screen not needed or not possible:', error.message);
        }
      };

      // Cleanup full screen event listeners
      if (window.fullScreenCleanup && typeof window.fullScreenCleanup === 'function') {
        try {
          window.fullScreenCleanup();
        } catch (error) {
          console.log('Error during full screen cleanup:', error.message);
        }
        delete window.fullScreenCleanup;
      }

      // Exit full screen
      exitFullScreen();
    };
  }, []);

  // ─── Answer Management ──────────────────────────────────────────────────
  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Save to server (optimistic)
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    studentAPI.saveAnswer(examId, {
      sessionId: session.id,
      questionId,
      ...(question.type === 'mcq' ? { selectedOption: answer } : 
         question.type === 'coding' ? { codeSubmission: answer } : 
         { answerText: answer }),
    }).catch(() => {});
  };

  const handleSubmit = async (autoSubmit = false, retryCount = 0) => {
    if (submitted) {
      console.log('Exam already submitted, ignoring duplicate submission');
      return;
    }
    
    if (!autoSubmit && !window.confirm('Submit exam? You cannot change answers after submission.')) return;

    console.log(autoSubmit ? '📤 Auto-submitting exam...' : '📤 Submitting exam...');
    setSubmitted(true);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);

  try {
      // Final save all answers before submission (defensive)
      console.log('💾 Saving final answers (defensive)...');
      try {
        const savePromises = Object.entries(answers).map(([questionId, answer]) => {
          const question = questions.find(q => q.id === questionId);
          if (!question || !answer) return Promise.resolve();
          
          return studentAPI.saveAnswer(examId, {
            sessionId: session.id,
            questionId,
            ...(question.type === 'mcq' ? { selectedOption: answer } : 
               question.type === 'coding' ? { codeSubmission: answer } : 
               { answerText: answer }),
          });
        });
        
        // Use allSettled so one failed save doesn't block final submission
        await Promise.allSettled(savePromises);
        console.log('✅ Final answer save attempted');
      } catch (saveAllErr) {
        console.warn('⚠️ Some final answers could not be saved, but proceeding with submission:', saveAllErr);
      }

      // Prepare submission data
      const submissionData = {
        sessionId: session.id,
        autoSubmit: autoSubmit,
        violationCount: violationCount,
        terminationReason: autoSubmit ? 'max_violations_reached' : 'manual_submission',
        submissionTime: new Date().toISOString(),
        answersCount: Object.keys(answers).filter(k => answers[k]).length
      };

      // Submit exam to backend with retry logic
      console.log('📤 Submitting exam to backend...');
      
      let res;
      try {
        res = await studentAPI.submitExam(examId, submissionData);
      } catch (fetchError) {
        console.error('❌ Network or Server error during submission:', fetchError);
        
        // Retry logic for network errors
        if (retryCount < 2 && autoSubmit) {
          console.log(`🔄 Retrying auto-submission (${retryCount + 1}/2)...`);
          toast.loading(`Auto-submitting... Retry ${retryCount + 1}/2`, { id: 'submit-retry' });
          await new Promise(resolve => setTimeout(resolve, 2000));
          setSubmitted(false);
          return handleSubmit(autoSubmit, retryCount + 1);
        }
        
        // Extract exact server message if available
        const serverMsg = fetchError.response?.data?.message || fetchError.error || fetchError.message;
        throw new Error(serverMsg || 'Server error: Unable to submit exam');
      }

      // Check if response is valid
      if (!res || !res.data) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Exam submitted successfully:', res.data);
      setResult(res.data);
      setPhase('submitted');
      
      // Notify backend via socket
      socketRef.current?.emit('exam-submitted', { 
        sessionId: session.id, 
        examId,
        autoSubmit,
        violationCount,
        submissionTime: new Date().toISOString()
      });
      
      toast.success(res.message || 'Exam submitted successfully!');

      // Exit full screen logic...
      const exitFullScreen = () => {
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          }
        } catch (e) {}
      };
      setTimeout(exitFullScreen, 1000);

    } catch (err) {
      console.error('❌ [PROFESSIONAL] Exam submission failure:', err);
      
      // Extract the most specific message from the server response
      const serverMessage = err.response?.data?.message || err.message;
      const errorMessage = serverMessage || 'An unexpected error occurred. Your answers are saved locally.';
      
      toast.error(errorMessage, { 
        duration: 8000,
        id: 'submit-error' 
      });
      
      // Industrial-strength local backup
      try {
        const backupKey = `backup_exam_${examId}_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify({
          answers,
          sessionId: session?.id,
          timestamp: new Date().toISOString()
        }));
        console.log(`💾 [PROFESSIONAL] Local backup created: ${backupKey}`);
      } catch (e) {
        console.error('Failed to create local backup:', e);
      }
      
      setSubmitted(false);
    }
  };

  // ─── Violation Handling (Ref-based to avoid stale closures) ──────────────

  // Refs to hold the latest versions of functions, avoiding stale closures
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const submittedRef = useRef(submitted);
  submittedRef.current = submitted;

  // Track last violation time per type for cooldowns
  const lastViolationTimeRef = useRef({});

  // Shared handler for backend violation responses — updates UI state
  const handleViolationResponse = useCallback((response) => {
    if (!response) return;
    // Extract actual payload whether wrapped in response.data or bare
    const data = response.data || response;
    const { message, violationCount: count, autoTerminate } = data;
    
    console.log(`📊 [PROCTORING] Backend Response: count=${count}, terminate=${autoTerminate}, msg="${message}"`);
    setViolationCount(count || 0);
    setWarningMsg(message || '');

    if (autoTerminate) {
      console.error('🚨 [PROCTORING] EXAM AUTO-TERMINATED BY SERVER');
      toast.error('🚨 Exam terminated due to violations!', { duration: 8000, id: 'exam-terminated' });
      setWarningMsg('🚨 EXAM TERMINATED: Your exam is being submitted due to policy violations.');
      setTimeout(() => {
        if (!submittedRef.current) {
          handleSubmitRef.current(true);
        }
      }, 2000);
    } else if (message) {
      toast.error(message, { duration: 4000 });
    }
  }, []); // No deps — uses refs for latest values

  // Core violation reporting function — sends to backend
  const reportViolation = useCallback(async (type, description) => {
    if (!sessionRef.current || submittedRef.current) {
      console.log(`⏭️ [PROCTORING] Skipping violation (no session or submitted): ${type}`);
      return;
    }

    // Per-type cooldown: 3 seconds between same-type violations
    const now = Date.now();
    const cooldown = 3000;
    if (lastViolationTimeRef.current[type] && (now - lastViolationTimeRef.current[type]) < cooldown) {
      console.log(`⏭️ [PROCTORING] Cooldown active for ${type}, skipping`);
      return;
    }
    lastViolationTimeRef.current[type] = now;

    try {
      console.log(`📡 [PROCTORING] Reporting violation: ${type} — ${description}`);
      const res = await studentAPI.reportViolation({
        sessionId: sessionRef.current.id,
        examId,
        type,
        description,
      });

      // Update UI from backend response
      if (res?.data) {
        handleViolationResponse(res.data);

        // Broadcast to admin via socket
        socketRef.current?.emit('violation', {
          sessionId: sessionRef.current.id,
          examId,
          studentId: sessionRef.current.student_id,
          type,
          severity: res.data.autoTerminate ? 'critical' : 'warning',
        });
      }
    } catch (error) {
      console.error('❌ [PROCTORING] Violation report failed:', error.response?.data || error.message);
      
      // Even if backend fails, still increment local count as fallback
      setViolationCount(prev => {
        const newCount = prev + 1;
        const maxV = examData?.max_violations || 3;
        setWarningMsg(`⚠️ Warning ${newCount}/${maxV}: ${description}`);
        toast.error(`⚠️ Warning ${newCount}/${maxV}: ${description}`, { duration: 4000 });
        
        if (newCount >= maxV && !submittedRef.current) {
          setWarningMsg('🚨 EXAM TERMINATED: Maximum violations reached.');
          setTimeout(() => handleSubmitRef.current(true), 2000);
        }
        return newCount;
      });
    }
  }, [examId, handleViolationResponse, examData]);

  // Ref to keep reportViolation always up-to-date for event listeners
  const reportViolationRef = useRef(reportViolation);
  reportViolationRef.current = reportViolation;

  // ─── Professional Proctoring System: Full-Screen + Tab Detection ──────────
  useEffect(() => {
    if (phase !== 'exam') return;

    console.log('🛡️ [PROCTORING] Full-screen + tab-switching detection ACTIVE');
    
    let isTabSwitching = false;

    // ── Full-Screen Exit Detection ──
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      
      if (!isFullscreen && !submittedRef.current) {
        console.log('🚨 [PROCTORING] Full-screen exited — counting violation');
        reportViolationRef.current('fullscreen_exit', 'Student exited full-screen mode');
        
        // Re-request full-screen after a short delay
        setTimeout(() => {
          if (!submittedRef.current) {
            const el = document.documentElement;
            try {
              if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {});
              } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
              }
            } catch (e) {}
          }
        }, 1000);
      }
    };

    // ── Tab Switch Detection ──
    const handleVisibilityChange = () => {
      if (document.hidden && !isTabSwitching && !submittedRef.current) {
        isTabSwitching = true;
        setTimeout(() => {
          if (document.hidden) {
            reportViolationRef.current('tab_switch', 'Student switched tabs/windows');
          }
          isTabSwitching = false;
        }, 500);
      }
    };

    // ── Window Focus ──
    const handleWindowFocus = () => {
      // Clear warning message 3 seconds after returning
      if (!submittedRef.current) {
        setTimeout(() => setWarningMsg(''), 3000);
      }
    };

    // ── Context Menu Blocking ──
    const handleContextMenu = (e) => {
      if (!submittedRef.current) {
        e.preventDefault();
        reportViolationRef.current('context_menu', 'Right-click blocked');
        return false;
      }
    };

    // ── Keyboard Shortcut Blocking ──
    const handleKeyDown = (e) => {
      if (submittedRef.current) return;

      const key = e.key.toLowerCase();
      const ctrlKey = e.ctrlKey || e.metaKey;
      const altKey = e.altKey;

      const dangerousCombos = [
        { ctrl: true, key: 'c', name: 'Copy' },
        { ctrl: true, key: 'v', name: 'Paste' },
        { ctrl: true, key: 'x', name: 'Cut' },
        { ctrl: true, key: 'a', name: 'Select All' },
        { ctrl: true, key: 'u', name: 'View Source' },
        { ctrl: true, key: 'i', name: 'DevTools' },
        { ctrl: true, key: 's', name: 'Save Page' },
        { alt: true, key: 'tab', name: 'Alt+Tab' },
        { key: 'f12', name: 'DevTools' },
        { key: 'escape', name: 'Escape' }
      ];

      const matchedCombo = dangerousCombos.find(combo =>
        (combo.ctrl && ctrlKey && combo.key === key) ||
        (combo.alt && altKey && combo.key === key) ||
        (!combo.ctrl && !combo.alt && combo.key === key)
      );

      if (matchedCombo) {
        e.preventDefault();
        e.stopPropagation();
        
        // Escape key: re-request fullscreen instead of counting violation
        if (key === 'escape') {
          const el = document.documentElement;
          try {
            if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
          } catch (err) {}
          return false;
        }
        
        reportViolationRef.current('keyboard_shortcut', `Blocked: ${matchedCombo.name}`);
        return false;
      }
    };

    // ── Register All Listeners ──
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true);

    // ── Cleanup ──
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [phase]); // Only re-run when phase changes — uses refs for everything else

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (phase !== 'exam' || !session) return;
    autoSaveRef.current = setInterval(() => {
      Object.entries(answers).forEach(([questionId, answer]) => {
        const question = questions.find(q => q.id === questionId);
        if (!question || !answer) return;
        studentAPI.saveAnswer(examId, {
          sessionId: session.id,
          questionId,
          ...(question.type === 'mcq' ? { selectedOption: answer } : question.type === 'coding' ? { codeSubmission: answer } : { answerText: answer }),
        }).catch(() => {});
      });
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [phase, session, answers, questions, examId]);

  const handleStartExam = async (examKey) => {
    try {
      console.log('🚀 Starting exam with key:', examKey);
      setIsStartingExam(true);
      setLoadingError(null);
      setPhase('loading');
      
      // Show loading toast
      toast.loading('Starting your exam...', { id: 'exam-start' });

      const res = await studentAPI.startExam(examId, { examKey });
      console.log('📋 Exam start response:', res.data);
      
      // SIMPLIFIED: Direct data extraction without complex validation
      const responseData = res.data;
      
      console.log('🔍 Response structure analysis:', {
        hasSuccess: 'success' in responseData,
        success: responseData.success,
        hasData: 'data' in responseData,
        hasDirectData: 'exam' in responseData,
        keys: Object.keys(responseData)
      });
      
      // Extract data from response - try multiple patterns
      let exam, sessionData, questionsData, savedAnswers, time;
      
      if (responseData.data && responseData.data.exam) {
        // Pattern 1: { success: true, data: { exam, session, questions, ... } }
        console.log('📊 Using Pattern 1: data.exam structure');
        exam = responseData.data.exam;
        sessionData = responseData.data.session;
        questionsData = responseData.data.questions || [];
        savedAnswers = responseData.data.savedAnswers || [];
        time = responseData.data.timeRemaining;
      } else if (responseData.exam) {
        // Pattern 2: { exam, session, questions, ... } directly
        console.log('📊 Using Pattern 2: direct exam structure');
        exam = responseData.exam;
        sessionData = responseData.session;
        questionsData = responseData.questions || [];
        savedAnswers = responseData.savedAnswers || [];
        time = responseData.timeRemaining;
      } else {
        // Pattern 3: Fallback - try to extract whatever we can
        console.log('📊 Using Pattern 3: fallback extraction');
        exam = responseData.exam || responseData;
        sessionData = responseData.session;
        questionsData = responseData.questions || [];
        savedAnswers = responseData.savedAnswers || [];
        time = responseData.timeRemaining;
      }
      
      console.log('📊 Extracted data:', {
        hasExam: !!exam,
        hasSession: !!sessionData,
        hasQuestions: !!questionsData,
        questionsCount: questionsData?.length || 0,
        examName: exam?.name || 'Unknown',
        sessionId: sessionData?.id || 'Unknown'
      });
      
      // CRITICAL: Force questions to be an array and ensure we have data
      if (!questionsData || !Array.isArray(questionsData)) {
        console.warn('⚠️ Questions data is invalid, creating empty array');
        questionsData = [];
      }
      
      // If we have basic data, proceed regardless of validation issues
      if (exam && sessionData) {
        console.log('✅ Basic data received, proceeding with exam start');
        console.log('📋 Questions data received:', {
          isArray: Array.isArray(questionsData),
          length: questionsData?.length || 0,
          firstQuestion: questionsData?.[0] ? {
            id: questionsData[0].id,
            type: questionsData[0].type,
            hasText: !!questionsData[0].question_text,
            textLength: questionsData[0].question_text?.length || 0,
            hasOptions: !!questionsData[0].options,
            optionsCount: questionsData[0].options?.length || 0
          } : null
        });
        
        // Set all data
        setExamData(exam);
        setSession(sessionData);
        setQuestions(questionsData);
        setTimeRemaining(time || 3600); // Default to 1 hour
        setLoadingError(null);

        console.log('🔄 State updated - Questions in state:', questionsData.length);

        // Restore saved answers
        const saved = {};
        if (Array.isArray(savedAnswers)) {
          savedAnswers.forEach(a => {
            saved[a.question_id] = a.selected_option || a.answer_text || a.code_submission || '';
          });
        }
        setAnswers(saved);
        
        console.log('💾 Saved answers restored:', Object.keys(saved).length);
        
        // Set current question to first question
        if (questionsData.length > 0) {
          setCurrentQ(0);
        }
        
        // CRITICAL: Force phase change to exam
        setPhase('exam');
        setIsStartingExam(false);
        
        // Update toast to success
        toast.success('Exam started successfully!', { id: 'exam-start' });
        console.log('✅ Exam started successfully with', questionsData.length, 'questions');
        
        // 🖥️ Request Full-Screen Mode after render
        setTimeout(() => {
          const el = document.documentElement;
          try {
            if (el.requestFullscreen) {
              el.requestFullscreen().catch(err => console.warn('Fullscreen request denied:', err.message));
            } else if (el.webkitRequestFullscreen) {
              el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
              el.msRequestFullscreen();
            }
            console.log('🖥️ Full-screen mode requested');
          } catch (e) {
            console.warn('Full-screen not available:', e.message);
          }
        }, 500);
        
      } else {
        throw new Error('Required exam data not received');
      }

    } catch (error) {
      console.error('❌ Failed to start exam:', error);
      setIsStartingExam(false);
      
      const errorMessage = error.message || error.error || (typeof error === 'string' ? error : 'Failed to start exam');
      setLoadingError(errorMessage);
      setPhase('key');
      
      // Update toast to error
      toast.error(errorMessage, { 
        id: 'exam-start',
        duration: 5000 
      });
    }
  };

  const q = questions[currentQ];
  const answered = Object.keys(answers).filter(k => answers[k]).length;

  // Debug logging for question display issues
  console.log('🔍 Question Debug:', {
    questionsLength: questions.length,
    currentQ: currentQ,
    q: q ? {
      id: q.id,
      type: q.type,
      questionText: q.question_text?.substring(0, 50) + '...'
    } : null,
    phase: phase,
    hasQuestions: questions.length > 0,
    hasCurrentQuestion: !!q,
    currentQInBounds: currentQ >= 0 && currentQ < questions.length
  });

  // ─── Exam Key Entry Phase ────────────────────────────────────────────────────
  if (phase === 'key') {
    return <ExamKeyModal examName={examData?.name || 'Loading...'} onStart={handleStartExam} disabled={isStartingExam} />;
  }

  // ─── Loading Phase ─────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0a0f', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Sora, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            border: '3px solid rgba(233,69,96,0.2)', 
            borderTop: '3px solid #e94560', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
            Starting Your Exam...
          </h2>
          <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, marginBottom: 20 }}>
            We're preparing your exam questions and setting up your session. This will only take a moment.
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 8,
            marginBottom: 16
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#e94560',
                  animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                }}
              ></div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#4a5568' }}>
            Please wait while we load your exam...
          </p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ─── Submitted Phase ─────────────────────────────────────────────────────────
  if (phase === 'submitted' && result) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: 32 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>{result.status === 'pass' ? '🎉' : result.isPending ? '⏳' : '😔'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>
            {result.isPending ? 'Exam Submitted!' : result.status === 'pass' ? 'Congratulations!' : 'Exam Completed'}
          </h1>
          {result.isPending ? (
            <p style={{ color: '#718096', marginBottom: 24 }}>Your answers are submitted. Results will be published after evaluation.</p>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              {[
                ['Marks Obtained', `${result.marksObtained} / ${result.totalMarks}`],
                ['Percentage', `${result.percentage}%`],
                ['Grade', result.grade],
                ['Status', result.status?.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 13, color: '#718096' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: result.status === 'pass' ? '#22c55e' : '#e94560' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/student/dashboard')} style={{ background: 'linear-gradient(135deg,#e94560,#c62a47)', border: 'none', borderRadius: 10, padding: '12px 28px', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Exam UI ─────────────────────────────────────────────────────────────
  return (
    <div data-exam-container style={{ minHeight: '100vh', background: '#080810', fontFamily: 'Sora, sans-serif', display: 'flex' }}>
      {/* Professional Warning Banner */}
      {warningMsg && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          background: warningMsg.includes('🚨') ? '#dc2626' : warningMsg.includes('Warning 3') ? '#dc2626' : warningMsg.includes('Warning 2') ? '#f59e0b' : '#ef4444', 
          padding: '14px 20px', 
          textAlign: 'center', 
          fontWeight: 600, 
          fontSize: 15, 
          color: 'white', 
          zIndex: 9999, 
          animation: 'slideDown 0.3s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          fontFamily: 'Sora, sans-serif'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <span style={{ fontSize: '20px', marginRight: '5px' }}>⚠️</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{warningMsg}</span>
            {warningMsg.includes('Warning') && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', marginRight: '5px', opacity: 0.9 }}>Violations:</span>
                {[1, 2, 3].map(num => {
                  const currentWarning = parseInt(warningMsg.match(/Warning (\d)/)?.[1] || '0');
                  const isActive = currentWarning >= num;
                  return (
                    <div 
                      key={num}
                      style={{ 
                        width: '14px', 
                        height: '14px', 
                        borderRadius: '50%', 
                        background: isActive ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        border: '2px solid #ffffff',
                        animation: isActive ? 'pulse 1.5s infinite' : 'none',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Indicator */}
      {phase === 'exam' && (
        <div style={{ position: 'fixed', top: 10, left: 10, background: 'rgba(34, 197, 94, 0.9)', padding: '8px 16px', borderRadius: '20px', fontSize: 12, fontWeight: 700, color: 'white', zIndex: 9998, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🖥️ FULL SCREEN MODE ACTIVE
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 2s infinite' }} />
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 260, background: 'rgba(10,10,20,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e94560', letterSpacing: 2, marginBottom: 4 }}>EXAMSHIELD</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>{examData?.name}</div>
          <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4 }}>{examData?.type?.toUpperCase()}</div>
        </div>

        {/* Timer */}
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Time Remaining</div>
          {timeRemaining > 0 && <Timer seconds={timeRemaining} onExpire={() => handleSubmit(true)} />}
        </div>

        {/* Professional Proctoring — Camera + Face Detection */}
        {phase === 'exam' && (
          <ProfessionalProctoring 
            sessionId={session?.id}
            examId={examId}
            studentId={user?.id}
            currentQuestion={currentQ}
            totalQuestions={questions.length}
            onViolation={handleViolationResponse}
          />
        )}

        {/* Violations */}
        {violationCount > 0 && (
          <div style={{ margin: '0 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
              ⚠ Violations: {violationCount}/{examData?.max_violations || 3}
            </div>
          </div>
        )}

        {/* Progress */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4a5568', marginBottom: 6 }}>
            <span>Progress</span>
            <span>{answered}/{questions.length}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{ height: '100%', background: '#e94560', borderRadius: 2, width: `${(answered / questions.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>

          {/* Question grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginTop: 12 }}>
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrentQ(i)} style={{
                width: '100%', aspectRatio: '1', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                background: i === currentQ ? '#e94560' : answers[q.id] ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)',
                color: i === currentQ ? 'white' : answers[q.id] ? '#22c55e' : '#4a5568',
              }}>{i + 1}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 260, padding: '32px 36px', overflowY: 'auto' }}>
        {phase === 'exam' && (
          <>
            {questions.length === 0 ? (
              // Enhanced loading state with retry mechanism
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#a0aec0' }}>
                <div style={{ 
                  width: 50, 
                  height: 50, 
                  border: '3px solid rgba(233,69,96,0.2)', 
                  borderTop: '3px solid #e94560', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  marginBottom: 20 
                }}></div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Loading Questions...</h2>
                <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 400, marginBottom: 20 }}>
                  Please wait while we load your exam questions. This should only take a moment.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#e94560',
                        animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                      }}
                    ></div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered');
                      window.location.reload();
                    }}
                    style={{
                      background: 'rgba(233,69,96,0.15)',
                      border: '1px solid rgba(233,69,96,0.3)',
                      borderRadius: 8,
                      padding: '10px 20px',
                      color: '#e94560',
                      cursor: 'pointer',
                      fontFamily: 'Sora, sans-serif',
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 Debug info:', {
                        phase: phase,
                        questionsLength: questions.length,
                        currentQ: currentQ,
                        examData: !!examData,
                        session: !!session,
                        examId: examId
                      });
                      alert(`Debug Info:\nPhase: ${phase}\nQuestions: ${questions.length}\nCurrentQ: ${currentQ}\nExamData: ${!!examData}\nSession: ${!!session}`);
                    }}
                    style={{
                      background: 'rgba(59,130,246,0.15)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: 8,
                      padding: '10px 20px',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontFamily: 'Sora, sans-serif',
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    Debug Info
                  </button>
                </div>
              </div>
            ) : !q || currentQ >= questions.length ? (
              // Enhanced error state with recovery options
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#a0aec0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Question Not Available</h2>
                <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 400, marginBottom: 20 }}>
                  {currentQ >= questions.length 
                    ? `You've reached the end of the exam. You have ${questions.length} questions in total.`
                    : 'There seems to be an issue loading this question. Please try the options below.'
                  }
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setCurrentQ(0)}
                    style={{ 
                      background: 'rgba(233,69,96,0.15)', 
                      border: '1px solid rgba(233,69,96,0.3)', 
                      borderRadius: 8, 
                      padding: '10px 20px', 
                      color: '#e94560', 
                      cursor: 'pointer', 
                      fontFamily: 'Sora, sans-serif', 
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    Go to First Question
                  </button>
                  <button 
                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                    style={{ 
                      background: 'rgba(59,130,246,0.15)', 
                      border: '1px solid rgba(59,130,246,0.3)', 
                      borderRadius: 8, 
                      padding: '10px 20px', 
                      color: '#3b82f6', 
                      cursor: 'pointer', 
                      fontFamily: 'Sora, sans-serif', 
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    Previous Question
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    style={{ 
                      background: 'rgba(107,114,128,0.15)', 
                      border: '1px solid rgba(107,114,128,0.3)', 
                      borderRadius: 8, 
                      padding: '10px 20px', 
                      color: '#6b7280', 
                      cursor: 'pointer', 
                      fontFamily: 'Sora, sans-serif', 
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    Refresh Exam
                  </button>
                </div>
              </div>
            ) : (
              // Normal question display
              <div style={{ maxWidth: 700 }}>
                {/* Question header with enhanced info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.3)', color: '#e94560', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                      Q{currentQ + 1} / {questions.length}
                    </span>
                    <span style={{ fontSize: 11, color: '#4a5568' }}>{q.marks || 0} {q.marks === 1 ? 'mark' : 'marks'}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: q.type === 'mcq' ? 'rgba(233,69,96,0.1)' : q.type === 'coding' ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)', color: q.type === 'mcq' ? '#e94560' : q.type === 'coding' ? '#22c55e' : '#8b5cf6' }}>
                      {q.type ? q.type.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#4a5568' }}>
                    {answers[q.id] ? <span style={{ color: '#22c55e' }}>✓ Answered</span> : 'Not answered'}
                  </div>
                </div>

                {/* Question Content */}
                {q.type === 'mcq' ? (
                  <MCQQuestion question={q} answer={answers[q.id]} onAnswer={(v) => handleAnswer(q.id, v)} />
                ) : q.type === 'subjective' ? (
                  <SubjectiveQuestion question={q} answer={answers[q.id]} onAnswer={(v) => handleAnswer(q.id, v)} />
                ) : q.type === 'coding' ? (
                  <CodingQuestion question={q} answer={answers[q.id]} onAnswer={(v) => handleAnswer(q.id, v)} />
                ) : (
                  <div style={{ color: '#a0aec0', fontSize: 14 }}>
                    <p style={{ marginBottom: 16, lineHeight: 1.7 }}>{q.question_text}</p>
                    <textarea value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)}
                      placeholder="Write your code here..."
                      rows={14}
                  style={{ width: '100%', background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '14px 16px', color: '#22c55e', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", resize: 'vertical' }} />
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                  <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 20px', color: '#a0aec0', cursor: currentQ === 0 ? 'default' : 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13, opacity: currentQ === 0 ? 0.4 : 1 }}>
                    ← Previous
                  </button>

                  <button onClick={() => handleSubmit(false)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 20px', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Sora, sans-serif' }}>
                    Submit Exam
                  </button>

                  <button onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))} disabled={currentQ === questions.length - 1}
                    style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 8, padding: '10px 20px', color: '#e94560', cursor: currentQ === questions.length - 1 ? 'default' : 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, opacity: currentQ === questions.length - 1 ? 0.4 : 1 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; border-color: #e94560 !important; }
        textarea::placeholder { color: #2d3748; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes slideDown { from{transform:translateY(-100%)} to{transform:none} }
      `}</style>
    </div>
  );
}
