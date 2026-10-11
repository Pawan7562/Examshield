// src/components/admin/AdminTopBar.js — Institutional College Admin Top Navigation Bar
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  CreditCard,
  Settings,
  Radio,
  Brain,
  Headphones,
  PlusCircle,
  ShieldCheck,
  Building2,
  LogOut,
  Clock,
  Search,
  ChevronRight
} from 'lucide-react';
import { formatIST } from '../../utils/timezone';

export default function AdminTopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock tick for live examination vigilance
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute page meta from current pathname
  const getPageMeta = (pathname) => {
    if (pathname.includes('/monitoring')) {
      return {
        section: 'Command Center',
        title: 'Live Surveillance Cockpit',
        icon: Radio,
        isLive: true
      };
    }
    if (pathname.includes('/students')) {
      return {
        section: 'Academic & Candidates',
        title: 'Candidate Registry & Enrollment',
        icon: Users
      };
    }
    if (pathname.includes('/exams/create')) {
      return {
        section: 'Examinations Center',
        title: 'Create Examination Wizard',
        icon: PlusCircle
      };
    }
    if (pathname.includes('/ai-questions')) {
      return {
        section: 'AI Intelligence',
        title: 'AI Question Studio v2',
        icon: Brain
      };
    }
    if (pathname.includes('/exams')) {
      return {
        section: 'Examinations Center',
        title: 'Examination Management',
        icon: FileText
      };
    }
    if (pathname.includes('/results')) {
      return {
        section: 'Academic & Candidates',
        title: 'Gradebook & Forensic Dossiers',
        icon: Trophy
      };
    }
    if (pathname.includes('/subscription')) {
      return {
        section: 'Institutional Control',
        title: 'License & Quota Management',
        icon: CreditCard
      };
    }
    if (pathname.includes('/settings')) {
      return {
        section: 'Institutional Control',
        title: 'Proctoring Rules & College Profile',
        icon: Settings
      };
    }
    if (pathname.includes('/support')) {
      return {
        section: 'Support',
        title: 'Institutional Helpdesk & SLA',
        icon: Headphones
      };
    }
    return {
      section: 'Command Center',
      title: 'Institutional Dashboard Overview',
      icon: LayoutDashboard
    };
  };

  const meta = getPageMeta(location.pathname);
  const PageIcon = meta.icon;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD';
  const collegeName = user?.collegeName || user?.college_name || 'Partner Institution';

  return (
    <header className="admin-topbar" role="banner">
      <div className="admin-topbar-inner">
        {/* Left: Breadcrumb Navigation */}
        <div className="admin-topbar-left">
          <div className="admin-topbar-breadcrumbs">
            <span className="topbar-crumb-section">
              <Building2 size={13} className="crumb-icon" aria-hidden="true" />
              <span>{meta.section}</span>
            </span>
            <ChevronRight size={13} className="topbar-crumb-separator" aria-hidden="true" />
            <div className="topbar-crumb-current">
              <PageIcon size={15} className={`crumb-page-icon ${meta.isLive ? 'live-icon' : ''}`} aria-hidden="true" />
              <h1>{meta.title}</h1>
            </div>
          </div>
        </div>

        {/* Right: Actions, Real-Time Telemetry & Profile */}
        <div className="admin-topbar-right">
          {/* Live Telemetry Pill */}
          <div className="admin-topbar-telemetry" title="Continuous biometric & browser monitoring status">
            <span className="telemetry-beacon">
              <span className="beacon-ping" />
              <span className="beacon-dot" />
            </span>
            <span className="telemetry-text">PROCTOR ENGINE: <strong>OPERATIONAL</strong></span>
          </div>

          {/* Real-time Clock (IST) */}
          <div className="admin-topbar-clock" title="Official examination server time (IST)">
            <Clock size={14} className="clock-icon" aria-hidden="true" />
            <span>{formatIST(currentTime, 'timeOnly')} IST</span>
          </div>

          {/* Quick Schedule Exam Action Button */}
          {location.pathname !== '/admin/exams/create' && (
            <Link
              to="/admin/exams/create"
              className="admin-topbar-action-btn primary"
              title="Schedule a new proctored exam"
            >
              <PlusCircle size={15} aria-hidden="true" />
              <span>New Exam</span>
            </Link>
          )}

          {/* Real-Time Cockpit Shortcut */}
          {!location.pathname.includes('/monitoring') && (
            <Link
              to="/admin/monitoring"
              className="admin-topbar-action-btn secondary live-cta"
              title="Open Live Surveillance Cockpit"
            >
              <Radio size={14} className="live-radio-icon" aria-hidden="true" />
              <span>Live Cockpit</span>
            </Link>
          )}

          {/* College Identity & Profile Capsule */}
          <div className="admin-topbar-user">
            <div className="admin-user-avatar" title={`Signed in as ${user?.name || 'Administrator'}`}>
              {initials}
            </div>
            <div className="admin-user-info">
              <span className="user-name">{user?.name || 'College Admin'}</span>
              <span className="college-title">{collegeName}</span>
            </div>
            <button
              type="button"
              className="admin-topbar-logout-btn"
              onClick={handleLogout}
              title="Sign out of Admin Console"
              aria-label="Sign out of Admin Console"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
