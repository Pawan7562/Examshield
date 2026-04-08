// ProfessionalProctoring.js — Production-Grade AI Face Detection Proctoring
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';

// ─── Toast helpers (react-hot-toast v2 compatible — no toast.warning) ──────────
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
}) => {
  const [cameraStatus, setCameraStatus] = useState('initializing'); // initializing | requesting | active | denied | error
  const [faceCount, setFaceCount] = useState(-1); // -1 = detecting not started yet
  const [modelsLoaded, setModelsLoaded] = useState(modelsLoadedGlobal);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState(null);
  const [violationLog, setViolationLog] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const noFaceCountRef = useRef(0);
  const lastViolationTimeRef = useRef({});
  const sessionIdRef = useRef(sessionId);
  const examIdRef = useRef(examId);
  const onViolationRef = useRef(onViolation);

  // Keep refs current
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { examIdRef.current = examId; }, [examId]);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ─── Throttled Violation Reporter ──────────────────────────────────────────
  const reportViolation = useCallback(async (type, description) => {
    const now = Date.now();
    const COOLDOWN = 8000; // 8 second cooldown per violation type

    if (
      lastViolationTimeRef.current[type] &&
      now - lastViolationTimeRef.current[type] < COOLDOWN
    ) return;

    lastViolationTimeRef.current[type] = now;
    setLastViolationType(type);
    setViolationLog(prev => [
      { type, time: new Date().toLocaleTimeString(), description },
      ...prev.slice(0, 4), // keep last 5
    ]);

    // Notify parent component immediately (UI update)
    onViolationRef.current?.(type);

    // Show in-UI notification
    if (type === 'multiple_faces') {
      notify.warn('Multiple persons detected in camera — violation logged');
    } else if (type === 'no_face_detected') {
      notify.warn('Face not visible — please ensure your face is in camera frame');
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
  }, []);

  // ─── Load Models ────────────────────────────────────────────────────────────
  useEffect(() => {
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
  }, []);

  // ─── Camera Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        setCameraStatus('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
            frameRate: { ideal: 15 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[Proctoring] Camera error:', err);
        setCameraStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');

        if (err.name === 'NotAllowedError') {
          notify.error('Camera permission denied — this exam requires camera access');
          reportViolation('camera_off', 'Student denied camera permission');
        } else if (err.name === 'NotFoundError') {
          notify.error('No camera found — please connect a camera to continue');
          reportViolation('camera_off', 'No camera device found on this device');
        } else {
          notify.error('Camera error — please check your camera and refresh');
          reportViolation('camera_off', `Camera error: ${err.message}`);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [reportViolation]);

  // ─── Video onLoadedData → set active ───────────────────────────────────────
  const handleVideoReady = useCallback(() => {
    setCameraStatus('active');
    setFaceCount(0);
    console.log('📸 [Proctoring] Camera stream active');
  }, []);

  // ─── Face Detection Loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded || cameraStatus !== 'active') return;

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 2 || video.paused || video.ended) return;

      try {
        if (!faceDetectorGlobal) return;
        
        const timestampMs = performance.now();
        const results = faceDetectorGlobal.detectForVideo(video, timestampMs);
        
        // Map MediaPipe boundingBoxes to the old box format so NMS still works seamlessly
        const rawDetections = results.detections.map(det => ({
          box: {
            x: det.boundingBox.originX,
            y: det.boundingBox.originY,
            width: det.boundingBox.width,
            height: det.boundingBox.height
          }
        }));

        // Set canvas to exact video intrinsic size
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // ── Advanced NMS and Size Filtering to prevent false positives ──
        // Filter out absurdly small boxes (e.g., smaller than 30px on screen)
        let validDetections = rawDetections.filter(det => det.box.width >= 30 && det.box.height >= 30);

        if (validDetections.length > 1) {
          // Sort by area (largest first)
          validDetections.sort((a, b) => (b.box.width * b.box.height) - (a.box.width * a.box.height));
          
          const maxArea = validDetections[0].box.width * validDetections[0].box.height;
          const filtered = [];

          for (let i = 0; i < validDetections.length; i++) {
            const current = validDetections[i];
            const currentArea = current.box.width * current.box.height;

            // 1. Relative Size Filter: Ignore any face that is less than 15% the size of the main face
            if (currentArea < maxArea * 0.15) continue;

            // 2. Overlap Tracker (Intersection over Union / Box Area)
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
              
              // If the smaller box is more than 30% inside the larger box, it's a duplicate
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

        // ── Draw detection boxes ──
        if (canvas && video) {
          try {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            validDetections.forEach((det, idx) => {
              const box = det.box;
              const isExtra = faces > 1;
              const color = isExtra ? '#ef4444' : '#22c55e';

              // Draw rounded rect
              ctx.strokeStyle = color;
              ctx.lineWidth = 2.5;
              roundRect(ctx, box.x, box.y, box.width, box.height, 6);
              ctx.stroke();

              // Corner marks
              drawCorners(ctx, box.x, box.y, box.width, box.height, color);

              // Label
              ctx.fillStyle = color + 'cc';
              ctx.fillRect(box.x, box.y - 20, isExtra ? 80 : 55, 20);
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 11px Inter, sans-serif';
              ctx.fillText(
                isExtra ? `Person ${idx + 1} ⚠` : '✓ You',
                box.x + 6, box.y - 5
              );
            });
          } catch (_) {}
        }

        // ── Violation logic ──
        if (faces > 1) {
          noFaceCountRef.current = 0;
          setNoFaceCount(0);
          reportViolation('multiple_faces', `${faces} faces detected simultaneously`);
        } else if (faces === 0) {
          noFaceCountRef.current += 1;
          setNoFaceCount(noFaceCountRef.current);
          // Report after 6 consecutive misses (~12 seconds at 2s interval)
          if (noFaceCountRef.current >= 6) {
            reportViolation('no_face_detected', 'No face detected for extended period');
            noFaceCountRef.current = 0;
            setNoFaceCount(0);
          }
        } else {
          // Exactly 1 face — perfect
          noFaceCountRef.current = 0;
          setNoFaceCount(0);
        }
      } catch (err) {
        console.error('❌ [Proctoring] Face detection loop error:', err);
        // Silently swallow individual detection frame errors
      }
    };

    // Run initially and then periodically
    // Use requestAnimationFrame for smoother processing or setInterval. Still using 2000ms.
    detect();
    detectionIntervalRef.current = setInterval(detect, 2000);

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [modelsLoaded, cameraStatus, reportViolation]);

  // ─── Helper: Draw rounded rect ──────────────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ─── Helper: Corner cross-hairs ─────────────────────────────────────────────
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
  const camColor = cameraStatus === 'active' ? '#22c55e'
    : cameraStatus === 'requesting' || cameraStatus === 'initializing' ? '#f59e0b'
    : '#ef4444';

  const faceColor = faceCount === 1 ? '#22c55e'
    : faceCount > 1 ? '#ef4444'
    : noFaceCount >= 4 ? '#ef4444' : '#f59e0b';

  const faceText = faceCount === 1 ? '✓ Face detected'
    : faceCount > 1 ? `⚠ ${faceCount} faces!`
    : faceCount === 0 ? (noFaceCount >= 4 ? '⚠ Not visible' : 'Searching...')
    : 'Initializing...';

  const isViolation = faceCount > 1 || (faceCount === 0 && noFaceCount >= 4);
  const borderColor = faceCount === 1 ? 'rgba(34,197,94,0.5)'
    : isViolation ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)';

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '12px', fontFamily: "'Inter', sans-serif" }}>

      {/* Camera Preview */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#000',
        border: `2px solid ${borderColor}`,
        transition: 'border-color 0.4s ease',
        marginBottom: 12,
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

        {/* REC badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: cameraStatus === 'active' ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
          padding: '3px 8px', borderRadius: 5,
          fontSize: 9, fontWeight: 800, color: '#fff',
          letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#fff',
            animation: cameraStatus === 'active' ? 'er-pulse 1.5s infinite' : 'none',
          }} />
          {cameraStatus === 'active' ? 'REC' : 'OFF'}
        </div>

        {/* Face count badge */}
        {cameraStatus === 'active' && faceCount >= 0 && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: faceColor + 'dd',
            padding: '3px 8px', borderRadius: 5,
            fontSize: 9, fontWeight: 800, color: '#fff',
          }}>
            {faceCount === 1 ? '1 FACE' : faceCount > 1 ? `${faceCount} FACES` : 'NO FACE'}
          </div>
        )}

        {/* Multiple faces alert */}
        {faceCount > 1 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(239,68,68,0.92)',
            padding: '5px 8px', textAlign: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
            letterSpacing: '0.5px',
          }}>
            🚨 MULTIPLE PERSONS DETECTED
          </div>
        )}

        {/* No face warning */}
        {faceCount === 0 && noFaceCount >= 4 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(245,158,11,0.92)',
            padding: '5px 8px', textAlign: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
          }}>
            ⚠️ PLEASE FACE THE CAMERA
          </div>
        )}

        {/* Camera denied overlay */}
        {(cameraStatus === 'denied' || cameraStatus === 'error') && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8,
          }}>
            <div style={{ fontSize: 28 }}>📷</div>
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textAlign: 'center', padding: '0 12px' }}>
              {cameraStatus === 'denied' ? 'Camera Access Denied' : 'Camera Error'}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', padding: '0 12px' }}>
              Camera is required for this exam
            </div>
          </div>
        )}

        {/* AI loading overlay */}
        {cameraStatus === 'active' && !modelsLoaded && (
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)',
            padding: '3px 10px', borderRadius: 20,
            fontSize: 10, color: '#fbbf24', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            ⏳ Loading AI model...
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <StatusRow
          label="Camera"
          value={
            cameraStatus === 'active' ? 'Live' :
            cameraStatus === 'requesting' ? 'Connecting...' :
            cameraStatus === 'denied' ? 'Denied' :
            cameraStatus === 'error' ? 'Error' : 'Initializing'
          }
          color={camColor}
        />
        <StatusRow
          label="Face"
          value={faceText}
          color={faceColor}
        />
        <StatusRow
          label="AI Engine"
          value={modelsLoaded ? 'Active' : 'Loading...'}
          color={modelsLoaded ? '#22c55e' : '#f59e0b'}
        />
      </div>

      {/* Progress bar: No-face countdown */}
      {faceCount === 0 && noFaceCount > 0 && noFaceCount < 6 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>
            Face missing: {noFaceCount}/6 checks
          </div>
          <div style={{
            height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(noFaceCount / 6) * 100}%`,
              background: noFaceCount >= 4 ? '#ef4444' : '#f59e0b',
              borderRadius: 2,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Violation Log */}
      {violationLog.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 8,
          padding: '8px 10px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Recent Alerts
          </div>
          {violationLog.slice(0, 3).map((v, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10, color: '#f87171', padding: '2px 0',
              borderBottom: i < violationLog.length - 1 ? '1px solid rgba(239,68,68,0.1)' : 'none',
            }}>
              <span style={{ fontWeight: 600 }}>
                {v.type === 'multiple_faces' ? '👥 Multi-face' :
                 v.type === 'no_face_detected' ? '👁 No face' :
                 v.type === 'camera_off' ? '📷 Camera off' : v.type}
              </span>
              <span style={{ color: '#4a5568' }}>{v.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Question Progress */}
      {totalQuestions > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 4 }}>
            <span>Question Progress</span>
            <span>{currentQuestion}/{totalQuestions}</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(currentQuestion / totalQuestions) * 100}%`,
              background: 'linear-gradient(90deg, #e94560, #7c3aed)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Status Row helper ───────────────────────────────────────────────────────────
function StatusRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color, flexShrink: 0,
        animation: color === '#22c55e' ? 'er-pulse 3s infinite' : 'none',
      }} />
      <span style={{ color: '#4a5568', flexShrink: 0 }}>{label}:</span>
      <span style={{ color, fontWeight: 700, marginLeft: 'auto', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default ProfessionalProctoring;
