// src/pages/admin/Results.js
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Results() {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getExams({ status: 'completed', limit: 100 }).then(r => setExams(r.data.exams || [])).catch(() => {});
    fetchResults();
  }, []);

  const fetchResults = async (examId) => {
    setLoading(true);
    try {
      const r = await adminAPI.getResults({ examId });
      setResults(r.data.results || []);
    } catch { toast.error('Failed to load results'); }
    finally { setLoading(false); }
  };

  const publishAll = async () => {
    if (!selectedExam) return toast.error('Select an exam first');
    try {
      await adminAPI.publishResults(selectedExam);
      toast.success('Results published and students notified!');
    } catch (err) { toast.error(err.message || 'Failed to publish'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Results</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedExam} onChange={e => { setSelectedExam(e.target.value); fetchResults(e.target.value || undefined); }}
            style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif', minWidth: 200 }}>
            <option value="">All Exams</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {selectedExam && (
            <button onClick={publishAll} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '8px 16px', color: '#22c55e', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Sora, sans-serif' }}>
              📢 Publish Results
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student', 'Exam', 'Marks', 'Percentage', 'Grade', 'Status', 'Published'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>Loading...</td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>No results found</td></tr>
            ) : results.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{r.student_name}</div>
                  <div style={{ fontSize: 11, color: '#4a5568' }}>{r.roll_no}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#a0aec0' }}>{r.exam_name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{r.marks_obtained}/{r.total_marks}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#e2e8f0' }}>{r.percentage}%</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#e94560' }}>{r.grade}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: r.status === 'pass' ? 'rgba(34,197,94,0.12)' : r.status === 'fail' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: r.status === 'pass' ? '#22c55e' : r.status === 'fail' ? '#ef4444' : '#f59e0b' }}>
                    {r.status?.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 10, color: r.is_published ? '#22c55e' : '#4a5568' }}>{r.is_published ? '✓ Yes' : 'No'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
