// src/pages/student/ExamRoom.js - Professional Full-Screen Exam System
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

// ─── Professional Exam Room Component ──────────────────────────────────────────
export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
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
  const [, setLoadingError] = useState(null);
  const [isStartingExam, setIsStartingExam] = useState(false);

  // Professional State Management
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastVisibility, setLastVisibility] = useState('visible');
  const [examStartTime, setExamStartTime] = useState(null);

  // Refs for professional tracking
  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  const violationRef = useRef(violationCount);
  const tabSwitchTimeoutRef = useRef(null);
  violationRef.current = violationCount;

  // ─── Professional Full-Screen Management ──────────────────────────────────────────
  const enterFullScreen = useCallback(() => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.warn('Fullscreen request denied:', err.message);
          toast.error('Please enable full-screen mode for secure exam environment');
        });
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      setIsFullscreen(true);
      console.log('🖥️ Full-screen mode activated');
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Failed to enter full-screen mode');
    }
  }, []);

  const exitFullScreen = useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
      console.log('📱 Exited full-screen mode');
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  }, []);

  const checkFullscreenStatus = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);
    return isCurrentlyFullscreen;
  }, []);

  // ─── Professional Tab Switch Detection ──────────────────────────────────────────
  const handleVisibilityChange = useCallback(() => {
    const currentVisibility = document.visibilityState;
    
    if (lastVisibility === 'visible' && currentVisibility === 'hidden') {
      // Tab switch detected
      const newTabSwitchCount = tabSwitchCount + 1;
      setTabSwitchCount(newTabSwitchCount);
      
      console.log(`🚨 Tab switch detected! Count: ${newTabSwitchCount}`);
      
      // Report violation
      if (socketRef.current && session && !submitted) {
        socketRef.current.emit('violation', {
          sessionId: session.id,
          type: 'tab_switch',
          details: `Tab switched - Count: ${newTabSwitchCount}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Show warning
      if (newTabSwitchCount === 1) {
        toast.warning('⚠️ Tab switching detected! This may affect your exam score.');
      } else if (newTabSwitchCount === 2) {
        toast.error('🚨 Multiple tab switches detected! Final warning.');
      } else if (newTabSwitchCount >= 3) {
        toast.error('💀 Exam terminated! Too many tab switches.');
        // Auto-submit exam due to security violation
        handleSubmit(true);
        return;
      }
    }
    
    setLastVisibility(currentVisibility);
  }, [lastVisibility, tabSwitchCount, session, submitted, socketRef]);

  // ─── Professional Window Focus Management ──────────────────────────────────────────
  const handleWindowFocus = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('📱 Window focused - resuming full-screen check');
      // Re-check fullscreen status when window regains focus
      setTimeout(() => {
        checkFullscreenStatus();
      }, 100);
    }
  }, [checkFullscreenStatus]);

  // ─── Professional Context Menu Prevention ──────────────────────────────────────────
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error('🚫 Right-click disabled during exam');
    return false;
  }, []);

  // ─── Professional Keyboard Shortcuts Prevention ──────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    // Prevent common keyboard shortcuts
    const blockedKeys = [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Escape', 'Tab', 'Alt', 'Ctrl', 'Shift', 'Meta', 'Command',
      'c', 'v', 'x', 'a', 's', 'r', 'n', 't', 'w', 'i', 'p', 'o'
    ];
    
    if (blockedKeys.includes(e.key) && (e.ctrlKey || e.metaKey || e.altKey)) {
      e.preventDefault();
      e.stopPropagation();
      toast.error(`🚫 Keyboard shortcut "${e.key}" disabled during exam`);
      return false;
    }
  }, []);

  // ─── Answer Management ─────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Auto-save answer
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    studentAPI.saveAnswer(examId, {
      sessionId: session.id,
      questionId,
      ...(question.type === 'mcq' ? { selectedOption: answer } : 
         question.type === 'coding' ? { codeSubmission: answer } : 
         { answerText: answer }),
    }).catch(() => {});
  }, [questions, session, examId]);

  // ─── Professional Exam Submission ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async (autoSubmit = false, retryCount = 0) => {
    if (submitted) {
      console.log('📋 Exam already submitted, ignoring duplicate submission');
      return;
    }
    
    if (!autoSubmit && !window.confirm('Submit exam? You cannot change answers after submission.')) {
      return;
    }

    console.log(autoSubmit ? '🤖 Auto-submitting exam...' : '📤 Submitting exam...');
    setSubmitted(true);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);

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
      
      await Promise.allSettled(savePromises);
      console.log('✅ Final answers saved');

      // Prepare submission data
      const submissionData = {
        sessionId: session.id,
        autoSubmit: autoSubmit,
        violationCount: violationCount,
        tabSwitchCount: tabSwitchCount,
        terminationReason: autoSubmit ? 
          (tabSwitchCount >= 3 ? 'excessive_tab_switches' : 
           violationCount >= 3 ? 'excessive_violations' : 'max_violations_reached') : 
          'manual_submission',
        submissionTime: new Date().toISOString(),
        answersCount: Object.keys(answers).filter(k => answers[k]).length,
        examDuration: examStartTime ? Math.floor((Date.now() - examStartTime) / 1000) : 0
      };

      const response = await studentAPI.submitExam(examId, submissionData);
      
      if (response.success) {
        toast.success('Exam submitted successfully!');
        setResult(response.data);
        setPhase('submitted');
        
        // Exit fullscreen
        setTimeout(() => {
          exitFullScreen();
        }, 2000);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (err) {
      console.error('❌ [PROFESSIONAL] Exam submission failure:', err);
      toast.error('Exam submission failed. Please try again.');
      setSubmitted(false);
    }
  }, [answers, session, examId, violationCount, tabSwitchCount, examStartTime, questions, exitFullScreen]);

  // ─── Professional Exam Key Validation ─────────────────────────────────────────────
  const handleExamKey = useCallback(async (key) => {
    if (!key || key.trim() === '') {
      toast.error('Please enter a valid exam key');
      return;
    }

    setIsStartingExam(true);
    console.log('🔑 Validating exam key:', key);

    try {
      const response = await studentAPI.validateExamKey(examId, key);
      
      if (response.success) {
        toast.success('Exam key validated! Starting exam...');
        setSession(response.data.session);
        setQuestions(response.data.questions || []);
        setPhase('exam');
        setExamStartTime(Date.now());
        
        // Auto-enter fullscreen
        setTimeout(() => {
          enterFullScreen();
        }, 1000);
        
      } else {
        toast.error(response.message || 'Invalid exam key');
      }
    } catch (error) {
      console.error('❌ Exam key validation error:', error);
      toast.error('Failed to validate exam key');
    } finally {
      setIsStartingExam(false);
    }
  }, [examId]);

  // ─── Socket.IO Setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const wsUrl = process.env.REACT_APP_WS_URL || 
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://examshield-d5i2.onrender.com');
    
    const socket = io(wsUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔗 Connected to proctoring server');
    });

    socket.on('violation_update', (data) => {
      if (data.sessionId === session?.id) {
        setViolationCount(data.violationCount);
        toast.warning(`⚠️ Violation detected: ${data.type}`);
      }
    });

    socket.on('exam_terminated', (data) => {
      if (data.sessionId === session?.id) {
        toast.error(`🚨 Exam terminated: ${data.reason}`);
        handleSubmit(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [examId, session]);

  // ─── Professional Event Listeners Setup ───────────────────────────────────────────
  useEffect(() => {
    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = checkFullscreenStatus();
      
      if (!isCurrentlyFullscreen && phase === 'exam' && !submitted) {
        console.log('🚨 Full-screen exited - counting violation');
        if (socketRef.current && session) {
          socketRef.current.emit('violation', {
            sessionId: session.id,
            type: 'fullscreen_exit',
            details: 'Student exited full-screen mode',
            timestamp: new Date().toISOString()
          });
        }
        toast.warning('⚠️ Please return to full-screen mode');
      }
    };

    // Add all event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('focus', handleWindowFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Cleanup all event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleVisibilityChange, handleWindowFocus, handleContextMenu, handleKeyDown, checkFullscreenStatus, phase, session, submitted, socketRef]);

  // ─── Auto-save Setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'exam' && session && !submitted) {
      autoSaveRef.current = setInterval(() => {
        const currentAnswers = Object.keys(answers).filter(k => answers[k]);
        if (currentAnswers.length > 0) {
          console.log('💾 Auto-saving answers...');
          Object.entries(answers).forEach(([questionId, answer]) => {
            const question = questions.find(q => q.id === questionId);
            if (question && answer) {
              studentAPI.saveAnswer(examId, {
                sessionId: session.id,
                questionId,
                ...(question.type === 'mcq' ? { selectedOption: answer } : 
                   question.type === 'coding' ? { codeSubmission: answer } : 
                   { answerText: answer }),
              }).catch(() => {});
            }
          });
        }
      }, 30000); // Auto-save every 30 seconds
    } else if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }
  }, [phase, session, submitted, answers, questions, examId]);

  // ─── Fetch Exam Data ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await studentAPI.getExamDetails(examId);
        if (response.success) {
          setExamData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch exam data:', error);
        toast.error('Failed to load exam data');
      }
    };

    if (examId && phase === 'key') {
      fetchExamData();
    }
  }, [examId, phase]);

  // ─── Professional Render ─────────────────────────────────────────────────────
  const renderKeyPhase = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="d" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">ExamShield</h1>
            <p className="text-slate-600 mb-6">Enter your exam key to begin</p>
          </div>

          {/* Exam Key Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="examKey" className="block text-sm font-medium text-slate-700 mb-2">
                Exam Key
              </label>
              <input
                id="examKey"
                type="text"
                value=""
                onChange={(e) => setExamData(prev => prev ? { ...prev, examKey: e.target.value } : { examKey: e.target.value })}
                placeholder="Enter your exam key"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={isStartingExam}
              />
            </div>

            <button
              onClick={() => {
                const input = document.getElementById('examKey');
                if (input && input.value) {
                  handleExamKey(input.value.trim());
                } else {
                  toast.error('Please enter a valid exam key');
                }
              }}
              disabled={isStartingExam}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition duration-200"
            >
              {isStartingExam ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  </svg>
                  Validating Key...
                </>
              ) : (
                'Start Exam'
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Exam Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enter exam key provided by your institution</li>
              <li>• Ensure you have a stable internet connection</li>
              <li>• Allow full-screen mode when prompted</li>
              <li>• Do not switch tabs during exam</li>
              <li>• Complete exam in one sitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadingPhase = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16l8-8 8-8 8-8H4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading Exam...</h2>
        <p className="text-blue-200">Please wait while we prepare your exam</p>
      </div>
    </div>
  );

  const renderExamPhase = () => (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isFullscreen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-slate-700">
                  {isFullscreen ? '🖥️ Full-Screen Active' : '📱 Enter Full-Screen'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div>
                <span className="text-sm font-medium text-slate-700">
                  Tab Switches: {tabSwitchCount}/3
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${violationCount < 2 ? 'bg-green-500' : violationCount < 3 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-slate-700">
                  Violations: {violationCount}/3
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Timer 
                timeRemaining={timeRemaining} 
                onTimeUp={() => handleSubmit(true)} 
              />
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitted}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitted ? 'Submitted' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Proctoring Component */}
      <ProfessionalProctoring 
        socket={socketRef.current}
        sessionId={session?.id}
        violationCount={violationCount}
        tabSwitchCount={tabSwitchCount}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  Question {currentQ + 1} of {questions.length}
                </h2>
                <span className="text-sm text-slate-500">
                  {questions[currentQ]?.marks || 0} marks
                </span>
              </div>

              {/* Question Rendering */}
              {questions[currentQ] && (
                <div className="space-y-4">
                  {questions[currentQ].type === 'mcq' && (
                    <MCQQuestion
                      question={questions[currentQ]}
                      selectedOption={answers[questions[currentQ].id]?.selectedOption}
                      onSelect={(option) => handleAnswer(questions[currentQ].id, option)}
                      disabled={submitted}
                    />
                  )}
                  
                  {questions[currentQ].type === 'subjective' && (
                    <SubjectiveQuestion
                      question={questions[currentQ]}
                      answer={answers[questions[currentQ].id]?.answerText || ''}
                      onChange={(answer) => handleAnswer(questions[currentQ].id, answer)}
                      disabled={submitted}
                    />
                  )}
                  
                  {questions[currentQ].type === 'coding' && (
                    <CodingQuestion
                      question={questions[currentQ]}
                      code={answers[questions[currentQ].id]?.codeSubmission || ''}
                      onChange={(code) => handleAnswer(questions[currentQ].id, code)}
                      disabled={submitted}
                    />
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0 || submitted}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                  disabled={currentQ === questions.length - 1 || submitted}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">📋 Exam Instructions</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <p>• Read each question carefully before answering</p>
                <p>• You can navigate between questions using Previous/Next buttons</p>
                <p>• Answers are auto-saved every 30 seconds</p>
                <p>• Submit exam when you have answered all questions</p>
                <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="font-medium text-yellow-800">⚠️ Important:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Stay in full-screen mode throughout the exam</li>
                    <li>Do not switch tabs (max 3 switches allowed)</li>
                    <li>Each violation may affect your final score</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubmittedPhase = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 2 2-2 2-2H9z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-green-600 mb-4">Exam Submitted Successfully!</h1>
          <p className="text-slate-600 mb-6">Your exam has been submitted and is being graded.</p>
          
          {result && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">📊 Exam Results</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Marks:</span>
                  <span className="font-medium text-slate-800">{result.totalMarks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Your Score:</span>
                  <span className="font-medium text-slate-800">{result.score || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Percentage:</span>
                  <span className="font-medium text-slate-800">{result.percentage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-medium ${
                    result.percentage >= 40 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.percentage >= 40 ? '✅ Passed' : '❌ Failed'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Phase Renderer ─────────────────────────────────────────────────────
  if (phase === 'key') return renderKeyPhase();
  if (phase === 'loading') return renderLoadingPhase();
  if (phase === 'exam') return renderExamPhase();
  if (phase === 'submitted') return renderSubmittedPhase();
  
  return renderLoadingPhase();
}
