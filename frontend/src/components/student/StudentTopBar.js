// src/components/student/StudentTopBar.js — Sticky Industry-Grade Command & Navigation Bar
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  Search,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  Menu,
  X,
  Command,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import './StudentTopBar.css';

export default function StudentTopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when search modal opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Breadcrumb computation
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      return { section: 'Portal', current: 'Dashboard' };
    }
    if (path.includes('/exams')) {
      return { section: 'Assessments', current: 'My Assessments' };
    }
    if (path.includes('/results')) {
      return { section: 'Assessments', current: 'Transcripts & Results' };
    }
    if (path.includes('/profile')) {
      return { section: 'Candidate', current: 'Academic Profile' };
    }
    if (path.includes('/settings')) {
      return { section: 'Candidate', current: 'Hardware & Security' };
    }
    return { section: 'Student Portal', current: 'Overview' };
  };

  const breadcrumbs = getBreadcrumbs();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/student/exams?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const quickNav = (path) => {
    navigate(path);
    setSearchOpen(false);
    setUserMenuOpen(false);
  };

  const notifications = [
    {
      id: 1,
      title: 'AI Proctoring Cleared',
      desc: 'Your webcam & microphone passed pre-flight security checks.',
      time: '10m ago',
      read: false
    },
    {
      id: 2,
      title: 'Assessment Schedule Confirmed',
      desc: 'Final Term examination slots have been published by your college.',
      time: '1h ago',
      read: true
    }
  ];

  return (
    <header className="es-topbar">
      <div className="es-topbar-left">
        {isMobile && (
          <button
            className="es-topbar-mobile-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="es-breadcrumbs" aria-label="Breadcrumb navigation">
          <span className="es-breadcrumb-root">{breadcrumbs.section}</span>
          <span className="es-breadcrumb-divider" aria-hidden="true">/</span>
          <span className="es-breadcrumb-current">{breadcrumbs.current}</span>
        </div>
      </div>

      {/* Center Search / Command Trigger */}
      <div className="es-topbar-center">
        <button
          className="es-search-trigger"
          onClick={() => setSearchOpen(true)}
          aria-label="Quick search or jump to assessment"
        >
          <Search size={15} className="es-search-icon" aria-hidden="true" />
          <span className="es-search-placeholder">Search assessments, subjects, keys...</span>
          <kbd className="es-search-kbd">
            <span style={{ fontSize: '0.7rem' }}>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="es-topbar-right">
        {/* Live Proctoring Status Chip */}
        <div 
          className="es-readiness-chip"
          onClick={() => navigate('/student/settings')}
          title="Click to view hardware diagnostics"
        >
          <span className="es-readiness-dot" />
          <span className="es-readiness-text">Hardware Ready</span>
        </div>

        {/* Live Clock */}
        <div className="es-clock-chip" title="Official Examination Timezone">
          <Clock size={13} className="es-clock-icon" aria-hidden="true" />
          <span className="es-tabular">{currentTime || 'IST Active'}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          className="es-icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={17} className="es-theme-sun" />
          ) : (
            <Moon size={17} className="es-theme-moon" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="es-dropdown-container" ref={notifRef}>
          <button
            className="es-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="View notifications"
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            <span className="es-notif-badge" />
          </button>

          {notifOpen && (
            <div className="es-notif-dropdown">
              <div className="es-dropdown-header">
                <span className="es-dropdown-title">System Notifications</span>
                <span className="es-badge-sm">2 Recent</span>
              </div>
              <div className="es-notif-list">
                {notifications.map((n) => (
                  <div key={n.id} className={`es-notif-item ${!n.read ? 'unread' : ''}`}>
                    <div className="es-notif-icon">
                      <ShieldCheck size={16} color="#10b981" />
                    </div>
                    <div className="es-notif-content">
                      <div className="es-notif-item-title">{n.title}</div>
                      <div className="es-notif-item-desc">{n.desc}</div>
                      <div className="es-notif-item-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="es-dropdown-container" ref={userMenuRef}>
          <button
            className="es-user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="Open candidate account menu"
            aria-expanded={userMenuOpen}
          >
            <div className="es-avatar-ring">
              <span className="es-avatar-letter">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </span>
            </div>
            <ChevronDown size={14} className="es-user-chevron" />
          </button>

          {userMenuOpen && (
            <div className="es-user-menu-dropdown">
              <div className="es-menu-header">
                <div className="es-menu-name">{user?.name || 'Candidate'}</div>
                <div className="es-menu-id es-mono">
                  {user?.roll_number || user?.enrollment_number || user?.studentId || 'Verified Student'}
                </div>
              </div>
              <div className="es-menu-divider" />
              <button
                className="es-menu-item"
                onClick={() => quickNav('/student/profile')}
              >
                <User size={15} />
                <span>Academic Profile</span>
              </button>
              <button
                className="es-menu-item"
                onClick={() => quickNav('/student/settings')}
              >
                <Settings size={15} />
                <span>Hardware & Security</span>
              </button>
              <button
                className="es-menu-item"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
              <div className="es-menu-divider" />
              <button
                className="es-menu-item es-menu-danger"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  navigate('/student/login');
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Command Palette / Search Modal */}
      {searchOpen && (
        <div className="es-modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="es-command-palette" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit} className="es-palette-form">
              <Search size={18} className="es-palette-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search assessments by title, subject, or access key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="es-palette-input"
              />
              <button
                type="button"
                className="es-palette-close"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <kbd>ESC</kbd>
              </button>
            </form>

            <div className="es-palette-suggestions">
              <div className="es-palette-section-label">Quick Jump</div>
              <button
                className="es-palette-item"
                onClick={() => quickNav('/student/dashboard')}
              >
                <span>Dashboard Overview</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="es-palette-item"
                onClick={() => quickNav('/student/exams')}
              >
                <span>My Assigned Assessments</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="es-palette-item"
                onClick={() => quickNav('/student/results')}
              >
                <span>Transcripts & Grade Reports</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="es-palette-item"
                onClick={() => quickNav('/student/settings')}
              >
                <span>Run Hardware Diagnostics Check</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
