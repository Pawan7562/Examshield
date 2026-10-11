// src/components/admin/AdminSidebar.js — Institutional College Admin Sidebar
import React from 'react';
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
  Menu,
  Brain,
  Radio,
  Headphones
} from 'lucide-react';
import logoImg from '../../assets/logo-mark.png';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobile, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();

  const menuSections = [
    {
      title: 'Command Center',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
          path: '/admin/dashboard',
        },
        {
          id: 'live-monitoring',
          label: 'Live Monitoring',
          icon: Radio,
          path: '/admin/monitoring',
          badge: 'LIVE',
          isLiveBadge: true
        }
      ]
    },
    {
      title: 'Academic & Candidates',
      items: [
        {
          id: 'students',
          label: 'Candidate Registry',
          icon: Users,
          path: '/admin/students',
        },
        {
          id: 'exams',
          label: 'Examinations Center',
          icon: FileText,
          path: '/admin/exams',
        },
        {
          id: 'results',
          label: 'Gradebook & Audits',
          icon: Trophy,
          path: '/admin/results',
        }
      ]
    },
    {
      title: 'AI Intelligence',
      items: [
        {
          id: 'ai-questions',
          label: 'AI Question Studio',
          icon: Brain,
          path: '/admin/ai-questions',
          badge: 'AI v2'
        }
      ]
    },
    {
      title: 'Institutional Control',
      items: [
        {
          id: 'subscription',
          label: 'License & Quotas',
          icon: CreditCard,
          path: '/admin/subscription',
        },
        {
          id: 'settings',
          label: 'Proctoring Rules & College',
          icon: Settings,
          path: '/admin/settings',
        },
        {
          id: 'support',
          label: 'Support & Helpdesk',
          icon: Headphones,
          path: '/admin/support',
        }
      ]
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) closeMobileSidebar();
  };

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD';

  return (
    <>
      {/* Mobile Menu Toggle Floating Bar */}
      {isMobile && (
        <button 
          className="admin-mobile-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
          <span>Admin Portal</span>
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isMobileOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={closeMobileSidebar} 
        />
      )}

      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobileOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon-wrap" onClick={() => navigate('/admin/dashboard')}>
            <img
              src={logoImg}
              alt="Nexify Examina Logo"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
          </div>

          {!isCollapsed && (
            <div className="admin-brand-info" onClick={() => navigate('/admin/dashboard')}>
              <div className="admin-brand-title">
                NEXIFY <span>EXAMINA</span>
              </div>
              <div className="admin-brand-tag">COLLEGE ADMIN</div>
            </div>
          )}

          <button 
            className="admin-sidebar-collapse-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Live Proctoring Status Pill */}
        {!isCollapsed && (
          <div className="admin-proctor-pill">
            <span className="admin-proctor-dot" />
            <span className="admin-proctor-text">AI Proctor Core Active</span>
          </div>
        )}

        {/* Institution / Admin Identity Chip */}
        {!isCollapsed && (
          <div className="admin-identity-chip">
            <div className="admin-avatar-box">
              {initials}
            </div>
            <div className="admin-identity-text">
              <span className="admin-name">{user?.name || 'Administrator'}</span>
              <span className="admin-college-label">
                {user?.collegeName || user?.college_name || 'Partner Institution'}
              </span>
              <span className="admin-sidebar-tier-badge">
                {(user?.subscriptionPlan || 'Enterprise').toUpperCase()} TIER
              </span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="admin-nav-scroll">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="admin-nav-group">
              {!isCollapsed && (
                <div className="admin-nav-group-title">{section.title}</div>
              )}

              {section.items.map((item) => {
                const active = isActivePath(item.path);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    className={`admin-nav-link ${active ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="admin-link-icon">
                      <IconComponent size={19} />
                    </span>
                    {!isCollapsed && (
                      <span className="admin-link-text">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className={`admin-link-badge ${item.isLiveBadge ? 'live-badge' : ''}`}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer / Quick Sign Out */}
        <div className="admin-sidebar-footer">
          <button 
            className="admin-logout-button"
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out Admin' : undefined}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sign Out Administrator</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
