// src/components/admin/AdminSidebar.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { 
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Shield,
  BookOpen,
  Activity,
  Database,
  Bell,
  TrendingUp,
  Menu,
  Brain,
  Sparkles
} from 'lucide-react';
import './AdminSidebar.css';

export default function AdminSidebar() {
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
          icon: LayoutDashboard,
          path: '/admin/dashboard',
          badge: null
        }
      ]
    },
    {
      section: 'Management',
      items: [
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          path: '/admin/students',
          badge: null
        },
        {
          id: 'exams',
          label: 'Exams',
          icon: FileText,
          path: '/admin/exams',
          badge: null
        },
        {
          id: 'results',
          label: 'Results',
          icon: Trophy,
          path: '/admin/results',
          badge: null
        }
      ]
    },
    {
      section: 'AI Tools',
      items: [
        {
          id: 'ai-questions',
          label: 'AI Question Generator',
          icon: Brain,
          path: '/admin/ai-questions',
          badge: null,
          highlight: true
        }
      ]
    },
    {
      section: 'System',
      items: [
        {
          id: 'subscription',
          label: 'Subscription',
          icon: CreditCard,
          path: '/admin/subscription',
          badge: null
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/admin/settings',
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
    navigate('/admin/login');
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
          className="admin-mobile-menu-toggle"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
          <span>Menu</span>
        </button>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile-sidebar' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-text">EXAMSHIELD</div>
            <div className="admin-sidebar-logo-badge">ADMIN</div>
          </div>
          <button 
            className="admin-sidebar-toggle"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="admin-sidebar-user-profile">
            <div className="admin-user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name">{user?.name}</div>
              <div className="admin-user-role">College Admin</div>
              <div className="admin-user-plan">
                {(user?.subscriptionPlan || 'Basic').toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="admin-sidebar-nav">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="admin-nav-section">
              <div className="admin-nav-section-title">
                {!isCollapsed && section.section}
              </div>
              
              {section.items.map((item) => (
                <a
                  key={item.id}
                  href={item.path}
                  className={`admin-nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className="admin-nav-item-icon" />
                  {!isCollapsed && (
                    <span className="admin-nav-item-text">{item.label}</span>
                  )}
                  {item.badge && (
                    <span className="admin-nav-item-badge">{item.badge}</span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button 
            className="admin-nav-item admin-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} className="admin-nav-item-icon" />
            {!isCollapsed && <span className="admin-nav-item-text">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
