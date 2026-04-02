// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, sub, color = '#e94560' }) => (
  <div style={{
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '20px 24px', position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', right: 20, top: 20, fontSize: 28, opacity: 0.15, color }}>
      {icon}
    </div>
    <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
      {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>
      {value ?? '—'}
    </div>
    {sub && <div style={{ fontSize: 12, color: '#4a5568', marginTop: 6 }}>{sub}</div>}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
  </div>
);

const ExamRow = ({ exam, onClick }) => {
  const now = new Date();
  const examDate = new Date(exam.date_time);
  const isLive = examDate <= now && new Date(examDate.getTime() + exam.duration * 60000) >= now;

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
      background: 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color 0.2s',
      marginBottom: 8,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isLive ? '#22c55e' : '#e94560',
        boxShadow: isLive ? '0 0 8px #22c55e' : 'none',
        animation: isLive ? 'pulse 1.5s infinite' : 'none',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{exam.name}</div>
        <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>
          {format(examDate, 'dd MMM yyyy, HH:mm')} · {exam.duration} min · {exam.type.toUpperCase()}
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
        background: isLive ? 'rgba(34,197,94,0.15)' : 'rgba(233,69,96,0.12)',
        color: isLive ? '#22c55e' : '#e94560', letterSpacing: 1,
      }}>
        {isLive ? '● LIVE' : 'UPCOMING'}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const { stats, upcomingExams } = data || {};

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Dashboard Overview</h1>
        <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="◉" label="Total Students" value={stats?.totalStudents} sub={`${stats?.activeStudents} active`} color="#e94560" />
        <StatCard icon="◆" label="Total Exams" value={stats?.totalExams} color="#8b5cf6" />
        <StatCard icon="◇" label="Total Results" value={stats?.totalResults} color="#22c55e" />
        <StatCard icon="◈" label="Upcoming Exams" value={upcomingExams?.length} color="#f59e0b" />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Add Student', icon: '➕', to: '/admin/students', color: '#e94560' },
          { label: 'Create Exam', icon: '📝', to: '/admin/exams/create', color: '#8b5cf6' },
          { label: 'View Results', icon: '📊', to: '/admin/results', color: '#22c55e' },
        ].map(({ label, icon, to, color }) => (
          <button key={to} onClick={() => navigate(to)} style={{
            background: `rgba(${color === '#e94560' ? '233,69,96' : color === '#8b5cf6' ? '139,92,246' : '34,197,94'},0.08)`,
            border: `1px solid ${color}30`,
            borderRadius: 10, padding: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.15s', color: '#e2e8f0', fontFamily: 'Sora, sans-serif',
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Upcoming Exams */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Upcoming & Live Exams</h2>
          <button onClick={() => navigate('/admin/exams')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12 }}>
            View all →
          </button>
        </div>
        {upcomingExams?.length > 0 ? (
          upcomingExams.map(exam => (
            <ExamRow key={exam.id} exam={exam} onClick={() => navigate(`/admin/exams/${exam.id}/monitor`)} />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: '#4a5568', fontSize: 13 }}>
            No upcoming exams. <button onClick={() => navigate('/admin/exams/create')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontWeight: 600 }}>Create one →</button>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
    <div style={{ width: 36, height: 36, border: '3px solid rgba(233,69,96,0.2)', borderTopColor: '#e94560', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default Dashboard;
