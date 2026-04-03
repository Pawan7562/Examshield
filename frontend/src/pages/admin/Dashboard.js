// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Users, 
  FileText, 
  Trophy, 
  Calendar, 
  Activity, 
  TrendingUp,
  Clock,
  BarChart3,
  PlusCircle,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const StatCard = ({ icon: Icon, label, value, sub, color = '#e94560', trend }) => (
  <div className="admin-content-card admin-stat-card">
    <div className="admin-stat-header">
      <div className="admin-stat-icon" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`admin-stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? <TrendingUp size={16} /> : <Activity size={16} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="admin-stat-value">{value ?? '—'}</div>
    <div className="admin-stat-label">{label}</div>
    {sub && <div className="admin-stat-sub">{sub}</div>}
  </div>
);

const ExamRow = ({ exam, onClick }) => {
  const now = new Date();
  const examDate = new Date(exam.date_time);
  const isLive = examDate <= now && new Date(examDate.getTime() + exam.duration * 60000) >= now;
  const isCompleted = new Date(examDate.getTime() + exam.duration * 60000) < now;

  return (
    <div onClick={onClick} className="admin-exam-row">
      <div className="admin-exam-status">
        <div className={`admin-status-indicator ${isLive ? 'live' : isCompleted ? 'completed' : 'upcoming'}`} />
      </div>
      <div className="admin-exam-info">
        <div className="admin-exam-name">{exam.name}</div>
        <div className="admin-exam-meta">
          <Calendar size={14} />
          {format(examDate, 'dd MMM yyyy, HH:mm')}
          <Clock size={14} />
          {exam.duration} min
          <span className="admin-exam-type">{exam.type.toUpperCase()}</span>
        </div>
      </div>
      <span className={`admin-exam-badge ${isLive ? 'live' : isCompleted ? 'completed' : 'upcoming'}`}>
        {isLive ? (
          <>
            <Activity size={12} />
            LIVE
          </>
        ) : isCompleted ? (
          <>
            <CheckCircle size={12} />
            COMPLETED
          </>
        ) : (
          <>
            <Calendar size={12} />
            UPCOMING
          </>
        )}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading-container"><div className="admin-loading-spinner"></div></div>;

  const { stats, upcomingExams } = data || {};

  return (
    <div className="admin-pages-container">
      {/* Welcome Section */}
      <div className="admin-welcome-section">
        <div className="admin-welcome-content">
          <h1>Admin Dashboard</h1>
          <p>{format(new Date(), 'EEEE, MMMM d, yyyy')} · Welcome back, {user?.name}</p>
        </div>
        <div className="admin-welcome-actions">
          <button className="admin-btn" onClick={() => navigate('/admin/exams/create')}>
            <PlusCircle size={20} />
            Create Exam
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/students')}>
            <Users size={20} />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatCard 
          icon={Users} 
          label="Total Students" 
          value={stats?.totalStudents} 
          sub={`${stats?.activeStudents} active`} 
          color="#e94560"
          trend={12}
        />
        <StatCard 
          icon={FileText} 
          label="Total Exams" 
          value={stats?.totalExams} 
          sub={`${stats?.upcomingExams} upcoming`} 
          color="#8b5cf6"
          trend={8}
        />
        <StatCard 
          icon={Trophy} 
          label="Total Results" 
          value={stats?.totalResults} 
          sub={`${stats?.passRate}% pass rate`} 
          color="#22c55e"
          trend={15}
        />
        <StatCard 
          icon={BarChart3} 
          label="Success Rate" 
          value={`${stats?.successRate || 92}%`} 
          sub="Above target" 
          color="#f59e0b"
          trend={5}
        />
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-actions-grid">
          <button onClick={() => navigate('/admin/students')} className="admin-action-card">
            <div className="admin-action-icon" style={{ background: 'linear-gradient(135deg, #e94560 0%, #9b2335 100%)' }}>
              <Users size={24} />
            </div>
            <div className="admin-action-content">
              <h3>Student Management</h3>
              <p>Add, edit, and manage students</p>
            </div>
            <div className="admin-action-arrow">
              <Eye size={20} />
            </div>
          </button>
          
          <button onClick={() => navigate('/admin/exams')} className="admin-action-card">
            <div className="admin-action-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
              <FileText size={24} />
            </div>
            <div className="admin-action-content">
              <h3>Exam Management</h3>
              <p>Create and manage examinations</p>
            </div>
            <div className="admin-action-arrow">
              <Eye size={20} />
            </div>
          </button>
          
          <button onClick={() => navigate('/admin/results')} className="admin-action-card">
            <div className="admin-action-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #047857 100%)' }}>
              <Trophy size={24} />
            </div>
            <div className="admin-action-content">
              <h3>Results Analysis</h3>
              <p>View and analyze exam results</p>
            </div>
            <div className="admin-action-arrow">
              <Eye size={20} />
            </div>
          </button>
        </div>
      </div>

      {/* Upcoming & Live Exams */}
      <div className="admin-content-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Upcoming & Live Exams</h2>
          <button onClick={() => navigate('/admin/exams')} className="admin-view-all-btn">
            View all
            <Eye size={16} />
          </button>
        </div>
        {upcomingExams?.length > 0 ? (
          <div className="admin-exams-list">
            {upcomingExams.map(exam => (
              <ExamRow key={exam.id} exam={exam} onClick={() => navigate(`/admin/exams/${exam.id}/monitor`)} />
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <Calendar size={48} />
            <h3>No upcoming exams</h3>
            <p>There are no exams scheduled. Create your first exam to get started.</p>
            <button onClick={() => navigate('/admin/exams/create')} className="admin-btn">
              <PlusCircle size={20} />
              Create Exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
