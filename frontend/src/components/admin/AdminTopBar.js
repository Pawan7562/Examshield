// src/components/admin/AdminTopBar.js — Ultra-Modern Emerald College Admin Top Navigation Bar
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminTopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl + K or Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/admin/students?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Exam started successfully',
      sub: 'AIML – Semester III',
      time: '2m ago',
      path: '/admin/monitoring',
    },
    {
      id: 2,
      type: 'info',
      title: '482 students logged in',
      sub: 'Attendance verified via biometric & IP',
      time: '2m ago',
      path: '/admin/students',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Camera issue detected in hall B',
      sub: 'AI proctor auto-recalibrating camera stream',
      time: '5m ago',
      path: '/admin/monitoring',
    },
    {
      id: 4,
      type: 'success',
      title: 'Result published for BCA – Sem I',
      sub: 'Gradebook & rank audits compiled',
      time: '10m ago',
      path: '/admin/results',
    },
  ];

  return (
    <header className="admin-emerald-topbar">
      {/* ──── CAPSULE SEARCH BAR ──── */}
      <form onSubmit={handleSearchSubmit} className="topbar-search-form">
        <div className="topbar-search-wrapper">
          <Search size={17} className="topbar-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="topbar-search-input"
            placeholder="Search students, exams, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <kbd className="topbar-shortcut-badge">Ctrl + K</kbd>
        </div>
      </form>

      {/* ──── TOP BAR RIGHT ACTION ICONS ──── */}
      <div className="topbar-actions-group">
        {/* Notifications Icon with Badge & Popover */}
        <div className="topbar-notif-container" ref={notifRef}>
          <button
            type="button"
            className={`topbar-action-icon-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            title="System alerts & proctoring notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="notif-red-counter">3</span>
          </button>

          {showNotifications && (
            <div className="topbar-notif-dropdown">
              <div className="notif-dropdown-header">
                <div>
                  <div className="notif-dropdown-title">Recent Notifications</div>
                  <div className="notif-dropdown-sub">Live alerts from proctoring engine</div>
                </div>
                <button
                  type="button"
                  className="notif-close-btn"
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="notif-dropdown-list">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="notif-dropdown-item"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(n.path);
                    }}
                  >
                    <div className={`notif-item-icon ${n.type}`}>
                      {n.type === 'success' && <CheckCircle2 size={15} />}
                      {n.type === 'info' && <Info size={15} />}
                      {n.type === 'warning' && <AlertTriangle size={15} />}
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-sub">{n.sub}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="notif-dropdown-footer">
                <button
                  type="button"
                  className="notif-view-all-link"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/admin/monitoring');
                  }}
                >
                  <span>View All Live Telemetry</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          className="topbar-action-icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          className="topbar-action-icon-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title="Toggle display mode"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Online Status Pill / Avatar Circle */}
        <div className="topbar-status-circle" title="All Examination Systems Operational">
          <span className="status-emerald-pulse" />
        </div>
      </div>
    </header>
  );
}
