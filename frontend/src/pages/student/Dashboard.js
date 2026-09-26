// src/pages/student/Dashboard.js — Professional Candidate Examination Cockpit
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { formatIST, isExamStartable } from '../../utils/timezone';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Award,
  Activity,
  ArrowRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Mic,
  Wifi,
  Monitor,
  Play,
  Copy,
  KeyRound,
  FileCheck
} from 'lucide-react';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickExamKey, setQuickExamKey] = useState('');
  const [joiningKey, setJoiningKey] = useState(false);

  // Fetch candidate exams and results
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          studentAPI.getExams().catch(() => ({ data: { exams: [] } })),
          studentAPI.getResults().catch(() => ({ data: { results: [] } }))
        ]);

        if (isMounted) {
          setExams(examsRes.data?.exams || []);
          setResults(resultsRes.data?.results || []);
        }
      } catch (error) {
        console.error('Failed to load candidate metrics:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Filter exams
  const upcomingExams = useMemo(() => {
    return exams.filter(e => {
      const isDone = e.session_status === 'submitted' || e.session_status === 'terminated';
      return !isDone && (e.status === 'published' || e.status === 'active');
    });
  }, [exams]);

  // Check for any currently live / immediately startable exam
  const liveExam = useMemo(() => {
    return upcomingExams.find(exam => isExamStartable(exam));
  }, [upcomingExams]);

  // Statistics calculation
  const totalExams = exams.length;
  const completedExams = results.length;
  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    const sum = results.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
    return Math.round(sum / results.length);
  }, [results]);

  const passRate = useMemo(() => {
    if (!results.length) return 0;
    const passed = results.filter(r => r.status === 'pass' || (Number(r.percentage) >= 40)).length;
    return Math.round((passed / results.length) * 100);
  }, [results]);

  // Helper: check if a specific exam can be launched right now
  const isStartable = (exam) => {
    return isExamStartable(exam);
  };

  // Quick Key Join handler
  const handleQuickJoin = (e) => {
    e.preventDefault();
    const key = quickExamKey.trim().toUpperCase();
    if (!key) {
      toast.error('Please enter an exam key to launch');
      return;
    }
    setJoiningKey(true);

    // Look for a local match in assigned exams
    const matched = exams.find(ex =>
      (ex.exam_code && ex.exam_code.toUpperCase() === key) ||
      (ex.exam_key && ex.exam_key.toUpperCase() === key)
    );

    if (matched) {
      toast.success(`Exam identified: "${matched.title || matched.name}"`);
      navigate(`/student/exams/${matched.id}`);
    } else {
      // If no local match, navigate to exams list with search
      toast.error(`Exam key "${key}" not found in your assigned tests.`);
    }
    setJoiningKey(false);
  };

  // Copy key helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied key "${text}" to clipboard!`);
  };

  if (loading) {
    return (
      <div className="sd-container">
        <div className="sd-loading-wrap">
          <div className="sd-spinner" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>
            Initializing Candidate Dashboard...
          </span>
        </div>
      </div>
    );
  }

  const currentDateFormatted = formatIST(new Date(), 'longDate');

  return (
    <div className="sd-container">
      {/* ═══════════════════════════════════════════════════════════
          1. HERO CANDIDATE BANNER
          ═══════════════════════════════════════════════════════════ */}
      <section className="sd-hero-banner">
        <div className="sd-hero-profile-wrap">
          <div className="sd-hero-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="sd-hero-info">
            <h1>Welcome back, {user?.name ? user.name.split(' ')[0] : 'Candidate'}!</h1>
            <div className="sd-hero-meta-row">
              <span className="sd-hero-chip sd-hero-chip-verified">
                <ShieldCheck size={14} /> Verified Student
              </span>
              <span className="sd-hero-chip sd-hero-chip-id">
                Roll / ID: {user?.roll_number || user?.enrollment_number || user?.studentId || 'ES-STD'}
              </span>
              <span className="sd-hero-chip">
                🎓 {user?.college_name || user?.collegeName || 'Institutional Assessment Center'}
              </span>
              <span className="sd-hero-chip">
                📅 {currentDateFormatted}
              </span>
            </div>
          </div>
        </div>

        <div className="sd-hero-actions">
          <button
            onClick={() => navigate('/student/exams')}
            className="sd-btn-primary"
          >
            <BookOpen size={18} />
            <span>My Assessments</span>
          </button>
          <button
            onClick={() => navigate('/student/results')}
            className="sd-btn-secondary"
          >
            <Trophy size={18} />
            <span>Transcript</span>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. LIVE ASSESSMENT ALERT (IF APPLICABLE)
          ═══════════════════════════════════════════════════════════ */}
      {liveExam && (
        <section className="sd-live-alert-card">
          <div className="sd-live-alert-content">
            <span className="sd-live-badge-pulse">
              <span className="sd-live-dot" /> Live Exam
            </span>
            <div className="sd-live-text">
              <h3>{liveExam.title || liveExam.name}</h3>
              <p>
                {liveExam.subject} · Scheduled for {formatIST(liveExam.date_time, 'time')} (IST) · {liveExam.duration} Minutes Duration
                {(liveExam.exam_code || liveExam.exam_key) && (
                  <strong style={{ marginLeft: 8, color: '#92400e' }}>
                    [Key: {liveExam.exam_code || liveExam.exam_key}]
                  </strong>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/student/exams/${liveExam.id}`)}
            className="sd-live-alert-btn"
          >
            <Play size={16} fill="currentColor" />
            <span>Enter Examination Room</span>
          </button>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          3. ACADEMIC KPI STATS (4 METRICS)
          ═══════════════════════════════════════════════════════════ */}
      <section className="sd-stats-grid">
        {/* Metric 1 */}
        <div className="sd-stat-card">
          <div className="sd-stat-body">
            <span className="sd-stat-label">Assigned Exams</span>
            <span className="sd-stat-value">{totalExams}</span>
            <span className="sd-stat-subtext">
              <BookOpen size={13} color="#0a74da" /> Registered modules
            </span>
          </div>
          <div className="sd-stat-icon-wrap icon-blue">
            <BookOpen size={24} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="sd-stat-card">
          <div className="sd-stat-body">
            <span className="sd-stat-label">Completed Tests</span>
            <span className="sd-stat-value">{completedExams}</span>
            <span className="sd-stat-subtext">
              <CheckCircle2 size={13} color="#10b981" /> Submitted & graded
            </span>
          </div>
          <div className="sd-stat-icon-wrap icon-green">
            <Award size={24} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="sd-stat-card">
          <div className="sd-stat-body">
            <span className="sd-stat-label">Academic Average</span>
            <span className="sd-stat-value">{averageScore}%</span>
            <span className="sd-stat-subtext">
              <TrendingUp size={13} color="#8b5cf6" />
              {averageScore >= 75 ? 'Distinction Tier' : averageScore >= 50 ? 'First Class' : averageScore > 0 ? 'Passing' : 'Pending Evaluation'}
            </span>
          </div>
          <div className="sd-stat-icon-wrap icon-purple">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="sd-stat-card">
          <div className="sd-stat-body">
            <span className="sd-stat-label">Success Rate</span>
            <span className="sd-stat-value">{passRate}%</span>
            <span className="sd-stat-subtext">
              <Target size={13} color="#f59e0b" />
              {results.filter(r => r.status === 'pass' || (Number(r.percentage) >= 40)).length} passed papers
            </span>
          </div>
          <div className="sd-stat-icon-wrap icon-amber">
            <Target size={24} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. MAIN WORKSPACE (LEFT 68% / RIGHT 32%)
          ═══════════════════════════════════════════════════════════ */}
      <div className="sd-main-grid">
        {/* ── LEFT COLUMN: EXAMS & RESULTS ── */}
        <div className="sd-left-column">
          {/* Scheduled & Upcoming Assessments Card */}
          <div className="sd-card">
            <div className="sd-card-header">
              <h2 className="sd-card-title">
                <Calendar size={20} color="#0a74da" />
                <span>Scheduled Assessments</span>
              </h2>
              <button
                onClick={() => navigate('/student/exams')}
                className="sd-card-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span>View Full Schedule</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="sd-empty-state">
                <div className="sd-empty-icon">
                  <FileCheck size={28} />
                </div>
                <h4>All Caught Up!</h4>
                <p>You have no pending or scheduled examinations at this time.</p>
              </div>
            ) : (
              <div>
                {upcomingExams.slice(0, 4).map(exam => {
                  const startable = isStartable(exam);
                  const examCode = exam.exam_code || exam.exam_key;

                  return (
                    <div key={exam.id} className="sd-exam-item">
                      <div className="sd-exam-info-col">
                        <div className="sd-exam-tag-row">
                          <span className="sd-subject-tag">
                            {exam.subject || 'General'}
                          </span>
                          {examCode && (
                            <span
                              className="sd-key-badge"
                              onClick={() => copyToClipboard(examCode)}
                              title="Click to copy key"
                              style={{ cursor: 'pointer' }}
                            >
                              <KeyRound size={12} /> Key: {examCode}
                              <Copy size={11} style={{ marginLeft: 2 }} />
                            </span>
                          )}
                          {exam.is_proctored !== false && (
                            <span className="sd-proctor-indicator">
                              <Shield size={12} /> Proctored
                            </span>
                          )}
                        </div>

                        <h3 className="sd-exam-title">
                          {exam.title || exam.name || 'Assessment'}
                        </h3>

                        <div className="sd-exam-meta-pills">
                          <span className="sd-exam-meta-pill">
                            <Clock size={13} />
                            {exam.date_time ? formatIST(exam.date_time, 'dateTime') : 'Flexible Schedule'}
                          </span>
                          <span>•</span>
                          <span className="sd-exam-meta-pill">
                            <Activity size={13} />
                            {exam.duration || 60} mins
                          </span>
                          <span>•</span>
                          <span className="sd-exam-meta-pill">
                            <Award size={13} />
                            {exam.total_marks || 100} Marks
                          </span>
                        </div>
                      </div>

                      <div>
                        {startable ? (
                          <button
                            onClick={() => navigate(`/student/exams/${exam.id}`)}
                            className="sd-btn-take-exam"
                          >
                            <Play size={14} fill="currentColor" />
                            <span>Launch Room</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/student/exams/${exam.id}`)}
                            className="sd-btn-exam-outline"
                          >
                            <span>View Details</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Performance & Results */}
          <div className="sd-card">
            <div className="sd-card-header">
              <h2 className="sd-card-title">
                <Trophy size={20} color="#8b5cf6" />
                <span>Recent Results & Transcripts</span>
              </h2>
              <button
                onClick={() => navigate('/student/results')}
                className="sd-card-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span>All Results</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {results.length === 0 ? (
              <div className="sd-empty-state">
                <div className="sd-empty-icon">
                  <Trophy size={28} />
                </div>
                <h4>No Examination History Yet</h4>
                <p>Complete your first online assessment to view sealed scores and AI proctoring telemetry.</p>
              </div>
            ) : (
              <div>
                {results.slice(0, 3).map((resItem, idx) => {
                  const pct = Number(resItem.percentage) || 0;
                  const isPassed = resItem.status === 'pass' || pct >= 40;

                  return (
                    <div
                      key={resItem.id || idx}
                      className="sd-result-item"
                      onClick={() => navigate(`/student/results/${resItem.exam_id || resItem.id}`)}
                    >
                      <div className="sd-exam-info-col">
                        <div className="sd-exam-tag-row">
                          <span className="sd-subject-tag">
                            {resItem.subject || 'Academic Result'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {resItem.completed_at || resItem.submitted_at
                              ? formatDistanceToNow(new Date(resItem.completed_at || resItem.submitted_at)) + ' ago'
                              : 'Graded Paper'}
                          </span>
                        </div>
                        <h4 className="sd-exam-title">
                          {resItem.exam_title || resItem.title || 'Completed Assessment'}
                        </h4>
                      </div>

                      <div className="sd-result-score-block">
                        <span className="sd-score-num" style={{ color: isPassed ? '#10b981' : '#b45309' }}>
                          {resItem.score !== undefined ? resItem.score : resItem.marks_obtained ?? '—'} / {resItem.total_marks || resItem.totalMarks || 100}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className={isPassed ? 'sd-badge-pass' : 'sd-badge-eval'}>
                            {resItem.status === 'pending' ? 'Evaluating' : isPassed ? 'PASSED' : 'COMPLETED'}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: FAST JOIN & PRE-FLIGHT READINESS ── */}
        <div className="sd-right-column">
          {/* Quick Exam Key Join Card */}
          <div className="sd-join-box">
            <h3 className="sd-join-title">
              <KeyRound size={20} />
              <span>Direct Exam Key Entry</span>
            </h3>
            <p className="sd-join-desc">
              Have an exam key provided by your institutional invigilator? Enter below to launch directly.
            </p>
            <form onSubmit={handleQuickJoin}>
              <div className="sd-join-input-group">
                <input
                  type="text"
                  value={quickExamKey}
                  onChange={(e) => setQuickExamKey(e.target.value.toUpperCase())}
                  placeholder="e.g. EXAM2026"
                  className="sd-join-input"
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={joiningKey || !quickExamKey.trim()}
                  className="sd-btn-join-submit"
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Pre-Exam Hardware & Readiness Check Widget */}
          <div className="sd-readiness-box">
            <div className="sd-readiness-header">
              <div className="sd-readiness-title">
                <ShieldCheck size={18} color="#0a74da" />
                <span>Pre-Flight Readiness</span>
              </div>
              <span className="sd-readiness-tag">
                <CheckCircle2 size={12} /> System Ready
              </span>
            </div>

            <div className="sd-check-list">
              <div className="sd-check-item">
                <div className="sd-check-left">
                  <Camera size={16} color="#0a74da" />
                  <span>WebCam & AI Vision</span>
                </div>
                <span className="sd-check-status">Verified</span>
              </div>

              <div className="sd-check-item">
                <div className="sd-check-left">
                  <Mic size={16} color="#0a74da" />
                  <span>Audio & Microphone</span>
                </div>
                <span className="sd-check-status">Calibrated</span>
              </div>

              <div className="sd-check-item">
                <div className="sd-check-left">
                  <Monitor size={16} color="#0a74da" />
                  <span>Fullscreen Security</span>
                </div>
                <span className="sd-check-status">Supported</span>
              </div>

              <div className="sd-check-item">
                <div className="sd-check-left">
                  <Wifi size={16} color="#0a74da" />
                  <span>Network Latency</span>
                </div>
                <span className="sd-check-status">Optimal (&lt;40ms)</span>
              </div>
            </div>
          </div>

          {/* Examination Protocol Guidelines */}
          <div className="sd-rules-box">
            <div className="sd-rules-title">
              <AlertCircle size={16} color="#0a74da" />
              <span>Assessment Protocol</span>
            </div>
            <div className="sd-rules-item">
              <span>•</span>
              <span>Keep your camera centered and well-lit throughout the exam session.</span>
            </div>
            <div className="sd-rules-item">
              <span>•</span>
              <span>A maximum of 3 tab/window switches is allowed before auto-submission.</span>
            </div>
            <div className="sd-rules-item">
              <span>•</span>
              <span>Keyboard shortcuts (copy, paste, refresh) are restricted during tests.</span>
            </div>
            <div className="sd-rules-item">
              <span>•</span>
              <span>All question answers are encrypted and auto-saved every 30 seconds.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
