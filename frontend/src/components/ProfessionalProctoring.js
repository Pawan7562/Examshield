// ProfessionalProctoring.js — Production-Grade AI Face Detection & Voice Proctoring
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Shield,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';

// ─── Toast helpers (react-hot-toast compatible) ───────────────────────────────
const notify = {
  warn: (msg) => toast(msg, {
    icon: '⚠️',
    style: {
      background: '#1c1400', color: '#fbbf24',
      border: '1px solid rgba(251,191,36,0.3)',
      fontWeight: 600, fontSize: 13,
      fontFamily: "'Inter', sans-serif",
    },
    duration: 5000,
  }),
  error: (msg) => toast.error(msg, {
    style: {
      background: '#1a0000', color: '#f87171',
      border: '1px solid rgba(239,68,68,0.3)',
      fontFamily: "'Inter', sans-serif",
      fontSize: 13,
    },
    duration: 6000,
  }),
};

// ─── Model loading state (module-level singleton — only load once) ────────────
let faceDetectorGlobal = null;
let modelsLoadedGlobal = false;
let modelLoadingPromise = null;

async function loadFaceModels() {
  if (modelsLoadedGlobal && faceDetectorGlobal) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      faceDetectorGlobal = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5
      });
      modelsLoadedGlobal = true;
      console.log('✅ [Proctoring] MediaPipe Face detection model loaded');
      return true;
    } catch (err) {
      console.error('❌ [Proctoring] Model load failed:', err);
      return false;
    }
  })();

  return modelLoadingPromise;
}

// ─── Component ─────────────────────────────────────────────────────────────────
const ProfessionalProctoring = ({
  sessionId,
  examId,
  onViolation,
  studentId,
  currentQuestion,
  totalQuestions,
  mode = 'docked', // 'docked' | 'pip'
  pipCorner = 'bottom-left', // 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right'
  socket = null,
  monitoringConfig = null,
}) => {
  const monConfig = useMemo(() => ({
    face_detection: monitoringConfig?.face_detection !== false,
    voice_detection: monitoringConfig?.voice_detection !== false,
    tab_switch: monitoringConfig?.tab_switch !== false,
    fullscreen: monitoringConfig?.fullscreen !== false,
    device_camera: monitoringConfig?.device_camera !== false,
    is_proctored: monitoringConfig?.is_proctored !== false,
  }), [monitoringConfig]);
  const [cameraStatus, setCameraStatus] = useState('initializing'); // initializing | requesting | active | denied | error
  const [micStatus, setMicStatus] = useState('initializing');       // initializing | requesting | active | denied | unavailable
  const [faceCount, setFaceCount] = useState(-1);                 // -1 = detecting not started yet
  const [modelsLoaded, setModelsLoaded] = useState(modelsLoadedGlobal);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);                // 0 to 100
  const [voiceAlert, setVoiceAlert] = useState(false);
  const [isPipMinimized, setIsPipMinimized] = useState(false);
  const [activeCorner, setActiveCorner] = useState(pipCorner);
  const [customPos, setCustomPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ offsetX: 0, offsetY: 0 });
  const [violationLog, setViolationLog] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioAnimRef = useRef(null);
  const speakingFramesRef = useRef(0);
  const noFaceCountRef = useRef(0);
  const lastViolationTimeRef = useRef({});
  const sessionIdRef = useRef(sessionId);
  const examIdRef = useRef(examId);
  const onViolationRef = useRef(onViolation);
  const socketRef = useRef(socket);

  useEffect(() => { socketRef.current = socket; }, [socket]);

  // Keep refs current
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { examIdRef.current = examId; }, [examId]);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ─── Periodic Camera Frame & Telemetry Transmitter to Admin Cockpit ───
  useEffect(() => {
    if (!socket || cameraStatus !== 'active') return;

    const transmitInterval = setInterval(() => {
      try {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || !video.videoWidth) return;

        const offscreen = document.createElement('canvas');
        offscreen.width = 240;
        offscreen.height = 180;
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(video, 0, 0, 240, 180);

        const dataUrl = offscreen.toDataURL('image/jpeg', 0.42);
        const base64Data = dataUrl.split(',')[1];

        if (base64Data) {
          socket.emit('camera-feed', {
            examId: examIdRef.current,
            studentId,
            sessionId: sessionIdRef.current,
            imageData: base64Data,
            timestamp: new Date().toISOString(),
          });
        }

        socket.emit('student-activity', {
          examId: examIdRef.current,
          studentId,
          sessionId: sessionIdRef.current,
          activity: {
            currentQuestion,
            totalQuestions,
            cameraActive: true,
            audioLevel,
            faceCount,
            status: 'active',
          },
        });
      } catch (_) {}
    }, 3500);

    return () => clearInterval(transmitInterval);
  }, [socket, cameraStatus, studentId, currentQuestion, totalQuestions, audioLevel, faceCount]);

  // ─── Throttled Violation Reporter ──────────────────────────────────────────
  const reportViolation = useCallback(async (type, description) => {
    // If the college admin disabled this feature for this exam, ignore completely
    if (
      (type === 'speech_detected' && !monConfig.voice_detection) ||
      ((type === 'multiple_faces' || type === 'no_face_detected') && !monConfig.face_detection) ||
      ((type === 'tab_switch' || type === 'window_blur') && !monConfig.tab_switch) ||
      (type === 'fullscreen_exit' && !monConfig.fullscreen) ||
      (type === 'camera_off' && !monConfig.device_camera)
    ) {
      return;
    }

    const now = Date.now();
    const COOLDOWN = type === 'speech_detected' ? 25000 : 8000; // 25s cooldown for audio, 8s for camera/tab

    if (
      lastViolationTimeRef.current[type] &&
      now - lastViolationTimeRef.current[type] < COOLDOWN
    ) return;

    lastViolationTimeRef.current[type] = now;
    setViolationLog(prev => [
      { type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), description },
      ...prev.slice(0, 4),
    ]);

    // Notify parent component immediately (UI update)
    onViolationRef.current?.(type);

    // Emit live to proctor socket
    if (socketRef.current) {
      socketRef.current.emit('violation', {
        sessionId: sessionIdRef.current,
        examId: examIdRef.current,
        studentId,
        type,
        severity: type === 'multiple_faces' || type === 'camera_off' ? 'high' : 'medium',
        description,
      });
    }

    // Show in-UI notification
    if (type === 'multiple_faces') {
      notify.warn('Multiple persons detected in camera — violation logged');
    } else if (type === 'no_face_detected') {
      notify.warn('Face not visible — please ensure your face remains in camera frame');
    } else if (type === 'speech_detected') {
      notify.warn('Voice/speech detected — please maintain complete silence during examination');
    } else if (type === 'camera_off') {
      notify.error('Camera is required for this proctored exam');
    }

    // Report to backend
    if (!sessionIdRef.current || !examIdRef.current) return;
    try {
      await studentAPI.reportViolation({
        sessionId: sessionIdRef.current,
        examId: examIdRef.current,
        type,
        description,
      });
    } catch (err) {
      console.warn('[Proctoring] Backend violation report failed:', err.message);
    }
  }, [monConfig]);

  // ─── Load Models ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!monConfig.face_detection || !monConfig.device_camera) return;
    if (modelsLoadedGlobal) {
      setModelsLoaded(true);
      return;
    }
    loadFaceModels().then(ok => {
      setModelsLoaded(ok);
      if (!ok) {
        console.warn('[Proctoring] AI model unavailable — camera-only monitoring active');
      }
    });
  }, [monConfig.face_detection, monConfig.device_camera]);

  // ─── Camera & Microphone Initialization ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initDevices = async () => {
      if (!monConfig.is_proctored || (!monConfig.device_camera && !monConfig.voice_detection)) {
        setCameraStatus('disabled');
        setMicStatus('disabled');
        return;
      }

      try {
        if (monConfig.device_camera) setCameraStatus('requesting');
        else setCameraStatus('disabled');

        if (monConfig.voice_detection) setMicStatus('requesting');
        else setMicStatus('disabled');

        let stream;
        try {
          const constraints = {};
          if (monConfig.device_camera) {
            constraints.video = {
              width: { ideal: 320 },
              height: { ideal: 240 },
              facingMode: 'user',
              frameRate: { ideal: 15 },
            };
          }
          if (monConfig.voice_detection) {
            constraints.audio = {
              echoCancellation: true,
              noiseSuppression: false, // We want raw room noise to detect voice
              autoGainControl: true,
            };
          }

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (monConfig.voice_detection && stream.getAudioTracks().length > 0) {
            setMicStatus('active');
          } else if (!monConfig.voice_detection) {
            setMicStatus('disabled');
          }
        } catch (mediaErr) {
          console.warn('[Proctoring] Combined media request failed, attempting fallback:', mediaErr);
          if (monConfig.device_camera) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 320 },
                height: { ideal: 240 },
                facingMode: 'user',
                frameRate: { ideal: 15 },
              },
            });
            setMicStatus(monConfig.voice_detection ? 'unavailable' : 'disabled');
          } else {
            throw mediaErr;
          }
        }

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // Attach video stream
        if (videoRef.current && monConfig.device_camera) {
          videoRef.current.srcObject = stream;
        }

        // Setup Web Audio Analyser if microphone tracks are present and voice detection enabled
        const audioTracks = stream.getAudioTracks();
        if (monConfig.voice_detection && audioTracks.length > 0) {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              if (audioCtx.state === 'suspended') {
                audioCtx.resume();
              }
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              analyser.smoothingTimeConstant = 0.6;
              const source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);

              audioContextRef.current = audioCtx;
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);

              const checkAudioLevel = () => {
                if (!analyserRef.current || !mounted) return;
                analyserRef.current.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                // Scale to 0-100%
                const normalized = Math.min(100, Math.round((avg / 128) * 100));
                setAudioLevel(normalized);

                // Detect sustained speech/voice: volume > 58% for > 25 consecutive frames (~0.4s sustained voice)
                if (normalized > 58) {
                  speakingFramesRef.current += 1;
                  if (speakingFramesRef.current >= 25) {
                    setVoiceAlert(true);
                    reportViolation('speech_detected', `Voice/speech detected (Audio Level: ${normalized}%)`);
                    speakingFramesRef.current = 0;
                    setTimeout(() => setVoiceAlert(false), 3500);
                  }
                } else {
                  speakingFramesRef.current = Math.max(0, speakingFramesRef.current - 1);
                }

                audioAnimRef.current = requestAnimationFrame(checkAudioLevel);
              };

              audioAnimRef.current = requestAnimationFrame(checkAudioLevel);
            }
          } catch (audioErr) {
            console.warn('[Proctoring] Web Audio setup error:', audioErr);
            setMicStatus('unavailable');
          }
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[Proctoring] Hardware error:', err);
        setCameraStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
        setMicStatus('denied');

        if (monConfig.device_camera) {
          if (err.name === 'NotAllowedError') {
            notify.error('Camera/Microphone permission denied — this exam requires proctoring permissions');
            reportViolation('camera_off', 'Student denied camera/microphone permission');
          } else if (err.name === 'NotFoundError') {
            notify.error('No webcam found — please connect a camera device');
            reportViolation('camera_off', 'No camera device found on this system');
          } else {
            notify.error('Camera initialization error — please check device permissions');
            reportViolation('camera_off', `Camera error: ${err.message}`);
          }
        }
      }
    };

    initDevices();

    return () => {
      mounted = false;
      if (audioAnimRef.current) cancelAnimationFrame(audioAnimRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (_) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [monConfig, reportViolation]);

  // ─── Video onLoadedData → set active ───────────────────────────────────────
  const handleVideoReady = useCallback(() => {
    setCameraStatus('active');
    setFaceCount(0);
    console.log('📸 [Proctoring] Camera & Microphone stream active');
  }, []);

  // ─── Face Detection Loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!monConfig.face_detection || !monConfig.device_camera || !modelsLoaded || cameraStatus !== 'active') return;

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 2 || video.paused || video.ended) return;

      try {
        if (!faceDetectorGlobal) return;
        
        const timestampMs = performance.now();
        const results = faceDetectorGlobal.detectForVideo(video, timestampMs);
        
        const rawDetections = (results?.detections || []).map(det => ({
          box: {
            x: det.boundingBox.originX,
            y: det.boundingBox.originY,
            width: det.boundingBox.width,
            height: det.boundingBox.height
          }
        }));

        if (canvas) {
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
        }

        // Filter out absurdly small boxes (e.g. noise smaller than 30px)
        let validDetections = rawDetections.filter(det => det.box.width >= 30 && det.box.height >= 30);

        if (validDetections.length > 1) {
          validDetections.sort((a, b) => (b.box.width * b.box.height) - (a.box.width * a.box.height));
          const maxArea = validDetections[0].box.width * validDetections[0].box.height;
          const filtered = [];

          for (let i = 0; i < validDetections.length; i++) {
            const current = validDetections[i];
            const currentArea = current.box.width * current.box.height;
            if (currentArea < maxArea * 0.15) continue;

            let isDuplicate = false;
            for (let j = 0; j < filtered.length; j++) {
              const keep = filtered[j];
              const xA = Math.max(current.box.x, keep.box.x);
              const yA = Math.max(current.box.y, keep.box.y);
              const xB = Math.min(current.box.x + current.box.width, keep.box.x + keep.box.width);
              const yB = Math.min(current.box.y + current.box.height, keep.box.y + keep.box.height);

              const w = Math.max(0, xB - xA);
              const h = Math.max(0, yB - yA);
              const intersection = w * h;
              
              if (intersection / currentArea > 0.3) {
                isDuplicate = true;
                break;
              }
            }

            if (!isDuplicate) {
              filtered.push(current);
            }
          }
          validDetections = filtered;
        }

        const faces = validDetections.length;
        setFaceCount(faces);

        // Draw detection boxes
        if (canvas && video) {
          try {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            validDetections.forEach((det, idx) => {
              const box = det.box;
              const isExtra = faces > 1;
              const color = isExtra ? '#ef4444' : '#22c55e';

              ctx.strokeStyle = color;
              ctx.lineWidth = 2.5;
              roundRect(ctx, box.x, box.y, box.width, box.height, 6);
              ctx.stroke();

              drawCorners(ctx, box.x, box.y, box.width, box.height, color);

              ctx.fillStyle = color + 'dd';
              ctx.fillRect(box.x, box.y - 20, isExtra ? 80 : 60, 20);
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 11px Inter, sans-serif';
              ctx.fillText(
                isExtra ? `Person ${idx + 1} ⚠` : '✓ Candidate',
                box.x + 6, box.y - 5
              );
            });
          } catch (_) {}
        }

        // Violation logic
        if (faces > 1) {
          noFaceCountRef.current = 0;
          setNoFaceCount(0);
          reportViolation('multiple_faces', `${faces} faces detected simultaneously`);
        } else if (faces === 0) {
          noFaceCountRef.current += 1;
          setNoFaceCount(noFaceCountRef.current);
          if (noFaceCountRef.current >= 6) {
            reportViolation('no_face_detected', 'Candidate face not detected in frame');
            noFaceCountRef.current = 0;
            setNoFaceCount(0);
          }
        } else {
          noFaceCountRef.current = 0;
          setNoFaceCount(0);
        }
      } catch (err) {
        console.error('❌ [Proctoring] Face detection loop error:', err);
      }
    };

    detect();
    detectionIntervalRef.current = setInterval(detect, 2000);

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [modelsLoaded, cameraStatus, reportViolation]);

  // ─── Helpers: Rounded rect & cross-hairs ────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCorners(ctx, x, y, w, h, color) {
    const len = 12, lw = 2.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    const corners = [
      [[x, y + len], [x, y], [x + len, y]],
      [[x + w - len, y], [x + w, y], [x + w, y + len]],
      [[x, y + h - len], [x, y + h], [x + len, y + h]],
      [[x + w - len, y + h], [x + w, y + h], [x + w, y + h - len]],
    ];
    corners.forEach(pts => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.stroke();
    });
  }

  // ─── Derived UI values ──────────────────────────────────────────────────────
  const isViolation = faceCount > 1 || (faceCount === 0 && noFaceCount >= 4) || voiceAlert;
  const borderColor = isViolation ? 'rgba(239,68,68,0.8)'
    : faceCount === 1 ? 'rgba(34,197,94,0.6)'
    : 'rgba(255,255,255,0.15)';

  const faceColor = faceCount === 1 ? '#22c55e'
    : faceCount > 1 ? '#ef4444'
    : noFaceCount >= 4 ? '#ef4444' : '#f59e0b';

  const faceText = faceCount === 1 ? '✓ Candidate Present'
    : faceCount > 1 ? `⚠ ${faceCount} Faces Detected!`
    : faceCount === 0 ? (noFaceCount >= 4 ? '⚠ Face Missing' : 'Detecting...')
    : 'Initializing...';

  // ─── PIP DRAGGING & CORNER MANAGEMENT ──────────────────────────────────────
  const cycleCorner = (e) => {
    e.stopPropagation();
    setCustomPos(null);
    setActiveCorner(prev => {
      if (prev === 'bottom-left') return 'top-left';
      if (prev === 'top-left') return 'top-right';
      return 'bottom-left';
    });
  };

  const handleDragStart = (e) => {
    if (mode !== 'pip') return;
    if (e.target.closest('button')) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const el = e.currentTarget.closest('.er-proctor-pip-container') || e.currentTarget;
    const rect = el.getBoundingClientRect();

    dragStartRef.current = {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      const newX = Math.max(10, Math.min(window.innerWidth - 270, clientX - dragStartRef.current.offsetX));
      const newY = Math.max(60, Math.min(window.innerHeight - 280, clientY - dragStartRef.current.offsetY));

      setCustomPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const getPipPos = (width = 250) => {
    if (customPos) {
      return {
        position: 'fixed',
        left: customPos.x,
        top: customPos.y,
        zIndex: 1000,
        width,
      };
    }
    switch (activeCorner) {
      case 'bottom-left':
        return { position: 'fixed', bottom: 24, left: 24, zIndex: 1000, width };
      case 'top-left':
        return { position: 'fixed', top: 75, left: 24, zIndex: 1000, width };
      case 'top-right':
        return { position: 'fixed', top: 75, right: 24, zIndex: 1000, width };
      case 'bottom-right':
      default:
        return { position: 'fixed', bottom: 95, right: 24, zIndex: 1000, width };
    }
  };

  // ─── PIP MINIMIZED FLOATING PILL ────────────────────────────────────────────
  if (mode === 'pip' && isPipMinimized) {
    const pillPos = getPipPos('auto');
    return (
      <div
        className="er-proctor-pip-container"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          ...pillPos,
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1.5px solid ${isViolation ? '#ef4444' : 'rgba(10, 116, 218, 0.5)'}`,
          backdropFilter: 'blur(12px)',
          borderRadius: 30,
          padding: '8px 14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cameraStatus === 'active' ? '#22c55e' : '#ef4444',
          boxShadow: cameraStatus === 'active' ? '0 0 8px #22c55e' : 'none'
        }} />
        <Camera size={14} color="#38bdf8" />
        <span style={{ cursor: 'pointer' }} onClick={() => setIsPipMinimized(false)}>AI Proctoring</span>
        <button
          onClick={cycleCorner}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'flex' }}
          title={`Position: ${activeCorner}. Click to change corner.`}
        >
          <Move size={12} />
        </button>
        <button
          onClick={() => setIsPipMinimized(false)}
          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 2, display: 'flex' }}
          title="Expand Proctoring HUD"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    );
  }

  // ─── PIP FLOATING WINDOW WRAPPER ───────────────────────────────────────────
  const containerStyle = mode === 'pip' ? {
    ...getPipPos(250),
    background: 'rgba(15, 23, 42, 0.96)',
    border: `1.5px solid ${borderColor}`,
    backdropFilter: 'blur(14px)',
    borderRadius: 14,
    padding: '12px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
    fontFamily: "'Inter', sans-serif",
    transition: isDragging ? 'none' : 'border-color 0.3s ease',
  } : {
    padding: '14px',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={containerStyle} className={mode === 'pip' ? 'er-proctor-pip-container' : ''}>
      {/* PiP Header with Move and Minimize */}
      {mode === 'pip' && (
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          title="Drag to reposition anywhere, or click corner button"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
            <Shield size={13} color="#38bdf8" />
            <span>AI MONITOR HUD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={cycleCorner}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 5px',
                fontSize: 10,
                fontWeight: 600,
              }}
              title={`Position: ${activeCorner}. Click to change corner.`}
            >
              <Move size={11} />
              <span>{activeCorner === 'bottom-left' ? 'Bottom-Left' : activeCorner === 'top-left' ? 'Top-Left' : 'Top-Right'}</span>
            </button>
            <button
              onClick={() => setIsPipMinimized(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
              }}
              title="Minimize Proctoring HUD"
            >
              <Minimize2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      {!monConfig.device_camera ? (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0b1329, #1e293b)',
          border: '1.5px dashed #475569',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          padding: 12
        }}>
          <CameraOff size={26} color="#94a3b8" />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }}>
            Camera Stream Disabled
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
            Not monitored for this exam
          </div>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: 10,
          overflow: 'hidden',
          background: '#0a0f1d',
          border: `2px solid ${borderColor}`,
          transition: 'border-color 0.4s ease',
          marginBottom: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={handleVideoReady}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: 'block',
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              transform: 'scaleX(-1)',
              pointerEvents: 'none',
            }}
          />

          {/* REC / LIVE badge */}
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: cameraStatus === 'active' ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)',
            padding: '2px 7px', borderRadius: 5,
            fontSize: 9, fontWeight: 800, color: '#fff',
            letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#fff',
              animation: cameraStatus === 'active' ? 'er-pulse 1.5s infinite' : 'none',
            }} />
            {cameraStatus === 'active' ? 'LIVE' : 'OFF'}
          </div>

          {/* Face count badge */}
          {monConfig.face_detection && cameraStatus === 'active' && faceCount >= 0 && (
            <div style={{
              position: 'absolute', top: 6, right: 6,
              background: faceColor + 'dd',
              padding: '2px 7px', borderRadius: 5,
              fontSize: 9, fontWeight: 800, color: '#fff',
            }}>
              {faceCount === 1 ? '1 FACE' : faceCount > 1 ? `${faceCount} FACES` : 'NO FACE'}
            </div>
          )}

          {/* Multiple faces alert */}
          {monConfig.face_detection && faceCount > 1 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(239,68,68,0.95)',
              padding: '4px 6px', textAlign: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff',
              letterSpacing: '0.5px',
            }}>
              🚨 MULTIPLE PERSONS DETECTED
            </div>
          )}

          {/* No face warning */}
          {monConfig.face_detection && faceCount === 0 && noFaceCount >= 4 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(245,158,11,0.95)',
              padding: '4px 6px', textAlign: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff',
            }}>
              ⚠️ FACE THE CAMERA
            </div>
          )}

          {/* Voice detected alert */}
          {monConfig.voice_detection && voiceAlert && (
            <div style={{
              position: 'absolute', top: 30, left: 6, right: 6,
              background: 'rgba(239,68,68,0.92)',
              padding: '4px 8px', borderRadius: 6, textAlign: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff',
              letterSpacing: '0.4px',
              animation: 'er-pulse 1s infinite',
            }}>
              🎙️ VOICE / SPEECH DETECTED
            </div>
          )}

          {/* Camera denied overlay */}
          {(cameraStatus === 'denied' || cameraStatus === 'error') && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(15,23,42,0.94)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6,
            }}>
              <Camera size={24} color="#ef4444" />
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textAlign: 'center', padding: '0 8px' }}>
                {cameraStatus === 'denied' ? 'Camera Access Denied' : 'Camera Error'}
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
                Webcam required for monitoring
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIVE VOICE / MICROPHONE MONITORING BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: !monConfig.voice_detection ? 'rgba(30,41,59,0.4)' : voiceAlert ? 'rgba(239,68,68,0.2)' : 'rgba(30,41,59,0.7)',
        border: `1px solid ${!monConfig.voice_detection ? 'rgba(255,255,255,0.05)' : voiceAlert ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 8,
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: !monConfig.voice_detection ? '#94a3b8' : voiceAlert ? '#f87171' : '#e2e8f0' }}>
          {!monConfig.voice_detection ? (
            <MicOff size={13} color="#64748b" />
          ) : micStatus === 'active' ? (
            <Mic size={13} color={voiceAlert ? '#ef4444' : '#22c55e'} />
          ) : (
            <MicOff size={13} color="#94a3b8" />
          )}
          <span>
            {!monConfig.voice_detection ? 'Voice Monitor Disabled' : voiceAlert ? 'Speaking Detected!' : micStatus === 'active' ? 'Voice Monitor Active' : 'Mic Unavailable'}
          </span>
        </div>

        {/* Live Audio Equalizer Waveform */}
        {monConfig.voice_detection ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 14 }}>
            {[0.25, 0.5, 0.9, 1.0, 0.65, 0.35].map((factor, idx) => {
              const rawH = Math.round((audioLevel / 100) * 14 * (1 + factor * 0.3));
              const barH = Math.max(3, Math.min(14, rawH));
              const barColor = voiceAlert || audioLevel > 50 ? '#ef4444' : audioLevel > 22 ? '#f59e0b' : '#22c55e';
              return (
                <div
                  key={idx}
                  style={{
                    width: 3,
                    height: `${barH}px`,
                    borderRadius: 2,
                    background: barColor,
                    transition: 'height 0.08s ease, background 0.15s ease',
                  }}
                />
              );
            })}
          </div>
        ) : (
          <span style={{ fontSize: 9, color: '#64748b', fontWeight: 800 }}>OFF</span>
        )}
      </div>

      {/* Status Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        <StatusRow 
          label="Face Tracking" 
          value={!monConfig.face_detection ? 'Disabled' : !monConfig.device_camera ? 'Camera Off' : faceText} 
          color={!monConfig.face_detection || !monConfig.device_camera ? '#94a3b8' : faceColor} 
        />
        <StatusRow
          label="Microphone"
          value={!monConfig.voice_detection ? 'Disabled' : micStatus === 'active' ? (audioLevel > 35 ? 'Voice Detected' : 'Quiet (Silent)') : 'Offline'}
          color={!monConfig.voice_detection ? '#94a3b8' : voiceAlert ? '#ef4444' : micStatus === 'active' ? '#22c55e' : '#94a3b8'}
        />
        <StatusRow
          label="Tab Security"
          value={!monConfig.tab_switch ? 'Disabled' : 'Enforced'}
          color={!monConfig.tab_switch ? '#94a3b8' : '#22c55e'}
        />
      </div>

      {/* Recent Alerts Log */}
      {violationLog.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          padding: '6px 8px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#f87171', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Alert History ({violationLog.length})
          </div>
          {violationLog.slice(0, 2).map((v, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10, color: '#fca5a5', padding: '1px 0',
            }}>
              <span style={{ fontWeight: 600 }}>
                {v.type === 'multiple_faces' ? '👥 Multi-face' :
                 v.type === 'no_face_detected' ? '👁 No face' :
                 v.type === 'speech_detected' ? '🎙️ Speech' :
                 v.type === 'camera_off' ? '📷 Cam off' : v.type}
              </span>
              <span style={{ color: '#94a3b8', fontSize: 9 }}>{v.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Status Row helper ─────────────────────────────────────────────────────────
function StatusRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: color, flexShrink: 0,
        boxShadow: color === '#22c55e' ? '0 0 6px #22c55e' : 'none',
      }} />
      <span style={{ color: '#94a3b8', flexShrink: 0 }}>{label}:</span>
      <span style={{ color, fontWeight: 700, marginLeft: 'auto', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}

export default ProfessionalProctoring;
