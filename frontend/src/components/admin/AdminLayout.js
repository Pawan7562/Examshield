// src/components/admin/AdminLayout.js — Nexify Examina · College Admin Layout Shell
import React, { useState, useEffect } from 'react';
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

  // ── Palette State Management ────────────────────────────────
  const [palette, setPalette] = useState(() => {
    try {
      return localStorage.getItem('nx-pal') || 'blue';
    } catch (_) {
      return 'blue';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    try {
      localStorage.setItem('nx-pal', palette);
    } catch (_) {}
  }, [palette]);

  // ── Theme State Management ──────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('nx-theme6') || localStorage.getItem('nx-theme3');
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
      localStorage.setItem('nx-theme6', isDark ? 'dark' : 'light');
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

  // ── Escape Key Listener for Mobile Drawer ───────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
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
              {breadcrumb.group} / <b>{breadcrumb.page}</b>
            </div>

            <div className="sp"></div>

            <form onSubmit={handleSearchSubmit} style={{ margin: 0, padding: 0 }}>
              <label className="search">
                <NexifyIcon name="search" />
                <input 
                  placeholder="Search candidates or exams" 
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
            </form>

            {/* 4 Multi-Palette Switcher */}
            <div className="pals" role="group" aria-label="Color palette">
              <button 
                className="pal" 
                data-p="blue" 
                aria-pressed={palette === 'blue'} 
                aria-label="Royal blue palette" 
                title="Royal blue" 
                style={{ background: 'linear-gradient(135deg, #2563eb 50%, #17306b 50%)' }}
                onClick={() => setPalette('blue')}
              />
              <button 
                className="pal" 
                data-p="indigo" 
                aria-pressed={palette === 'indigo'} 
                aria-label="Indigo palette" 
                title="Indigo" 
                style={{ background: 'linear-gradient(135deg, #6d4ae0 50%, #d946a8 50%)' }}
                onClick={() => setPalette('indigo')}
              />
              <button 
                className="pal" 
                data-p="gold" 
                aria-pressed={palette === 'gold'} 
                aria-label="Obsidian gold palette" 
                title="Obsidian gold" 
                style={{ background: 'linear-gradient(135deg, #b8892b 50%, #15161a 50%)' }}
                onClick={() => setPalette('gold')}
              />
              <button 
                className="pal" 
                data-p="coral" 
                aria-pressed={palette === 'coral'} 
                aria-label="Coral palette" 
                title="Coral" 
                style={{ background: 'linear-gradient(135deg, #d1432b 50%, #2f7f9e 50%)' }}
                onClick={() => setPalette('coral')}
              />
            </div>

            {/* Dark / Light Mode Toggle */}
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
              title="Notifications"
            >
              <NexifyIcon name="bell" />
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
