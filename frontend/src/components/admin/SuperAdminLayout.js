// src/components/admin/SuperAdminLayout.js
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SuperAdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/super-admin/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810', fontFamily: 'Sora, sans-serif' }}>
      <aside style={{ width: 220, background: 'rgba(12,12,22,0.98)', borderRight: '1px solid rgba(233,69,96,0.15)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0 }}>
        <div style={{ padding: '22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e94560', letterSpacing: 2 }}>EXAMSHIELD</div>
          <div style={{ fontSize: 10, color: '#4a5568', marginTop: 2 }}>Super Admin Panel</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {[
            { to: '/super-admin/dashboard', icon: '◈', label: 'Dashboard' },
            { to: '/super-admin/colleges', icon: '◉', label: 'Colleges' },
          ].map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
              color: isActive ? '#e94560' : '#718096', fontSize: 13, fontWeight: 500, marginBottom: 4,
              background: isActive ? 'rgba(233,69,96,0.1)' : 'transparent',
              borderLeft: isActive ? '2px solid #e94560' : '2px solid transparent',
              textDecoration: 'none',
            })}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} style={{ margin: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px', color: '#ef4444', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 12 }}>
          Logout ↩
        </button>
      </aside>
      <main style={{ flex: 1, marginLeft: 220, padding: '28px 32px' }}>
        <Outlet />
      </main>
      <style>{`a{text-decoration:none;}`}</style>
    </div>
  );
}

// ─── src/pages/super-admin/Dashboard.js ───────────────────────────────────────
// Note: Export as named file but combined here for brevity
