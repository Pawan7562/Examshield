// src/pages/admin/ExamManagement.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors = {
  draft: '#718096', published: '#f59e0b', active: '#22c55e', completed: '#3b82f6', cancelled: '#ef4444',
};

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetch = () => {
    setLoading(true);
    adminAPI.getExams({ status: filter === 'all' ? undefined : filter, limit: 50 })
      .then(r => setExams(r.data.exams || []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filter]);

  const publish = async (id, name) => {
    try { await adminAPI.publishExam(id); toast.success(`${name} published!`); fetch(); }
    catch (err) { toast.error(err.message || 'Failed to publish'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Exam Management</h1>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>{exams.length} exams</p>
        </div>
        <button onClick={() => navigate('/admin/exams/create')} style={{ background: 'linear-gradient(135deg,#e94560,#c62a47)', border: 'none', borderRadius: 8, padding: '10px 20px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
          + Create Exam
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'draft', 'published', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#e94560' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 20, padding: '6px 14px', color: filter === f ? 'white' : '#718096', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>Loading...</div>
          : exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#4a5568' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p>No exams found. <button onClick={() => navigate('/admin/exams/create')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Create one →</button></p>
            </div>
          ) : exams.map(exam => (
            <div key={exam.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{exam.name}</h3>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${statusColors[exam.status]}22`, color: statusColors[exam.status] }}>
                    {exam.status?.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[
                    [exam.type?.toUpperCase()],
                    [format(new Date(exam.date_time), 'dd MMM, HH:mm')],
                    [`${exam.duration} min`],
                    [`${exam.total_marks} marks`],
                    [`${exam.question_count || 0} questions`],
                    [`${exam.student_count || 0} students`],
                  ].map(([v], i) => <span key={i} style={{ fontSize: 12, color: '#4a5568' }}>{v}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate(`/admin/exams/${exam.id}/questions`)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#a0aec0', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif' }}>Questions</button>
                {exam.status === 'draft' && (
                  <button onClick={() => publish(exam.id, exam.name)} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 14px', color: '#f59e0b', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif' }}>Publish</button>
                )}
                {(exam.status === 'active' || exam.status === 'published') && (
                  <button onClick={() => navigate(`/admin/exams/${exam.id}/monitor`)} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '8px 14px', color: '#22c55e', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif' }}>
                    ● Monitor
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
