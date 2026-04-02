// src/pages/super-admin/CollegeManagement.js
import React, { useEffect, useState } from 'react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CollegeManagement() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getColleges({ search: search || undefined });
      setColleges(res.data.colleges || []);
    } catch { toast.error('Failed to load colleges'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchColleges, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleCollege = async (id, name, isActive) => {
    try {
      await superAdminAPI.toggleCollege(id);
      toast.success(`${name} ${isActive ? 'suspended' : 'activated'}`);
      fetchColleges();
    } catch { toast.error('Action failed'); }
  };

  const planColor = { basic: '#718096', standard: '#e94560', premium: '#f59e0b' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>College Management</h1>
        <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>{colleges.length} colleges registered</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search colleges..."
        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora,sans-serif', marginBottom: 16 }} />

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['College', 'Email', 'Plan', 'Students', 'Exams', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>Loading...</td></tr>
              : colleges.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>No colleges found</td></tr>
              : colleges.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#718096' }}>{c.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${planColor[c.subscription_plan] || '#718096'}22`, color: planColor[c.subscription_plan] || '#718096' }}>{c.subscription_plan?.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#a0aec0' }}>{c.student_count || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#a0aec0' }}>{c.exam_count || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#4a5568' }}>{c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: c.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: c.is_active ? '#22c55e' : '#ef4444' }}>
                      {c.is_active ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleCollege(c.id, c.name, c.is_active)} style={{ background: c.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${c.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, borderRadius: 6, padding: '5px 12px', color: c.is_active ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Sora,sans-serif' }}>
                      {c.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <style>{`input:focus{outline:none;border-color:#e94560!important;} input::placeholder{color:#4a5568;}`}</style>
    </div>
  );
}
