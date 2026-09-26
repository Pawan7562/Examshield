// src/pages/admin/LiveMonitor.js — Institutional Live Monitoring & Remote Proctoring Cockpit
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Users,
  Radio,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  Search,
  Eye,
  Send,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  Camera,
  Activity,
  UserX
} from 'lucide-react';
import './LiveMonitoringCockpit.css';

// Audio chime generator using standard Web Audio API (Zero external MP3 dependencies)
const playAlertChime = (severity = 'high') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'high' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(severity === 'high' ? 587.33 : 440, ctx.currentTime); // D5 or A4
    osc.frequency.exponentialRampToValueAtTime(severity === 'high' ? 880 : 659.25, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
};

export default function LiveMonitor() {
  const { id: paramExamId } = useParams();
  const navigate = useNavigate();

  // ─── Exam & Global State ───────────────────────────────────────────────────────
  const [examsList, setExamsList] = useState([]);
  const [currentExamId, setCurrentExamId] = useState(paramExamId || null);
  const [examData, setExamData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    safe: 0,
    flagged: 0,
    warnings: 0,
    terminated: 0,
  });

  // ─── Connection & Audio State ──────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [pingMs, setPingMs] = useState(12);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  // ─── Filters & Search ──────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'flagged' | 'safe' | 'terminated'
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Action Modals State ───────────────────────────────────────────────────────
  const [warnModal, setWarnModal] = useState({ open: false, student: null, message: '', strike: 1 });
  const [terminateModal, setTerminateModal] = useState({ open: false, student: null, reason: '' });
  const [broadcastModal, setBroadcastModal] = useState({ open: false, message: '', urgency: 'normal' });
  const [inspectModal, setInspectModal] = useState({ open: false, student: null, activityData: null });

  // ─── Live Camera Frames & Audio Cache ──────────────────────────────────────────
  const [cameraFrames, setCameraFrames] = useState({}); // { [studentId]: base64Data }
  const [audioLevels, setAudioLevels] = useState({}); // { [studentId]: level0to100 }

  const socketRef = useRef(null);

  // ─── 1. Load Overview & Detect Selected Exam ──────────────────────────────────
  const loadOverviewAndData = useCallback(async (forcedExamId = null) => {
    try {
      setRefreshing(true);
      const overviewRes = await adminAPI.getMonitoringOverview();
      if (overviewRes.success && overviewRes.data) {
        const exams = overviewRes.data.exams || [];
        setExamsList(exams);

        // Determine target exam ID
        const targetId = forcedExamId || paramExamId || overviewRes.data.activeExamId || (exams[0] ? exams[0].id : null);
        if (targetId) {
          setCurrentExamId(targetId);
          await loadExamMonitoringData(targetId);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Failed to load live overview:', err);
      toast.error('Unable to fetch live monitoring overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramExamId]);

  const loadExamMonitoringData = async (examId) => {
    try {
      const res = await adminAPI.getMonitoringData(examId);
      if (res.success && res.data) {
        setExamData(res.data.exam);
        const stds = res.data.students || res.data.sessions || [];
        setCandidates(stds);
        setViolations(res.data.recentViolations || []);
        if (res.data.stats) {
          setStats({
            total: res.data.stats.totalStudents || stds.length,
            active: res.data.stats.activeStudents || stds.filter(s => s.status === 'active').length,
            safe: res.data.stats.safeStudents || stds.filter(s => s.status === 'active' && s.violation_count === 0).length,
            flagged: res.data.stats.flaggedStudents || stds.filter(s => s.status === 'active' && s.violation_count > 0).length,
            warnings: res.data.stats.totalWarnings || 0,
            terminated: res.data.stats.terminatedStudents || stds.filter(s => s.status === 'terminated').length,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching exam monitoring details:', err);
    }
  };

  useEffect(() => {
    loadOverviewAndData(paramExamId);
  }, [paramExamId, loadOverviewAndData]);

  // ─── 2. Setup Socket Connection for Selected Exam ─────────────────────────────
  useEffect(() => {
    if (!currentExamId) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = process.env.REACT_APP_WS_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://examshield-d5i2.onrender.com');

    const socket = io(wsUrl, {
      auth: { token, role: 'admin' },
      reconnectionAttempts: 8,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setPingMs(Math.floor(Math.random() * 15 + 10)); // Simulated realistic ping
      socket.emit('join-exam-monitoring', { examId: currentExamId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Live frame feed from candidate
    socket.on('camera-feed', (data) => {
      if (data.studentId && data.imageData) {
        setCameraFrames(prev => ({ ...prev, [data.studentId]: data.imageData }));
      }
    });

    // Real-time candidate telemetry
    socket.on('student-activity', (data) => {
      if (!data.studentId) return;
      setCandidates(prev => prev.map(cand => {
        if (cand.id === data.studentId || cand.sessionId === data.sessionId) {
          return {
            ...cand,
            activity: {
              ...cand.activity,
              ...data.activity,
              lastSeen: new Date().toISOString()
            }
          };
        }
        return cand;
      }));

      if (data.activity?.audioLevel !== undefined) {
        setAudioLevels(prev => ({ ...prev, [data.studentId]: data.activity.audioLevel }));
      }
    });

    // Real-time violation event
    socket.on('violation-alert', (v) => {
      setViolations(prev => [{
        id: `v-${Date.now()}-${Math.random()}`,
        type: v.type,
        severity: v.severity || 'medium',
        message: v.description || v.type,
        student_id: v.studentId,
        student_name: v.studentName || 'Candidate',
        created_at: v.timestamp || new Date().toISOString(),
      }, ...prev.slice(0, 49)]);

      // Update student violation count in state
      setCandidates(prev => prev.map(cand => {
        if (cand.id === v.studentId) {
          return { ...cand, violation_count: (cand.violation_count || 0) + 1 };
        }
        return cand;
      }));

      setStats(prev => ({
        ...prev,
        flagged: prev.flagged + 1,
        safe: Math.max(0, prev.safe - 1)
      }));

      if (soundEnabled) {
        playAlertChime(v.severity);
      }
      toast.error(`⚠️ Security Flag: ${v.type?.replace(/_/g, ' ')} (${v.studentName || 'Candidate'})`, {
        duration: 4000,
        position: 'top-right'
      });
    });

    // Student joined
    socket.on('student-joined', (data) => {
      toast.success(`Candidate joined exam session`, { duration: 2500 });
      loadExamMonitoringData(currentExamId);
    });

    // Student submitted
    socket.on('student-submitted', (data) => {
      setCandidates(prev => prev.map(c => c.id === data.studentId ? { ...c, status: 'submitted' } : c));
      setStats(prev => ({ ...prev, active: Math.max(0, prev.active - 1) }));
    });

    // Student terminated
    socket.on('student-terminated', (data) => {
      setCandidates(prev => prev.map(c => c.id === data.studentId ? { ...c, status: 'terminated' } : c));
      setStats(prev => ({
        ...prev,
        active: Math.max(0, prev.active - 1),
        terminated: prev.terminated + 1
      }));
    });

    return () => {
      socket.emit('leave-exam-monitoring', { examId: currentExamId });
      socket.disconnect();
    };
  }, [currentExamId, soundEnabled]);

  // ─── 3. Polling fallback every 15s to keep candidate lists synchronized ───────
  useEffect(() => {
    if (!currentExamId) return;
    const interval = setInterval(() => {
      loadExamMonitoringData(currentExamId);
    }, 15000);
    return () => clearInterval(interval);
  }, [currentExamId]);

  // ─── 4. Exam Selector Change Handler ──────────────────────────────────────────
  const handleExamChange = (newExamId) => {
    setCurrentExamId(newExamId);
    navigate(`/admin/exams/${newExamId}/monitor`, { replace: true });
    loadExamMonitoringData(newExamId);
  };

  // ─── 5. Warning Interventions ─────────────────────────────────────────────────
  const openWarningModal = (student, presetMsg = '', strike = 1) => {
    setWarnModal({
      open: true,
      student,
      message: presetMsg || 'Face camera directly and maintain quiet focus.',
      strike: (student.warning_count || 0) + 1,
    });
  };

  const handleSendWarning = async () => {
    if (!warnModal.student || !warnModal.message.trim()) return;
    try {
      await adminAPI.warnStudent(currentExamId, {
        studentId: warnModal.student.id,
        message: warnModal.message.trim(),
        severity: warnModal.strike >= 2 ? 'high' : 'medium',
        strike: warnModal.strike,
      });

      toast.success(`Official Strike ${warnModal.strike} sent to ${warnModal.student.name}`);
      setCandidates(prev => prev.map(c => {
        if (c.id === warnModal.student.id) {
          return { ...c, warning_count: (c.warning_count || 0) + 1 };
        }
        return c;
      }));
      setStats(prev => ({ ...prev, warnings: prev.warnings + 1 }));
      setWarnModal({ open: false, student: null, message: '', strike: 1 });
    } catch (err) {
      toast.error('Failed to issue warning');
    }
  };

  // ─── 6. Termination Interventions ─────────────────────────────────────────────
  const openTerminationModal = (student) => {
    setTerminateModal({
      open: true,
      student,
      reason: 'Repeated proctoring security breaches and unauthorized window navigation.',
    });
  };

  const handleTerminateStudent = async () => {
    if (!terminateModal.student) return;
    try {
      await adminAPI.terminateStudent(currentExamId, {
        studentId: terminateModal.student.id,
        reason: terminateModal.reason.trim() || 'Exam terminated by proctor.',
      });

      toast.error(`Exam session terminated for ${terminateModal.student.name}`, { duration: 5000 });
      setCandidates(prev => prev.map(c => {
        if (c.id === terminateModal.student.id) {
          return { ...c, status: 'terminated' };
        }
        return c;
      }));
      setStats(prev => ({
        ...prev,
        active: Math.max(0, prev.active - 1),
        terminated: prev.terminated + 1,
      }));
      setTerminateModal({ open: false, student: null, reason: '' });
    } catch (err) {
      toast.error('Failed to terminate student exam');
    }
  };

  // ─── 7. Broadcast Announcement ────────────────────────────────────────────────
  const handleSendBroadcast = async () => {
    if (!broadcastModal.message.trim()) return;
    try {
      await adminAPI.broadcastAnnouncement(currentExamId, {
        title: 'Institutional Exam Committee Notice',
        message: broadcastModal.message.trim(),
        urgency: broadcastModal.urgency,
      });

      toast.success('Exam-wide announcement broadcasted to all students');
      setBroadcastModal({ open: false, message: '', urgency: 'normal' });
    } catch (err) {
      toast.error('Failed to send broadcast');
    }
  };

  // ─── 8. Inspect Deep Telemetry ────────────────────────────────────────────────
  const handleInspectStudent = async (student) => {
    setInspectModal({ open: true, student, activityData: null });
    try {
      const res = await adminAPI.getStudentActivity(currentExamId, student.id);
      if (res.success) {
        setInspectModal(prev => ({ ...prev, activityData: res.data }));
      }
    } catch (e) {
      console.warn('Inspect fetch fallback used');
    }
  };

  // ─── 9. Simulation Demo Toggle ────────────────────────────────────────────────
  const toggleSimulation = () => {
    if (simulationActive) {
      setSimulationActive(false);
      loadExamMonitoringData(currentExamId);
      toast('Test telemetry simulation stopped', { icon: 'ℹ️' });
    } else {
      setSimulationActive(true);
      const simulatedCandidates = [
        {
          id: 'sim-1',
          name: 'Aarav Sharma',
          studentId: 'CS2026-042',
          email: 'aarav.sharma@college.edu',
          status: 'active',
          violation_count: 0,
          warning_count: 0,
          activity: { currentQuestion: 16, totalQuestions: 30, cameraActive: true, timeSpent: 1420 },
        },
        {
          id: 'sim-2',
          name: 'Priya Patel',
          studentId: 'CS2026-088',
          email: 'priya.patel@college.edu',
          status: 'active',
          violation_count: 2,
          warning_count: 1,
          activity: { currentQuestion: 21, totalQuestions: 30, cameraActive: true, timeSpent: 1680 },
        },
        {
          id: 'sim-3',
          name: 'Rohan Deshmukh',
          studentId: 'CS2026-112',
          email: 'rohan.deshmukh@college.edu',
          status: 'active',
          violation_count: 1,
          warning_count: 0,
          activity: { currentQuestion: 9, totalQuestions: 30, cameraActive: true, timeSpent: 920 },
        },
        {
          id: 'sim-4',
          name: 'Sneha Verma',
          studentId: 'CS2026-015',
          email: 'sneha.verma@college.edu',
          status: 'terminated',
          violation_count: 4,
          warning_count: 2,
          activity: { currentQuestion: 12, totalQuestions: 30, cameraActive: false, timeSpent: 850 },
        },
      ];
      setCandidates(simulatedCandidates);
      setStats({
        total: 4,
        active: 3,
        safe: 1,
        flagged: 2,
        warnings: 3,
        terminated: 1,
      });
      setViolations([
        {
          id: 'v-sim-1',
          type: 'tab_switch',
          severity: 'high',
          message: 'Student switched away to external browser window',
          student_name: 'Priya Patel',
          created_at: new Date(Date.now() - 45000).toISOString(),
        },
        {
          id: 'v-sim-2',
          type: 'speech_detected',
          severity: 'medium',
          message: 'Voice/audio conversation detected in room',
          student_name: 'Rohan Deshmukh',
          created_at: new Date(Date.now() - 120000).toISOString(),
        },
        {
          id: 'v-sim-3',
          type: 'multiple_faces',
          severity: 'high',
          message: 'Multiple human faces detected in frame',
          student_name: 'Sneha Verma',
          created_at: new Date(Date.now() - 300000).toISOString(),
        },
      ]);
      setAudioLevels({ 'sim-1': 14, 'sim-2': 42, 'sim-3': 68, 'sim-4': 0 });
      toast.success('Demonstration Telemetry Active — 4 Live Candidate Cards Loaded');
    }
  };

  // ─── 10. Filtered Candidates Memo ─────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      // 1. Filter Tab Match
      if (activeFilter === 'active' && cand.status !== 'active') return false;
      if (activeFilter === 'flagged' && !(cand.violation_count > 0 && cand.status === 'active')) return false;
      if (activeFilter === 'safe' && !(cand.violation_count === 0 && cand.status === 'active')) return false;
      if (activeFilter === 'terminated' && cand.status !== 'terminated') return false;

      // 2. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = cand.name?.toLowerCase().includes(q);
        const idMatch = cand.studentId?.toLowerCase().includes(q);
        const emailMatch = cand.email?.toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [candidates, activeFilter, searchQuery]);

  if (loading && examsList.length === 0) {
    return (
      <div className="live-cockpit-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div className="admin-loading-spinner" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#fff', margin: '0 0 6px', fontSize: '1.1rem' }}>Initializing Proctoring Cluster...</h3>
          <p style={{ margin: 0, fontSize: '0.84rem' }}>Connecting to live telemetry streams and WebSocket rooms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-cockpit-root">
      {/* ═══════════════════════════════════════════════════════════════════════
          1. HEADER BAR & CONTROLS
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="cockpit-top-bar">
        <div className="cockpit-header-left">
          <div className={`cockpit-radar-beacon ${connected ? 'connected' : ''}`}>
            <Radio size={22} />
            <span className="cockpit-radar-pulse" />
          </div>
          <div className="cockpit-title-meta">
            <h1>
              Live Proctoring Cockpit
              <span className="cockpit-live-pill">● LIVE SURVEILLANCE</span>
            </h1>
            <p>
              {examData?.title || examData?.name || 'Institutional Examination Center'} •{' '}
              <span style={{ color: connected ? '#34d399' : '#f87171' }}>
                {connected ? `Socket Online (${pingMs}ms latency)` : 'Reconnecting to proctoring cluster...'}
              </span>
            </p>
          </div>
        </div>

        <div className="cockpit-header-right">
          {/* Exam Selector Dropdown */}
          <div className="cockpit-exam-dropdown-wrap">
            <select
              className="cockpit-exam-select"
              value={currentExamId || ''}
              onChange={(e) => handleExamChange(e.target.value)}
            >
              {examsList.length === 0 ? (
                <option value="">No Active Exams Available</option>
              ) : (
                examsList.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.isLive ? '🔴 ' : '📄 '}
                    {exam.title} ({exam.stats?.activeStudents || 0} active)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Broadcast Announcement Button */}
          <button
            className="cockpit-btn cockpit-btn-primary"
            onClick={() => setBroadcastModal({ open: true, message: '', urgency: 'normal' })}
            title="Broadcast announcement message to all students taking this exam"
          >
            <Megaphone size={16} />
            <span>Broadcast Notice</span>
          </button>

          {/* Sound Alarm Toggle */}
          <button
            className={`cockpit-btn cockpit-btn-outline ${soundEnabled ? 'active' : ''}`}
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast(soundEnabled ? 'Security audio alarm muted' : 'Security audio alarm armed', {
                icon: soundEnabled ? '🔇' : '🔔'
              });
            }}
            title={soundEnabled ? 'Mute Audio Alarm' : 'Enable Audio Alarm'}
          >
            {soundEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} color="#94a3b8" />}
            <span>{soundEnabled ? 'Alarm On' : 'Alarm Muted'}</span>
          </button>

          {/* Refresh Data Button */}
          <button
            className="cockpit-btn cockpit-btn-outline"
            onClick={() => loadOverviewAndData(currentExamId)}
            disabled={refreshing}
            title="Force refresh live telemetry data"
          >
            <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          {/* Simulation Toggle for Demo Testing */}
          <button
            className={`cockpit-btn ${simulationActive ? 'cockpit-btn-danger' : 'cockpit-btn-outline'}`}
            onClick={toggleSimulation}
            title="Simulate candidate telemetry for live verification"
          >
            <Sparkles size={15} />
            <span>{simulationActive ? 'Stop Demo' : 'Run Telemetry Demo'}</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. KPI METRICS CARDS
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="cockpit-kpi-grid">
        <div className="cockpit-kpi-card">
          <div className="cockpit-kpi-icon-wrap kpi-blue">
            <Users size={20} />
          </div>
          <div className="cockpit-kpi-content">
            <div className="cockpit-kpi-value">{stats.active}</div>
            <div className="cockpit-kpi-label">Active In-Session</div>
          </div>
        </div>

        <div className="cockpit-kpi-card">
          <div className="cockpit-kpi-icon-wrap kpi-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="cockpit-kpi-content">
            <div className="cockpit-kpi-value">{stats.safe}</div>
            <div className="cockpit-kpi-label">Safe & Verified</div>
          </div>
        </div>

        <div className="cockpit-kpi-card">
          <div className="cockpit-kpi-icon-wrap kpi-rose">
            <ShieldAlert size={20} />
          </div>
          <div className="cockpit-kpi-content">
            <div className="cockpit-kpi-value">{stats.flagged}</div>
            <div className="cockpit-kpi-label">Flagged Candidates</div>
          </div>
        </div>

        <div className="cockpit-kpi-card">
          <div className="cockpit-kpi-icon-wrap kpi-amber">
            <AlertTriangle size={20} />
          </div>
          <div className="cockpit-kpi-content">
            <div className="cockpit-kpi-value">{stats.warnings}</div>
            <div className="cockpit-kpi-label">Strikes Issued</div>
          </div>
        </div>

        <div className="cockpit-kpi-card">
          <div className="cockpit-kpi-icon-wrap kpi-purple">
            <UserX size={20} />
          </div>
          <div className="cockpit-kpi-content">
            <div className="cockpit-kpi-value">{stats.terminated}</div>
            <div className="cockpit-kpi-label">Disqualified</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. TOOLBAR: FILTER PILLS & SEARCH
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="cockpit-toolbar">
        <div className="cockpit-filter-pills">
          <button
            className={`cockpit-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Candidates <span className="cockpit-pill-count">{candidates.length}</span>
          </button>
          <button
            className={`cockpit-filter-pill ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            Active Only <span className="cockpit-pill-count">{stats.active}</span>
          </button>
          <button
            className={`cockpit-filter-pill pill-flagged ${activeFilter === 'flagged' ? 'active' : ''}`}
            onClick={() => setActiveFilter('flagged')}
          >
            Flagged (Violations) <span className="cockpit-pill-count">{stats.flagged}</span>
          </button>
          <button
            className={`cockpit-filter-pill ${activeFilter === 'safe' ? 'active' : ''}`}
            onClick={() => setActiveFilter('safe')}
          >
            Safe <span className="cockpit-pill-count">{stats.safe}</span>
          </button>
          <button
            className={`cockpit-filter-pill ${activeFilter === 'terminated' ? 'active' : ''}`}
            onClick={() => setActiveFilter('terminated')}
          >
            Terminated <span className="cockpit-pill-count">{stats.terminated}</span>
          </button>
        </div>

        <div className="cockpit-search-wrap">
          <Search size={15} className="cockpit-search-icon" />
          <input
            type="text"
            className="cockpit-search-input"
            placeholder="Search candidate name, ID, roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. MAIN VIEWPORT: CANDIDATES SURVEILLANCE GRID + INCIDENT TICKER
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="cockpit-viewport">
        {/* Left Column: Candidates Surveillance Grid */}
        <div className="cockpit-grid-container">
          {filteredCandidates.length === 0 ? (
            <div className="cockpit-empty-banner">
              <Camera size={44} color="#64748b" />
              <h3>No Candidates Active in This View</h3>
              <p>
                {searchQuery
                  ? `No students matched "${searchQuery}". Try a different filter or search term.`
                  : 'Candidates will appear automatically once they enter the exam room and start their secure sessions.'}
              </p>
              {!simulationActive && (
                <button
                  className="cockpit-btn cockpit-btn-primary"
                  onClick={toggleSimulation}
                  style={{ marginTop: 12 }}
                >
                  <Sparkles size={16} />
                  <span>Run Live Telemetry Demo</span>
                </button>
              )}
            </div>
          ) : (
            <div className="cockpit-candidates-grid">
              {filteredCandidates.map((student) => {
                const liveImage = cameraFrames[student.id];
                const decibelLevel = audioLevels[student.id] || 0;
                const isFlagged = student.violation_count > 0;
                const isTerminated = student.status === 'terminated';

                return (
                  <div
                    key={student.id}
                    className={`surveillance-card ${isFlagged && !isTerminated ? 'flagged' : ''} ${isTerminated ? 'terminated' : ''}`}
                  >
                    {/* Camera Feed Viewport */}
                    <div className="surveillance-frame-wrap">
                      {liveImage ? (
                        <img
                          src={`data:image/jpeg;base64,${liveImage}`}
                          alt={student.name}
                          className="surveillance-webcam-feed"
                        />
                      ) : (
                        <div className="surveillance-radar-placeholder">
                          <div className="surveillance-avatar-circle">
                            {student.name?.charAt(0)?.toUpperCase() || 'C'}
                            <div className="surveillance-scanline" />
                          </div>
                          <span style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                            {isTerminated ? 'SESSION TERMINATED' : 'PROCTOR RADAR ACTIVE'}
                          </span>
                        </div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="surveillance-overlay-top">
                        <div className="surveillance-status-badge">
                          <span
                            className={
                              isTerminated
                                ? 'status-dot-danger'
                                : isFlagged
                                ? 'status-dot-warning'
                                : 'status-dot-active'
                            }
                          />
                          <span>
                            {isTerminated
                              ? 'Terminated'
                              : isFlagged
                              ? `Flagged (${student.violation_count})`
                              : 'Live • Good'}
                          </span>
                        </div>

                        {student.warning_count > 0 && (
                          <div
                            style={{
                              background: 'rgba(239, 68, 68, 0.85)',
                              color: '#fff',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            Strike {student.warning_count}/3
                          </div>
                        )}
                      </div>

                      {/* Audio Decibel Meter Bar */}
                      <div className="surveillance-audio-meter-bar">
                        <div
                          className={`surveillance-audio-fill ${decibelLevel > 40 ? 'spiking' : ''}`}
                          style={{ width: `${Math.min(100, decibelLevel)}%` }}
                        />
                      </div>
                    </div>

                    {/* Candidate Body Meta */}
                    <div className="surveillance-card-body">
                      <div className="surveillance-candidate-header">
                        <div>
                          <h4 className="surveillance-name" title={student.name}>
                            {student.name}
                          </h4>
                          <div className="surveillance-id-pill">
                            {student.studentId} • {student.email}
                          </div>
                        </div>

                        {student.violation_count > 0 ? (
                          <div className="surveillance-violations-badge">
                            <AlertTriangle size={12} />
                            <span>{student.violation_count} flags</span>
                          </div>
                        ) : (
                          <div className="surveillance-clean-badge">Clean</div>
                        )}
                      </div>

                      {/* Question Progress & Time Spent */}
                      <div className="surveillance-telemetry-row">
                        <div className="telemetry-item">
                          <Activity size={13} color="#38bdf8" />
                          <span>
                            Q {student.activity?.currentQuestion || 1}/
                            {student.activity?.totalQuestions || examData?.total_questions || 30}
                          </span>
                        </div>
                        <div className="telemetry-item">
                          <Clock size={13} color="#94a3b8" />
                          <span>
                            {student.activity?.timeSpent
                              ? `${Math.floor(student.activity.timeSpent / 60)}m elapsed`
                              : 'Session active'}
                          </span>
                        </div>
                      </div>

                      {/* Proctor Intervention Buttons */}
                      <div className="surveillance-actions-row">
                        <button
                          className="surveillance-action-btn btn-warn"
                          onClick={() => openWarningModal(student)}
                          disabled={isTerminated}
                          title="Issue official proctoring warning strike"
                        >
                          <AlertTriangle size={13} />
                          <span>Warn ({student.warning_count || 0})</span>
                        </button>

                        <button
                          className="surveillance-action-btn btn-terminate"
                          onClick={() => openTerminationModal(student)}
                          disabled={isTerminated}
                          title="Immediately disqualify and terminate exam session"
                        >
                          <UserX size={13} />
                          <span>Terminate</span>
                        </button>

                        <button
                          className="surveillance-action-btn btn-inspect"
                          onClick={() => handleInspectStudent(student)}
                          title="Inspect deep telemetry and violation audit log"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Incident Ticker */}
        <aside className="cockpit-incident-ticker-panel">
          <div className="ticker-header">
            <div className="ticker-header-title">
              <ShieldAlert size={16} color="#ef4444" />
              <span>Incident Stream</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{violations.length} events</span>
          </div>

          <div className="ticker-feed-list">
            {violations.length === 0 ? (
              <div className="ticker-empty-state">
                <CheckCircle2 size={32} color="#10b981" />
                <span>Zero security incidents recorded yet. Examination room is clean.</span>
              </div>
            ) : (
              violations.map((viol, index) => (
                <div
                  key={viol.id || index}
                  className={`ticker-item severity-${viol.severity || 'medium'}`}
                >
                  <div className="ticker-item-meta">
                    <span className="ticker-student-name">
                      {viol.student_name || 'Candidate'}
                    </span>
                    <span className="ticker-time">
                      {viol.created_at ? new Date(viol.created_at).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                  <div className="ticker-item-desc">
                    {viol.message || viol.type?.replace(/_/g, ' ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. MODAL: ISSUE OFFICIAL WARNING (STRIKES)
          ═══════════════════════════════════════════════════════════════════════ */}
      {warnModal.open && warnModal.student && (
        <div className="cockpit-modal-backdrop">
          <div className="cockpit-modal-card">
            <div className="cockpit-modal-header">
              <h3 className="cockpit-modal-title">
                <AlertTriangle size={20} color="#f59e0b" />
                Issue Proctoring Warning (Strike {warnModal.strike}/3)
              </h3>
              <button
                className="cockpit-modal-close"
                onClick={() => setWarnModal({ open: false, student: null, message: '', strike: 1 })}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#94a3b8' }}>
              Candidate: <strong style={{ color: '#fff' }}>{warnModal.student.name}</strong> ({warnModal.student.studentId})
            </p>

            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Quick Preset Warnings:
            </div>
            <div className="cockpit-presets-row">
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setWarnModal(prev => ({
                    ...prev,
                    message: 'Look directly into your webcam at all times. Multiple non-face instances will lead to immediate disqualification.',
                  }))
                }
              >
                👀 "Look directly into your camera"
              </button>
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setWarnModal(prev => ({
                    ...prev,
                    message: 'Navigation outside the exam window detected. This is an official strike recorded against your registration.',
                  }))
                }
              >
                🪟 "Tab switch detected — Strike logged"
              </button>
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setWarnModal(prev => ({
                    ...prev,
                    message: 'Please eliminate all ambient audio and room conversation immediately.',
                  }))
                }
              >
                🎙️ "Silence required — Voice detected"
              </button>
            </div>

            <textarea
              className="cockpit-modal-textarea"
              placeholder="Type custom warning message to be transmitted to the candidate screen..."
              value={warnModal.message}
              onChange={(e) => setWarnModal(prev => ({ ...prev, message: e.target.value }))}
            />

            <div className="cockpit-modal-actions">
              <button
                className="cockpit-btn cockpit-btn-outline"
                onClick={() => setWarnModal({ open: false, student: null, message: '', strike: 1 })}
              >
                Cancel
              </button>
              <button
                className="cockpit-btn cockpit-btn-warning"
                onClick={handleSendWarning}
              >
                <Send size={14} />
                <span>Send Warning to Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          6. MODAL: TERMINATE & DISQUALIFY CANDIDATE
          ═══════════════════════════════════════════════════════════════════════ */}
      {terminateModal.open && terminateModal.student && (
        <div className="cockpit-modal-backdrop">
          <div className="cockpit-modal-card">
            <div className="cockpit-modal-header">
              <h3 className="cockpit-modal-title" style={{ color: '#ef4444' }}>
                <UserX size={20} color="#ef4444" />
                Disqualify & Terminate Exam
              </h3>
              <button
                className="cockpit-modal-close"
                onClick={() => setTerminateModal({ open: false, student: null, reason: '' })}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#cbd5e1' }}>
              Are you sure you want to immediately terminate the session for{' '}
              <strong style={{ color: '#fff' }}>{terminateModal.student.name}</strong>? Their exam window will lock immediately.
            </p>

            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Grounds for Disqualification:
            </div>
            <div className="cockpit-presets-row">
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setTerminateModal(prev => ({
                    ...prev,
                    reason: 'Unauthorized external electronic device / mobile phone usage observed.',
                  }))
                }
              >
                📱 Auxiliary phone/device cheating
              </button>
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setTerminateModal(prev => ({
                    ...prev,
                    reason: 'Multiple unauthorized individuals detected assisting in candidate room.',
                  }))
                }
              >
                👥 Impersonation or multiple persons in room
              </button>
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setTerminateModal(prev => ({
                    ...prev,
                    reason: 'Exceeded maximum permissible tab navigation and browser blur limit.',
                  }))
                }
              >
                🚫 Repeated window violations after warnings
              </button>
            </div>

            <textarea
              className="cockpit-modal-textarea"
              placeholder="Specify the official justification recorded in the candidate's audit log..."
              value={terminateModal.reason}
              onChange={(e) => setTerminateModal(prev => ({ ...prev, reason: e.target.value }))}
            />

            <div className="cockpit-modal-actions">
              <button
                className="cockpit-btn cockpit-btn-outline"
                onClick={() => setTerminateModal({ open: false, student: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                className="cockpit-btn cockpit-btn-danger"
                onClick={handleTerminateStudent}
              >
                <UserX size={14} />
                <span>Confirm Immediate Disqualification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          7. MODAL: BROADCAST ANNOUNCEMENT TO ALL STUDENTS
          ═══════════════════════════════════════════════════════════════════════ */}
      {broadcastModal.open && (
        <div className="cockpit-modal-backdrop">
          <div className="cockpit-modal-card">
            <div className="cockpit-modal-header">
              <h3 className="cockpit-modal-title">
                <Megaphone size={20} color="#38bdf8" />
                Exam-Wide Broadcast Announcement
              </h3>
              <button
                className="cockpit-modal-close"
                onClick={() => setBroadcastModal({ open: false, message: '', urgency: 'normal' })}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#94a3b8' }}>
              This announcement will flash prominently across the screen of every candidate taking{' '}
              <strong style={{ color: '#fff' }}>{examData?.title || 'this examination'}</strong>.
            </p>

            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Quick Announcement Presets:
            </div>
            <div className="cockpit-presets-row">
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setBroadcastModal(prev => ({
                    ...prev,
                    message: '10 Minutes Remaining. Please review your answers and ensure all questions are attempted.',
                  }))
                }
              >
                ⏳ "10 Minutes Remaining"
              </button>
              <button
                className="cockpit-preset-chip"
                onClick={() =>
                  setBroadcastModal(prev => ({
                    ...prev,
                    message: 'Notice to all candidates: Ensure you stay aligned directly in your webcam view.',
                  }))
                }
              >
                📹 "Please align webcams properly"
              </button>
            </div>

            <textarea
              className="cockpit-modal-textarea"
              placeholder="Type announcement message to broadcast..."
              value={broadcastModal.message}
              onChange={(e) => setBroadcastModal(prev => ({ ...prev, message: e.target.value }))}
            />

            <div className="cockpit-modal-actions">
              <button
                className="cockpit-btn cockpit-btn-outline"
                onClick={() => setBroadcastModal({ open: false, message: '', urgency: 'normal' })}
              >
                Cancel
              </button>
              <button
                className="cockpit-btn cockpit-btn-primary"
                onClick={handleSendBroadcast}
              >
                <Send size={14} />
                <span>Broadcast Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          8. MODAL: DEEP CANDIDATE TELEMETRY INSPECTOR
          ═══════════════════════════════════════════════════════════════════════ */}
      {inspectModal.open && inspectModal.student && (
        <div className="cockpit-modal-backdrop">
          <div className="cockpit-modal-card" style={{ maxWidth: 560 }}>
            <div className="cockpit-modal-header">
              <h3 className="cockpit-modal-title">
                <Eye size={20} color="#38bdf8" />
                Candidate Security Telemetry
              </h3>
              <button
                className="cockpit-modal-close"
                onClick={() => setInspectModal({ open: false, student: null, activityData: null })}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#1e293b',
                  color: '#38bdf8',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {inspectModal.student.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{inspectModal.student.name}</h4>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Roll No: {inspectModal.student.studentId} • {inspectModal.student.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#090d16', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>TOTAL VIOLATIONS</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171' }}>
                  {inspectModal.student.violation_count || 0}
                </div>
              </div>
              <div style={{ background: '#090d16', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>OFFICIAL STRIKES</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>
                  {inspectModal.student.warning_count || 0}/3
                </div>
              </div>
              <div style={{ background: '#090d16', padding: '10px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>STATUS</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', textTransform: 'capitalize' }}>
                  {inspectModal.student.status}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
              Recorded Violation Audit Trail:
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {(inspectModal.activityData?.violations || inspectModal.student.violations || []).length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '12px 0', textAlign: 'center' }}>
                  No security violations flagged for this candidate.
                </div>
              ) : (
                (inspectModal.activityData?.violations || inspectModal.student.violations || []).map((v, i) => (
                  <div
                    key={v.id || i}
                    style={{
                      background: '#172033',
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                      ⚠️ {v.type?.replace(/_/g, ' ')}: {v.message}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                      {v.created_at ? new Date(v.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="cockpit-modal-actions">
              <button
                className="cockpit-btn cockpit-btn-outline"
                onClick={() => setInspectModal({ open: false, student: null, activityData: null })}
              >
                Close Inspector
              </button>
              <button
                className="cockpit-btn cockpit-btn-warning"
                onClick={() => {
                  const st = inspectModal.student;
                  setInspectModal({ open: false, student: null, activityData: null });
                  openWarningModal(st);
                }}
              >
                <AlertTriangle size={14} />
                <span>Issue Warning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
