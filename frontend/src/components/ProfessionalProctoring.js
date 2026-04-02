// Professional Proctoring Component - Enhanced Camera Detection
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const ProfessionalProctoring = ({ sessionId, examId, onViolation, studentId, currentQuestion, totalQuestions }) => {
  const [cameraStatus, setCameraStatus] = useState('checking');
  const [faceCount, setFaceCount] = useState(0);
  const [lastViolation, setLastViolation] = useState(null);
  const [cameraRetryCount, setCameraRetryCount] = useState(0);
  const [framesDetected, setFramesDetected] = useState(0);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  const cameraCheckInterval = useRef(null);
  const frameCheckInterval = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const cameraFrameInterval = useRef(null);

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

  // Report violation with debounce
  const debouncedReportViolation = useCallback(
    debounce(async (type, description) => {
      try {
        const response = await fetch('/api/student/violations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, examId, type, description })
        });
        const result = await response.json();
        
        if (result.success) {
          onViolation(result.data);
          setLastViolation(result.data);
          
          if (result.data.autoTerminate) {
            toast.error('Exam terminated due to violations!');
          } else {
            toast.error(result.data.message, { duration: 4000 });
          }
        }
      } catch (error) {
        console.error('Violation reporting failed:', error);
      }
    }, 2000),
    [sessionId, examId, onViolation]
  );

  // Enhanced camera initialization with retry logic and permissions handling
  const initializeCamera = async (retryCount = 0) => {
    try {
      setCameraStatus('checking');
      
      const constraints = { 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } 
      };

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported by this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraStatus('active');
        setCameraRetryCount(0);
        setFramesDetected(0);

        // Start frame detection
        startFrameDetection();
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      
      // Handle different types of camera errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.log('Camera permission denied by user');
        setCameraStatus('permission_denied');
        toast.error('Camera access is required for proctoring. Please allow camera access and refresh the page.');
        
        // Don't retry if permission is denied
        return;
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        console.log('No camera found');
        setCameraStatus('no_camera');
        toast.error('No camera detected. Please connect a camera and refresh the page.');
        
        // Don't retry if no camera is found
        return;
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        console.log('Camera is already in use by another application');
        setCameraStatus('in_use');
        toast.error('Camera is already in use. Please close other applications using the camera and refresh the page.');
        
        // Don't retry if camera is in use
        return;
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        console.log('Camera constraints cannot be satisfied');
        setCameraStatus('constraints_error');
        
        // Try with lower constraints
        if (retryCount === 0) {
          console.log('Retrying with lower constraints...');
          setTimeout(() => initializeCamera(1), 2000);
          return;
        }
      } else if (error.name === 'TypeError' || error.message.includes('Camera API not supported')) {
        console.log('Camera API not supported');
        setCameraStatus('not_supported');
        toast.error('Camera is not supported by this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
        
        // Don't retry if API is not supported
        return;
      }
      
      if (retryCount < 3) {
        console.log(`Retrying camera initialization (${retryCount + 1}/3)...`);
        setCameraRetryCount(retryCount + 1);
        
        // Wait before retry
        setTimeout(() => {
          initializeCamera(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        console.log('Max camera retry attempts reached');
        setCameraStatus('failed');
        toast.error('Failed to initialize camera after multiple attempts. Please check your camera settings and refresh the page.');
      }
    }
  };

  // Enhanced camera status monitoring
  const checkCameraStatus = useCallback(() => {
    if (!streamRef.current || !videoRef.current) {
      setCameraStatus('off');
      return;
    }

    const video = videoRef.current;
    const stream = streamRef.current;

    // Check if video is playing and has frames
    if (video.paused || video.ended || video.readyState === 0) {
      setCameraStatus('off');
      debouncedReportViolation('camera_off', 'Camera video not playing');
      return;
    }

    // Check if stream is active
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0 || tracks[0].readyState === 'ended') {
      setCameraStatus('off');
      debouncedReportViolation('camera_off', 'Camera stream ended');
      return;
    }

    // Check track enabled state
    if (!tracks[0].enabled) {
      setCameraStatus('off');
      debouncedReportViolation('camera_off', 'Camera track disabled');
      return;
    }

    // Check if we're receiving frames
    if (framesDetected === 0 && video.readyState >= 2) {
      // Video is ready but no frames detected yet
      setCameraStatus('warning');
    } else if (framesDetected > 0) {
      setCameraStatus('active');
    }
  }, [framesDetected, debouncedReportViolation]);

  // Frame detection to verify camera is active
  const startFrameDetection = () => {
    let frameCount = 0;
    
    const detectFrame = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 160; // Small size for performance
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          
          // Try to draw a frame
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // Get image data to verify frame was captured
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Check if frame has content (not all black)
          let hasContent = false;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
              hasContent = true;
              break;
            }
          }
          
          if (hasContent) {
            frameCount++;
            setFramesDetected(frameCount);
          }
        } catch (error) {
          console.error('Frame detection error:', error);
        }
      }
    };

    frameCheckInterval.current = setInterval(detectFrame, 1000);
  };

  // Enhanced face detection (still simplified but more robust)
  const detectFaces = useCallback(() => {
    if (!videoRef.current || cameraStatus !== 'active') return;

    const video = videoRef.current;
    
    // Only detect faces if we have frames
    if (framesDetected < 10) return; // Wait for stable frames

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Simulate face detection (replace with actual face detection library)
      // For demo, we'll use a more realistic simulation
      const random = Math.random();
      let detectedFaces = 1;
      
      if (random > 0.95) {
        detectedFaces = 2; // Occasionally detect multiple faces
      } else if (random < 0.05) {
        detectedFaces = 0; // Occasionally detect no faces
      }
      
      if (detectedFaces !== faceCount) {
        setFaceCount(detectedFaces);
        
        if (detectedFaces > 1) {
          debouncedReportViolation('multiple_faces', `Multiple faces detected: ${detectedFaces}`);
        } else if (detectedFaces === 0) {
          debouncedReportViolation('no_face_detected', 'No face detected in camera');
        }
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [cameraStatus, faceCount, framesDetected, debouncedReportViolation]);

  // Camera reconnection logic
  const attemptReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting camera reconnection...');
      initializeCamera();
    }, 3000);
  }, []);

  // Tab switch detection (enhanced)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        debouncedReportViolation('tab_switch', 'Student switched tabs during exam');
        // Check camera when returning to tab
        setTimeout(() => checkCameraStatus(), 1000);
      }
    };

    const handleBlur = () => {
      debouncedReportViolation('window_blur', 'Exam window lost focus');
    };

    const handleFocus = () => {
      // Check camera status when window regains focus
      setTimeout(() => checkCameraStatus(), 500);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [debouncedReportViolation, checkCameraStatus]);

  // Prevent copy/paste and right-click (enhanced)
  useEffect(() => {
    const preventCopy = (e) => {
      e.preventDefault();
      debouncedReportViolation('copy_paste', 'Copy attempt detected');
    };

    const preventPaste = (e) => {
      e.preventDefault();
      debouncedReportViolation('copy_paste', 'Paste attempt detected');
    };

    const preventCut = (e) => {
      e.preventDefault();
      debouncedReportViolation('copy_paste', 'Cut attempt detected');
    };

    const preventContextMenu = (e) => e.preventDefault();

    const preventKeyboardShortcuts = (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && ['u','s','i','c','v','x','a','p','r'].includes(e.key.toLowerCase())) ||
          (e.altKey && ['tab','f4'].includes(e.key.toLowerCase())) ||
          (e.metaKey && ['c','v','x','a','s','r'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        debouncedReportViolation('keyboard_shortcut', `Blocked key: ${e.key}`);
      }
    };

    // Prevent DevTools opening
    const preventDevTools = (e) => {
      if (e.keyCode === 123) { // F12
        e.preventDefault();
        debouncedReportViolation('dev_tools', 'DevTools access blocked');
      }
    };

    // Add event listeners
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCut);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('keydown', preventDevTools);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('cut', preventCut);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('keydown', preventDevTools);
    };
  }, [debouncedReportViolation]);

  // Initialize camera and monitoring
  useEffect(() => {
    initializeCamera();

    // Start face detection interval
    faceDetectionInterval.current = setInterval(detectFaces, 3000);

    // Start camera status checking
    cameraCheckInterval.current = setInterval(checkCameraStatus, 2000);

    return () => {
      // Cleanup
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
      if (cameraCheckInterval.current) {
        clearInterval(cameraCheckInterval.current);
      }
      if (frameCheckInterval.current) {
        clearInterval(frameCheckInterval.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [detectFaces, checkCameraStatus]);

  // Initialize WebSocket for real-time monitoring
  useEffect(() => {
    if (!sessionId || !examId || !studentId) return;

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('accessToken'),
        role: 'student'
      }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to monitoring server');
      
      // Join exam room
      newSocket.emit('join-exam', {
        examId,
        studentId,
        sessionId
      });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from monitoring server');
    });

    // Handle warnings from admin
    newSocket.on('warning-received', (data) => {
      toast.error(`⚠️ Warning: ${data.message}`, {
        duration: 5000
      });
    });

    // Handle exam termination
    newSocket.on('exam-terminated', (data) => {
      toast.error(`🚫 Exam terminated: ${data.reason}`, {
        duration: 10000
      });
      // Redirect to results page
      setTimeout(() => {
        window.location.href = '/student/results';
      }, 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, examId, studentId]);

  // Emit real-time activity updates
  useEffect(() => {
    if (!socket || !connected) return;

    const activityData = {
      examId,
      studentId,
      activity: {
        status: 'active',
        currentQuestion: currentQuestion || 0,
        totalQuestions: totalQuestions || 0,
        cameraActive: cameraStatus === 'active',
        faceCount: faceCount,
        lastSeen: new Date().toISOString()
      }
    };

    socket.emit('student-activity', activityData);
  }, [socket, connected, currentQuestion, totalQuestions, cameraStatus, faceCount]);

  // Emit camera feed periodically
  useEffect(() => {
    if (!socket || !connected || cameraStatus !== 'active') return;

    const captureFrame = () => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        socket.emit('camera-feed', {
          examId,
          studentId,
          imageData: imageData.split(',')[1] // Remove data URL prefix
        });
      }
    };

    // Capture frame every 5 seconds
    cameraFrameInterval.current = setInterval(captureFrame, 5000);

    return () => {
      if (cameraFrameInterval.current) {
        clearInterval(cameraFrameInterval.current);
      }
    };
  }, [socket, connected, cameraStatus, examId, studentId]);

  const getStatusColor = () => {
    switch (cameraStatus) {
      case 'active': return '#22c55e';
      case 'checking': return '#f59e0b';
      case 'warning': return '#f59e0b';
      case 'off': case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getFaceCountColor = () => {
    if (faceCount === 0) return '#ef4444';
    if (faceCount === 1) return '#22c55e';
    return '#f59e0b';
  };

  const getStatusText = () => {
    switch (cameraStatus) {
      case 'active': return '🟢 Active';
      case 'checking': return '🟡 Checking...';
      case 'warning': return '🟡 Warning';
      case 'off': return '🔴 Off';
      case 'error': return '🔴 Error';
      default: return '⚪ Unknown';
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      background: 'rgba(0,0,0,0.95)', 
      color: 'white', 
      padding: '15px',
      borderRadius: '10px',
      fontSize: '12px',
      zIndex: 99999, // Higher z-index for full screen
      minWidth: '220px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', textAlign: 'center', fontSize: '13px' }}>
        🎥 Proctoring Active
      </div>
      
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: getStatusColor(),
          animation: cameraStatus === 'active' ? 'pulse 2s infinite' : 'none'
        }} />
        <span>Camera: {getStatusText()}</span>
      </div>
      
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: getFaceCountColor() 
        }} />
        <span>Faces: {faceCount}</span>
      </div>

      {cameraRetryCount > 0 && (
        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#f59e0b' }}>
          Retry: {cameraRetryCount}/3
        </div>
      )}

      {framesDetected > 0 && (
        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#22c55e' }}>
          Frames: {framesDetected}
        </div>
      )}
      
      {lastViolation && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          background: 'rgba(239,68,68,0.2)', 
          borderRadius: '5px',
          fontSize: '11px',
          border: '1px solid rgba(239,68,68,0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Last Violation:</div>
          <div>{lastViolation.message}</div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        muted
        style={{ 
          display: 'none' 
        }} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .camera-feed {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .camera-feed video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .camera-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%);
          pointer-events: none;
        }
        .camera-status {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .camera-status.recording {
          background: rgba(233,69,96,0.9);
        }
        .camera-status.connected {
          background: rgba(34,197,94,0.9);
        }
      `}} />
    </div>
  );
};

export default ProfessionalProctoring;
