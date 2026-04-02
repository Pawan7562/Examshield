// src/pages/student/ExamList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { format } from 'date-fns';

const statusConfig = {
  published: { label: 'UPCOMING', color: '#e94560', bg: 'rgba(233,69,96,0.12)' },
  active: { label: 'LIVE NOW', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  completed: { label: 'ENDED', color: '#718096', bg: 'rgba(113,128,150,0.12)' },
};

const sessionConfig = {
  submitted: { label: 'SUBMITTED', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  terminated: { label: 'TERMINATED', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  active: { label: 'IN PROGRESS', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getExams().then(r => setExams(r.data.exams || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e => {
    if (filter === 'upcoming') return e.status === 'published' && !e.session_status;
    if (filter === 'completed') return e.session_status === 'submitted' || e.session_status === 'terminated';
    return true;
  });

  const canStart = (exam) => {
    if (exam.session_status === 'submitted' || exam.session_status === 'terminated') return false;
    if (exam.status === 'completed') return false;
    const now = new Date();
    const start = new Date(exam.date_time);
    const end = new Date(start.getTime() + exam.duration * 60000);
    return now >= new Date(start.getTime() - 15 * 60000) && now <= end;
  };

  const getStatus = (exam) => {
    if (exam.session_status) return sessionConfig[exam.session_status] || { label: exam.session_status.toUpperCase(), color: '#718096', bg: 'rgba(113,128,150,0.12)' };
    return statusConfig[exam.status] || { label: exam.status.toUpperCase(), color: '#718096', bg: 'rgba(113,128,150,0.12)' };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#4a5568' }}>Loading exams...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>My Exams</h1>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>{exams.length} exams assigned</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'upcoming', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#e94560' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 20,
              padding: '6px 16px', color: filter === f ? 'white' : '#718096', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Sora, sans-serif', textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#4a5568' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <p>No exams found</p>
          </div>
        ) : filtered.map(exam => {
          const st = getStatus(exam);
          const startable = canStart(exam);
          return (
            <div key={exam.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{exam.name}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    ['Subject', exam.subject],
                    ['Type', exam.type?.toUpperCase()],
                    ['Date', format(new Date(exam.date_time), 'dd MMM yyyy, HH:mm')],
                    ['Duration', `${exam.duration} min`],
                    ['Marks', exam.total_marks],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 12, color: '#4a5568' }}>
                      <strong style={{ color: '#718096' }}>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
                {exam.result_status && exam.result_status !== 'pending' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: exam.result_status === 'pass' ? '#22c55e' : '#ef4444' }}>
                    Result: {exam.marks_obtained} / {exam.total_marks} marks — {exam.result_status.toUpperCase()}
                  </div>
                )}
              </div>
              {startable ? (
                <button onClick={() => navigate(`/student/exam/${exam.id}`)} style={{ background: 'linear-gradient(135deg,#e94560,#c62a47)', border: 'none', borderRadius: 10, padding: '12px 24px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif', whiteSpace: 'nowrap' }}>
                  Start Exam →
                </button>
              ) : exam.session_status === 'active' ? (
                <button onClick={() => navigate(`/student/exam/${exam.id}`)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '12px 24px', color: '#f59e0b', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
                  Resume →
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
