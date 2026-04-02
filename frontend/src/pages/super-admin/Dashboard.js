// src/pages/super-admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { superAdminAPI } from '../../services/api';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    superAdminAPI.getDashboard().then(r => setData(r.data)).catch(() => {});
  }, []);

  const { stats, recentColleges, planDistribution } = data || {};

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>Platform Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          ['Total Colleges', stats?.totalColleges, '#e94560'],
          ['Active Colleges', stats?.activeColleges, '#22c55e'],
          ['Total Students', stats?.totalStudents, '#8b5cf6'],
          ['Total Revenue', `₹${(stats?.totalRevenue || 0).toLocaleString()}`, '#f59e0b'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value ?? '—'}</div>
            <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Recent Registrations</h2>
        {(recentColleges || []).map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>{c.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(233,69,96,0.12)', color: '#e94560' }}>{c.subscription_plan?.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: '#4a5568' }}>{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
