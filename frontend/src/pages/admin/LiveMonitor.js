// src/pages/admin/LiveMonitor.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LiveMonitoring from '../../components/LiveMonitoring';

const ViolationBadge = ({ type }) => {
  const map = {
    tab_switch: { label: 'Tab Switch', color: '#f59e0b' },
    face_not_detected: { label: 'No Face', color: '#ef4444' },
    multiple_faces: { label: 'Multi Face', color: '#ef4444' },
    audio_detected: { label: 'Audio', color: '#f59e0b' },
    window_blur: { label: 'Window Blur', color: '#f59e0b' },
    copy_paste: { label: 'Copy/Paste', color: '#8b5cf6' },
  };
  const m = map[type] || { label: type, color: '#718096' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${m.color}22`, color: m.color, letterSpacing: 0.5 }}>
      {m.label}
    </span>
  );
};

const StatusDot = ({ status }) => {
  const colors = { active: '#22c55e', submitted: '#3b82f6', terminated: '#ef4444', disconnected: '#6b7280' };
  const color = colors[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: status === 'active' ? `0 0 6px ${color}` : 'none', animation: status === 'active' ? 'pulse 1.5s infinite' : 'none' }} />
  );
};

export default function LiveMonitor() {
  const { id: examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState([]);
  const [sessionStatuses, setSessionStatuses] = useState({});
  const socketRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    fetchData();
    setupSocket();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
    };
  }, [examId]);

  const fetchData = async () => {
    try {
      const res = await adminAPI.getMonitoringData(examId);
      setData(res.data);
      setViolations(res.data.recentViolations || []);
    } catch {
      // Silently fail refresh
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const token = localStorage.getItem('accessToken');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.emit('monitor-exam', { examId, collegeId: null });

    socket.on('violation-alert', (v) => {
      setViolations(prev => [{ ...v, occurred_at: v.timestamp }, ...prev.slice(0, 49)]);
      toast.error(`⚠ Violation: ${v.type} — ${v.studentId?.slice(0, 8)}`, { duration: 5000 });
      if (alertRef.current) alertRef.current.play?.().catch(() => {});
    });

    socket.on('student-joined', (data) => {
      setSessionStatuses(prev => ({ ...prev, [data.sessionId]: 'active' }));
    });

    socket.on('student-submitted', (data) => {
      setSessionStatuses(prev => ({ ...prev, [data.sessionId]: 'submitted' }));
    });

    socket.on('student-disconnected', (data) => {
      setSessionStatuses(prev => ({ ...prev, [data.sessionId]: 'disconnected' }));
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#4a5568' }}>Connecting to live monitor...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 60, color: '#4a5568' }}>Exam not found</div>;

  const { exam, sessions, stats } = data;

  return (
    <div>
      {/* Hidden audio for alerts */}
      <audio ref={alertRef} style={{ display: 'none' }}>
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA..." />
      </audio>

      {/* Use the new LiveMonitoring component */}
      <LiveMonitoring examId={examId} examName={exam?.name || 'Live Exam'} />
    </div>
  );
}
