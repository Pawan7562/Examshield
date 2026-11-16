// src/components/admin/AdminSidebar.js — Ultra-Modern Emerald College Admin Sidebar
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Radio,
  Trophy,
  FileText,
  Settings,
  Bell,
  HelpCircle,
  Crown,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  ArrowRight,
  Menu,
  Shield
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();

  // Exactly matching navigation items from the design
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: Calendar,
      path: '/admin/exams',
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      path: '/admin/students',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Radio,
      path: '/admin/monitoring',
      hasDot: true,
    },
    {
      id: 'results',
      label: 'Results',
      icon: Trophy,
      path: '/admin/results',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      path: '/admin/results',
    },
    {
      id: 'settings',
      label: 'College Settings',
      icon: Settings,
      path: '/admin/settings',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/admin/support',
      badge: 3,
    },
    {
      id: 'support',
      label: 'Help & Support',
      icon: HelpCircle,
      path: '/admin/support',
    },
  ];

  const isActivePath = (path, id) => {
    if (id === 'dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin' || location.pathname === '/admin/';
    }
    if (id === 'reports') {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) closeMobileSidebar();
  };

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'PA';

  return (
    <>
      {/* Mobile Menu Toggle Floating Bar */}
      {isMobile && (
        <button
          className="admin-mobile-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
          <span>Admin Menu</span>
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isMobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={closeMobileSidebar}
        />
      )}

      <aside className={`admin-emerald-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobileOpen ? 'open' : ''}`}>
        {/* Background Ambient Cyber-Teal Aurora Glow */}
        <div className="sidebar-aurora-glow" aria-hidden="true" />

        {/* ──── BRAND HEADER ──── */}
        <div className="sidebar-brand-container">
          <div className="brand-monogram-box" onClick={() => navigate('/admin/dashboard')}>
            <span className="brand-monogram-letter">N</span>
          </div>

          {!isCollapsed && (
            <div className="brand-details" onClick={() => navigate('/admin/dashboard')}>
              <div className="brand-title-row">
                <span className="brand-title-main">Nexify Examina</span>
              </div>
              <div className="brand-sub-row">
                <span className="brand-subtitle">Exam Monitoring System</span>
                <span className="brand-version-pill">v2.0</span>
              </div>
            </div>
          )}

          <button
            className="sidebar-collapse-toggle"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar Collapse"
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* ──── NAVIGATION MENU ──── */}
        <nav className="sidebar-nav-container">
          {navItems.map((item) => {
            const active = isActivePath(item.path, item.id);
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="nav-item-icon-box">
                  <IconComponent size={18} />
                </div>

                {!isCollapsed && (
                  <span className="nav-item-label">{item.label}</span>
                )}

                {!isCollapsed && item.hasDot && (
                  <span className="nav-item-live-dot" />
                )}

                {!isCollapsed && item.badge && (
                  <span className="nav-item-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ──── BOTTOM PLAN WIDGET & USER PROFILE ──── */}
        <div className="sidebar-footer-container">
          {!isCollapsed && (
            <div className="sidebar-plan-widget" onClick={() => navigate('/admin/subscription')}>
              <div className="plan-widget-header">
                <div className="plan-crown-icon">
                  <Crown size={18} />
                </div>
                <div>
                  <div className="plan-widget-title">Premium Plan</div>
                  <div className="plan-widget-desc">Unlock advanced features</div>
                </div>
              </div>
              <button
                type="button"
                className="plan-upgrade-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/admin/subscription');
                }}
              >
                <span>Upgrade Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* User Profile Pill */}
          <div className="sidebar-user-card">
            <div className="user-avatar-pill">
              {initials}
            </div>

            {!isCollapsed && (
              <div className="user-text-stack">
                <div className="user-display-name">
                  <span>{user?.name || 'Pawan Kumar Yadav'}</span>
                  <ChevronDown size={14} className="user-chevron" />
                </div>
                <div className="user-role-label">College Admin</div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out of administrative portal"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
