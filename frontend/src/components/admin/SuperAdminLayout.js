import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  ShieldCheck,
  Sliders,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Activity,
  Server,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import '../../pages/super-admin/SuperAdmin.css';

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Super admin session terminated safely.');
    navigate('/super-admin/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/colleges')) return 'Institutional Tenants';
    if (location.pathname.includes('/payments')) return 'Financial Ledger & Subscriptions';
    if (location.pathname.includes('/audit-logs')) return 'Security Audit & Compliance';
    if (location.pathname.includes('/settings')) return 'Platform Governance & Policies';
    return 'Executive Overview';
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        {
          to: '/super-admin/dashboard',
          icon: LayoutDashboard,
          label: 'Executive Command',
          badge: 'Live',
        },
      ],
    },
    {
      group: 'Tenancy Management',
      items: [
        {
          to: '/super-admin/colleges',
          icon: Building2,
          label: 'Institutional Tenants',
          badge: null,
        },
      ],
    },
    {
      group: 'Financials & Billing',
      items: [
        {
          to: '/super-admin/payments',
          icon: CreditCard,
          label: 'Revenue & Ledger',
          badge: null,
        },
      ],
    },
    {
      group: 'Platform & Security',
      items: [
        {
          to: '/super-admin/audit-logs',
          icon: ShieldCheck,
          label: 'Audit & Compliance',
          badge: null,
        },
        {
          to: '/super-admin/settings',
          icon: Sliders,
          label: 'Platform Settings',
          badge: null,
        },
      ],
    },
  ];

  return (
    <div className="sa-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="sa-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ──── ENTERPRISE SIDEBAR (Width 240px) ──── */}
      <aside className={`sa-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sa-sidebar-header">
          <Link
            to="/super-admin/dashboard"
            className="sa-sidebar-brand"
            onClick={() => setMobileOpen(false)}
          >
            <div className="sa-brand-icon">
              <ShieldCheck size={20} className="sa-brand-icon-svg" />
            </div>
            <div className="sa-brand-text">
              <span className="sa-brand-name">Nexify Examina</span>
              <span className="sa-brand-tier">Root Control Console</span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="sa-sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.group} className="sa-nav-group">
              <div className="sa-nav-group-title">{group.group}</div>
              <div className="sa-nav-group-items">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={18} className="sa-nav-icon" />
                      <span className="sa-nav-label">{item.label}</span>
                      {item.badge && <span className="sa-nav-badge">{item.badge}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Cluster Status Chip */}
        <div className="sa-sidebar-cluster">
          <div className="sa-cluster-status-box">
            <div className="sa-cluster-header">
              <span className="sa-pulse-indicator" />
              <span className="sa-cluster-title">Mesh Cluster</span>
            </div>
            <div className="sa-cluster-desc">6 KVM Nodes Operational</div>
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="sa-sidebar-footer">
          <div className="sa-user-card">
            <div className="sa-user-avatar">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="sa-user-info">
              <div className="sa-user-name">{user?.name || 'Administrator'}</div>
              <div className="sa-user-email">{user?.email || 'superadmin@nexifyforge.in'}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="sa-logout-btn"
              title="Sign Out of Root Console"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ──── MAIN VIEWPORT ──── */}
      <div className="sa-main-viewport">
        {/* Topbar */}
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <button
              type="button"
              className="sa-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="sa-breadcrumbs">
              <span className="sa-breadcrumb-root">Super Admin</span>
              <ChevronRight size={13} className="sa-breadcrumb-sep" />
              <span className="sa-breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="sa-topbar-right">
            <div className="sa-live-status-pill">
              <span className="sa-live-dot" />
              <span>Cluster Synced</span>
            </div>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="sa-portal-link"
              title="Open Public Candidate Portal"
            >
              <span>Candidate Portal</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="sa-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
