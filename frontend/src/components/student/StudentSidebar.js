// src/components/student/StudentSidebar.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { 
  Home,
  BookOpen,
  Trophy,
  User,
  Settings,
  FileText,
  Calendar,
  Clock,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import './StudentSidebar.css';

export default function StudentSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();

  const menuItems = [
    {
      section: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/student/dashboard',
          badge: null
        }
      ]
    },
    {
      section: 'Academics',
      items: [
        {
          id: 'exams',
          label: 'My Exams',
          icon: FileText,
          path: '/student/exams',
          badge: null
        },
        {
          id: 'results',
          label: 'Results',
          icon: Trophy,
          path: '/student/results',
          badge: null
        }
      ]
    },
    {
      section: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          path: '/student/profile',
          badge: null
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/student/settings',
          badge: null
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
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button 
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
          <span>Menu</span>
        </button>
      )}

      {/* Sidebar */}
      <aside className={`student-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile-sidebar' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">EXAMSHIELD</div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="sidebar-user-profile">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">Student</div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              <div className="nav-section-title">
                {!isCollapsed && section.section}
              </div>
              
              {section.items.map((item) => (
                <a
                  key={item.id}
                  href={item.path}
                  className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className="nav-item-icon" />
                  {!isCollapsed && (
                    <span className="nav-item-text">{item.label}</span>
                  )}
                  {item.badge && (
                    <span className="nav-item-badge">{item.badge}</span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button 
            className="nav-item logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} className="nav-item-icon" />
            {!isCollapsed && <span className="nav-item-text">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
