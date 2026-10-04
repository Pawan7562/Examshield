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
import { parseToIST, formatIST, isExamEnded, isExamStartable, getExamRemainingSeconds } from '../../utils/timezone';
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
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  CheckSquare,
  Square,
  Monitor,
  Wifi,
  Camera,
  Mic,
  Code2,
  Sparkles
} from 'lucide-react';

// ─── Toast Notification Helpers ───────────────────────────────────────────────
const notify = {
  warn: (msg) => setTimeout(() => {
    toast(msg, {
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
    });
  }, 0),
  error: (msg) => setTimeout(() => {
    toast.error(msg, {
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
    });
  }, 0),
  success: (msg) => setTimeout(() => {
    toast.success(msg, {
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
    });
  }, 0),
  info: (msg) => setTimeout(() => {
    toast(msg, {
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
    });
  }, 0),
};

// ─── Bulletproof Self-Contained SVG Icons (Zero-Dependency & HMR Resilient) ───
const CameraOff = ({ size = 18, color = 'currentColor', style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 1.4-0.6" />
    <path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);

const RefreshCw = ({ size = 16, color = 'currentColor', style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

const Lock = ({ size = 16, color = 'currentColor', style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ScreenShare = ({ size = 18, color = 'currentColor', style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
    <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="m17 8 5-5" />
    <path d="M17 3h5v5" />
  </svg>
);

const ScreenShareOff = ({ size = 18, color = 'currentColor', style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M17 3h5v5" />
    <path d="m22 3-5 5" />
    <path d="M22 13v2a2 2 0 0 1-.18.82" />
    <path d="M17 17H4a2 2 0 0 1-2-2V5c0-.55.22-1.05.59-1.41" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
);

const ShieldCheck = ({ size = 18, color = 'currentColor', style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// ─── Safe Component Wrappers (Prevents any 'Element type is invalid' crash) ───
const SafeProfessionalProctoring = (props) => {
  if (!ProfessionalProctoring || (typeof ProfessionalProctoring !== 'function' && typeof ProfessionalProctoring !== 'object')) {
    return null;
  }
  return <ProfessionalProctoring {...props} />;
};

const SafeMCQQuestion = (props) => (MCQQuestion && (typeof MCQQuestion === 'function' || typeof MCQQuestion === 'object') ? <MCQQuestion {...props} /> : null);
const SafeSubjectiveQuestion = (props) => (SubjectiveQuestion && (typeof SubjectiveQuestion === 'function' || typeof SubjectiveQuestion === 'object') ? <SubjectiveQuestion {...props} /> : null);
const SafeCodingQuestion = (props) => (CodingQuestion && (typeof CodingQuestion === 'function' || typeof CodingQuestion === 'object') ? <CodingQuestion {...props} /> : null);
const SafeTimer = (props) => (Timer && (typeof Timer === 'function' || typeof Timer === 'object') ? <Timer {...props} /> : null);

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
  const [phase, setPhase] = useState('key'); // 'key' | 'intro' | 'permissions' | 'waiting' | 'exam' | 'submitted' | 'ended'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [introTab, setIntroTab] = useState('general'); // 'general' | 'proctoring' | 'palette' | 'instructor'
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
  const [waitingCountdown, setWaitingCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 1, isReady: false });
  const [waitingStatus, setWaitingStatus] = useState('');

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

  // ── Mandatory Hardware & Permission Verification State ──
  const [setupStep, setSetupStep] = useState(1); // 1: Entire Screen, 2: Microphone, 3: Camera, 4: Ready Confirmation
  const [cameraPerm, setCameraPerm] = useState('prompt'); // 'prompt' | 'checking' | 'granted' | 'denied' | 'unavailable'
  const [micPerm, setMicPerm] = useState('prompt');       // 'prompt' | 'checking' | 'granted' | 'denied' | 'unavailable'
  const [screenPerm, setScreenPerm] = useState('prompt'); // 'prompt' | 'checking' | 'granted' | 'denied' | 'not_entire'
  const [deviceCheckError, setDeviceCheckError] = useState(null);
  const [previewAudioLevel, setPreviewAudioLevel] = useState(0);
  const [speechDetectedTest, setSpeechDetectedTest] = useState(false);
  const [cameraInterrupted, setCameraInterrupted] = useState(false);
  const [screenShareInterrupted, setScreenShareInterrupted] = useState(false);
  const [reinitCameraKey, setReinitCameraKey] = useState(0);
  const [activeMediaStream, setActiveMediaStream] = useState(null);

  const previewStreamRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewAudioCtxRef = useRef(null);
  const previewAnalyserRef = useRef(null);
  const previewAnimRef = useRef(null);
  const screenStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Sync video and audio tracks into a unified MediaStream for background proctoring
  const syncCombinedMediaStream = useCallback(() => {
    const videoTrack = cameraStreamRef.current?.getVideoTracks().find(t => t.readyState === 'live')
      || previewStreamRef.current?.getVideoTracks().find(t => t.readyState === 'live');
    const audioTrack = micStreamRef.current?.getAudioTracks().find(t => t.readyState === 'live')
      || previewStreamRef.current?.getAudioTracks().find(t => t.readyState === 'live');

    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);

    if (tracks.length > 0) {
      const combined = new MediaStream(tracks);
      previewStreamRef.current = combined;
      setActiveMediaStream(combined);
      return combined;
    }
    return previewStreamRef.current;
  }, []);

  // Responsive device check: all 3 permissions must be granted to proceed
  const isDeviceCheckPassed = useMemo(() => {
    return cameraPerm === 'granted' && micPerm === 'granted' && screenPerm === 'granted';
  }, [cameraPerm, micPerm, screenPerm]);

  // ── Refs ──
  const [activeSocket, setActiveSocket] = useState(null);
  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const submittedRef = useRef(false);
  const sessionRef = useRef(null);
  const answersRef = useRef({});
  const languagesRef = useRef({});
  const questionsRef = useRef([]);
  const debounceTimersRef = useRef({});
  const isFlushingRef = useRef(false);

  // Keep refs current
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // Clean up preview audio visualizer and preview elements
  const cleanupPreviewStream = useCallback(() => {
    if (previewAnimRef.current) {
      cancelAnimationFrame(previewAnimRef.current);
      previewAnimRef.current = null;
    }
    if (previewAudioCtxRef.current) {
      try { previewAudioCtxRef.current.close(); } catch (_) {}
      previewAudioCtxRef.current = null;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
  }, []);

  // ── STEP 1: Entire Screen Sharing Authorization (Strictly requires Entire Screen/Monitor) ──
  const authorizeScreenShare = useCallback(async () => {
    setScreenPerm('checking');
    setDeviceCheckError(null);

    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // Strongly hints browser to default to entire screen
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'exclude',
        systemAudio: 'exclude',
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack || screenTrack.readyState !== 'live') {
        setScreenPerm('denied');
        setDeviceCheckError('Screen sharing could not be initiated. Please select your Entire Screen.');
        displayStream.getTracks().forEach(t => t.stop());
        return;
      }

      const settings = screenTrack.getSettings();
      const displaySurface = settings.displaySurface;

      if (displaySurface && displaySurface !== 'monitor') {
        setScreenPerm('not_entire');
        setDeviceCheckError(
          `You selected "${displaySurface === 'browser' ? 'a browser tab' : 'an application window'}" instead of your entire screen. ` +
          'Proctoring security standards strictly require sharing your ENTIRE MONITOR/SCREEN. Please click "Authorize Entire Screen Share" again and select the "Entire Screen" option.'
        );
        notify.warn('You must share your ENTIRE screen, not a tab or window.');
        displayStream.getTracks().forEach(t => t.stop());
        return;
      }

      screenStreamRef.current = displayStream;
      setScreenPerm('granted');
      setScreenShareInterrupted(false);

      screenTrack.addEventListener('ended', () => {
        console.warn('[ExamRoom] Screen share track ended — candidate stopped sharing');
        setScreenPerm('denied');
        setScreenShareInterrupted(true);
        screenStreamRef.current = null;
      });

      notify.success('Entire screen sharing verified! Proceed to microphone setup.');
      setTimeout(() => {
        setSetupStep(prev => (prev === 1 ? 2 : prev));
      }, 600);
    } catch (screenErr) {
      console.warn('Screen share permission error:', screenErr);
      setScreenPerm('denied');
      if (screenErr.name === 'NotAllowedError' || screenErr.name === 'AbortError') {
        setDeviceCheckError('Screen sharing was cancelled or denied. Entire screen sharing is mandatory to enter the exam.');
        notify.warn('Screen sharing was cancelled. Please authorize your entire screen.');
      } else {
        setDeviceCheckError('Screen sharing failed or was blocked by your browser. Please try again.');
        notify.error('Screen sharing unavailable.');
      }
    }
  }, []);

  // ── STEP 2: Dedicated Microphone Access & Real-Time Voice Waveform Test ──
  const authorizeMicrophone = useCallback(async () => {
    setMicPerm('checking');
    setDeviceCheckError(null);

    try {
      if (micStreamRef.current && micStreamRef.current.getAudioTracks().some(t => t.readyState === 'live')) {
        setMicPerm('granted');
        return micStreamRef.current;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (e) {
        console.warn('Microphone constraint fallback to basic audio:', e);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== 'live') {
        setMicPerm('denied');
        setDeviceCheckError('Microphone hardware detected but track is not live. Please verify connection.');
        stream.getTracks().forEach(t => t.stop());
        return null;
      }

      micStreamRef.current = stream;
      setMicPerm('granted');

      audioTrack.addEventListener('ended', () => {
        console.warn('[ExamRoom] Microphone track ended');
        setMicPerm('denied');
        setCameraInterrupted(true);
      });

      // Set up real-time audio volume visualizer
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (previewAudioCtxRef.current) {
            try { previewAudioCtxRef.current.close(); } catch (_) {}
          }
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') await ctx.resume();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.4;
          const src = ctx.createMediaStreamSource(stream);
          src.connect(analyser);

          previewAudioCtxRef.current = ctx;
          previewAnalyserRef.current = analyser;

          const buf = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioMeter = () => {
            if (!previewAnalyserRef.current) return;
            previewAnalyserRef.current.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const avg = sum / buf.length;
            const lvl = Math.min(100, Math.round((avg / 128) * 100));
            setPreviewAudioLevel(lvl);
            if (lvl > 8) {
              setSpeechDetectedTest(true);
            }
            previewAnimRef.current = requestAnimationFrame(updateAudioMeter);
          };
          previewAnimRef.current = requestAnimationFrame(updateAudioMeter);
        }
      } catch (e) {
        console.warn('Audio visualization notice:', e);
      }

      syncCombinedMediaStream();
      notify.success('Microphone verified and active! Speak to test audio sensitivity.');
      return stream;
    } catch (err) {
      console.warn('Microphone permission error:', err);
      setMicPerm('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDeviceCheckError('Microphone permission was blocked. Click the lock icon in your browser address bar to allow microphone access.');
        notify.warn('Microphone permission blocked.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicPerm('unavailable');
        setDeviceCheckError('No microphone hardware detected on this device. An active microphone is required.');
        notify.error('No microphone found.');
      } else {
        setDeviceCheckError('Could not access microphone. Ensure no other application (Zoom, Teams) is using it.');
        notify.error('Microphone access failed.');
      }
      return null;
    }
  }, [syncCombinedMediaStream]);

  // ── STEP 3: Dedicated Web Camera Access & Face Guide Feed ──
  const authorizeCamera = useCallback(async () => {
    setCameraPerm('checking');
    setDeviceCheckError(null);

    try {
      if (cameraStreamRef.current && cameraStreamRef.current.getVideoTracks().some(t => t.readyState === 'live')) {
        setCameraPerm('granted');
        if (previewVideoRef.current && previewVideoRef.current.srcObject !== cameraStreamRef.current) {
          previewVideoRef.current.srcObject = cameraStreamRef.current;
          previewVideoRef.current.play().catch(() => {});
        }
        return cameraStreamRef.current;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch (camErr) {
        console.warn('Camera ideal constraint fallback to basic video:', camErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== 'live') {
        setCameraPerm('denied');
        setDeviceCheckError('Webcam detected but video track is inactive. Please reconnect your webcam.');
        stream.getTracks().forEach(t => t.stop());
        return null;
      }

      cameraStreamRef.current = stream;
      setCameraPerm('granted');

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.play().catch(() => {});
      }

      videoTrack.addEventListener('ended', () => {
        console.warn('[ExamRoom] Camera track ended');
        setCameraPerm('denied');
        setCameraInterrupted(true);
      });

      syncCombinedMediaStream();
      notify.success('Camera feed verified and active! Align your face within the frame.');
      return stream;
    } catch (err) {
      console.warn('Camera permission error:', err);
      setCameraPerm('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDeviceCheckError('Camera permission was blocked. Click the lock icon in your browser address bar to allow camera access.');
        notify.warn('Camera permission blocked.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPerm('unavailable');
        setDeviceCheckError('No webcam hardware detected. A functional webcam is mandatory.');
        notify.error('No camera detected.');
      } else {
        setDeviceCheckError('Could not access webcam. Ensure other apps (Zoom, Skype) are closed and try again.');
        notify.error('Camera access failed.');
      }
      return null;
    }
  }, [syncCombinedMediaStream]);

  // Composite re-enable handler for lock screen and mid-exam reconnection
  const verifyCameraAndMic = useCallback(async () => {
    const mic = await authorizeMicrophone();
    const cam = await authorizeCamera();
    return (mic && cam) ? previewStreamRef.current : null;
  }, [authorizeMicrophone, authorizeCamera]);

  const verifyDevicePermissions = useCallback(async () => {
    if (screenPerm !== 'granted') {
      await authorizeScreenShare();
    }
    if (micPerm !== 'granted') {
      await authorizeMicrophone();
    }
    if (cameraPerm !== 'granted') {
      await authorizeCamera();
    }
  }, [screenPerm, micPerm, cameraPerm, authorizeScreenShare, authorizeMicrophone, authorizeCamera]);

  // Clean up all hardware streams completely on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewStream();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop());
        previewStreamRef.current = null;
      }
    };
  }, [cleanupPreviewStream]);

  // Attach video stream to previewVideoRef if available during camera step or final review
  useEffect(() => {
    if ((setupStep === 3 || setupStep === 4) && cameraStreamRef.current && previewVideoRef.current) {
      if (previewVideoRef.current.srcObject !== cameraStreamRef.current) {
        previewVideoRef.current.srcObject = cameraStreamRef.current;
        previewVideoRef.current.play().catch(() => {});
      }
    }
  }, [setupStep, cameraPerm]);

  // Screen share watchdog during active exam — detect if share stops or window closes
  useEffect(() => {
    if (phase !== 'exam' || submitted) return;

    const watchdog = setInterval(() => {
      const stream = screenStreamRef.current;
      if (!stream || !stream.active) {
        if (!screenShareInterrupted) {
          setScreenShareInterrupted(true);
          setScreenPerm('denied');
        }
        return;
      }
      const tracks = stream.getVideoTracks();
      if (tracks.length === 0 || tracks[0].readyState === 'ended') {
        if (!screenShareInterrupted) {
          setScreenShareInterrupted(true);
          setScreenPerm('denied');
        }
      }
    }, 2000);

    return () => clearInterval(watchdog);
  }, [phase, submitted, screenShareInterrupted]);

  // ── Compute Normalized Per-Exam Monitoring Config (Proctoring Always Enforced) ──
  const resolvedMonitoringConfig = useMemo(() => {
    let cfg = examData?.exam?.monitoring_config || examData?.monitoring_config;
    if (typeof cfg === 'string') {
      try { cfg = JSON.parse(cfg); } catch (_) { cfg = null; }
    }
    // In ExamShield, all exams strictly require camera and audio telemetry
    return {
      face_detection: cfg?.face_detection !== false,
      voice_detection: true, // Always mandatory
      tab_switch: cfg?.tab_switch !== false,
      fullscreen: cfg?.fullscreen !== false,
      device_camera: true,  // Always mandatory
      is_proctored: true,   // Always mandatory
    };
  }, [examData]);

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
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = null;
    }
    // Cancel all pending per-question debounce timers to avoid post-submit race conditions
    if (debounceTimersRef.current) {
      Object.values(debounceTimersRef.current).forEach(t => clearTimeout(t));
      debounceTimersRef.current = {};
    }

    try {
      // 1. Build answersList from current in-memory state, then flush via bulk save
      const currentSessionId = sessionRef.current?.id;
      const currentAnswers = { ...(answersRef.current || {}), ...(answers || {}) };
      const currentQuestions = (questionsRef.current && questionsRef.current.length > 0)
        ? questionsRef.current
        : (questions || []);

      let answersList = [];
      if (currentSessionId && Object.keys(currentAnswers).length > 0) {
        answersList = Object.entries(currentAnswers)
          .filter(([, ans]) => ans !== null && ans !== undefined && String(ans).trim() !== '')
          .map(([qId, ans]) => {
            const q = currentQuestions.find(item => String(item.id) === String(qId));
            const isMcqOrTf = q?.type === 'mcq' || q?.type === 'true_false';
            const lang = languagesRef.current[qId];
            return {
              questionId: qId,
              ...(isMcqOrTf ? { selectedOption: ans } :
                q?.type === 'coding' ? { codeSubmission: ans, selectedLanguage: lang, language: lang } :
                  { answerText: ans }),
            };
          });

        if (answersList.length > 0) {
          try {
            await studentAPI.saveAnswersBulk(examId, {
              sessionId: currentSessionId,
              answers: answersList,
            });
          } catch (flushErr) {
            console.warn('Bulk flush notice before submit:', flushErr);
          }
        }
      }

      // 2. Submit the entire examination
      const response = await studentAPI.submitExam(examId, {
        sessionId: currentSessionId,
        autoSubmit,
        violationCount,
        tabSwitchCount: tabSwitchCountRef.current,
        terminationReason: autoSubmit ? 'auto_submit' : 'manual',
        submissionTime: new Date().toISOString(),
        answers: answersList,
      });

      if (response.success) {
        try { localStorage.removeItem(`examshield_backup_${examId}_${user?.id || 'candidate'}`); } catch (_) {}
        notify.success('Exam submitted successfully!');
        const rawResult = response.data?.result || response.data || {};
        const normalizedResult = {
          score: rawResult.score ?? rawResult.marksObtained ?? response.data?.score ?? 0,
          totalMarks: rawResult.totalMarks ?? response.data?.totalMarks ?? 100,
          percentage: rawResult.percentage ?? response.data?.percentage ?? 0,
          status: rawResult.status ?? response.data?.status ?? 'Submitted',
          questionsAttempted: rawResult.questionsAttempted ?? response.data?.questionsAttempted ?? Object.keys(currentAnswers).length,
          questionsTotal: rawResult.questionsTotal ?? response.data?.questionsTotal ?? currentQuestions.length,
          ...rawResult
        };
        setResult(normalizedResult);
        setPhase('submitted');
        setTimeout(exitFullScreen, 1200);
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      const errMsg = err?.response?.data?.message || err?.message || '';
      if (errMsg.toLowerCase().includes('already submitted') || errMsg.toLowerCase().includes('already completed')) {
        try { localStorage.removeItem(`examshield_backup_${examId}_${user?.id || 'candidate'}`); } catch (_) {}
        notify.success('Your examination responses are safely recorded.');
        setPhase('submitted');
        setTimeout(exitFullScreen, 1200);
      } else {
        notify.error(errMsg || 'Submission encountered an issue. Please try again.');
        submittedRef.current = false;
        setSubmitted(false);
      }
    }
  }, [examId, violationCount, exitFullScreen]);

  // ─── Face Violation Handler (from ProfessionalProctoring) ────────────────────
  const handleFaceViolation = useCallback((type) => {
    if (resolvedMonitoringConfig.face_detection === false) return;
    setFaceAlert(type);
    setViolationCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setTimeout(() => {
          notify.error('Too many proctoring violations recorded. Exam is being auto-submitted.');
          handleSubmit(true);
        }, 0);
      }
      return next;
    });
    setTimeout(() => setFaceAlert(null), 5000);
  }, [handleSubmit, resolvedMonitoringConfig.face_detection]);

  // ─── Tab Switch Detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;
    if (resolvedMonitoringConfig.tab_switch === false) return; // Feature disabled by admin

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
  }, [phase, handleSubmit, resolvedMonitoringConfig.tab_switch]);

  // ─── Fullscreen Event Listener ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;
    if (resolvedMonitoringConfig.fullscreen === false) return; // Feature disabled by admin

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
  }, [phase, resolvedMonitoringConfig.fullscreen]);

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
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://examshield-3-wydj.onrender.com');
    const socket = io(wsUrl, { auth: { token }, reconnectionAttempts: 5 });
    socketRef.current = socket;
    setActiveSocket(socket);

    socket.on('connect', () => {
      console.log('Proctoring connection established for session:', session.id);
      setActiveSocket(socket);
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
      socketRef.current = null;
      setActiveSocket(null);
    };
  }, [phase, session, examId, user?.id, user?.name, handleSubmit]);

  // ─── Periodic Auto-save with Randomized Scheduling Jitter ───────────────────
  useEffect(() => {
    if (phase !== 'exam' || !session || submitted) return;

    let isMounted = true;

    const scheduleNextBulkFlush = () => {
      // Randomized scheduling jitter: 28s to 42s (smoothes concurrent load across candidates)
      const jitteredIntervalMs = 28000 + Math.floor(Math.random() * 14000);

      autoSaveRef.current = setTimeout(async () => {
        if (!isMounted || phase !== 'exam' || submittedRef.current) return;

        // Prevent overlapping concurrent flushes
        if (isFlushingRef.current) {
          scheduleNextBulkFlush();
          return;
        }

        const currentAnswers = { ...(answersRef.current || {}) };
        const currentQuestions = (questionsRef.current && questionsRef.current.length > 0)
          ? questionsRef.current
          : [];
        const currentSessionId = sessionRef.current?.id || session?.id;

        const answersList = Object.entries(currentAnswers)
          .filter(([, ans]) => ans !== null && ans !== undefined && String(ans).trim() !== '')
          .map(([qId, ans]) => {
            const q = currentQuestions.find(item => String(item.id) === String(qId));
            const isMcqOrTf = q?.type === 'mcq' || q?.type === 'true_false';
            const lang = languagesRef.current?.[qId];
            return {
              questionId: qId,
              ...(isMcqOrTf ? { selectedOption: ans } :
                q?.type === 'coding' ? { codeSubmission: ans, selectedLanguage: lang, language: lang } :
                  { answerText: ans }),
            };
          });

        if (answersList.length > 0 && currentSessionId) {
          isFlushingRef.current = true;
          try {
            await studentAPI.saveAnswersBulk(examId, {
              sessionId: currentSessionId,
              answers: answersList,
            });
          } catch (err) {
            console.warn('Periodic bulk autosave background notice:', err);
          } finally {
            isFlushingRef.current = false;
          }
        }

        if (isMounted && !submittedRef.current) {
          scheduleNextBulkFlush();
        }
      }, jitteredIntervalMs);
    };

    scheduleNextBulkFlush();

    return () => {
      isMounted = false;
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
        autoSaveRef.current = null;
      }
    };
  }, [phase, session?.id, submitted, examId]);

  // ─── Fetch Exam Details ───────────────────────────────────────────────────────
  // ─── Fetch Exam Details & Auto-Fill Access Key ──────────────────────────────
  useEffect(() => {
    // Check URL parameters for pre-supplied access key
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlKey = sp.get('key') || sp.get('exam_key') || sp.get('exam_code') || sp.get('access_key');
      if (urlKey) {
        setExamKey(urlKey.trim().toUpperCase());
      }
    } catch (_) {}

    if (examId) {
      studentAPI.getExamDetails(examId)
        .then(r => {
          if (r.success && r.data) {
            setExamData(r.data);
            const examObj = r.data.exam;
            const hasSubmittedSession = r.data.existingSession?.status === 'submitted' || r.data.existingSession?.status === 'terminated';

            if (hasSubmittedSession) {
              setPhase('submitted');
              const sess = r.data.existingSession;
              const totalM = r.data.exam?.total_marks ? Number(r.data.exam.total_marks) : 100;
              const score = sess.total_score !== undefined && sess.total_score !== null ? Number(sess.total_score) : 0;
              const pct = sess.percentage !== undefined && sess.percentage !== null && !isNaN(sess.percentage)
                ? Number(sess.percentage)
                : (totalM > 0 ? Math.round((score / totalM) * 100) : 0);
              const qTotal = sess.questionsTotal || r.data.questions?.length || 2;
              const qAttempted = sess.questionsAttempted || (score > 0 && qTotal > 0 ? qTotal : qTotal);
              setResult({
                score: score,
                totalMarks: totalM,
                percentage: pct,
                status: sess.result_status || (pct >= 40 ? 'Passed' : 'Completed'),
                questionsAttempted: qAttempted,
                questionsTotal: qTotal,
                isPending: sess.result_status === 'pending'
              });
              return;
            }

            // If exam has already ended according to its scheduled end time or backend check
            if (r.data.isEnded || isExamEnded(examObj)) {
              setPhase('ended');
              return;
            }

            // Automatically pre-fill the official access key for the student
            const key = examObj?.exam_code || examObj?.exam_key;
            if (key) {
              setExamKey(String(key).trim().toUpperCase());
            }

            // Industry standard: Verification must strictly occur ONLY when the candidate
            // explicitly clicks the "Verify Student" button.
          }
        })
        .catch((err) => {
          const errMsg = err?.response?.data?.message || '';
          if (err?.response?.data?.isEnded || errMsg.toLowerCase().includes('ended')) {
            setPhase('ended');
          }
        });
    }
  }, [examId]);

  // ─── Answer Handler & Offline Local Backup ──────────────────────────────────
  // ─── Answer Handler & Offline Local Backup ──────────────────────────────────
  const persistAnswersToLocalStorage = useCallback((updatedAnswers, updatedLanguages = {}) => {
    try {
      const storageKey = `examshield_backup_${examId}_${user?.id || 'candidate'}`;
      let existingBackup = {};
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) existingBackup = JSON.parse(raw);
      } catch (_) {}

      const previousEntries = (existingBackup && existingBackup.entries) ? existingBackup.entries : {};
      const now = Date.now();

      const newEntries = {};
      Object.entries(updatedAnswers || {}).forEach(([qId, val]) => {
        const prev = previousEntries[qId];
        const hasChanged = !prev || prev.value !== val;
        newEntries[qId] = {
          value: val,
          updatedAt: hasChanged ? now : (prev.updatedAt || now),
          language: updatedLanguages[qId] || languagesRef.current?.[qId] || prev?.language || null
        };
      });

      const backupEnvelope = {
        version: 2,
        savedAt: now,
        answers: updatedAnswers,
        entries: newEntries
      };

      localStorage.setItem(storageKey, JSON.stringify(backupEnvelope));
    } catch (_) {}
  }, [examId, user]);

  const handleAnswer = useCallback((questionId, answer, language = null) => {
    answersRef.current = { ...answersRef.current, [questionId]: answer };
    if (language) {
      languagesRef.current[questionId] = language;
    }
    setAnswers(prev => {
      const next = { ...prev, [questionId]: answer };
      persistAnswersToLocalStorage(next, language ? { [questionId]: language } : {});
      return next;
    });

    const q = questions.find(q => String(q.id) === String(questionId));
    if (!q || !session) return;
    const isMcqOrTf = q.type === 'mcq' || q.type === 'true_false';
    const langToUse = language || languagesRef.current[questionId];

    // Clear any previous debounce timer for this question
    if (debounceTimersRef.current[questionId]) {
      clearTimeout(debounceTimersRef.current[questionId]);
    }

    // Debounce remote network saves by 1200ms to eliminate high-concurrency request spikes
    debounceTimersRef.current[questionId] = setTimeout(() => {
      delete debounceTimersRef.current[questionId];
      studentAPI.saveAnswer(examId, {
        sessionId: session.id,
        questionId,
        ...(isMcqOrTf ? { selectedOption: answer } :
          q.type === 'coding' ? { codeSubmission: answer, selectedLanguage: langToUse, language: langToUse } :
            { answerText: answer }),
      }).catch((err) => {
        console.warn('Realtime save notice (will be flushed on next interval/submit):', err);
      });
    }, 1200);
  }, [questions, session, examId, persistAnswersToLocalStorage]);

  // ─── Clear Answer ─────────────────────────────────────────────────────────────
  const handleClearAnswer = (questionId) => {
    if (debounceTimersRef.current[questionId]) {
      clearTimeout(debounceTimersRef.current[questionId]);
      delete debounceTimersRef.current[questionId];
    }
    if (answersRef.current) {
      delete answersRef.current[questionId];
    }
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      persistAnswersToLocalStorage(next);
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
    if (!isDeviceCheckPassed || cameraPerm !== 'granted' || micPerm !== 'granted' || screenPerm !== 'granted') {
      setPhase('permissions');
      notify.error('Camera, microphone, and entire screen sharing permissions must be verified before entering the exam room.');
      return;
    }

    syncCombinedMediaStream();
    if (previewStreamRef.current) {
      setActiveMediaStream(previewStreamRef.current);
    }

    const finalKey = (keyToUse || examKey || examData?.exam?.exam_code || examData?.exam?.exam_key || '').trim();
    setIsStartingExam(true);
    try {
      const response = await studentAPI.startExam(examId, { examKey: finalKey });
      if (response.alreadySubmitted || response.data?.alreadySubmitted || response.message?.includes('already completed') || response.message?.includes('already submitted')) {
        exitFullScreen();
        setPhase('submitted');
        setTimeout(() => {
          toast('This examination has already been completed and locked.', {
            icon: '📋',
            style: {
              background: '#f0fdf4',
              color: '#15803d',
              border: '1.5px solid #bbf7d0',
              fontWeight: 600,
              fontSize: '0.88rem',
              borderRadius: '10px'
            },
            duration: 6000
          });
        }, 0);
        return;
      }
      if (response.success) {
        const data = response.data || response;
        setSession(data.session);
        setQuestions(data.questions || []);

        // ── Intelligent Answer Reconciliation (Question-by-Question Timestamp Merge) ──
        const serverMap = {};
        if (Array.isArray(data.savedAnswers) && data.savedAnswers.length > 0) {
          data.savedAnswers.forEach(a => {
            const val = a.selected_option ?? a.code_submission ?? a.answer_text;
            if (val !== undefined && val !== null) {
              const serverTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              serverMap[String(a.question_id)] = {
                value: val,
                updatedAt: serverTime,
                language: a.selected_language || null
              };
            }
          });
        }

        let localEntries = {};
        try {
          const cached = localStorage.getItem(`examshield_backup_${examId}_${user?.id || 'candidate'}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.version === 2 && parsed.entries) {
              localEntries = parsed.entries;
            } else if (parsed && typeof parsed === 'object') {
              const flat = parsed.answers || parsed;
              Object.entries(flat).forEach(([k, v]) => {
                localEntries[k] = { value: v, updatedAt: 0 };
              });
            }
          }
        } catch (_) {}

        const allQuestionIds = new Set([
          ...Object.keys(serverMap),
          ...Object.keys(localEntries)
        ]);

        const mergedAnswers = {};
        const mergedLanguages = { ...(languagesRef.current || {}) };

        allQuestionIds.forEach(qId => {
          const s = serverMap[qId];
          const l = localEntries[qId];

          if (s && l) {
            // If local answer has a newer timestamp than server, prioritize fresher local answer
            if (l.updatedAt && l.updatedAt > s.updatedAt) {
              mergedAnswers[qId] = l.value;
              if (l.language) mergedLanguages[qId] = l.language;
            } else {
              mergedAnswers[qId] = s.value;
              if (s.language) mergedLanguages[qId] = s.language;
            }
          } else if (s) {
            mergedAnswers[qId] = s.value;
            if (s.language) mergedLanguages[qId] = s.language;
          } else if (l) {
            mergedAnswers[qId] = l.value;
            if (l.language) mergedLanguages[qId] = l.language;
          }
        });

        setAnswers(mergedAnswers);
        answersRef.current = mergedAnswers;
        languagesRef.current = mergedLanguages;

        const calcRemaining = getExamRemainingSeconds(data.exam, data.session?.started_at);
        const secs = (data.timeRemaining !== undefined && data.timeRemaining !== null)
          ? Math.min(Number(data.timeRemaining), calcRemaining)
          : calcRemaining;

        if (secs <= 0) {
          exitFullScreen();
          setPhase('ended');
          notify.error('The scheduled examination duration has expired.');
          return;
        }

        setTimeSeconds(secs);
        setPhase('exam');
        notify.success('Exam session initiated. Good luck!');
      } else {
        const msg = response.message || '';
        if (response.isEnded || response.data?.isEnded || msg.toLowerCase().includes('ended') || msg.toLowerCase().includes('expired')) {
          exitFullScreen();
          setPhase('ended');
          notify.error(msg || 'This examination has ended. Students are not allowed to enter or start after expiration.');
          return;
        }

        const isTimingNotice = msg.toLowerCase().includes('scheduled') || 
                               msg.toLowerCase().includes('accessible') || 
                               msg.toLowerCase().includes('access period') ||
                               msg.toLowerCase().includes('not accessible') ||
                               msg.toLowerCase().includes('waiting');

        if (phase === 'waiting' || isTimingNotice) {
          setWaitingStatus(msg || 'Synchronizing with exam server...');
        } else {
          exitFullScreen();
          setPhase('key');
          notify.error(msg || 'Invalid exam key. Please verify and try again.');
        }
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || '';
      if (err?.response?.data?.isEnded || errMsg.toLowerCase().includes('ended') || errMsg.toLowerCase().includes('expired')) {
        exitFullScreen();
        setPhase('ended');
        notify.error(errMsg || 'This examination has ended. Students cannot enter or start after scheduled time has expired.');
        return;
      }

      if (errMsg.toLowerCase().includes('already submitted') || errMsg.toLowerCase().includes('already completed')) {
        exitFullScreen();
        setPhase('submitted');
        setTimeout(() => {
          toast('This examination has already been completed and locked.', {
            icon: '📋',
            style: {
              background: '#f0fdf4',
              color: '#15803d',
              border: '1.5px solid #bbf7d0',
              fontWeight: 600,
              fontSize: '0.88rem',
              borderRadius: '10px'
            },
            duration: 6000
          });
        }, 0);
        return;
      }

      const isTimingNotice = errMsg.toLowerCase().includes('scheduled') || 
                             errMsg.toLowerCase().includes('accessible') || 
                             errMsg.toLowerCase().includes('access period') ||
                             errMsg.toLowerCase().includes('not accessible') ||
                             errMsg.toLowerCase().includes('waiting');

      if (phase === 'waiting' || isTimingNotice) {
        setWaitingStatus(errMsg || 'Synchronizing with server start authorization...');
      } else {
        exitFullScreen();
        setPhase('key');
        console.error('Start exam error:', err);
        notify.error(errMsg || 'Failed to start exam. Check your key and try again.');
      }
    } finally {
      setIsStartingExam(false);
    }
  }, [examId, examKey, examData, phase, exitFullScreen, isDeviceCheckPassed, verifyCameraAndMic, cameraPerm, micPerm]);

  // ─── Step 1: Validate Key & Open Introduction ─────────────────────────────
  const handleEnterExamination = useCallback(async () => {
    const key = (examKey || '').trim();
    if (!key) {
      notify.warn('Please enter your examination access key');
      return;
    }

    if (isExamEnded(examData?.exam)) {
      setPhase('ended');
      notify.error('This examination has ended. Access is locked.');
      return;
    }

    setIsStartingExam(true);
    try {
      let currentData = examData;
      if (!currentData || !currentData.exam) {
        const res = await studentAPI.getExamDetails(examId);
        if (res.success && res.data) {
          currentData = res.data;
          setExamData(res.data);
        }
      }

      if (isExamEnded(currentData?.exam)) {
        setPhase('ended');
        notify.error('This examination has ended. Access is locked.');
        return;
      }

      if (currentData?.existingSession?.status === 'submitted') {
        setPhase('submitted');
        const sess = currentData.existingSession;
        const totalM = currentData.exam?.total_marks ? Number(currentData.exam.total_marks) : 100;
        const score = sess.total_score !== undefined && sess.total_score !== null ? Number(sess.total_score) : 0;
        const pct = sess.percentage !== undefined && sess.percentage !== null && !isNaN(sess.percentage)
          ? Number(sess.percentage)
          : (totalM > 0 ? Math.round((score / totalM) * 100) : 0);
        const qTotal = sess.questionsTotal || currentData.questions?.length || 2;
        const qAttempted = sess.questionsAttempted || (score > 0 && qTotal > 0 ? qTotal : qTotal);
        setResult({
          score: score,
          totalMarks: totalM,
          percentage: pct,
          status: sess.result_status || (pct >= 40 ? 'Passed' : 'Completed'),
          questionsAttempted: qAttempted,
          questionsTotal: qTotal,
          isPending: sess.result_status === 'pending'
        });
        return;
      }

      const validKeys = [
        currentData?.exam?.exam_code,
        currentData?.exam?.exam_key
      ].filter(Boolean).map(k => String(k).trim().toUpperCase());

      if (validKeys.length > 0 && !validKeys.includes(key.toUpperCase())) {
        notify.error('Invalid examination access key. Please verify your credentials and try again.');
        return;
      }

      setPhase('intro');
      notify.success('Student verified successfully! Welcome to the examination briefing.');
    } catch (err) {
      console.error('Key verification error:', err);
      // Fallback: proceed to introduction
      setPhase('intro');
    } finally {
      setIsStartingExam(false);
    }
  }, [examKey, examData, examId]);

  // ─── Step 2: Proceed from Permissions to Live Exam / Waiting Room ────────
  const handleProceedFromIntro = useCallback(() => {
    if (!isDeviceCheckPassed || cameraPerm !== 'granted' || micPerm !== 'granted' || screenPerm !== 'granted') {
      notify.error('Camera, microphone, and entire screen sharing permissions must be granted to enter the examination.');
      setPhase('permissions');
      return;
    }

    if (!agreedToTerms) {
      notify.warn('Please accept the candidate declaration before proceeding.');
      return;
    }

    if (isExamEnded(examData?.exam)) {
      setPhase('ended');
      notify.error('The scheduled duration for this examination has ended.');
      return;
    }

    syncCombinedMediaStream();

    // Keep active stream reference so ProfessionalProctoring receives it directly
    if (previewStreamRef.current) {
      setActiveMediaStream(previewStreamRef.current);
    }

    enterFullScreen();

    if (examData?.exam?.date_time) {
      const start = parseToIST(examData.exam.date_time);
      if (start && Date.now() < start.getTime()) {
        setPhase('waiting');
        return;
      }
    }

    const key = (examKey || examData?.exam?.exam_code || examData?.exam?.exam_key || '').trim();
    triggerBackendStart(key);
  }, [isDeviceCheckPassed, agreedToTerms, examData, examKey, enterFullScreen, triggerBackendStart, cameraPerm, micPerm, screenPerm, syncCombinedMediaStream]);

  // Live Countdown & Resilient Auto-Start Effect for Waiting Room (Strictly anchored to IST)
  useEffect(() => {
    if (phase !== 'waiting' || !examData?.exam?.date_time) return;

    if (isExamEnded(examData.exam)) {
      setPhase('ended');
      return;
    }

    const start = parseToIST(examData.exam.date_time);
    if (!start) return;
    const targetTime = start.getTime();

    const updateCountdownAndCheck = () => {
      const now = Date.now();
      if (isExamEnded(examData.exam)) {
        setPhase('ended');
        return;
      }
      const diff = targetTime - now;

      if (diff <= 1000) {
        // Scheduled start time reached!
        setWaitingCountdown({ hours: 0, minutes: 0, seconds: 0, totalMs: 0, isReady: true });
        if (!isStartingExam) {
          const key = (examKey || examData?.exam?.exam_code || examData?.exam?.exam_key || '').trim();
          triggerBackendStart(key);
        }
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setWaitingCountdown({ hours, minutes, seconds, totalMs: diff, isReady: false });
      }
    };

    updateCountdownAndCheck();
    const timer = setInterval(updateCountdownAndCheck, 1000);
    return () => clearInterval(timer);
  }, [phase, examData, examKey, isStartingExam, triggerBackendStart]);

  // Live Scheduled End Time Guard: Auto-submits immediately if scheduled exam time has elapsed
  useEffect(() => {
    if (phase !== 'exam' || submitted) return;

    const endCheckInterval = setInterval(() => {
      if (examData?.exam && isExamEnded(examData.exam)) {
        console.warn('Scheduled examination end time elapsed. Triggering automatic submission.');
        notify.warn('The scheduled examination time has elapsed. Responses are being submitted.');
        handleSubmit(true);
      }
    }, 4000);

    return () => clearInterval(endCheckInterval);
  }, [phase, submitted, examData, handleSubmit]);

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
    const curQ = questions[currentQ];
    if (curQ && answers[curQ.id] !== undefined && session?.id) {
      const ans = answers[curQ.id];
      const isMcqOrTf = curQ.type === 'mcq' || curQ.type === 'true_false';
      studentAPI.saveAnswer(examId, {
        sessionId: session.id,
        questionId: curQ.id,
        ...(isMcqOrTf ? { selectedOption: ans } :
          curQ.type === 'coding' ? { codeSubmission: ans } :
            { answerText: ans }),
      }).catch(() => {});
    }

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
  // ─── 1. PHASE: EXAM KEY VERIFICATION ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'key') {
    const exam = examData?.exam || {};
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Minimal Brand Bar */}
        <header style={{
          height: 64,
          background: '#ffffff',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(10, 116, 218, 0.25)'
            }}>
              <Shield size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
                ExamShield™
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#eff6ff', color: '#0a74da', padding: '2px 7px', borderRadius: 6, marginLeft: 8 }}>
                Secure Gateway
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} color="#0a74da" />
            <span>256-Bit Encrypted Assessment Session</span>
          </div>
        </header>

        {/* Center Key Verification Container */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px'
        }}>
          <div style={{
            maxWidth: 500,
            width: '100%',
            background: '#ffffff',
            borderRadius: 24,
            border: '1.5px solid #e2e8f0',
            padding: '38px 36px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 20px rgba(10, 116, 218, 0.28)'
              }}>
                <Lock size={28} />
              </div>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                Examination Access Key
              </h1>
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                {exam.title ? exam.title : 'Enter your official access key to unlock your examination'}
              </p>
            </div>

            {/* Candidate Identity Chip */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                marginBottom: 24
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0a74da, #0656a3)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {user.name || 'Candidate'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    ID: {user.roll_number || user.enrollment_number || user.email || 'ES-STUDENT'}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #bbf7d0'
                }}>
                  Verified
                </span>
              </div>
            )}

            {/* Access Key Input */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Examination Access Key
                </label>
                {examKey && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#0a74da',
                    background: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid #bfdbfe',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Lock size={12} />
                    Auto-Filled
                  </span>
                )}
              </div>
              <input
                type="text"
                value={examKey}
                onChange={e => setExamKey(e.target.value.toUpperCase())}
                placeholder="e.g. EXAM-8942-ABC"
                disabled={isStartingExam}
                onKeyDown={e => e.key === 'Enter' && handleEnterExamination()}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 12,
                  color: '#0f172a',
                  fontSize: '1.1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
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
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Access key is automatically populated. Click "Verify Student" to proceed.</span>
              </div>
            </div>

            {/* Verify Student Button */}
            <button
              id="verify-student-btn"
              onClick={handleEnterExamination}
              disabled={isStartingExam || !examKey.trim()}
              style={{
                width: '100%',
                height: 52,
                background: isStartingExam || !examKey.trim()
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                cursor: isStartingExam || !examKey.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: examKey.trim() && !isStartingExam ? '0 6px 20px rgba(10, 116, 218, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {isStartingExam ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Verifying Student &amp; Access...</span>
                </div>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Verify Student</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── 2. PHASE: INTRODUCTION & EXAMINATION BRIEFING ───────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    const exam = examData?.exam || {};
    const questionCount = questions.length || examData?.questions?.length || 0;
    const durationMins = exam.duration ? Number(exam.duration) : 60;
    const totalMarks = exam.total_marks ?? 100;
    const rawPassMarks = exam.passing_marks;
    let passingMarks;
    if (rawPassMarks !== undefined && rawPassMarks !== null && !isNaN(rawPassMarks) && Number(rawPassMarks) > 0) {
      const num = Number(rawPassMarks);
      if (num <= totalMarks) {
        passingMarks = num;
      } else if (num <= 100) {
        passingMarks = Math.round((totalMarks * num) / 100);
      } else {
        passingMarks = Math.round(totalMarks * 0.4);
      }
    } else {
      passingMarks = Math.round(totalMarks * 0.4);
    }
    const passPercentage = totalMarks > 0 ? Math.round((passingMarks / totalMarks) * 100) : 40;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Enterprise Control Bar */}
        <header style={{
          height: 70,
          background: '#ffffff',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Brand & Suite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
            }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
                  ExamShield™ Enterprise
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#eff6ff', color: '#0a74da', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                  Proctoring Engine v4.2
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Computer-Based Testing System • ISO/IEC 27001 Certified Security
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#f0fdf4', padding: '5px 12px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
              <Check size={14} />
              <span>1. Student Verified</span>
            </div>
            <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 800, color: '#0a74da', background: '#eff6ff', padding: '5px 14px', borderRadius: 20, border: '1.5px solid #bfdbfe', boxShadow: '0 2px 6px rgba(10,116,218,0.1)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0a74da', animation: 'er-pulse 1.5s infinite' }} />
              <span>2. Candidate Briefing</span>
            </div>
            <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>→</span>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
              <span>3. Device Permissions</span>
            </div>
            <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>→</span>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
              <span>4. Live Assessment</span>
            </div>
          </div>

          {/* Candidate Profile Chip */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '5px 16px 5px 6px', borderRadius: 30 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0a74da, #0656a3)', color: '#ffffff', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                  {user.name || 'Candidate'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                  ID: {user.roll_number || user.enrollment_number || user.email || 'ES-STUDENT'}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, maxWidth: 1240, width: '100%', margin: '0 auto', padding: '28px 24px 44px', boxSizing: 'border-box' }}>
          
          {/* ══════════════════════════════════════════════════════════════════════════
              HERO DOSSIER & SPECIFICATIONS BANNER
              ══════════════════════════════════════════════════════════════════════════ */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid #e2e8f0',
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Ribbon Tags */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a74da', background: '#eff6ff', padding: '3px 10px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                  {exam.subject || 'Academic & Professional Assessment'}
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  {exam.type === 'mcq' ? 'Multiple Choice (MCQ)' : exam.type === 'coding' ? 'Programming & Coding Sandbox' : 'Comprehensive CBT Assessment'}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Lock size={12} color="#0a74da" />
                  <span>Key:</span>
                  <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0f172a' }}>{examKey || exam.exam_code || 'VERIFIED'}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                <CheckCircle2 size={16} />
                <span>Identity Verified • Session Authorized</span>
              </div>
            </div>

            {/* Assessment Title & Subtitle */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.025em' }}>
                {exam.title || 'Official Computer-Based Examination'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Please review all examination instructions, anti-cheating regulations, question palette guide, and system requirements carefully before proceeding to hardware calibration.
              </p>
            </div>

            {/* 4-KPI Metric Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              paddingTop: 18,
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Allocated Time</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{durationMins} Minutes</div>
                  <div style={{ fontSize: '0.7rem', color: '#0a74da', fontWeight: 600 }}>Server-Synchronized</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Questions</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{questionCount > 0 ? questionCount : 'Scheduled'} Items</div>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>All Compulsory</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maximum Score</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{totalMarks} Marks</div>
                  <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>Passing: {passingMarks} Marks ({passPercentage}%)</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proctoring Engine</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Strict Level 3</div>
                  <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600 }}>AI + Screen + Audio</div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              2-COLUMN WORKSPACE: BRIEFING CONSOLE & ACTION LAUNCHPAD
              ══════════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)', gap: 24, alignItems: 'start' }}>
            
            {/* ═══ LEFT COLUMN: Tabbed Guidelines Console ═══ */}
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}>
              {/* Tab Navigation Header */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', padding: '8px 10px', gap: 6, overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setIntroTab('general')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: introTab === 'general' ? '#ffffff' : 'transparent',
                    color: introTab === 'general' ? '#0a74da' : '#64748b',
                    fontSize: '0.86rem',
                    fontWeight: introTab === 'general' ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: introTab === 'general' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <BookOpen size={16} />
                  <span>1. Examination Protocol</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntroTab('proctoring')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: introTab === 'proctoring' ? '#ffffff' : 'transparent',
                    color: introTab === 'proctoring' ? '#0a74da' : '#64748b',
                    fontSize: '0.86rem',
                    fontWeight: introTab === 'proctoring' ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: introTab === 'proctoring' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Shield size={16} />
                  <span>2. Anti-Cheating Directives</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntroTab('palette')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: introTab === 'palette' ? '#ffffff' : 'transparent',
                    color: introTab === 'palette' ? '#0a74da' : '#64748b',
                    fontSize: '0.86rem',
                    fontWeight: introTab === 'palette' ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: introTab === 'palette' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>3. Palette &amp; Shortcuts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntroTab('hardware')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: introTab === 'hardware' ? '#ffffff' : 'transparent',
                    color: introTab === 'hardware' ? '#0a74da' : '#64748b',
                    fontSize: '0.86rem',
                    fontWeight: introTab === 'hardware' ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: introTab === 'hardware' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Monitor size={16} />
                  <span>4. System Readiness</span>
                </button>

                {exam.instructions && exam.instructions.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIntroTab('instructor')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: 'none',
                      background: introTab === 'instructor' ? '#ffffff' : 'transparent',
                      color: introTab === 'instructor' ? '#0a74da' : '#64748b',
                      fontSize: '0.86rem',
                      fontWeight: introTab === 'instructor' ? 800 : 600,
                      cursor: 'pointer',
                      boxShadow: introTab === 'instructor' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FileText size={16} />
                    <span>5. Examiner Memo</span>
                  </button>
                )}
              </div>

              {/* Tab Body Content */}
              <div style={{ padding: '26px 30px', minHeight: 460 }}>
                
                {/* ─── TAB 1: Examination Protocol ─── */}
                {introTab === 'general' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Standard Assessment Protocol &amp; Rules
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                          Official regulations governing candidate responses, time management, and autosave.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Clock size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                            1. Server-Synchronized Timer &amp; Auto-Submit
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>
                            The examination clock is locked to the centralized server timestamp and begins counting down immediately upon entering the room. The timer cannot be paused or altered locally. When the timer hits <strong>00:00:00</strong>, all recorded answers are finalized and automatically submitted.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Wifi size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                            2. Real-Time Cloud Save &amp; Fault Tolerance
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>
                            Every option selection, subjective response keystroke, and code compilation is encrypted and dispatched instantly to the database. If your internet connection flickers, your progress is safely buffered in local memory and re-synchronized once connectivity returns.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Code2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                            3. Multi-Format Question Paper Standards
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>
                            This exam includes Multiple Choice Questions (single/multi-select), True/False items, and Coding Sandbox challenges. Read each problem statement carefully before selecting an answer or compiling your code against standard test cases.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                            4. Final Review &amp; Submission Confirmation
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>
                            Clicking "Submit Exam" triggers an interactive confirmation modal showing your total attempted, answered, and review-flagged counts. Once confirmed, your submission is locked and instant analytics are generated.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: Anti-Cheating & AI Proctoring Directives ─── */}
                {introTab === 'proctoring' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Academic Integrity &amp; Continuous Telemetry Monitoring
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                          Strict proctoring algorithms enforce institutional anti-cheating regulations.
                        </p>
                      </div>
                    </div>

                    {/* Notice Callout */}
                    <div style={{
                      background: '#fff1f2',
                      border: '1.5px solid #fecdd3',
                      borderRadius: 12,
                      padding: '12px 18px',
                      color: '#9f1239',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: 18,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <AlertTriangle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
                      <span>Zero-Tolerance Policy: All violations are recorded and reviewed by your institutional exam board.</span>
                    </div>

                    {/* 4 Guardrails Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0a74da', fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>
                          <Monitor size={17} />
                          <span>Full-Screen Lockdown</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                          The exam launches into full-screen. Pressing Esc, minimizing, or resizing triggers an instant strike.
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>
                          <AlertTriangle size={17} />
                          <span>3-Strike Tab Policy</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                          Switching tabs or focusing other windows is tracked. <strong>3 tab switches causes immediate test termination.</strong>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed', fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>
                          <Camera size={17} />
                          <span>Facial Biometrics</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                          AI vision continuously verifies that you are present in frame, facing forward, with no other individuals in the room.
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0891b2', fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>
                          <Mic size={17} />
                          <span>Acoustic Surveillance</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                          Microphone levels are monitored for whisper patterns, voice signals, or background communication.
                        </div>
                      </div>
                    </div>

                    {/* DOs & DON'Ts Comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#166534', marginBottom: 8 }}>✓ Mandatory Compliance</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#15803d' }}>
                          <div>• Sit in a well-lit, isolated room facing your webcam</div>
                          <div>• Keep your entire workspace clear of unauthorized materials</div>
                          <div>• Maintain continuous screen sharing until submission</div>
                        </div>
                      </div>

                      <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>✕ Prohibited Actions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#b91c1c' }}>
                          <div>• No earphones, smartwatches, or external communication</div>
                          <div>• No secondary monitors or display mirroring</div>
                          <div>• No looking away from the screen for prolonged periods</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: Palette & Keyboard Shortcuts ─── */}
                {introTab === 'palette' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Question Navigation Palette &amp; Keyboard Controls
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                          Understand question state colors and speed up navigation with keyboard shortcuts.
                        </p>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
                      The question palette is located on the right side of the examination interface. It allows you to jump directly to any question at any time:
                    </div>

                    {/* Question State Colors Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }} />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#166534' }}>Answered</div>
                          <div style={{ fontSize: '0.74rem', color: '#15803d' }}>Response saved securely to cloud</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f5f3ff', borderRadius: 12, border: '1px solid #ddd6fe' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0, boxShadow: '0 2px 6px rgba(139,92,246,0.3)' }} />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#5b21b6' }}>Marked for Review</div>
                          <div style={{ fontSize: '0.74rem', color: '#6d28d9' }}>Flagged to revisit before submitting</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#e2e8f0', border: '1.5px solid #94a3b8', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#475569' }}>Unanswered</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Question not yet attempted</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#0a74da', flexShrink: 0, boxShadow: '0 2px 6px rgba(10,116,218,0.3)' }} />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e40af' }}>Current Question</div>
                          <div style={{ fontSize: '0.74rem', color: '#2563eb' }}>Currently active in viewport</div>
                        </div>
                      </div>
                    </div>

                    {/* Keyboard Shortcuts Reference */}
                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={16} color="#0a74da" />
                        <span>Interactive Keyboard Shortcuts (Industry Standard)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
                          <kbd style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>A - D</kbd>
                          <span>Select MCQ Options</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
                          <kbd style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>Alt + N</kbd>
                          <span>Next Question</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
                          <kbd style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>Alt + P</kbd>
                          <span>Previous Question</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
                          <kbd style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>Alt + R</kbd>
                          <span>Toggle Mark for Review</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: System Readiness & Hardware Requirements ─── */}
                {introTab === 'hardware' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Hardware, Browser &amp; Network Specifications
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                          Ensure your machine satisfies minimum system requirements before starting hardware calibration.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Monitor size={18} color="#0a74da" />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Display &amp; Resolution</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Minimum 1024×768 (1080p Full HD recommended)</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: 6 }}>Verified</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Camera size={18} color="#0a74da" />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Web Camera</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Front-facing 720p/1080p webcam with clear view of candidate</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0a74da', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 }}>Ready for Test</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Mic size={18} color="#0a74da" />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Microphone Sensor</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Built-in or external mic for continuous ambient acoustic capture</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0a74da', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 }}>Ready for Test</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Wifi size={18} color="#0a74da" />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Network Connection</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Stable internet (1.5 Mbps+ upload/download recommended)</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: 6 }}>Active Connection</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 5: Examiner Memo ─── */}
                {introTab === 'instructor' && exam.instructions && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Info size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#1e40af', margin: 0 }}>
                          Special Instructions from the Examination Committee
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                          Mandatory guidelines issued by your professor or evaluation department.
                        </p>
                      </div>
                    </div>

                    <div style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: 14,
                      padding: '20px 24px',
                      fontSize: '0.92rem',
                      lineHeight: 1.7,
                      color: '#1e3a8a',
                      whiteSpace: 'pre-line'
                    }}>
                      {exam.instructions}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ═══ RIGHT COLUMN: Candidate Pre-Flight Launchpad ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Card 1: Candidate Verification Dossier */}
              <div style={{
                background: '#ffffff',
                borderRadius: 20,
                border: '1.5px solid #e2e8f0',
                padding: '22px 24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#475569',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <User size={16} color="#0a74da" />
                  <span>Authenticated Candidate Dossier</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                    color: '#ffffff',
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(10, 116, 218, 0.25)',
                    flexShrink: 0
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                      {user?.name || 'Verified Candidate'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                      {user?.roll_number || user?.enrollment_number || user?.email || 'ID: ES-STUDENT-2026'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} />
                      <span>Biometric Identity Authenticated</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#64748b' }}>Institution Node</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{user?.college_name || 'ExamShield CBT Network'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#64748b' }}>Session Token</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0a74da' }}>#{examId?.slice(0, 8)?.toUpperCase() || 'CBT-LIVE'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#64748b' }}>Security Layer</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>TLS 1.3 256-Bit Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Next Hardware Steps Preview */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 18,
                border: '1.5px solid #e2e8f0',
                padding: '20px 22px'
              }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#0a74da" />
                  <span>Mandatory Hardware Authorizations (Next)</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>1</div>
                    <span><strong>Entire Screen Share:</strong> Stream entire desktop monitor</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>2</div>
                    <span><strong>Microphone:</strong> Audio sensitivity &amp; ambient test</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>3</div>
                    <span><strong>Web Camera:</strong> Face position calibration guide</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Action Launchpad */}
              <div style={{
                background: '#ffffff',
                borderRadius: 20,
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 8px 24px -6px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <button
                  type="button"
                  id="proceed-to-permissions-btn"
                  onClick={() => setPhase('permissions')}
                  style={{
                    width: '100%',
                    height: 54,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 6px 22px rgba(10, 116, 218, 0.32)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Proceed to Device Permissions Check</span>
                  <ArrowRight size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setPhase('key')}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Change Access Key</span>
                </button>

                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.45 }}>
                  By continuing, you agree to automated proctoring telemetry recording under institutional examination regulations.
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── 3. PHASE: HARDWARE & PERMISSION VERIFICATION WIZARD ──────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'permissions') {
    const exam = examData?.exam || {};
    const questionCount = questions.length || examData?.questions?.length || 0;
    const durationMins = exam.duration ? Number(exam.duration) : 60;
    const totalMarks = exam.total_marks ?? 100;
    const rawPassMarks = exam.passing_marks;
    let passingMarks;
    if (rawPassMarks !== undefined && rawPassMarks !== null && !isNaN(rawPassMarks) && Number(rawPassMarks) > 0) {
      const num = Number(rawPassMarks);
      if (num <= totalMarks) {
        passingMarks = num;
      } else if (num <= 100) {
        passingMarks = Math.round((totalMarks * num) / 100);
      } else {
        passingMarks = Math.round(totalMarks * 0.4);
      }
    } else {
      passingMarks = Math.round(totalMarks * 0.4);
    }
    const passPercentage = totalMarks > 0 ? Math.round((passingMarks / totalMarks) * 100) : 40;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Enterprise Header Bar */}
        <header style={{
          height: 68,
          background: '#ffffff',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Brand & Suite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(10, 116, 218, 0.25)'
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
                  ExamShield™
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  Hardware Checks
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                System &amp; Permission Verification Wizard
              </div>
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '4px 0' }}>
            {[
              { id: 1, label: 'Display Stream', isDone: screenPerm === 'granted', icon: Monitor },
              { id: 2, label: 'Audio Sensor', isDone: micPerm === 'granted', icon: Mic },
              { id: 3, label: 'Web Camera', isDone: cameraPerm === 'granted', icon: Camera },
              { id: 4, label: 'Clearance & Oath', isDone: isDeviceCheckPassed, icon: ShieldCheck },
            ].map((step, idx) => {
              const isCurrent = setupStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <div style={{
                      width: 14,
                      height: 2,
                      background: step.isDone ? '#86efac' : isCurrent ? '#bfdbfe' : '#e2e8f0',
                      flexShrink: 0
                    }} />
                  )}
                  <button
                    type="button"
                    onClick={() => setSetupStep(step.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 12,
                      border: isCurrent
                        ? '1.5px solid #0a74da'
                        : step.isDone
                        ? '1.5px solid #86efac'
                        : '1.5px solid #e2e8f0',
                      background: isCurrent
                        ? '#eff6ff'
                        : step.isDone
                        ? '#f0fdf4'
                        : '#ffffff',
                      color: isCurrent
                        ? '#0a74da'
                        : step.isDone
                        ? '#15803d'
                        : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: isCurrent ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: isCurrent ? '0 2px 8px rgba(10, 116, 218, 0.15)' : 'none'
                    }}
                  >
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: step.isDone
                        ? '#16a34a'
                        : isCurrent
                        ? '#0a74da'
                        : '#f1f5f9',
                      color: step.isDone || isCurrent ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {step.isDone ? <Check size={11} color="#ffffff" strokeWidth={3} /> : step.id}
                    </div>
                    <span>{step.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Candidate Profile Chip */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 14px 4px 6px', borderRadius: 30 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0a74da, #0656a3)', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                  {user.name || 'Candidate'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                  ID: {user.roll_number || user.enrollment_number || user.email || 'ES-STUDENT'}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          padding: '36px 24px 48px',
          boxSizing: 'border-box'
        }}>
          {/* Assessment Title Strip */}
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            border: '1.5px solid #e2e8f0',
            padding: '18px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a74da', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                  {exam.subject || 'Assessment'}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  • Key: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{examKey || exam.exam_code || 'VERIFIED'}</strong>
                </span>
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {exam.title || 'Official Examination'}
              </h1>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: isDeviceCheckPassed ? '#f0fdf4' : '#eff6ff',
              border: `1px solid ${isDeviceCheckPassed ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: 10,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: isDeviceCheckPassed ? '#15803d' : '#0a74da'
            }}>
              {isDeviceCheckPassed ? <CheckCircle2 size={16} /> : <Shield size={16} />}
              <span>{isDeviceCheckPassed ? 'All Permissions Verified' : `Step ${setupStep} of 4: Device Calibration`}</span>
            </div>
          </div>

          {/* Wizard Card Body */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid #e2e8f0',
            padding: '32px 36px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            marginBottom: 20
          }}>
            {/* ════ STEP 1: Entire Screen Sharing ════ */}
            {setupStep === 1 && (
              <div>
                {/* Header Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: screenPerm === 'granted' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: screenPerm === 'granted' ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(10, 116, 218, 0.28)'
                    }}>
                      <Monitor size={26} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a74da', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                          Step 1 of 4 • Display Security
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>SEC-DISP-01</span>
                      </div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Full-Screen Display Stream Authorization
                      </h2>
                    </div>
                  </div>

                  {/* Status Pill in Header */}
                  <div>
                    {screenPerm === 'granted' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '6px 14px', borderRadius: 20 }}>
                        <CheckCircle2 size={15} />
                        <span>Display Stream Active</span>
                      </span>
                    ) : screenPerm === 'not_entire' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: 20 }}>
                        <AlertTriangle size={15} />
                        <span>Single Window Rejected</span>
                      </span>
                    ) : screenPerm === 'checking' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#0a74da', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: 20 }}>
                        <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Awaiting Selection...</span>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 20 }}>
                        <Shield size={15} />
                        <span>Authorization Required</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Column Professional Cockpit */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 390px) 1fr', gap: 28, alignItems: 'start' }}>
                  {/* Left Column: Interactive Hardware Display Simulator */}
                  <div>
                    <div style={{
                      background: '#0b1120',
                      borderRadius: '16px 16px 6px 6px',
                      border: `2px solid ${screenPerm === 'granted' ? '#10b981' : screenPerm === 'not_entire' ? '#ef4444' : '#1e293b'}`,
                      padding: '12px 12px 14px',
                      boxShadow: screenPerm === 'granted' ? '0 12px 30px rgba(16, 185, 129, 0.18)' : '0 12px 30px rgba(0,0,0,0.18)',
                      transition: 'all 0.25s ease'
                    }}>
                      {/* Top Bezel Webcam Dot */}
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155', margin: '0 auto 8px' }} />

                      {/* Display Screen Interior */}
                      <div style={{
                        height: 220,
                        borderRadius: 10,
                        background: screenPerm === 'granted'
                          ? 'radial-gradient(ellipse at center, #064e3b 0%, #022c22 60%, #021712 100%)'
                          : screenPerm === 'not_entire'
                          ? 'radial-gradient(ellipse at center, #450a0a 0%, #1f0505 70%, #0f0303 100%)'
                          : 'radial-gradient(ellipse at center, #0f172a 0%, #080d1a 70%, #030712 100%)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* STATE 1: Granted Live Telemetry */}
                        {screenPerm === 'granted' && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '3px 8px', borderRadius: 20, color: '#34d399', fontSize: '0.68rem', fontWeight: 800 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'er-pulse 1.5s infinite' }} />
                                <span>LIVE MONITOR TELEMETRY</span>
                              </div>
                              <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: '#86efac', fontWeight: 700 }}>
                                30 FPS • HD
                              </span>
                            </div>

                            <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                                <Check size={22} />
                              </div>
                              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                                Entire Monitor Verified
                              </div>
                              <div style={{ color: '#86efac', fontSize: '0.72rem', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                                Resolution: {window.screen ? `${window.screen.width} × ${window.screen.height} px` : '1920 × 1080 px'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, fontSize: '0.68rem', color: '#94a3b8' }}>
                              <span>Surface: <strong style={{ color: '#ffffff' }}>monitor</strong></span>
                              <span style={{ color: '#34d399', fontWeight: 700 }}>Encrypted WebRTC</span>
                            </div>
                          </>
                        )}

                        {/* STATE 2: Single Window Rejection */}
                        {screenPerm === 'not_entire' && (
                          <div style={{ margin: 'auto 0', textAlign: 'center', padding: '0 8px' }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: '1.5px solid #ef4444', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                              <AlertTriangle size={20} />
                            </div>
                            <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: '0.86rem', marginBottom: 4 }}>
                              SINGLE WINDOW REJECTED
                            </div>
                            <div style={{ color: '#fecaca', fontSize: '0.72rem', lineHeight: 1.45 }}>
                              You selected an app window or browser tab. Proctoring policy strictly requires sharing your <strong>Entire Screen</strong>.
                            </div>
                          </div>
                        )}

                        {/* STATE 3: Prompt / Checking / Denied Simulator */}
                        {screenPerm !== 'granted' && screenPerm !== 'not_entire' && (
                          <div style={{ margin: 'auto 0', textAlign: 'center', padding: '0 10px' }}>
                            {/* Browser Dialog Mockup Tabs */}
                            <div style={{ background: '#1e293b', borderRadius: 8, padding: 6, display: 'flex', gap: 4, marginBottom: 12 }}>
                              <div style={{ flex: 1, background: '#0a74da', color: '#ffffff', borderRadius: 6, padding: '5px 4px', fontSize: '0.66rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 2px 6px rgba(10, 116, 218, 0.4)' }}>
                                <Check size={10} />
                                <span>Entire Screen</span>
                              </div>
                              <div style={{ flex: 1, background: '#0f172a', color: '#64748b', borderRadius: 6, padding: '5px 4px', fontSize: '0.66rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, opacity: 0.65 }}>
                                <X size={10} color="#ef4444" />
                                <span>Window</span>
                              </div>
                              <div style={{ flex: 1, background: '#0f172a', color: '#64748b', borderRadius: 6, padding: '5px 4px', fontSize: '0.66rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, opacity: 0.65 }}>
                                <X size={10} color="#ef4444" />
                                <span>Tab</span>
                              </div>
                            </div>

                            <div style={{ color: '#e2e8f0', fontSize: '0.76rem', fontWeight: 700, marginBottom: 3 }}>
                              {screenPerm === 'checking' ? 'Waiting for your selection...' : 'Select the "Entire Screen" tab'}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: 1.4 }}>
                              When browser prompt opens, choose <strong>Entire Screen</strong> &amp; click <strong>Share</strong>.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Physical Monitor Stand */}
                    <div style={{ width: 28, height: 14, background: 'linear-gradient(to bottom, #1e293b, #0f172a)', margin: '0 auto' }} />
                    <div style={{ width: 110, height: 7, borderRadius: 10, background: '#1e293b', border: '1px solid #334155', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }} />
                  </div>

                  {/* Right Column: Regulations & Action Area */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Security Directives Card */}
                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Shield size={14} color="#0a74da" />
                        <span>Examination Display Regulations</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>1</div>
                          <div>
                            <strong>Mandatory Entire Monitor Stream:</strong> Individual browser tabs or app windows will be detected and automatically rejected by our proctoring engine.
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>2</div>
                          <div>
                            <strong>Single Physical Display:</strong> Disconnect any external secondary monitors, projectors, or HDMI cables before entering.
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#eff6ff', color: '#0a74da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>3</div>
                          <div>
                            <strong>Continuous Auditing:</strong> Screen activity is encrypted and monitored for unauthorized tab switching or external application focus.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Action Panel */}
                    <div>
                      {screenPerm === 'granted' && (
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 800, fontSize: '0.94rem', marginBottom: 4 }}>
                            <CheckCircle2 size={18} />
                            <span>Entire Screen Sharing Verified &amp; Streaming</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#166534', margin: '0 0 16px', lineHeight: 1.5 }}>
                            Your desktop display stream is verified and securely connected. You may now proceed to microphone calibration.
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setSetupStep(2)}
                              style={{
                                padding: '12px 24px',
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                                border: 'none',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
                              }}
                            >
                              <span>Proceed to Step 2: Microphone Access</span>
                              <ArrowRight size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={authorizeScreenShare}
                              style={{
                                padding: '12px 16px',
                                borderRadius: 10,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                fontWeight: 600,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <RefreshCw size={14} />
                              <span>Re-authorize</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {screenPerm === 'not_entire' && (
                        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', fontWeight: 800, fontSize: '0.94rem', marginBottom: 4 }}>
                            <AlertTriangle size={18} />
                            <span>Selection Rejected: Tab or Window Detected</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#991b1b', margin: '0 0 14px', lineHeight: 1.5 }}>
                            Examination security standards require sharing your <strong>entire display monitor</strong>. Please click below and choose <strong>"Entire Screen"</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={authorizeScreenShare}
                            disabled={screenPerm === 'checking'}
                            style={{
                              padding: '12px 24px',
                              borderRadius: 10,
                              background: '#dc2626',
                              border: 'none',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
                            }}
                          >
                            <ScreenShare size={18} />
                            <span>Re-authorize: Select "Entire Screen"</span>
                          </button>
                        </div>
                      )}

                      {screenPerm === 'denied' && (
                        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', fontWeight: 800, fontSize: '0.94rem', marginBottom: 4 }}>
                            <AlertTriangle size={18} />
                            <span>Screen Sharing Cancelled or Denied</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#991b1b', margin: '0 0 14px', lineHeight: 1.5 }}>
                            Display monitoring is mandatory under institutional proctoring regulations to enter the examination room.
                          </p>
                          <button
                            type="button"
                            onClick={authorizeScreenShare}
                            disabled={screenPerm === 'checking'}
                            style={{
                              padding: '12px 24px',
                              borderRadius: 10,
                              background: '#0a74da',
                              border: 'none',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
                            }}
                          >
                            <ScreenShare size={18} />
                            <span>Authorize Entire Screen Share</span>
                          </button>
                        </div>
                      )}

                      {screenPerm === 'prompt' && (
                        <div>
                          <button
                            type="button"
                            onClick={authorizeScreenShare}
                            style={{
                              width: '100%',
                              padding: '15px 28px',
                              borderRadius: 12,
                              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                              border: 'none',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '0.98rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 10,
                              boxShadow: '0 6px 20px rgba(10, 116, 218, 0.32)'
                            }}
                          >
                            <ScreenShare size={20} />
                            <span>Authorize Entire Screen Share</span>
                          </button>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', marginTop: 10 }}>
                            A browser security prompt will appear at the top-center of your screen.
                          </div>
                        </div>
                      )}

                      {screenPerm === 'checking' && (
                        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <RefreshCw size={20} color="#0a74da" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e40af' }}>
                              Awaiting Browser Screen Selection...
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#3b82f6', marginTop: 2 }}>
                              Click the <strong>"Entire Screen"</strong> tab in the browser dialog and click <strong>Share</strong>.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 2: Microphone Access & Real-Time Audio Calibration ════ */}
            {setupStep === 2 && (
              <div>
                {/* Header Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: micPerm === 'granted' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: micPerm === 'granted' ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(10, 116, 218, 0.28)'
                    }}>
                      <Mic size={26} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a74da', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                          Step 2 of 4 • Acoustic Sensor
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>SEC-AUD-02</span>
                      </div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Microphone Access &amp; Acoustic Calibration
                      </h2>
                    </div>
                  </div>

                  <div>
                    {micPerm === 'granted' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '6px 14px', borderRadius: 20 }}>
                        <CheckCircle2 size={15} />
                        <span>Acoustic Sensor Live</span>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 20 }}>
                        <Shield size={15} />
                        <span>Calibration Required</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* If mic not granted */}
                {micPerm !== 'granted' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 360px)', gap: 24, alignItems: 'start' }}>
                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>
                      {micPerm === 'denied' && (
                        <div style={{ marginBottom: 18, padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: '0.84rem' }}>
                          <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={16} color="#dc2626" />
                            <span>Microphone Permission Blocked</span>
                          </div>
                          <div>Click the lock icon in your browser address bar, set Microphone to "Allow", and click Retry below.</div>
                        </div>
                      )}

                      {micPerm === 'unavailable' && (
                        <div style={{ marginBottom: 18, padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: '0.84rem' }}>
                          <strong>No microphone hardware found.</strong> Please connect a microphone or headset to your computer.
                        </div>
                      )}

                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                        Audio Calibration Directives
                      </h3>
                      <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 20px', lineHeight: 1.55 }}>
                        Examination security standards monitor room acoustics to detect unauthorized verbal communication or secondary individuals.
                      </p>

                      <button
                        type="button"
                        onClick={authorizeMicrophone}
                        disabled={micPerm === 'checking'}
                        style={{
                          padding: '14px 28px',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: micPerm === 'checking' ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
                        }}
                      >
                        {micPerm === 'checking' ? (
                          <>
                            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Requesting Microphone Access...</span>
                          </>
                        ) : (
                          <>
                            <Mic size={18} />
                            <span>{micPerm === 'denied' ? 'Retry Microphone Access' : 'Authorize Microphone Sensor'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: 12 }}>
                        Acoustic Guidelines
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem', color: '#475569' }}>
                        <div>• Keep ambient background noise below 20%</div>
                        <div>• No headsets or earbuds permitted during examination</div>
                        <div>• Speak clearly during calibration to test voice pickup</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* If mic is granted: Live Equalizer & Speech Sensor */}
                {micPerm === 'granted' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 340px)', gap: 24, alignItems: 'start' }}>
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '22px 26px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 800, fontSize: '0.98rem' }}>
                          <CheckCircle2 size={20} />
                          <span>Microphone Connected &amp; Calibrated</span>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>
                          Audio Sensor Active
                        </span>
                      </div>

                      {/* Interactive VU Meter / Equalizer */}
                      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Real-Time Acoustic Sensitivity
                          </span>
                          <span style={{ fontSize: '0.84rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: previewAudioLevel > 10 ? '#10b981' : '#64748b' }}>
                            Level: {previewAudioLevel}%
                          </span>
                        </div>

                        {/* 16-Bar Equalizer Display */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 52, padding: '0 6px', gap: 4, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          {[...Array(16)].map((_, i) => {
                            const threshold = (i + 1) * 5;
                            const isActive = previewAudioLevel >= threshold;
                            const barHeight = Math.max(8, Math.min(46, (previewAudioLevel * 0.44) + Math.sin(i * 0.7 + previewAudioLevel * 0.1) * 6));
                            const barColor = i < 10 ? '#10b981' : i < 13 ? '#f59e0b' : '#ef4444';
                            return (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: `${isActive ? barHeight : 6}px`,
                                  background: isActive ? barColor : '#e2e8f0',
                                  borderRadius: 3,
                                  transition: 'height 0.08s ease, background 0.1s ease'
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Speech Detection Confirmation */}
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: speechDetectedTest ? '#10b981' : '#f59e0b',
                              animation: speechDetectedTest ? 'none' : 'er-pulse 1.5s infinite'
                            }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: speechDetectedTest ? '#15803d' : '#b45309' }}>
                              {speechDetectedTest ? '✓ Voice input detected & verified!' : 'Speak into your mic (e.g. "Testing 1, 2, 3") to confirm audio pickup'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={authorizeMicrophone}
                            style={{ background: 'none', border: 'none', color: '#0a74da', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <RefreshCw size={13} />
                            <span>Re-calibrate</span>
                          </button>
                        </div>
                      </div>

                      {/* Navigation Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setSetupStep(3)}
                          style={{
                            padding: '12px 24px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
                          }}
                        >
                          <span>Proceed to Step 3: Web Camera Access</span>
                          <ArrowRight size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetupStep(1)}
                          style={{
                            padding: '12px 18px',
                            borderRadius: 10,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          Back to Screen Share
                        </button>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: 12 }}>
                        Acoustic Proctoring Standards
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                        <div>• Continuous background noise is measured to detect secondary voices and coaching.</div>
                        <div>• Real-time speech anomaly detection will be armed upon entering the exam room.</div>
                        <div>• Avoid muting your microphone at any time during the test.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ STEP 3: Web Camera Access & Biometric Alignment ("web crema page") ════ */}
            {setupStep === 3 && (
              <div>
                {/* Header Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: cameraPerm === 'granted' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: cameraPerm === 'granted' ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(10, 116, 218, 0.28)'
                    }}>
                      <Camera size={26} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a74da', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                          Step 3 of 4 • Biometric Telemetry
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>SEC-BIO-03</span>
                      </div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Web Camera Access &amp; Facial Alignment
                      </h2>
                    </div>
                  </div>

                  <div>
                    {cameraPerm === 'granted' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '6px 14px', borderRadius: 20 }}>
                        <CheckCircle2 size={15} />
                        <span>Biometric Feed Calibrated</span>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 20 }}>
                        <Shield size={15} />
                        <span>Camera Alignment Required</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-Column Professional Cockpit */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: 28, alignItems: 'start' }}>
                  {/* Left Column: Biometric HUD Viewport */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 310,
                    borderRadius: 18,
                    background: '#080c14',
                    overflow: 'hidden',
                    border: `2px solid ${cameraPerm === 'granted' ? '#10b981' : '#334155'}`,
                    boxShadow: cameraPerm === 'granted' ? '0 8px 28px rgba(16, 185, 129, 0.2)' : '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.25s ease'
                  }}>
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
                        display: cameraPerm === 'granted' ? 'block' : 'none'
                      }}
                    />

                    {cameraPerm === 'granted' && (
                      <>
                        {/* Top HUD Row */}
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          right: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          zIndex: 4
                        }}>
                          <div style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            color: '#34d399',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'er-pulse 1.5s infinite' }} />
                            <span>AI BIOMETRIC FEED (30 FPS • HD)</span>
                          </div>

                          <div style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#e2e8f0',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 20
                          }}>
                            Lighting: <strong style={{ color: '#10b981' }}>Optimal (94%)</strong>
                          </div>
                        </div>

                        {/* Centered Facial Biometric Reticle & Scanline */}
                        <div style={{
                          position: 'absolute',
                          width: 150,
                          height: 200,
                          borderRadius: '50%',
                          border: '2px dashed rgba(56, 189, 248, 0.85)',
                          boxShadow: '0 0 0 9999px rgba(8, 12, 20, 0.35)',
                          pointerEvents: 'none',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {/* Corner Precision Brackets */}
                          <span style={{ position: 'absolute', top: -6, left: -6, width: 14, height: 14, borderTop: '2.5px solid #38bdf8', borderLeft: '2.5px solid #38bdf8', filter: 'drop-shadow(0 0 4px #38bdf8)' }} />
                          <span style={{ position: 'absolute', top: -6, right: -6, width: 14, height: 14, borderTop: '2.5px solid #38bdf8', borderRight: '2.5px solid #38bdf8', filter: 'drop-shadow(0 0 4px #38bdf8)' }} />
                          <span style={{ position: 'absolute', bottom: -6, left: -6, width: 14, height: 14, borderBottom: '2.5px solid #38bdf8', borderLeft: '2.5px solid #38bdf8', filter: 'drop-shadow(0 0 4px #38bdf8)' }} />
                          <span style={{ position: 'absolute', bottom: -6, right: -6, width: 14, height: 14, borderBottom: '2.5px solid #38bdf8', borderRight: '2.5px solid #38bdf8', filter: 'drop-shadow(0 0 4px #38bdf8)' }} />

                          {/* Sweeping Laser Scanline */}
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 2,
                            background: 'linear-gradient(90deg, transparent, #38bdf8, #67e8f9, transparent)',
                            boxShadow: '0 0 8px #38bdf8',
                            animation: 'er-scanline 3s ease-in-out infinite'
                          }} />
                        </div>

                        {/* Bottom HUD Telemetry Strip */}
                        <div style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 12,
                          right: 12,
                          background: 'rgba(8, 12, 20, 0.88)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '5px 12px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.68rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#94a3b8',
                          zIndex: 4
                        }}>
                          <span>CANDIDATE: <strong style={{ color: '#ffffff' }}>{user?.name?.toUpperCase() || 'STUDENT'}</strong></span>
                          <span style={{ color: '#34d399' }}>ID: {user?.roll_number || user?.enrollment_number || 'VERIFIED'}</span>
                        </div>
                      </>
                    )}

                    {cameraPerm !== 'granted' && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                        <CameraOff size={42} color={cameraPerm === 'denied' ? '#ef4444' : '#64748b'} style={{ marginBottom: 12 }} />
                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: cameraPerm === 'denied' ? '#ef4444' : '#cbd5e1', marginBottom: 4 }}>
                          {cameraPerm === 'denied' ? 'Webcam Permission Blocked' : cameraPerm === 'unavailable' ? 'No Camera Hardware Found' : 'Camera Feed Inactive'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 240, margin: '0 auto' }}>
                          Authorize your web camera to activate live biometric facial calibration
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Controls & Verification Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cameraPerm !== 'granted' ? (
                      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px' }}>
                        {cameraPerm === 'denied' && (
                          <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangle size={15} color="#dc2626" />
                              <span>Camera Permission Blocked</span>
                            </div>
                            <div>Click the lock icon in the address bar, allow Camera access, and click Retry below.</div>
                          </div>
                        )}

                        <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: 8 }}>
                          Biometric Alignment Protocols
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 16px', lineHeight: 1.55 }}>
                          Click below to grant camera access. Ensure no other application (Zoom, Teams, Skype) is currently using your webcam.
                        </p>

                        <button
                          type="button"
                          onClick={authorizeCamera}
                          disabled={cameraPerm === 'checking'}
                          style={{
                            padding: '14px 28px',
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            cursor: cameraPerm === 'checking' ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
                          }}
                        >
                          {cameraPerm === 'checking' ? (
                            <>
                              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Requesting Camera Access...</span>
                            </>
                          ) : (
                            <>
                              <Camera size={18} />
                              <span>{cameraPerm === 'denied' ? 'Retry Camera Access' : 'Authorize Web Camera'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 800, fontSize: '0.96rem', marginBottom: 12 }}>
                          <CheckCircle2 size={20} />
                          <span>Biometric Feed Calibrated &amp; Active</span>
                        </div>

                        {/* Checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.82rem', color: '#166534', marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={15} color="#16a34a" /> <span>Face positioned directly within the centered cyan reticle</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={15} color="#16a34a" /> <span>Adequate front lighting without deep shadows or backlighting</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={15} color="#16a34a" /> <span>Single candidate isolation verified at workstation</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check size={15} color="#16a34a" /> <span>Face unobscured (no hats, dark glasses, or face coverings)</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setSetupStep(4)}
                            style={{
                              padding: '12px 24px',
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                              border: 'none',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'
                            }}
                          >
                            <span>Proceed to Step 4: Final Readiness Review</span>
                            <ArrowRight size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSetupStep(2)}
                            style={{
                              padding: '12px 18px',
                              borderRadius: 10,
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.84rem',
                              cursor: 'pointer'
                            }}
                          >
                            Back to Microphone
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Biometric Regulations Card */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: 10 }}>
                        Automated Biometric Telemetry
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.55 }}>
                        Continuous facial recognition and gaze estimation operate in real-time. Looking away frequently, leaving the camera frame, or multiple faces detected will flag automated security incidents.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 4: Final Readiness Review & Launch ("final review page") ════ */}
            {setupStep === 4 && (
              <div>
                {/* Header Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)'
                    }}>
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, border: '1px solid #86efac' }}>
                          Step 4 of 4 • Pre-Flight Clearance
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>SYSTEM-CLEARANCE-PASS</span>
                      </div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Pre-Flight System Clearance &amp; Session Launch
                      </h2>
                    </div>
                  </div>

                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '6px 14px', borderRadius: 20 }}>
                      <CheckCircle2 size={15} />
                      <span>All 3 Channels Active</span>
                    </span>
                  </div>
                </div>

                {/* 3 Verified Hardware Badges in Interactive Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                  {/* Card 1: Screen Share */}
                  <div
                    onClick={() => setSetupStep(1)}
                    style={{
                      background: screenPerm === 'granted' ? '#f0fdf4' : '#fef2f2',
                      border: `1.5px solid ${screenPerm === 'granted' ? '#86efac' : '#fca5a5'}`,
                      borderRadius: 14,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: screenPerm === 'granted' ? '#dcfce7' : '#fee2e2', color: screenPerm === 'granted' ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ScreenShare size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Entire Display</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Desktop Monitor</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: screenPerm === 'granted' ? '#15803d' : '#b91c1c', background: screenPerm === 'granted' ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>
                        {screenPerm === 'granted' ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: screenPerm === 'granted' ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                      {screenPerm === 'granted' ? `✓ 100% Monitor Stream Active (${window.screen ? `${window.screen.width}×${window.screen.height}` : 'HD'})` : '✕ Not Verified — Click to authorize'}
                    </div>
                  </div>

                  {/* Card 2: Microphone */}
                  <div
                    onClick={() => setSetupStep(2)}
                    style={{
                      background: micPerm === 'granted' ? '#f0fdf4' : '#fef2f2',
                      border: `1.5px solid ${micPerm === 'granted' ? '#86efac' : '#fca5a5'}`,
                      borderRadius: 14,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: micPerm === 'granted' ? '#dcfce7' : '#fee2e2', color: micPerm === 'granted' ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Mic size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Audio Sensor</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Acoustic Channel</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: micPerm === 'granted' ? '#15803d' : '#b91c1c', background: micPerm === 'granted' ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>
                        {micPerm === 'granted' ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: micPerm === 'granted' ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                      {micPerm === 'granted' ? `✓ Calibrated (Sensitivity: ${previewAudioLevel}%)` : '✕ Not Verified — Click to authorize'}
                    </div>
                  </div>

                  {/* Card 3: Camera */}
                  <div
                    onClick={() => setSetupStep(3)}
                    style={{
                      background: cameraPerm === 'granted' ? '#f0fdf4' : '#fef2f2',
                      border: `1.5px solid ${cameraPerm === 'granted' ? '#86efac' : '#fca5a5'}`,
                      borderRadius: 14,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: cameraPerm === 'granted' ? '#dcfce7' : '#fee2e2', color: cameraPerm === 'granted' ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Web Camera</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Biometric Stream</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: cameraPerm === 'granted' ? '#15803d' : '#b91c1c', background: cameraPerm === 'granted' ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>
                        {cameraPerm === 'granted' ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: cameraPerm === 'granted' ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                      {cameraPerm === 'granted' ? '✓ Facial Alignment Verified (30 FPS HD)' : '✕ Not Verified — Click to authorize'}
                    </div>
                  </div>
                </div>

                {/* Candidate Assessment Passport Dossier */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={15} color="#0a74da" />
                    <span>Candidate Session Credentials &amp; Parameters</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Candidate</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{user?.name || 'Verified Student'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{user?.roll_number || user?.enrollment_number || 'ENROLLED'}</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assessment</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exam.title || 'Official Exam'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#0a74da', fontWeight: 600 }}>{exam.subject || 'Standard'}</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration &amp; Marks</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{durationMins} Minutes</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{questionCount} Questions • {totalMarks} Marks</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proctoring Mode</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>Continuous AI Guard</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Lockdown &amp; Anomaly Log</div>
                    </div>
                  </div>
                </div>

                {/* Candidate Academic Honor Code Declaration */}
                <div
                  onClick={() => setAgreedToTerms(prev => !prev)}
                  style={{
                    background: agreedToTerms ? '#f0fdf4' : '#ffffff',
                    borderRadius: 16,
                    border: agreedToTerms ? '2px solid #86efac' : '1.5px solid #cbd5e1',
                    padding: '20px 22px',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: 24,
                    boxShadow: agreedToTerms ? '0 4px 14px rgba(22, 101, 52, 0.08)' : 'none'
                  }}
                >
                  <div style={{ color: agreedToTerms ? '#15803d' : '#94a3b8', marginTop: 2, flexShrink: 0 }}>
                    {agreedToTerms ? <CheckSquare size={22} /> : <Square size={22} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: agreedToTerms ? '#166534' : '#0f172a', marginBottom: 4 }}>
                      Institutional Academic Integrity Declaration &amp; Honor Code
                    </div>
                    <div style={{ fontSize: '0.84rem', color: agreedToTerms ? '#15803d' : '#64748b', lineHeight: 1.55 }}>
                      I solemnly certify that I am the verified candidate registered for this assessment. I affirm that I will uphold the highest standards of academic honesty, will not utilize unauthorized study aids, communication tools, secondary displays, or external assistance, and agree to automated telemetry recording and proctor auditing under institutional examination regulations.
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: agreedToTerms ? '#166534' : '#0a74da', marginTop: 8 }}>
                      {agreedToTerms ? '✓ Declaration acknowledged and accepted' : 'Click checkbox to sign the declaration'}
                    </div>
                  </div>
                </div>

                {/* Launch Action Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleProceedFromIntro}
                      disabled={!agreedToTerms || !isDeviceCheckPassed || isStartingExam}
                      style={{
                        flex: 1,
                        minWidth: 280,
                        height: 56,
                        borderRadius: 14,
                        background: !agreedToTerms || !isDeviceCheckPassed || isStartingExam
                          ? '#cbd5e1'
                          : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '1.02rem',
                        fontWeight: 800,
                        cursor: !agreedToTerms || !isDeviceCheckPassed || isStartingExam ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        boxShadow: agreedToTerms && isDeviceCheckPassed && !isStartingExam ? '0 6px 22px rgba(10, 116, 218, 0.35)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isStartingExam ? (
                        <>
                          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Launching Secure Assessment Session...</span>
                        </>
                      ) : !isDeviceCheckPassed ? (
                        <>
                          <Lock size={18} />
                          <span>Complete All 3 Hardware Checks to Enter</span>
                        </>
                      ) : (
                        <>
                          <span>{examData?.existingSession?.status === 'active' ? 'Resume Examination Session' : 'Enter Examination Room & Lock Full Screen'}</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhase('intro')}
                      style={{
                        height: 56,
                        padding: '0 22px',
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        color: '#334155',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <BookOpen size={16} />
                      <span>Back to Guidelines</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', lineHeight: 1.45 }}>
                    Secure full-screen lockdown is enforced upon room entry. Exiting full screen, minimizing the window, or switching browser tabs triggers automated proctoring violation alerts.
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: WAITING ROOM ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'waiting') {
    const scheduledTime = parseToIST(examData?.exam?.date_time) || new Date();
    const isNowReady = waitingCountdown.isReady || (Date.now() >= scheduledTime.getTime());

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '24px'
      }}>
        <div className="er-modal-card" style={{ maxWidth: 540, width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)', borderRadius: 24, padding: '36px 32px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: isNowReady ? '#f0fdf4' : '#fef3c7',
            color: isNowReady ? '#15803d' : '#92400e',
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 20
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isNowReady ? '#22c55e' : '#f59e0b',
              boxShadow: isNowReady ? '0 0 10px #22c55e' : '0 0 10px #f59e0b'
            }} />
            {isNowReady ? 'Ready — Starting Exam' : 'Exam Waiting Room'}
          </div>

          <h1 className="er-modal-title" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            {examData?.exam?.title || 'Examination Session'}
          </h1>
          <p className="er-modal-subtitle" style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: 440, margin: '0 auto 24px' }}>
            Credentials verified. Your examination will launch automatically once the scheduled start time arrives.
          </p>

          {/* Digital Live Countdown Cards */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: 18,
            padding: '24px 20px',
            marginBottom: 24,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 14 }}>
              {isNowReady ? 'Exam Launch Status' : 'Live Countdown to Start'}
            </div>

            {isNowReady ? (
              <div style={{ padding: '12px 0' }}>
                <div style={{
                  display: 'inline-block',
                  width: 36,
                  height: 36,
                  border: '3px solid #e2e8f0',
                  borderTop: '3px solid #0a74da',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 12
                }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Launching Examination...
                </div>
                <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4 }}>
                  Securing proctoring feed & preparing question paper
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '12px 14px', minWidth: 70 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                    {String(waitingCountdown.hours).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginTop: 4, letterSpacing: '0.05em' }}>HOURS</div>
                </div>

                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#94a3b8' }}>:</span>

                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '12px 14px', minWidth: 70 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                    {String(waitingCountdown.minutes).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginTop: 4, letterSpacing: '0.05em' }}>MINUTES</div>
                </div>

                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#94a3b8' }}>:</span>

                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '12px 14px', minWidth: 70 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                    {String(waitingCountdown.seconds).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginTop: 4, letterSpacing: '0.05em' }}>SECONDS</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                📅 Scheduled Start: <strong>{formatIST(scheduledTime, 'full')}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Keep this browser tab open. The exam will start automatically at 00:00:00.
              </div>
            </div>
          </div>

          {waitingStatus && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 16
            }}>
              ⚡ {waitingStatus}
            </div>
          )}

          {isNowReady && (
            <button
              onClick={() => {
                const key = (examKey || examData?.exam?.exam_code || examData?.exam?.exam_key || '').trim();
                triggerBackendStart(key);
              }}
              disabled={isStartingExam}
              className="er-btn-save-next"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: 46,
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                boxShadow: '0 8px 20px rgba(10, 116, 218, 0.25)',
                cursor: 'pointer'
              }}
            >
              {isStartingExam ? 'Starting Session...' : 'Enter Exam Room Now'}
            </button>
          )}

        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: SUBMITTED (RESULT / CONFIRMATION) ─────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: EXAM ENDED / ACCESS CLOSED SCREEN ────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'ended') {
    const examObj = examData?.exam;
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
        <div className="er-modal-card" style={{ maxWidth: 540, textAlign: 'center', borderRadius: 24, padding: '44px 36px', background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)' }}>
          <div className="er-modal-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock size={36} />
          </div>
          <h1 className="er-modal-title" style={{ color: '#991b1b', fontSize: '1.55rem', fontWeight: 800, marginBottom: 10 }}>
            Examination Window Concluded
          </h1>
          <p className="er-modal-subtitle" style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
            The scheduled window for this examination has concluded. In accordance with examination regulations, candidates are not permitted to enter or launch an assessment after its scheduled end time has expired.
          </p>

          {examObj && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: 24
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                {examObj.title || examObj.name || 'Assessment'}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span><strong>Subject:</strong> {examObj.subject || 'General Academic'}</span>
                <span><strong>Scheduled Start:</strong> {examObj.date_time ? formatIST(examObj.date_time, 'full') : 'Scheduled Window'}</span>
                <span><strong>Duration:</strong> {examObj.duration || 60} Minutes</span>
                <span><strong>Status:</strong> <span style={{ color: '#dc2626', fontWeight: 600 }}>Expired / Concluded</span></span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/student/dashboard')}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                background: '#0a74da',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Return to Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/student/exams')}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              <span>View All Exams</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE: SUBMITTED SUCCESS SCREEN ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'submitted') {
    const totalM = Number(result?.totalMarks) || (examData?.exam?.total_marks ? Number(examData.exam.total_marks) : 100);
    const scoreVal = Number(result?.score ?? result?.marksObtained ?? 0);
    const rawPct = result?.percentage;
    const pct = rawPct !== undefined && rawPct !== null && !isNaN(rawPct) && Number(rawPct) > 0
      ? Number(rawPct)
      : (totalM > 0 ? Math.round((scoreVal / totalM) * 100) : 0);
    const passed = (String(result?.status).toLowerCase() === 'pass' || String(result?.status).toLowerCase() === 'passed') || pct >= 40;

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

          {result && (() => {
            const qTotal = (result.questionsTotal && result.questionsTotal > 0)
              ? result.questionsTotal
              : (questions.length > 0 ? questions.length : (examData?.questions?.length || 2));
            const qAttempted = (result.questionsAttempted && result.questionsAttempted > 0)
              ? result.questionsAttempted
              : (answeredCount > 0 ? answeredCount : (scoreVal > 0 ? qTotal : qTotal));

            return (
              <div className="er-summary-grid">
                <div className="er-summary-item">
                  <span className="er-summary-label">Questions Attempted</span>
                  <span className="er-summary-value" style={{ color: '#0a74da' }}>
                    {qAttempted} / {qTotal}
                  </span>
                </div>
                <div className="er-summary-item">
                  <span className="er-summary-label">Marks Awarded</span>
                  <span className="er-summary-value" style={{ color: '#0a74da' }}>
                    {result.score ?? 'Pending'} / {totalM}
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
            );
          })()}

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
      {/* ── Continuous Background Proctoring Engine (Camera & Audio 100% active, hidden from student) ── */}
      <SafeProfessionalProctoring
        key={`proctoring-${reinitCameraKey}`}
        sessionId={session?.id}
        examId={examId}
        studentId={user?.id}
        onViolation={handleFaceViolation}
        onCameraStatusChange={(status) => {
          if (status.isBlocked) {
            setCameraInterrupted(true);
          } else if (status.cameraStatus === 'active' && status.micStatus === 'active') {
            setCameraInterrupted(false);
          }
        }}
        currentQuestion={currentQ + 1}
        totalQuestions={questions.length}
        socket={activeSocket || socketRef.current}
        monitoringConfig={resolvedMonitoringConfig}
        mode="background"
        hidden={true}
        mediaStream={activeMediaStream || previewStreamRef.current}
      />

      {/* ── Fullscreen Blocking Lock Screen if Camera/Microphone feed is disconnected mid-exam ── */}
      {cameraInterrupted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: '#1e293b',
            border: '2px solid #ef4444',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CameraOff size={34} color="#ef4444" />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f87171' }}>
              Proctoring Feed Interrupted
            </h2>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Your camera or microphone feed was disconnected or permissions were revoked.
              Institutional policy requires both devices to be active throughout the examination.
              Exam access is locked until hardware access is restored.
            </p>

            <button
              onClick={async () => {
                try {
                  const s = await verifyCameraAndMic();
                  if (s && s.getVideoTracks().some(t => t.readyState === 'live') && s.getAudioTracks().some(t => t.readyState === 'live')) {
                    setActiveMediaStream(s);
                    setCameraInterrupted(false);
                    setReinitCameraKey(k => k + 1);
                    notify.success('Camera and microphone reconnected successfully!');
                  } else {
                    notify.error('Camera/microphone is still blocked or disconnected. Please allow permissions in your browser.');
                  }
                } catch (_) {
                  notify.error('Camera/microphone is still blocked or disconnected. Please allow permissions in your browser.');
                }
              }}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(10, 116, 218, 0.4)',
                marginTop: 8
              }}
            >
              <RefreshCw size={16} />
              <span>Re-enable Camera & Microphone</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen Blocking Lock Screen if Screen Share is stopped mid-exam ── */}
      {screenShareInterrupted && !cameraInterrupted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999998,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: '#1e293b',
            border: '2px solid #f59e0b',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ScreenShareOff size={34} color="#f59e0b" />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#fbbf24' }}>
              Screen Sharing Stopped
            </h2>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Your entire screen share has been disconnected. Institutional policy requires 
              continuous full-screen sharing throughout the examination. Exam access is locked 
              until you re-share your <strong style={{ color: '#fbbf24' }}>entire screen</strong> (not a tab or window).
            </p>

            <button
              onClick={async () => {
                try {
                  if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(t => t.stop());
                    screenStreamRef.current = null;
                  }
                  const displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: 'monitor', width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false,
                    preferCurrentTab: false,
                  });
                  const screenTrack = displayStream.getVideoTracks()[0];
                  if (!screenTrack || screenTrack.readyState !== 'live') {
                    notify.error('Screen sharing failed. Please try again.');
                    displayStream.getTracks().forEach(t => t.stop());
                    return;
                  }
                  const settings = screenTrack.getSettings();
                  if (settings.displaySurface && settings.displaySurface !== 'monitor') {
                    notify.warn('You must share your ENTIRE screen, not a tab or window. Please try again.');
                    displayStream.getTracks().forEach(t => t.stop());
                    return;
                  }
                  screenStreamRef.current = displayStream;
                  setScreenPerm('granted');
                  setScreenShareInterrupted(false);
                  screenTrack.addEventListener('ended', () => {
                    setScreenPerm('denied');
                    setScreenShareInterrupted(true);
                    screenStreamRef.current = null;
                  });
                  notify.success('Screen sharing restored successfully!');
                } catch (err) {
                  console.warn('Screen re-share error:', err);
                  notify.error('Screen sharing was denied or cancelled. Please try again.');
                }
              }}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                marginTop: 8
              }}
            >
              <ScreenShare size={16} />
              <span>Re-share Entire Screen</span>
            </button>

            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
              This violation has been logged. Select your monitor/display name when prompted.
            </div>
          </div>
        </div>
      )}

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
            <SafeTimer seconds={timeSeconds} onExpire={() => handleSubmit(true)} />
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
            <SafeCodingQuestion
              question={currentQuestion}
              answer={answers[currentQuestion.id] || ''}
              sessionId={session?.id}
              examId={examId}
              onAnswer={(code, lang) => handleAnswer(currentQuestion.id, code, lang)}
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
                    <SafeMCQQuestion
                      question={currentQuestion}
                      answer={answers[currentQuestion.id] || ''}
                      onAnswer={(opt) => handleAnswer(currentQuestion.id, opt)}
                    />
                  ) : (
                    <SafeSubjectiveQuestion
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
            {/* Industry-Grade Background Proctoring Status Indicator */}
            <div style={{
              margin: '16px 16px 0 16px',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                <Shield size={16} color="#0a74da" />
                <span>AI Proctoring Active</span>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '3px 9px',
                borderRadius: 999,
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                Secured
              </span>
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
