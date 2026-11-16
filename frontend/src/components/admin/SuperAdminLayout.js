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
  ShieldAlert,
  Sparkles,
  Zap,
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
    return 'Executive Overview & Command';
  };

  const navLinks = [
    {
      to: '/super-admin/dashboard',
      icon: LayoutDashboard,
      label: 'Executive Overview',
      short: 'Dashboard',
      badge: 'Live',
    },
    {
      to: '/super-admin/colleges',
      icon: Building2,
      label: 'Tenants & Onboarding',
      short: 'Tenants',
      badge: null,
    },
    {
      to: '/super-admin/payments',
      icon: CreditCard,
      label: 'Payments & Revenue',
      short: 'Ledger',
      badge: 'Ledger',
    },
    {
      to: '/super-admin/audit-logs',
      icon: ShieldCheck,
      label: 'Audit & Compliance',
      short: 'Audit',
      badge: null,
    },
    {
      to: '/super-admin/settings',
      icon: Sliders,
      label: 'Platform Governance',
      short: 'Settings',
      badge: null,
    },
  ];

  return (
    <div className="sa-layout">
      {/* Background ambient gradient glow */}
      <div className="sa-ambient-bg" aria-hidden="true" />

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="sa-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ──── ULTRA-SLEEK VERTICAL DOCK RAIL (Reference: Left rail in photo) ──── */}
      <aside className={`sa-dock-rail ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Monogram Header */}
        <Link
          to="/super-admin/dashboard"
          className="sa-rail-brand"
          title="Nexify Examina — Root Admin Console"
          onClick={() => setMobileOpen(false)}
        >
          <div className="sa-rail-logo-ring">
            <span className="sa-rail-glyph">⚡</span>
          </div>
          <span className="sa-mobile-brand-title">Nexify Examina</span>
        </Link>

        {/* Navigation Rail Icons */}
        <nav className="sa-rail-nav">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sa-rail-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={item.label}
              >
                <div className="sa-rail-icon-wrapper">
                  <Icon size={20} strokeWidth={2.2} />
                  {item.badge && <span className="sa-rail-pip" />}
                </div>
                <span className="sa-rail-tooltip">{item.label}</span>
                <span className="sa-mobile-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Rail Footer (Cluster status & Logout) */}
        <div className="sa-rail-footer">
          <div className="sa-cluster-pill-chip" title="Cluster: 6 KVM Nodes Synchronized">
            <span className="sa-pulse-radar" />
            <span className="sa-mobile-cluster-text">6 Nodes Sync</span>
          </div>

          <div
            className="sa-rail-user-avatar"
            title={`Super Admin: ${user?.name || user?.email || 'Master Admin'}`}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="sa-rail-logout-btn"
            title="Safely Sign Out of Console"
          >
            <LogOut size={18} />
            <span className="sa-mobile-logout-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ──── MAIN DASHBOARD VIEWPORT ──── */}
      <div className="sa-main-viewport">
        {/* Minimalist Topbar */}
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <button
              type="button"
              className="sa-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="sa-breadcrumbs">
              <span className="sa-breadcrumb-root">Nexify Platform</span>
              <ChevronRight size={13} className="sa-breadcrumb-sep" />
              <span className="sa-breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="sa-topbar-right">
            <div className="sa-cluster-badge">
              <span className="sa-live-indicator" />
              <span>Mesh Cluster: 100% Operational</span>
            </div>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="sa-landing-link"
              title="Open Public Candidate Portal"
            >
              <span>Candidate Portal</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="sa-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
