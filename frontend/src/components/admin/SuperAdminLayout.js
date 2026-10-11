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
  Database,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logoImg from '../../assets/logo-mark.png';
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
    if (location.pathname.includes('/colleges')) return 'Multi-Tenant Directory & Onboarding';
    if (location.pathname.includes('/payments')) return 'Payments, MRR & Financial Ledger';
    if (location.pathname.includes('/audit-logs')) return 'Security Audit & Compliance Logs';
    if (location.pathname.includes('/settings')) return 'Platform Governance & Policies';
    return 'Platform Executive Command Center';
  };

  const navLinks = [
    {
      to: '/super-admin/dashboard',
      icon: LayoutDashboard,
      label: 'Executive Overview',
      badge: 'Live',
    },
    {
      to: '/super-admin/colleges',
      icon: Building2,
      label: 'Tenants & Onboarding',
      badge: null,
    },
    {
      to: '/super-admin/payments',
      icon: CreditCard,
      label: 'Payments & Revenue',
      badge: 'Ledger',
    },
    {
      to: '/super-admin/audit-logs',
      icon: ShieldCheck,
      label: 'Audit & Compliance',
      badge: null,
    },
    {
      to: '/super-admin/settings',
      icon: Sliders,
      label: 'Platform Governance',
      badge: null,
    },
  ];

  return (
    <div className="sa-layout">
      <div className="sa-bg-mesh" aria-hidden="true" />

      {/* ──── SIDEBAR ──── */}
      <aside className={`sa-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <Link to="/super-admin/dashboard" className="sa-sidebar-brand" onClick={() => setMobileOpen(false)}>
          <img src={logoImg} alt="Nexify Examina Logo" className="sa-brand-logo" />
          <div className="sa-brand-text-stack">
            <span className="sa-brand-title">
              Nexify<span>Examina</span>
            </span>
            <span className="sa-brand-badge">
              <span className="sa-pulse-bullet" />
              ROOT ADMIN CONSOLE
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="sa-nav">
          <div className="sa-nav-section-title">GOVERNANCE &amp; OVERSIGHT</div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon />
                <span>{item.label}</span>
                {item.badge && <span className="sa-nav-badge">{item.badge}</span>}
              </NavLink>
            );
          })}

          <div className="sa-cluster-box">
            <div className="sa-cluster-header">
              <span>SYSTEM CLUSTER</span>
              <span className="sa-pulse-bullet" />
            </div>
            <div className="sa-cluster-row">
              <span>Neon Database</span>
              <span className="sa-cluster-val">Connected</span>
            </div>
            <div className="sa-cluster-row">
              <span>AI Proctoring</span>
              <span className="sa-cluster-val">1080p Mesh</span>
            </div>
          </div>
        </nav>

        {/* Footer Profile & Logout */}
        <div className="sa-sidebar-footer">
          <div className="sa-sidebar-user">
            <div className="sa-user-avatar">SA</div>
            <div className="sa-user-info">
              <span className="sa-user-name">{user?.name || 'Master Admin'}</span>
              <span className="sa-user-role">SUPER ADMINISTRATOR</span>
            </div>
          </div>

          <button type="button" onClick={handleLogout} className="sa-logout-btn">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ──── MAIN CONTENT CONTAINER ──── */}
      <div className="sa-main">
        {/* Topbar */}
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <button
              type="button"
              className="sa-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="sa-breadcrumbs">
              <span>Nexify Examina Network</span>
              <ChevronRight size={14} />
              <span className="sa-breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="sa-topbar-right">
            <div className="sa-health-pill">
              <span className="sa-health-dot" />
              <span>Mesh Status: 100% Operational</span>
            </div>

            <Link to="/" target="_blank" rel="noreferrer" className="sa-public-link" title="Visit Public Landing Page">
              <span>View Landing</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </header>

        {/* Page View Outlet */}
        <main className="sa-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
