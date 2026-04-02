// src/components/student/StudentLayout.js
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/student/login'); };

  const nav = [
    { to: '/student/dashboard', icon: '◈', label: 'Dashboard' },
    { to: '/student/exams', icon: '◆', label: 'My Exams' },
    { to: '/student/results', icon: '◇', label: 'Results' },
    { to: '/student/profile', icon: '◉', label: 'Profile' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810', fontFamily: 'Sora, sans-serif' }}>
      <aside style={{ width: 220, background: 'rgba(12,12,22,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0 }}>
        <div style={{ padding: '22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, color: '#e94560' }}>⬡</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#e2e8f0', letterSpacing: 2 }}>EXAMSHIELD</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
              color: isActive ? '#e94560' : '#718096', fontSize: 13, fontWeight: 500, marginBottom: 4,
              background: isActive ? 'rgba(233,69,96,0.1)' : 'transparent',
              borderLeft: isActive ? '2px solid #e94560' : '2px solid transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            })}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#9b2335)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0 }}>
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: '#4a5568', fontFamily: 'monospace' }}>{user?.studentId}</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 14 }}>↩</button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 220, padding: '28px 32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap'); a{text-decoration:none;}`}</style>
    </div>
  );
}
