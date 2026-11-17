// src/components/admin/AdminLayout.js — Nexify Examina · College Admin Layout Shell
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import { NexifyIcon } from './NexifyIcons';
import { SidebarProvider } from '../../context/SidebarContext';
import './NexifyDashboardTheme.css';
import './AdminSidebar.css';

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // ── Theme State Management ──────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('nx-theme3');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = isDark ? 'dark' : 'light';
    try {
      localStorage.setItem('nx-theme3', isDark ? 'dark' : 'light');
    } catch (_) {}
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // ── Scroll Listener for Header Shadow ───────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Keyboard Shortcuts: Escape to close drawer, Ctrl/Cmd+K to search ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Breadcrumb resolution based on route ────────────────────
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/monitoring')) return { group: 'Command center', page: 'Live monitoring' };
    if (p.includes('/students')) return { group: 'Academic & candidates', page: 'Candidate registry' };
    if (p.includes('/exams/create')) return { group: 'Academic & candidates', page: 'Schedule examination' };
    if (p.includes('/exams')) return { group: 'Academic & candidates', page: 'Examinations center' };
    if (p.includes('/results')) return { group: 'Academic & candidates', page: 'Gradebook & audits' };
    if (p.includes('/ai-questions')) return { group: 'AI intelligence', page: 'AI question studio' };
    if (p.includes('/subscription')) return { group: 'Institutional control', page: 'License & quotas' };
    if (p.includes('/settings')) return { group: 'Institutional control', page: 'Proctoring rules & college' };
    if (p.includes('/support')) return { group: 'Institutional control', page: 'Support & helpdesk' };
    return { group: 'Command center', page: 'Dashboard overview' };
  };

  const breadcrumb = getBreadcrumb();

  const collegeName = user?.collegeName || user?.college_name || user?.name || 'Pk university';
  const initials = collegeName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PK';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (q.toLowerCase().includes('exam') || q.toLowerCase().includes('test')) {
      navigate('/admin/exams');
    } else {
      navigate('/admin/students');
    }
  };

  return (
    <SidebarProvider>
      <div className={`admin-shell ${mobileOpen ? 'open' : ''}`}>
        {/* Sidebar */}
        <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content & Top Bar */}
        <div className="main">
          <header className={`top ${isScrolled ? 'sc' : ''}`} id="top">
            <button 
              className="ib menu" 
              id="menu" 
              aria-label="Open navigation"
              onClick={() => setMobileOpen(prev => !prev)}
            >
              <NexifyIcon name="menu" />
            </button>

            <div className="crumb">
              <span>{breadcrumb.group}</span>
              <span style={{ opacity: 0.45, margin: '0 3px' }}>/</span>
              <b>{breadcrumb.page}</b>
            </div>

            <div className="sp"></div>

            <form onSubmit={handleSearchSubmit} style={{ margin: 0, padding: 0 }}>
              <label className="search">
                <NexifyIcon name="search" />
                <input 
                  ref={searchInputRef}
                  placeholder="Search candidates or exams" 
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd className="search-kbd">⌘K</kbd>
              </label>
            </form>

            <button 
              className="ib" 
              id="theme" 
              aria-label="Toggle theme"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              <NexifyIcon name={isDark ? 'sun' : 'moon'} />
            </button>

            <button 
              className="ib" 
              aria-label="Notifications"
              onClick={() => navigate('/admin/monitoring')}
              title="Notifications & Alerts"
              style={{ position: 'relative' }}
            >
              <NexifyIcon name="bell" />
              <span 
                style={{ 
                  position: 'absolute', 
                  top: '9px', 
                  right: '9px', 
                  width: '7px', 
                  height: '7px', 
                  borderRadius: '50%', 
                  background: 'var(--c1)',
                  boxShadow: '0 0 6px var(--c1)'
                }} 
              />
            </button>

            <div 
              className="me" 
              onClick={() => navigate('/admin/settings')}
              title={`Administrator: ${collegeName}`}
            >
              {initials}
            </div>
          </header>

          <main className="admin-page-outlet">
            {location.pathname.endsWith('/dashboard') || location.pathname === '/admin' ? (
              <Outlet />
            ) : (
              <div className="admin-main-content-wrapper">
                <Outlet />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
