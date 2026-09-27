// src/pages/admin/Dashboard.js — Enterprise College Admin Command Center
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { formatIST, parseToIST, isExamStartable } from '../../utils/timezone';
import toast from 'react-hot-toast';
import { 
  Users, 
  FileText, 
  Trophy, 
  Calendar, 
  Activity, 
  TrendingUp,
  Clock,
  PlusCircle,
  Eye,
  CheckCircle2,
  ShieldAlert,
  Brain,
  Radio,
  Building,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const StatCard = ({ icon: Icon, label, value, sub, color = '#0a74da', trend }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-header">
      <div className="admin-stat-icon" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
        <Icon size={22} />
      </div>
      {trend && (
        <div className={`admin-stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? <TrendingUp size={14} /> : <Activity size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="admin-stat-value">{value ?? '0'}</div>
    <div className="admin-stat-label">{label}</div>
    {sub && <div className="admin-stat-sub">{sub}</div>}
  </div>
);

const ExamRow = ({ exam, onClick }) => {
  const isLive = isExamStartable(exam);
  const now = Date.now();
  const start = parseToIST(exam.date_time).getTime();
  const duration = (exam.duration || 60) * 60000;
  const isCompleted = now > (start + duration);

  return (
    <div onClick={onClick} className="admin-exam-row">
      <div className="admin-exam-status">
        <div className={`admin-status-indicator ${isLive ? 'live' : isCompleted ? 'completed' : 'upcoming'}`} />
      </div>
      <div className="admin-exam-info">
        <div className="admin-exam-name">{exam.name || exam.title}</div>
        <div className="admin-exam-meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} color="#94a3b8" />
            {formatIST(exam.date_time, 'dateTime')}
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} color="#94a3b8" />
            {exam.duration} Minutes
          </span>
          <span>•</span>
          <span className="admin-exam-type">{(exam.type || 'Standard').toUpperCase()}</span>
          {exam.exam_code && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', color: '#0f172a', fontWeight: 700 }}>
              KEY: {exam.exam_code}
            </span>
          )}
        </div>
      </div>
      <span className={`admin-exam-badge ${isLive ? 'live' : isCompleted ? 'completed' : 'upcoming'}`}>
        {isLive ? (
          <>
            <Radio size={13} />
            LIVE PROCTORING
          </>
        ) : isCompleted ? (
          <>
            <CheckCircle2 size={13} />
            EVALUATED
          </>
        ) : (
          <>
            <Calendar size={13} />
            SCHEDULED
          </>
        )}
      </span>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const collegeId = user?.id || '';
  const storageKey = collegeId ? `cached_admin_dashboard_${collegeId}` : null;

  const [data, setData] = useState(() => {
    try {
      if (!storageKey) return null;
      const cached = sessionStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!collegeId) return;
    try {
      const cached = sessionStorage.getItem(`cached_admin_dashboard_${collegeId}`);
      if (cached) setData(JSON.parse(cached));
      else setData(null);
    } catch (_) {
      setData(null);
    }
    setLoading(true);

    adminAPI.getDashboard()
      .then(res => {
        setData(res.data);
        if (storageKey) {
          try { sessionStorage.setItem(storageKey, JSON.stringify(res.data)); } catch (_) {}
        }
      })
      .catch(() => toast.error('Failed to load college dashboard'))
      .finally(() => setLoading(false));
  }, [collegeId]);

  const { stats, upcomingExams } = data || {};
  const liveExam = upcomingExams?.find(exam => isExamStartable(exam));

  return (
    <div>
      {/* Welcome Banner */}
      <div className="admin-welcome-section">
        <div className="admin-welcome-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0a74da', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            <Building size={15} /> Institutional Cockpit
          </div>
          <h1>{user?.collegeName || user?.college_name || 'Academic Institution'} Command Center</h1>
          <p>{formatIST(new Date(), 'longDate')} · Welcome back, Administrator {user?.name}</p>
        </div>
        <div className="admin-welcome-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/exams/create')}>
            <PlusCircle size={18} />
            Schedule New Exam
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/students')}>
            <Users size={18} />
            Enroll Candidates
          </button>
        </div>
      </div>

      {/* Live Exam Fast Launch Banner */}
      {liveExam && (
        <div style={{
          background: 'linear-gradient(135deg, #0b1329 0%, #1e293b 100%)',
          borderRadius: '18px',
          padding: '20px 28px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '26px',
          boxShadow: '0 8px 24px rgba(11, 19, 41, 0.25)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Radio size={24} className="pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Assessment in Progress
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <h3 style={{ margin: '2px 0 0', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', fontWeight: 800 }}>
                {liveExam.name}
              </h3>
            </div>
          </div>

          <button 
            className="admin-btn admin-btn-success"
            onClick={() => navigate(`/admin/exams/${liveExam.id}/monitor`)}
          >
            <ShieldAlert size={18} /> Launch Real-Time Monitor
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        <StatCard 
          icon={Users} 
          label="Enrolled Candidates" 
          value={stats?.totalStudents || 0} 
          sub={`${stats?.activeStudents || stats?.totalStudents || 0} verified & active`} 
          color="#0a74da"
          trend={12}
        />
        <StatCard 
          icon={FileText} 
          label="Examinations Setup" 
          value={stats?.totalExams || 0} 
          sub={`${stats?.upcomingExams || 0} scheduled`} 
          color="#6366f1"
          trend={8}
        />
        <StatCard 
          icon={Trophy} 
          label="Completed Submissions" 
          value={stats?.totalResults || 0} 
          sub={`${stats?.passRate || 88}% overall pass rate`} 
          color="#10b981"
          trend={15}
        />
        <StatCard 
          icon={ShieldCheck} 
          label="Integrity Rating" 
          value={`${stats?.successRate || 96}%`} 
          sub="Clean Proctoring Audits" 
          color="#0284c7"
          trend={4}
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="admin-quick-actions">
        <h2 className="admin-section-title">Institutional Management Hub</h2>
        <div className="admin-actions-grid">
          <button onClick={() => navigate('/admin/students')} className="admin-action-card">
            <div className="admin-action-icon" style={{ background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)' }}>
              <Users size={22} />
            </div>
            <div className="admin-action-content">
              <h3>Candidate Registry</h3>
              <p>Enroll students, bulk upload CSV, and issue exam keys</p>
            </div>
            <div className="admin-action-arrow">
              <ArrowRight size={18} />
            </div>
          </button>
          
          <button onClick={() => navigate('/admin/exams')} className="admin-action-card">
            <div className="admin-action-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
              <FileText size={22} />
            </div>
            <div className="admin-action-content">
              <h3>Examinations Center</h3>
              <p>Configure schedules, duration, and AI proctoring rules</p>
            </div>
            <div className="admin-action-arrow">
              <ArrowRight size={18} />
            </div>
          </button>
          
          <button onClick={() => navigate('/admin/ai-questions')} className="admin-action-card">
            <div className="admin-action-icon" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
              <Brain size={22} />
            </div>
            <div className="admin-action-content">
              <h3>AI Question Studio</h3>
              <p>Generate high-rigor MCQs and coding challenges</p>
            </div>
            <div className="admin-action-arrow">
              <ArrowRight size={18} />
            </div>
          </button>
        </div>
      </div>

      {/* Upcoming & Live Assessments */}
      <div className="admin-content-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <Calendar size={22} color="#0a74da" />
            Scheduled & Active Examination Queue
          </h2>
          <button onClick={() => navigate('/admin/exams')} className="admin-view-all-btn">
            Manage All Assessments
            <Eye size={15} />
          </button>
        </div>

        {upcomingExams?.length > 0 ? (
          <div className="admin-exams-list">
            {upcomingExams.map(exam => (
              <ExamRow 
                key={exam.id} 
                exam={exam} 
                onClick={() => navigate(`/admin/exams/${exam.id}/monitor`)} 
              />
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <Calendar size={48} />
            <h3>No Active Examinations in Queue</h3>
            <p>Schedule your first assessment with AI proctoring parameters to monitor candidate telemetry in real time.</p>
            <button onClick={() => navigate('/admin/exams/create')} className="admin-btn admin-btn-primary">
              <PlusCircle size={18} />
              Create Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
