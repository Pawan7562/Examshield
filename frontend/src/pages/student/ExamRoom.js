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

  // Setup proctoring
  const reportViolation = useCallback(async (type, description) => {
    if (!session || submitted) return;
    try {
      const res = await studentAPI.reportViolation({
        sessionId: session.id,
        examId,
        type,
        description,
      });

      const { action, message, violationCount: count, autoTerminate } = res.data;
      setViolationCount(count);
      setWarningMsg(message);

      // Broadcast to admin
      socketRef.current?.emit('violation', {
        sessionId: session.id,
        examId,
        studentId: session.student_id,
        type,
        severity: action === 'terminate' ? 'critical' : 'warning',
      });

      if (autoTerminate) {
        toast.error('Exam terminated due to violations!');
        setTimeout(() => navigate('/student/exams'), 2000);
      } else {
        toast.error(message, { duration: 3000 });
      }
    } catch (error) {
      console.error('Violation reporting failed:', error);
    }
  }, [session, submitted, examId, navigate]);

  // Debounced violation reporting to prevent spam
  const debouncedReportViolation = useRef(
    debounce((type, description) => reportViolation(type, description), 2000)
  ).current;

  // Professional Tab Switching Detection System
  useEffect(() => {
    console.log('🎯 TAB SWITCHING DETECTION INITIALIZING:', {
      phase: phase,
      isProctored: examData?.is_proctored,
      submitted: submitted
    });
    
    if (phase !== 'exam' || !examData?.is_proctored) {
      console.log('❌ Tab switching detection disabled:', {
        reason: phase !== 'exam' ? 'Not in exam phase' : 'Exam not proctored',
        phase: phase,
        isProctored: examData?.is_proctored
      });
      return;
    }

    console.log('✅ Tab switching detection ENABLED');
    
    let violationCount = 0;
    const maxViolations = 3;
    let lastViolationTime = 0;
    let warningTimeoutId = null;
    let isTabSwitching = false;

    // Professional violation handler with smooth auto-submit
    const handleViolation = (type, description) => {
      console.log('🚨 VIOLATION HANDLER CALLED:', {
        type: type,
        description: description,
        submitted: submitted,
        currentTime: Date.now(),
        lastViolationTime: lastViolationTime
      });
      
      if (submitted) {
        console.log('❌ Violation ignored - exam already submitted');
        return;
      }

      const currentTime = Date.now();
      
      // Prevent duplicate violations within 2 seconds
      if (currentTime - lastViolationTime < 2000) {
        console.log('❌ Violation ignored - duplicate within 2 seconds');
        return;
      }
      
      lastViolationTime = currentTime;
      violationCount++;
      
      console.log('📊 VIOLATION COUNT:', violationCount, '/', maxViolations);
      
      // Professional violation messages
      const violationMessages = {
        'tab_switch': `⚠️ Warning ${violationCount}/3: Please remain focused on your exam. Tab switching is not allowed.`,
        'window_focus_lost': `⚠️ Warning ${violationCount}/3: Please keep your exam window active and focused.`,
        'context_menu': `⚠️ Warning ${violationCount}/3: Right-click is disabled during the exam.`,
        'keyboard_shortcut': `⚠️ Warning ${violationCount}/3: Keyboard shortcuts are disabled during the exam.`,
        'mouse_leave_screen': `⚠️ Warning ${violationCount}/3: Please keep your mouse within the exam window.`
      };

      const message = violationMessages[type] || `⚠️ Warning ${violationCount}/3: ${description}`;
      
      console.log(`🚨 Exam Violation ${violationCount}/3: ${type} - ${description}`);
      console.log('📝 Setting warning message:', message);
      setWarningMsg(message);

      // Report to backend with clean data
      console.log('📡 Reporting violation to backend...');
      reportViolation(type, description);

      // Clear any existing warning timeout
      if (warningTimeoutId) {
        clearTimeout(warningTimeoutId);
      }

      // Auto-terminate after max violations
      if (violationCount >= maxViolations) {
        console.error('🚨 EXAM TERMINATED: Maximum violations (3) reached');
        setWarningMsg('🚨 EXAM TERMINATED: You have reached the maximum number of violations. Your exam will be submitted automatically.');
        
        // Auto-submit immediately with professional handling
        setTimeout(() => {
          if (!submitted) {
            console.log('📤 Auto-submitting exam due to maximum violations...');
            handleSubmit(true);
          }
        }, 2000);
      } else {
        // Clear warning after 4 seconds if no more violations
        console.log('⏰ Setting warning timeout for 4 seconds');
        warningTimeoutId = setTimeout(() => {
          console.log('🧹 Clearing warning message');
          setWarningMsg('');
        }, 4000);
      }
    };

    // Smooth tab switching detection
    const handleVisibilityChange = () => {
      console.log('🔍 Visibility change detected:', {
        documentHidden: document.hidden,
        phase: phase,
        submitted: submitted,
        isTabSwitching: isTabSwitching,
        isProctored: examData?.is_proctored
      });
      
      if (document.hidden && !isTabSwitching && phase === 'exam' && !submitted && examData?.is_proctored) {
        console.log('🚨 Tab switch detected - starting violation process');
        isTabSwitching = true;
        
        // Small delay to ensure it's a real tab switch
        setTimeout(() => {
          if (document.hidden) {
            console.log('✅ Confirming tab switch violation');
            handleViolation('tab_switch', 'Student switched to another tab or window');
          } else {
            console.log('❌ Tab switch cancelled - user returned quickly');
          }
          isTabSwitching = false;
        }, 500);
      } else {
        console.log('🔍 Visibility change ignored:', {
          documentHidden: document.hidden,
          isTabSwitching: isTabSwitching,
          phase: phase,
          submitted: submitted,
          isProctored: examData?.is_proctored
        });
      }
    };

    // Professional window focus monitoring
    const handleWindowFocus = () => {
      // When window regains focus, clear any pending violations
      if (warningTimeoutId && violationCount < maxViolations) {
        clearTimeout(warningTimeoutId);
        setWarningMsg('');
      }
    };

    // Context menu blocking with professional message
    const handleContextMenu = (e) => {
      if (phase === 'exam' && !submitted) {
        e.preventDefault();
        handleViolation('context_menu', 'Student attempted to access context menu');
        return false;
      }
    };

    // Professional keyboard blocking
    const handleKeyDown = (e) => {
      if (submitted) return;

      const key = e.key.toLowerCase();
      const ctrlKey = e.ctrlKey || e.metaKey;
      const altKey = e.altKey;

      // Only block specific dangerous combinations
      const dangerousCombos = [
        { ctrl: true, key: 'c', name: 'Copy' },
        { ctrl: true, key: 'v', name: 'Paste' },
        { ctrl: true, key: 'x', name: 'Cut' },
        { ctrl: true, key: 'a', name: 'Select All' },
        { alt: true, key: 'tab', name: 'Alt+Tab' },
        { key: 'f12', name: 'Developer Tools' },
        { key: 'escape', name: 'Escape Key' }
      ];

      const isDangerous = dangerousCombos.some(combo => 
        (combo.ctrl && ctrlKey && combo.key === key) ||
        (combo.alt && altKey && combo.key === key) ||
        (!combo.ctrl && !combo.alt && combo.key === key)
      );

      if (isDangerous) {
        e.preventDefault();
        e.stopPropagation();
        
        const comboName = dangerousCombos.find(combo => 
          (combo.ctrl && ctrlKey && combo.key === key) ||
          (combo.alt && altKey && combo.key === key) ||
          (!combo.ctrl && !combo.alt && combo.key === key)
        ).name;
        
        handleViolation('keyboard_shortcut', `Student attempted to use ${comboName}`);
        return false;
      }
    };

    // Add only essential event listeners for smooth operation
    console.log('📡 Setting up event listeners...');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true);
    console.log('✅ Event listeners setup complete');

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up event listeners...');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      
      if (warningTimeoutId) {
        clearTimeout(warningTimeoutId);
      }
      console.log('✅ Cleanup complete');
    };
  }, [phase, examData, submitted, reportViolation]);

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
        
        // Set all data
        setExamData(exam);
        setSession(sessionData);
        setQuestions(questionsData);
        setTimeRemaining(time || 3600); // Default to 1 hour
        setLoadingError(null);

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
        
      } else {
        throw new Error('Required exam data not received');
      }

    } catch (error) {
      console.error('❌ Failed to start exam:', error);
      setIsStartingExam(false);
      setLoadingError(error.message || 'Failed to start exam');
      setPhase('key');
      
      // Show error toast
      toast.error(error.message || 'Failed to start exam. Please try again.', { 
        id: 'exam-start',
        duration: 5000 
      });
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(a => ({ ...a, [questionId]: value }));
    // Save immediately
    const question = questions.find(q => q.id === questionId);
    if (!question || !session) return;
    studentAPI.saveAnswer(examId, {
      sessionId: session.id,
      questionId,
      ...(question.type === 'mcq' ? { selectedOption: value } : question.type === 'coding' ? { codeSubmission: value } : { answerText: value }),
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
    clearInterval(autoSaveRef.current);

    try {
      // Final save all answers before submission
      console.log('💾 Saving final answers...');
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

      // Wait for all saves to complete
      await Promise.all(savePromises);
      console.log('✅ All answers saved successfully');

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
        console.error('❌ Network error during submission:', fetchError);
        
        // Retry logic for network errors
        if (retryCount < 3 && autoSubmit) {
          console.log(`🔄 Retrying auto-submission (${retryCount + 1}/3)...`);
          toast.loading(`Auto-submitting exam... Retry ${retryCount + 1}/3`);
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          
          // Reset submitted state for retry
          setSubmitted(false);
          
          // Retry the submission
          return handleSubmit(autoSubmit, retryCount + 1);
        }
        
        throw new Error('Network error: Unable to connect to server');
      }

      // Check if response is valid
      if (!res || !res.data) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Exam submitted successfully:', res.data);
      setResult(res.data);
      setPhase('submitted');

      // Notify backend with enhanced data
      socketRef.current?.emit('exam-submitted', { 
        sessionId: session.id, 
        examId,
        autoSubmit,
        violationCount,
        terminationReason: autoSubmit ? 'max_violations_reached' : 'manual_submission',
        submissionTime: new Date().toISOString(),
        answersCount: Object.keys(answers).filter(k => answers[k]).length
      });
      
      toast.success(autoSubmit ? 'Exam auto-submitted due to violations!' : 'Exam submitted successfully!');

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

      // Exit full screen after a short delay
      setTimeout(exitFullScreen, 1000);

      // Redirect to results after showing submission message
      setTimeout(() => {
        if (autoSubmit) {
          navigate('/student/exams'); // For auto-submit, go back to exams
        }
      }, 3000);

    } catch (err) {
      console.error('❌ Exam submission failed:', err);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Submission failed! Please try again.';
      
      if (err.message.includes('Network error')) {
        errorMessage = 'Network error! Please check your internet connection and try again.';
      } else if (err.message.includes('Invalid response')) {
        errorMessage = 'Server error! Please try again in a moment.';
      } else if (err.message.includes('session')) {
        errorMessage = 'Session expired! Please refresh the page and try again.';
      } else if (autoSubmit) {
        errorMessage = 'Auto-submission failed! Attempting to save your answers...';
        
        // For auto-submission failures, try to save answers locally
        try {
          localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
          localStorage.setItem(`exam_${examId}_session`, JSON.stringify({
            sessionId: session.id,
            violationCount: violationCount,
            terminationReason: 'max_violations_reached',
            timestamp: new Date().toISOString()
          }));
          errorMessage += ' Your answers have been saved locally.';
        } catch (saveError) {
          console.error('Failed to save answers locally:', saveError);
        }
      }
      
      toast.error(errorMessage);
      
      // Reset submitted state for manual retry (but not for auto-submission after max retries)
      if (!autoSubmit || retryCount >= 3) {
        setSubmitted(false);
      } else {
        // For auto-submission, try to continue without blocking
        console.log('⚠️ Auto-submission failed, but exam will continue...');
        setWarningMsg('Auto-submission failed, but your exam session is still active. Please submit manually when ready.');
      }
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

        {/* Professional Proctoring */}
        {examData?.is_proctored && (
          <ProfessionalProctoring 
            sessionId={session?.id}
            examId={examId}
            studentId={user?.id}
            currentQuestion={currentQ}
            totalQuestions={questions.length}
            onViolation={(violationData) => {
              setViolationCount(violationData.violationCount);
              setWarningMsg(violationData.message);
            }}
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
