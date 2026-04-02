// src/components/admin/AdminLayout.js
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const nav = [
  { to: '/admin/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/admin/students', icon: '◉', label: 'Students' },
  { to: '/admin/exams', icon: '◆', label: 'Exams' },
  { to: '/admin/results', icon: '◇', label: 'Results' },
  { to: '/admin/subscription', icon: '◎', label: 'Subscription' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 240 }}>
        {/* Logo */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>⬡</span>
          {!collapsed && <span style={styles.brandText}>EXAMSHIELD</span>}
        </div>

        <button onClick={() => setCollapsed(c => !c)} style={styles.collapseBtn}>
          {collapsed ? '▶' : '◀'}
        </button>

        {/* Nav */}
        <nav style={styles.nav}>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
              {!collapsed && <span style={styles.navGlow} />}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div style={styles.userSection}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name || 'Admin'}</div>
              <div style={styles.userRole}>College Admin</div>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            ↩
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Top bar */}
        <header style={styles.header}>
          <div>
            <div style={styles.headerTitle}>Admin Dashboard</div>
            <div style={styles.headerSub}>{user?.email}</div>
          </div>
          <div style={styles.headerRight}>
            {user?.subscriptionExpired && (
              <div style={styles.expiredBadge}>
                ⚠ Subscription Expired
              </div>
            )}
            <div style={styles.planBadge}>
              {(user?.subscriptionPlan || 'basic').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; font-family: 'Sora', sans-serif; color: #e2e8f0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(233,69,96,0.3); border-radius: 2px; }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
};

const styles = {
  root: { display: 'flex', minHeight: '100vh', background: '#080810' },
  sidebar: {
    background: 'rgba(12,12,22,0.98)',
    borderRight: '1px solid rgba(233,69,96,0.15)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', left: 0, top: 0, bottom: 0,
    transition: 'width 0.2s ease',
    zIndex: 100,
    overflow: 'hidden',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  brandIcon: { fontSize: 22, color: '#e94560', flexShrink: 0 },
  brandText: {
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
    fontSize: 14, color: '#e2e8f0', letterSpacing: 2, whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'none', border: 'none', color: '#4a5568',
    cursor: 'pointer', padding: '8px 16px', fontSize: 12,
    textAlign: 'left',
  },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 12px', borderRadius: 8,
    color: '#718096', fontSize: 14, fontWeight: 500,
    transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
    cursor: 'pointer',
  },
  navActive: {
    background: 'rgba(233,69,96,0.12)',
    color: '#e94560',
    borderLeft: '2px solid #e94560',
  },
  navIcon: { fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' },
  navLabel: { whiteSpace: 'nowrap', fontSize: 13 },
  navGlow: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 2,
    background: 'transparent',
  },
  userSection: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #e94560, #9b2335)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden', minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: '#4a5568', marginTop: 2 },
  logoutBtn: {
    background: 'none', border: 'none', color: '#4a5568',
    cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0,
    transition: 'color 0.2s',
  },
  main: {
    flex: 1,
    marginLeft: 240,
    transition: 'margin-left 0.2s',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    background: 'rgba(12,12,22,0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '16px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 50,
  },
  headerTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  headerSub: { fontSize: 12, color: '#4a5568', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  expiredBadge: {
    background: 'rgba(245,101,101,0.15)', border: '1px solid rgba(245,101,101,0.3)',
    color: '#fc8181', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  },
  planBadge: {
    background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.3)',
    color: '#e94560', padding: '4px 12px', borderRadius: 20, fontSize: 11,
    fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1,
  },
  content: { flex: 1, padding: '28px', overflow: 'auto' },
};

export default AdminLayout;
