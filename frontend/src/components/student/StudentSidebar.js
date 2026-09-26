// src/components/student/StudentSidebar.js — Professional Examination Cockpit Sidebar
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { 
  Home,
  FileText,
  Trophy,
  User,
  Settings,
  Shield,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu
} from 'lucide-react';
import './StudentSidebar.css';

export default function StudentSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();

  const menuSections = [
    {
      title: 'Portal',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/student/dashboard',
        }
      ]
    },
    {
      title: 'Assessments',
      items: [
        {
          id: 'exams',
          label: 'My Assessments',
          icon: FileText,
          path: '/student/exams',
        },
        {
          id: 'results',
          label: 'Transcripts & Results',
          icon: Trophy,
          path: '/student/results',
        }
      ]
    },
    {
      title: 'Candidate',
      items: [
        {
          id: 'profile',
          label: 'Academic Profile',
          icon: User,
          path: '/student/profile',
        },
        {
          id: 'settings',
          label: 'Hardware & Security',
          icon: Settings,
          path: '/student/settings',
        }
      ]
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    closeMobileSidebar();
  };

  return (
    <>
      {/* Mobile Toggle */}
      {isMobile && (
        <button 
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Main Sidebar Shell */}
      <aside className={`student-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile-sidebar' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/student/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="sidebar-logo-icon">
              <Shield size={20} />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">ExamShield</span>
                <span className="sidebar-brand-badge">STUDENT</span>
              </div>
            )}
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Proctoring Status Pill */}
        {!isCollapsed && (
          <div className="sidebar-proctor-status">
            <div className="proctor-status-indicator">
              <span className="proctor-status-dot" />
              <span>AI Proctoring Ready</span>
            </div>
            <ShieldCheck size={15} color="#10b981" />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {menuSections.map((sec, sIdx) => (
            <div key={sIdx} className="nav-section">
              {!isCollapsed && (
                <div className="nav-section-title">{sec.title}</div>
              )}
              
              {sec.items.map((item) => {
                const active = isActivePath(item.path);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                    title={isCollapsed ? item.label : ''}
                  >
                    <IconComponent size={19} className="nav-item-icon" />
                    {!isCollapsed && (
                      <span className="nav-item-text">{item.label}</span>
                    )}
                    {active && <span className="nav-active-pill" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-user-card" onClick={() => navigate('/student/profile')}>
              <div className="user-avatar-initials">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="user-details-text">
                <span className="user-name-title">{user?.name || 'Candidate'}</span>
                <span className="user-id-subtitle">
                  {user?.roll_number || user?.enrollment_number || user?.studentId || 'Verified'}
                </span>
              </div>
            </div>
          )}

          <button 
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
