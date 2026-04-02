// src/pages/student/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          studentAPI.getExams(),
          studentAPI.getResults()
        ]);
        setExams(examsRes.data.exams || []);
        setResults(resultsRes.data.results || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcoming = exams.filter(e => e.status === 'published' && !e.session_status && new Date(e.date_time) > new Date()).slice(0, 3);
  const recent = exams.filter(e => e.session_status === 'submitted').slice(0, 3);

  // Get result for an exam
  const getResultForExam = (examId) => {
    return results.find(r => r.exam_id === examId);
  };

  const getScoreColor = (status, percentage) => {
    if (status === 'pending') return '#f59e0b';
    if (status === 'pass') return '#22c55e';
    if (status === 'fail') return '#ef4444';
    return '#6b7280';
  };

  const getGradeColor = (grade) => {
    if (grade?.includes('A')) return '#22c55e';
    if (grade?.includes('B')) return '#3b82f6';
    if (grade?.includes('C')) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28, padding: '24px 28px', background: 'linear-gradient(135deg, rgba(233,69,96,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(233,69,96,0.2)', borderRadius: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 6 }}>{user?.studentId} · {user?.collegeName}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming Exams */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Upcoming Exams</h2>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 13, color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>No upcoming exams</p>
          ) : upcoming.map(exam => (
            <div key={exam.id} onClick={() => navigate('/student/exams')} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{exam.name}</div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>{format(new Date(exam.date_time), 'dd MMM, HH:mm')} · {exam.duration} min</div>
            </div>
          ))}
          <button onClick={() => navigate('/student/exams')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif', marginTop: 8 }}>View all exams →</button>
        </div>

        {/* Recent Results */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Recent Results</h2>
          {recent.length === 0 ? (
            <p style={{ fontSize: 13, color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>No completed exams yet</p>
          ) : recent.map(exam => {
            const result = getResultForExam(exam.id);
            return (
              <div key={exam.id} onClick={() => navigate(`/student/results/${exam.id}`)} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 8, border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{exam.name}</div>
                  <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}>
                    {exam.submitted_at ? formatDistanceToNow(new Date(exam.submitted_at)) + ' ago' : 'Submitted'}
                  </div>
                  
                  {result && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Score Display */}
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: getScoreColor(result.status, result.percentage),
                        background: `${getScoreColor(result.status, result.percentage)}15`,
                        padding: '2px 8px',
                        borderRadius: 12,
                        border: `1px solid ${getScoreColor(result.status, result.percentage)}30`
                      }}>
                        {result.status === 'pending' ? 'Pending' : `${result.marks_obtained}/${result.total_marks}`}
                      </span>
                      
                      {/* Percentage */}
                      {result.status !== 'pending' && (
                        <span style={{ 
                          fontSize: 11, 
                          color: '#718096',
                          fontWeight: 500
                        }}>
                          ({result.percentage}%)
                        </span>
                      )}
                      
                      {/* Grade */}
                      {result.grade && result.status !== 'pending' && (
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 700,
                          color: getGradeColor(result.grade),
                          background: `${getGradeColor(result.grade)}15`,
                          padding: '2px 6px',
                          borderRadius: 8
                        }}>
                          {result.grade}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Status Badge */}
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  padding: '3px 10px', 
                  borderRadius: 20, 
                  background: result 
                    ? `${getScoreColor(result.status, result.percentage)}15` 
                    : 'rgba(59,130,246,0.12)', 
                  color: result 
                    ? getScoreColor(result.status, result.percentage)
                    : '#3b82f6',
                  border: result 
                    ? `1px solid ${getScoreColor(result.status, result.percentage)}30`
                    : '1px solid rgba(59,130,246,0.3)'
                }}>
                  {result ? (result.status === 'pending' ? 'EVALUATING' : result.status?.toUpperCase()) : 'SUBMITTED'}
                </span>
              </div>
            );
          })}
          <button onClick={() => navigate('/student/results')} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif', marginTop: 8 }}>View all results →</button>
        </div>
      </div>
    </div>
  );
}
