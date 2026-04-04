// ProfessionalProctoring.js — Real Face Detection with face-api.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';

const ProfessionalProctoring = ({ sessionId, examId, onViolation, studentId, currentQuestion, totalQuestions }) => {
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [faceCount, setFaceCount] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [lastViolation, setLastViolation] = useState(null);
  const [noFaceTimer, setNoFaceTimer] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const noFaceCountRef = useRef(0); // consecutive no-face detections
  const lastViolationTimeRef = useRef({}); // per-type cooldown

  // ── Violation Reporting with Per-Type Cooldown ──
  const reportViolationThrottled = useCallback(async (type, description) => {
    const now = Date.now();
    const cooldown = 5000; // 5 seconds between same violation types
    
    if (lastViolationTimeRef.current[type] && (now - lastViolationTimeRef.current[type]) < cooldown) {
      return; // Skip, too soon
    }
    lastViolationTimeRef.current[type] = now;

    try {
      console.log(`📤 [FACE-DETECT] Reporting: ${type} — ${description}`);
      const result = await studentAPI.reportViolation({
        sessionId,
        examId,
        type,
        description
      });

      if (result?.data) {
        const payload = result.data.data || result.data;
        onViolation(payload);
        setLastViolation(payload);
      }
    } catch (error) {
      console.error('❌ [FACE-DETECT] Violation report failed:', error.message);
    }
  }, [sessionId, examId, onViolation]);

  // ── Load Face Detection Models ──
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('🧠 [FACE-DETECT] Loading TinyFaceDetector model...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
        console.log('✅ [FACE-DETECT] Model loaded successfully');
      } catch (err) {
        console.error('❌ [FACE-DETECT] Model loading failed:', err);
        // Fallback: still allow proctoring without face detection
        toast.error('Face detection model failed to load. Camera monitoring is still active.');
      }
    };
    loadModels();
  }, []);

  // ── Initialize Camera ──
  useEffect(() => {
    const initCamera = async () => {
      try {
        setCameraStatus('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraStatus('active');
          console.log('📸 [FACE-DETECT] Camera initialized');
        }
      } catch (err) {
        console.error('❌ [FACE-DETECT] Camera init failed:', err);
        setCameraStatus('denied');

        if (err.name === 'NotAllowedError') {
          toast.error('⚠️ Camera permission denied. Camera is required for proctoring.');
          reportViolationThrottled('camera_off', 'Camera permission denied by student');
        } else if (err.name === 'NotFoundError') {
          toast.error('⚠️ No camera found. Please connect a camera.');
          reportViolationThrottled('camera_off', 'No camera device found');
        } else {
          toast.error('⚠️ Camera error. Please check your camera.');
        }
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [reportViolationThrottled]);

  // ── Real Face Detection Loop ──
  useEffect(() => {
    if (!modelsLoaded || cameraStatus !== 'active') return;

    const runDetection = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 })
        );

        const faces = detections.length;
        setFaceCount(faces);

        // Draw detection boxes on canvas
        if (canvasRef.current && videoRef.current) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
          const resized = faceapi.resizeResults(detections, dims);
          
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          resized.forEach((det, i) => {
            const box = det.box;
            const color = faces > 1 ? '#ef4444' : '#22c55e';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(faces > 1 ? `Person ${i + 1}` : '✓ You', box.x + 4, box.y - 4);
          });
        }

        // ── Multiple Faces Detected ──
        if (faces > 1) {
          noFaceCountRef.current = 0;
          console.log(`🚨 [FACE-DETECT] Multiple faces: ${faces}`);
          reportViolationThrottled('multiple_faces', `${faces} faces detected — only 1 person is allowed`);
        }
        // ── No Face Detected ──
        else if (faces === 0) {
          noFaceCountRef.current += 1;
          setNoFaceTimer(noFaceCountRef.current);

          // Grace period: only report after 5 consecutive no-face detections (~10 seconds)
          if (noFaceCountRef.current >= 5) {
            console.log('🚨 [FACE-DETECT] No face for 10+ seconds');
            reportViolationThrottled('no_face_detected', 'No face visible in camera for extended period');
            noFaceCountRef.current = 0; // Reset after reporting
          }
        }
        // ── Exactly 1 Face — All Good ──
        else {
          noFaceCountRef.current = 0;
          setNoFaceTimer(0);
        }

      } catch (err) {
        // Silently handle detection errors (e.g., canvas issues)
      }
    };

    // Run detection every 2 seconds
    detectionIntervalRef.current = setInterval(runDetection, 2000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelsLoaded, cameraStatus, reportViolationThrottled]);

  // ── Status Colors ──
  const getStatusColor = () => {
    switch (cameraStatus) {
      case 'active': return '#22c55e';
      case 'requesting': case 'initializing': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const getFaceColor = () => {
    if (faceCount === 1) return '#22c55e';
    if (faceCount === 0) return noFaceTimer >= 3 ? '#ef4444' : '#f59e0b';
    return '#ef4444'; // multiple faces
  };

  const getFaceText = () => {
    if (faceCount === 1) return '✅ 1 Face';
    if (faceCount === 0) return noFaceTimer >= 3 ? '❌ No Face!' : '⚠️ Searching...';
    return `🚨 ${faceCount} Faces!`;
  };

  // ── Render: Sidebar-Embedded Proctoring Widget ──
  return (
    <div style={{
      padding: '12px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#e94560',
          letterSpacing: 1,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: cameraStatus === 'active' ? '#22c55e' : '#ef4444',
            animation: cameraStatus === 'active' ? 'pulse 2s infinite' : 'none',
          }} />
          Proctoring
        </div>
        <div style={{
          fontSize: 10,
          color: modelsLoaded ? '#22c55e' : '#f59e0b',
          fontWeight: 600,
        }}>
          {modelsLoaded ? '🧠 AI Active' : '⏳ Loading...'}
        </div>
      </div>

      {/* Camera Preview */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#000',
        marginBottom: 10,
        border: `2px solid ${faceCount === 1 ? 'rgba(34,197,94,0.4)' : faceCount > 1 ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
        transition: 'border-color 0.3s ease',
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror the video
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)', // Mirror to match video
          }}
        />

        {/* Camera Overlay Status */}
        <div style={{
          position: 'absolute',
          top: 6,
          left: 6,
          background: cameraStatus === 'active' ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 700,
          color: 'white',
          letterSpacing: 0.5,
        }}>
          {cameraStatus === 'active' ? '● REC' : '● OFF'}
        </div>

        {/* Face Count Badge */}
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: getFaceColor(),
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 700,
          color: 'white',
        }}>
          {faceCount === 1 ? '1 Face' : faceCount > 1 ? `${faceCount} Faces` : 'No Face'}
        </div>

        {/* Multiple Faces Alert Overlay */}
        {faceCount > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(239,68,68,0.9)',
            padding: '4px 8px',
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: 'white',
            animation: 'pulse 1s infinite',
          }}>
            🚨 MULTIPLE PERSONS DETECTED
          </div>
        )}

        {/* No Face Warning */}
        {faceCount === 0 && noFaceTimer >= 3 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(245,158,11,0.9)',
            padding: '4px 8px',
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: 'white',
          }}>
            ⚠️ PLEASE FACE THE CAMERA
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Camera Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: getStatusColor(),
            flexShrink: 0,
          }} />
          <span style={{ color: '#718096' }}>Camera:</span>
          <span style={{ color: getStatusColor(), fontWeight: 600, marginLeft: 'auto' }}>
            {cameraStatus === 'active' ? 'Active' : cameraStatus === 'requesting' ? 'Starting...' : cameraStatus === 'denied' ? 'Denied' : 'Checking'}
          </span>
        </div>

        {/* Face Detection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: getFaceColor(),
            flexShrink: 0,
          }} />
          <span style={{ color: '#718096' }}>Faces:</span>
          <span style={{ color: getFaceColor(), fontWeight: 600, marginLeft: 'auto' }}>
            {getFaceText()}
          </span>
        </div>

        {/* AI Model Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: modelsLoaded ? '#22c55e' : '#f59e0b',
            flexShrink: 0,
          }} />
          <span style={{ color: '#718096' }}>AI Detection:</span>
          <span style={{ color: modelsLoaded ? '#22c55e' : '#f59e0b', fontWeight: 600, marginLeft: 'auto' }}>
            {modelsLoaded ? 'Running' : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Last Violation */}
      {lastViolation && (
        <div style={{
          marginTop: 8,
          padding: '6px 8px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 6,
          fontSize: 10,
          color: '#ef4444',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Last Alert:</div>
          <div style={{ color: '#f87171', lineHeight: 1.3 }}>{lastViolation.message}</div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalProctoring;
