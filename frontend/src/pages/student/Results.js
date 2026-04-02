// src/pages/student/Results.js
import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { format } from 'date-fns';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getResults().then(r => setResults(r.data.results || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#4a5568' }}>Loading results...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>My Results</h1>
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#4a5568' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <p>No results published yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results.map(r => (
            <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{r.exam_name}</h3>
                  <p style={{ fontSize: 12, color: '#4a5568' }}>{r.subject} · {format(new Date(r.date_time), 'dd MMM yyyy')}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: r.status === 'pass' ? 'rgba(34,197,94,0.12)' : r.status === 'fail' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: r.status === 'pass' ? '#22c55e' : r.status === 'fail' ? '#ef4444' : '#f59e0b' }}>
                  {r.status?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                {[['Marks', `${r.marks_obtained}/${r.total_marks}`], ['Percentage', `${r.percentage}%`], ['Grade', r.grade], ['Type', r.exam_type?.toUpperCase()]].map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>{v}</div>
                    <div style={{ fontSize: 10, color: '#4a5568', marginTop: 2 }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
