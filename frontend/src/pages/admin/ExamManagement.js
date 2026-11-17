// src/pages/admin/ExamManagement.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { formatIST, isExamEnded, parseToIST, toDateTimeLocalValue, toISTISOString } from '../../utils/timezone';
import toast from 'react-hot-toast';
import {
  Plus,
  Filter,
  Calendar,
  Clock,
  FileText,
  Users,
  Trophy,
  Edit3,
  CheckCircle,
  CheckCircle2,
  Search,
  Monitor,
  X,
  Save,
  BookOpen,
  Shield,
  Eye,
  Mic,
  Layers,
  Maximize,
  Camera,
  Activity,
  Radio,
  RotateCcw
} from 'lucide-react';
import './ExamCenter.css';
import AnimatedNumber from '../../components/common/AnimatedNumber';

/* ── Status Badge Helper ───────────────────────────────────────────────────── */
const StatusBadge = ({ exam, status }) => {
  const currentStatus = (exam && isExamEnded(exam)) ? 'completed' : (status || exam?.status || 'draft');
  const normalized = String(currentStatus).toLowerCase();

  const labels = {
    draft: 'Draft',
    published: 'Published',
    active: 'Active Window',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  return (
    <span className={`ec-badge ${normalized}`}>
      <span className="ec-badge-dot" />
      <span>{labels[normalized] || normalized.toUpperCase()}</span>
    </span>
  );
};

export default function ExamManagement() {
  const { user } = useAuth();
  const collegeId = user?.id || '';
  const storageKey = collegeId ? `cached_admin_exams_${collegeId}` : null;

  const [exams, setExams] = useState(() => {
    try {
      if (!storageKey) return [];
      const cached = sessionStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState({
    open: false,
    exam: null,
    title: '',
    description: '',
    dateTime: '',
    duration: 60,
    total_marks: 100,
    passing_marks: 40,
    type: 'coding',
    status: 'draft',
    is_proctored: true,
    monitoringConfig: {
      face_detection: true,
      voice_detection: true,
      tab_switch: true,
      fullscreen: true,
      device_camera: true
    },
    saving: false
  });

  const navigate = useNavigate();

  const fetchExams = (isBackground = false) => {
    if (!collegeId) return;
    if (!isBackground) setLoading(true);
    adminAPI.getExams({
      status: filter === 'all' ? undefined : filter,
      search: search || undefined,
      limit: 50
    })
      .then(r => {
        const data = r.data?.exams || r.data?.data?.exams || [];
        setExams(data);
        if (storageKey) {
          try { sessionStorage.setItem(storageKey, JSON.stringify(data)); } catch (_) { }
        }
      })
      .catch(() => toast.error('Failed to load examinations'))
      .finally(() => setLoading(false));
  };

  // Immediate fetch on mount or filter change or college change
  useEffect(() => {
    if (!collegeId) return;
    try {
      const cached = sessionStorage.getItem(`cached_admin_exams_${collegeId}`);
      if (cached) setExams(JSON.parse(cached));
      else setExams([]);
    } catch (_) {
      setExams([]);
    }
    fetchExams(false);
  }, [collegeId, filter]);

  // Debounced search
  useEffect(() => {
    if (!search) return;
    const timeout = setTimeout(() => fetchExams(false), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const publishExam = async (id, name) => {
    try {
      await adminAPI.publishExam(id);
      toast.success(`${name || 'Exam'} published to student dashboards!`);
      fetchExams(true);
    }
    catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to publish examination');
    }
  };

  const toggleEditMonitoringOption = (key) => {
    setEditModal(prev => ({
      ...prev,
      monitoringConfig: {
        ...prev.monitoringConfig,
        [key]: !prev.monitoringConfig?.[key]
      }
    }));
  };

  const handleOpenEdit = (exam) => {
    let monConfig = exam.monitoring_config;
    if (typeof monConfig === 'string') {
      try { monConfig = JSON.parse(monConfig); } catch (e) { monConfig = null; }
    }
    const defaultMonitoring = {
      face_detection: true,
      voice_detection: true,
      tab_switch: true,
      fullscreen: true,
      device_camera: true
    };
    monConfig = monConfig ? { ...defaultMonitoring, ...monConfig } : defaultMonitoring;

    setEditModal({
      open: true,
      exam,
      title: exam.title || exam.name || '',
      description: exam.description || '',
      dateTime: exam.date_time ? toDateTimeLocalValue(exam.date_time) : '',
      duration: exam.duration || 60,
      total_marks: exam.total_marks || 100,
      passing_marks: exam.passing_marks || 40,
      type: exam.type || 'coding',
      status: exam.status || 'draft',
      is_proctored: exam.is_proctored !== false,
      monitoringConfig: monConfig,
      saving: false
    });
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!editModal.exam) return;

    if (!editModal.title.trim()) {
      return toast.error('Exam title is required');
    }

    setEditModal(prev => ({ ...prev, saving: true }));
    try {
      const payload = {
        title: editModal.title.trim(),
        name: editModal.title.trim(),
        description: editModal.description.trim(),
        duration: parseInt(editModal.duration) || 60,
        total_marks: parseInt(editModal.total_marks) || 100,
        passing_marks: parseInt(editModal.passing_marks) || 40,
        type: editModal.type,
        status: editModal.status,
        is_proctored: editModal.is_proctored,
        monitoring_config: editModal.monitoringConfig
      };

      if (editModal.dateTime) {
        payload.date_time = toISTISOString(editModal.dateTime);
        payload.dateTime = payload.date_time;

        const parsedStart = parseToIST(payload.date_time);
        if (parsedStart) {
          const effectiveDuration = parseInt(editModal.duration) || 60;
          const endTime = parsedStart.getTime() + (effectiveDuration * 60000);
          if (endTime > Date.now() && payload.status === 'completed') {
            payload.status = (Date.now() >= parsedStart.getTime() - 15 * 60000) ? 'active' : 'published';
          }
        }
      }

      const res = await adminAPI.updateExam(editModal.exam.id, payload);
      const updatedExam = res?.data?.exam || {};

      setExams(prev => prev.map(item => {
        if (item.id === editModal.exam.id) {
          return {
            ...item,
            ...payload,
            ...(updatedExam.date_time ? { date_time: updatedExam.date_time } : {}),
            status: updatedExam.status || payload.status || item.status
          };
        }
        return item;
      }));

      toast.success('Exam schedule and settings updated successfully');
      setEditModal(prev => ({ ...prev, open: false, saving: false }));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update exam');
      setEditModal(prev => ({ ...prev, saving: false }));
    }
  };

  // KPIs
  const activeExamsCount = exams.filter(e => e.status === 'active' || (!isExamEnded(e) && e.status === 'published')).length;
  const publishedExamsCount = exams.filter(e => e.status === 'published').length;
  const draftExamsCount = exams.filter(e => e.status === 'draft').length;

  return (
    <div className="ec-container">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="ec-header">
        <div className="ec-header-left">
          <div className="ec-eyebrow">
            <span className="ec-eyebrow-dot" />
            <span>Academic Operations • Examination Lifecycle &amp; Integrity</span>
          </div>
          <h1 className="ec-title">Examinations Center &amp; Orchestration</h1>
          <p className="ec-subtitle">
            <span>Configure examination schedules, question banks, AI proctoring shields, and live candidate deployments.</span>
          </p>
        </div>

        <div className="ec-header-actions">
          <button
            type="button"
            className="ec-btn primary"
            onClick={() => navigate('/admin/exams/create')}
          >
            <Plus size={16} />
            <span>Create Examination</span>
          </button>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ──────────────────────────────────────── */}
      <div className="ec-metrics-grid">
        <div className="ec-metric-card">
          <div className="ec-metric-icon">
            <BookOpen size={22} />
          </div>
          <div className="ec-metric-content">
            <span className="ec-metric-label">Total Examinations</span>
            <span className="ec-metric-value"><AnimatedNumber value={exams.length} /></span>
          </div>
        </div>

        <div className="ec-metric-card">
          <div className="ec-metric-icon good">
            <Radio size={22} />
          </div>
          <div className="ec-metric-content">
            <span className="ec-metric-label">Live &amp; Active Now</span>
            <span className="ec-metric-value"><AnimatedNumber value={activeExamsCount} /></span>
          </div>
        </div>

        <div className="ec-metric-card">
          <div className="ec-metric-icon gold">
            <Calendar size={22} />
          </div>
          <div className="ec-metric-content">
            <span className="ec-metric-label">Published / Scheduled</span>
            <span className="ec-metric-value"><AnimatedNumber value={publishedExamsCount} /></span>
          </div>
        </div>

        <div className="ec-metric-card">
          <div className="ec-metric-icon bad">
            <FileText size={22} />
          </div>
          <div className="ec-metric-content">
            <span className="ec-metric-label">Drafts in Progress</span>
            <span className="ec-metric-value"><AnimatedNumber value={draftExamsCount} /></span>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ─────────────────────────────────────────────── */}
      <div className="ec-filter-card">
        <div className="ec-search-box">
          <Search size={18} className="ec-search-icon" />
          <input
            type="text"
            className="ec-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search examinations by title, code, or description..."
          />
          {search && (
            <button type="button" className="ec-search-clear" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="ec-status-pills">
          {[
            { id: 'all', label: 'All Lifecycle' },
            { id: 'active', label: 'Active' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Draft' },
            { id: 'completed', label: 'Completed' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilter(p.id)}
              className={`ec-status-pill ${filter === p.id ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}

          <button
            type="button"
            className="ec-action-btn"
            onClick={() => fetchExams(false)}
            title="Refresh examination list"
            style={{ marginLeft: 6 }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── Examination Cards Grid ──────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--mu, #667085)' }}>
          <RotateCcw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading examination centers...</p>
        </div>
      ) : exams.length === 0 ? (
        <div style={{
          background: 'var(--sf, #ffffff)',
          border: '1px solid var(--bd, #e6e9f0)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--wash, rgba(37, 99, 235, 0.08))',
            color: 'var(--c1, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <FileText size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 600, color: 'var(--tx, #101828)' }}>
            No examinations found
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.86rem', color: 'var(--mu, #667085)' }}>
            {search ? `No examinations matching "${search}"` : 'Create your first proctored examination to orchestrate questions and enroll candidates.'}
          </p>
          {!search && (
            <button
              type="button"
              className="ec-btn primary"
              onClick={() => navigate('/admin/exams/create')}
            >
              <Plus size={16} />
              <span>Create First Examination</span>
            </button>
          )}
        </div>
      ) : (
        <div className="ec-exams-grid">
          {exams.map(exam => {
            const examTitle = exam.title || exam.name || 'Untitled Exam';
            const isEnded = isExamEnded(exam);
            const currentStatus = isEnded ? 'completed' : (exam.status || 'draft');
            const monConfig = typeof exam.monitoring_config === 'string' ? JSON.parse(exam.monitoring_config || '{}') : (exam.monitoring_config || {});

            return (
              <div key={exam.id} className="ec-exam-card">
                <div>
                  {/* Card Top */}
                  <div className="ec-exam-top">
                    <div className="ec-exam-title-box">
                      <span className="ec-exam-type-badge">
                        {(exam.type || 'coding').replace('_', ' ')} Assessment
                      </span>
                      <h3 className="ec-exam-title">{examTitle}</h3>
                    </div>
                    <StatusBadge exam={exam} status={exam.status} />
                  </div>

                  {/* Description */}
                  <div className="ec-exam-desc">
                    {exam.description || 'Proctored examination orchestrating automated telemetry, candidate verification, and secure scoring.'}
                  </div>

                  {/* Specs Grid */}
                  <div className="ec-specs-grid">
                    <div className="ec-spec-item">
                      <Calendar size={14} />
                      <span>{exam.date_time ? formatIST(exam.date_time, 'dateTime') : 'Scheduled anytime'}</span>
                    </div>
                    <div className="ec-spec-item">
                      <Clock size={14} />
                      <span>{exam.duration || 60} mins duration</span>
                    </div>
                    <div className="ec-spec-item">
                      <Trophy size={14} />
                      <span>{exam.total_marks || 100} marks (Pass: {exam.passing_marks || 40})</span>
                    </div>
                    <div className="ec-spec-item">
                      <FileText size={14} />
                      <span>{exam.question_count || 0} questions</span>
                    </div>
                    <div className="ec-spec-item">
                      <Users size={14} />
                      <span>{exam.student_count || 0} candidates</span>
                    </div>
                    <div className="ec-spec-item">
                      <Shield size={14} />
                      <span>{exam.is_proctored !== false ? 'AI Shield Active' : 'Unproctored'}</span>
                    </div>
                  </div>

                  {/* Proctoring Pill */}
                  {exam.is_proctored !== false && (
                    <div className="ec-proctoring-pill">
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--mu, #667085)' }}>
                        Telemetry Shields:
                      </span>
                      <div className="ec-proctoring-icons">
                        {monConfig.face_detection !== false && <Eye size={14} title="Face Detection Active" />}
                        {monConfig.voice_detection !== false && <Mic size={14} title="Voice Anomaly Detection Active" />}
                        {monConfig.tab_switch !== false && <Layers size={14} title="Tab-Switch Interception Active" />}
                        {monConfig.fullscreen !== false && <Maximize size={14} title="Full Screen Enforcement Active" />}
                        {monConfig.device_camera !== false && <Camera size={14} title="Webcam HUD Feed Active" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="ec-card-actions">
                  <button
                    type="button"
                    className="ec-action-btn primary"
                    onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                  >
                    <FileText size={13} />
                    <span>Questions ({exam.question_count || 0})</span>
                  </button>

                  <button
                    type="button"
                    className="ec-action-btn"
                    onClick={() => handleOpenEdit(exam)}
                  >
                    <Edit3 size={13} />
                    <span>Edit &amp; Settings</span>
                  </button>

                  {currentStatus === 'draft' && (
                    <button
                      type="button"
                      className="ec-action-btn success"
                      onClick={() => publishExam(exam.id, examTitle)}
                    >
                      <CheckCircle size={13} />
                      <span>Publish</span>
                    </button>
                  )}

                  {(currentStatus === 'published' || currentStatus === 'active') && (
                    <button
                      type="button"
                      className="ec-action-btn success"
                      onClick={() => navigate(`/admin/exams/${exam.id}/monitor`)}
                    >
                      <Monitor size={13} />
                      <span>Live Cockpit</span>
                    </button>
                  )}

                  {currentStatus === 'completed' && (
                    <button
                      type="button"
                      className="ec-action-btn"
                      onClick={() => navigate(`/admin/results`)}
                    >
                      <Trophy size={13} />
                      <span>Gradebook</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EDIT EXAM MODAL ────────────────────────────────────────────────── */}
      {editModal.open && editModal.exam && (
        <div
          className="ec-modal-overlay"
          onClick={() => !editModal.saving && setEditModal(prev => ({ ...prev, open: false }))}
        >
          <div className="ec-modal" onClick={e => e.stopPropagation()}>
            <div className="ec-modal-header">
              <h3 className="ec-modal-title">
                <BookOpen size={20} color="var(--c1, #2563eb)" />
                <span>Edit Examination &amp; AI Policy</span>
              </h3>
              <button
                onClick={() => !editModal.saving && setEditModal(prev => ({ ...prev, open: false }))}
                className="ec-modal-close"
                disabled={editModal.saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExam} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="ec-modal-body">
                {/* Title */}
                <div className="ec-form-group">
                  <label className="ec-form-label">
                    Examination Title *
                  </label>
                  <input
                    type="text"
                    value={editModal.title}
                    onChange={e => setEditModal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. End-Term Full Stack & Algorithms Assessment"
                    required
                    className="ec-form-input"
                    style={{ fontWeight: 600 }}
                  />
                </div>

                {/* Description */}
                <div className="ec-form-group">
                  <label className="ec-form-label">
                    Examination Instructions &amp; Description
                  </label>
                  <textarea
                    value={editModal.description}
                    onChange={e => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Instructions shown to candidates prior to launching the exam room..."
                    rows={2}
                    className="ec-form-textarea"
                  />
                </div>

                {/* Date & Time */}
                <div style={{ background: 'var(--s2, #f8f9fc)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--bd, #e6e9f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="ec-form-label" style={{ margin: 0 }}>
                      <Calendar size={15} color="var(--c1, #2563eb)" />
                      <span>Scheduled Date &amp; Window (IST)</span>
                    </label>
                    {editModal.exam?.date_time && (
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--c1, #2563eb)' }}>
                        Current: {formatIST(editModal.exam.date_time, 'dateTime')}
                      </span>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    value={editModal.dateTime || ''}
                    onChange={e => setEditModal(prev => ({ ...prev, dateTime: e.target.value }))}
                    className="ec-form-input"
                    style={{ background: 'var(--sf, #ffffff)' }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: 'var(--mu, #667085)', lineHeight: 1.4 }}>
                    💡 Updating the schedule reflects instantly on all candidate dashboards without resetting question responses.
                  </p>
                </div>

                {/* Duration & Type row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ec-form-group">
                    <label className="ec-form-label">
                      <Clock size={14} color="var(--mu, #667085)" />
                      <span>Duration (Minutes)</span>
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="600"
                      value={editModal.duration}
                      onChange={e => setEditModal(prev => ({ ...prev, duration: e.target.value }))}
                      className="ec-form-input"
                      required
                    />
                  </div>
                  <div className="ec-form-group">
                    <label className="ec-form-label">
                      <span>Assessment Type</span>
                    </label>
                    <select
                      value={editModal.type}
                      onChange={e => setEditModal(prev => ({ ...prev, type: e.target.value }))}
                      className="ec-form-select"
                    >
                      <option value="coding">Coding Assessment</option>
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="hybrid">Hybrid (Coding + MCQ)</option>
                      <option value="subjective">Subjective / Written</option>
                    </select>
                  </div>
                </div>

                {/* Marks row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ec-form-group">
                    <label className="ec-form-label">
                      <Trophy size={14} color="var(--mu, #667085)" />
                      <span>Total Marks</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editModal.total_marks}
                      onChange={e => setEditModal(prev => ({ ...prev, total_marks: e.target.value }))}
                      className="ec-form-input"
                      required
                    />
                  </div>
                  <div className="ec-form-group">
                    <label className="ec-form-label">
                      <span>Passing Marks</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={editModal.total_marks || 1000}
                      value={editModal.passing_marks}
                      onChange={e => setEditModal(prev => ({ ...prev, passing_marks: e.target.value }))}
                      className="ec-form-input"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="ec-form-group">
                  <label className="ec-form-label">
                    Lifecycle Status
                  </label>
                  <select
                    value={editModal.status}
                    onChange={e => setEditModal(prev => ({ ...prev, status: e.target.value }))}
                    className="ec-form-select"
                  >
                    <option value="draft">Draft (Not yet visible to candidates)</option>
                    <option value="published">Published (Ready on candidate portal)</option>
                    <option value="active">Active (Ongoing exam window)</option>
                    <option value="completed">Completed (Evaluation ready)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* AI Proctoring Policies */}
                <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--bd, #e6e9f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} color="var(--c1, #2563eb)" />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx, #101828)' }}>
                        AI Proctoring &amp; Monitoring Controls
                      </span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={editModal.is_proctored}
                        onChange={e => setEditModal(prev => ({ ...prev, is_proctored: e.target.checked }))}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--c1, #2563eb)' }}
                      />
                      <span>Enable Proctoring</span>
                    </label>
                  </div>

                  {editModal.is_proctored && (
                    <div className="ec-monitoring-grid">
                      {[
                        { key: 'face_detection', label: 'Face & Person Detection', icon: Eye, desc: 'Detects absent face or multiple persons' },
                        { key: 'voice_detection', label: 'Voice & Speech Detection', icon: Mic, desc: 'Detects speech or audio anomalies' },
                        { key: 'tab_switch', label: 'Tab-Switch Interception', icon: Layers, desc: 'Flags window blur and tab switching' },
                        { key: 'fullscreen', label: 'Full-Screen Enforcement', icon: Maximize, desc: 'Locks assessment in fullscreen mode' },
                        { key: 'device_camera', label: 'Live Camera HUD Stream', icon: Camera, desc: 'Captures candidate webcam snapshots' },
                      ].map(item => {
                        const active = editModal.monitoringConfig?.[item.key] !== false;
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.key}
                            className={`ec-monitoring-tile ${active ? 'active' : ''}`}
                            onClick={() => toggleEditMonitoringOption(item.key)}
                          >
                            <div className="ec-monitoring-tile-left">
                              <Icon size={16} color={active ? 'var(--c1, #2563eb)' : 'var(--mu, #667085)'} />
                              <div>
                                <div className="ec-monitoring-tile-title">{item.label}</div>
                                <div className="ec-monitoring-tile-desc">{item.desc}</div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleEditMonitoringOption(item.key)}
                              onClick={e => e.stopPropagation()}
                              style={{ accentColor: 'var(--c1, #2563eb)' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="ec-modal-footer">
                <button
                  type="button"
                  className="ec-btn secondary"
                  disabled={editModal.saving}
                  onClick={() => setEditModal(prev => ({ ...prev, open: false }))}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ec-btn primary"
                  disabled={editModal.saving}
                >
                  <Save size={15} />
                  <span>{editModal.saving ? 'Saving...' : 'Save Exam Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
