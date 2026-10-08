import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  User,
  GraduationCap,
  Building2,
  Sparkles,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ThemeToggle from '../../ui/ThemeToggle';
import logoImg from '../../../assets/logo-mark.png';
import { PORTAL_LINKS } from '../../../content/landingContent';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const isHome = location.pathname === '/';
  const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login';
  const isRegisterPage = location.pathname === '/register' || location.pathname === '/admin/register';

  const dashboardPath = dashboardPathFor(user?.role);
  const studentPortalTarget = user?.role === 'student' ? '/student/dashboard' : PORTAL_LINKS.studentLogin;

  // Track scroll position and scroll percentage for progress bar
  const handleScroll = useCallback(() => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
    setScrolled(window.scrollY > 16);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Lock body scroll on mobile drawer open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Clean, focused desktop nav items (includes Features, How It Works, Institutions, About, Contact)
  const desktopNavItems = [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Institutions', href: isHome ? '#command-suite' : '/#command-suite' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  // Full mobile drawer items
  const allMobileNavItems = [
    { label: 'Overview', to: '/' },
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Institutions', href: isHome ? '#command-suite' : '/#command-suite' },
    { label: 'Security & Compliance', href: isHome ? '#security' : '/#security' },
    { label: 'About Nexify Examina', to: '/about' },
    { label: 'Contact & Support', to: '/contact' },
  ];

  return (
    <>
      <header
        className={`es-navbar-header ${scrolled ? 'es-navbar-scrolled' : ''}`}
        role="banner"
      >
        {/* Top Scroll Progress Indicator */}
        <div
          className="es-scroll-progress"
          style={{ width: `${scrollProgress}%` }}
          aria-hidden="true"
        />

        <div className="es-container es-navbar-container">
          {/* Brand Logo (Clean & Elegant) */}
          <Link to="/" className="es-navbar-brand" aria-label="Nexify Examina home page">
            <img src={logoImg} alt="Nexify Examina Logo" className="es-brand-logo-img" />
            <span className="es-brand-name">
              Nexify <span className="es-brand-accent">Examina</span>
            </span>
          </Link>

          {/* Centered Desktop Navigation Capsule (Strictly single-line, 5 items) */}
          <nav className="es-desktop-nav" aria-label="Main navigation">
            <ul className="es-nav-list" role="list">
              {desktopNavItems.map((item) => (
                <li key={item.label} role="listitem">
                  {item.href ? (
                    <a href={item.href} className="es-nav-link">
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => `es-nav-link ${isActive ? 'active' : ''}`}
                    >
                      <span>{item.label}</span>
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Clean Action Group */}
          <div className="es-navbar-actions">
            {user ? (
              <Link
                to={dashboardPath}
                className="es-btn es-btn-lime es-btn-sm"
                aria-label="Enter your dashboard"
              >
                <User size={14} aria-hidden="true" />
                <span>Console</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            ) : isLoginPage ? (
              /* When on Login Page */
              <div className="es-cta-hierarchy-group">
                <Link
                  to={studentPortalTarget}
                  className="es-cta-ghost"
                  aria-label="Student Exam Room Portal"
                >
                  <GraduationCap size={15} aria-hidden="true" />
                  <span>Student Portal</span>
                </Link>

                <Link
                  to={PORTAL_LINKS.registerInstitution}
                  className="es-btn es-btn-lime es-btn-sm"
                  aria-label="Register Institution"
                >
                  <Sparkles size={14} aria-hidden="true" />
                  <span>Register College</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            ) : isRegisterPage ? (
              /* When on Registration Page */
              <div className="es-cta-hierarchy-group">
                <Link
                  to={PORTAL_LINKS.collegeAdminLogin}
                  className="es-cta-ghost"
                  aria-label="Sign in to College Admin"
                >
                  <Building2 size={15} aria-hidden="true" />
                  <span>Sign In</span>
                </Link>

                <Link
                  to={PORTAL_LINKS.demoRequest}
                  className="es-btn es-btn-lime es-btn-sm"
                  aria-label="Book Demo"
                >
                  <span>Book Demo</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              /* Standard Landing & Public Pages (Clean 3-action hierarchy) */
              <div className="es-cta-hierarchy-group">
                <Link
                  to={studentPortalTarget}
                  className="es-cta-ghost"
                  aria-label="Student Exam Room Portal"
                >
                  <GraduationCap size={15} aria-hidden="true" />
                  <span>Student Portal</span>
                </Link>

                <Link
                  to={PORTAL_LINKS.collegeAdminLogin}
                  className="es-btn es-btn-secondary es-btn-sm"
                  aria-label="College Admin Console sign in"
                >
                  <Building2 size={14} aria-hidden="true" />
                  <span>College Admin</span>
                </Link>

                <Link
                  to={PORTAL_LINKS.demoRequest}
                  className="es-btn es-btn-lime es-btn-sm"
                  aria-label="Book enterprise demo"
                >
                  <span>Book Demo</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Theme Toggle (At the far right) */}
            <ThemeToggle className="es-header-theme-toggle" />

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="es-mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {mobileMenuOpen && (
        <div className="es-mobile-drawer-portal" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div
            className="es-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="es-mobile-drawer">
            <div className="es-mobile-drawer-header">
              <Link to="/" className="es-navbar-brand" onClick={() => setMobileMenuOpen(false)}>
                <img src={logoImg} alt="Nexify Examina Logo" className="es-brand-logo-img" />
                <span className="es-brand-name">
                  Nexify <span className="es-brand-accent">Examina</span>
                </span>
              </Link>
              <div className="es-drawer-header-actions">
                <ThemeToggle />
                <button
                  type="button"
                  className="es-drawer-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <nav className="es-mobile-drawer-nav" aria-label="Mobile menu navigation">
              <div className="es-drawer-section-label">NAVIGATION</div>
              <ul className="es-mobile-nav-list" role="list">
                {allMobileNavItems.map((item) => (
                  <li key={item.label} role="listitem">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="es-mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `es-mobile-nav-link ${isActive ? 'active' : ''}`
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>

              <div className="es-drawer-section-label" style={{ marginTop: '24px' }}>
                ACCESS PORTALS
              </div>
              <div className="es-mobile-portals-stack">
                <Link
                  to={studentPortalTarget}
                  className="es-mobile-portal-card"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <GraduationCap size={18} className="es-portal-card-icon student" />
                  <div>
                    <strong>Student Exam Portal</strong>
                    <span>Candidate check-in, system test &amp; active exam room</span>
                  </div>
                </Link>

                <Link
                  to={PORTAL_LINKS.collegeAdminLogin}
                  className="es-mobile-portal-card"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 size={18} className="es-portal-card-icon admin" />
                  <div>
                    <strong>College Admin Console</strong>
                    <span>Deans, exam controllers, course schedules &amp; halls</span>
                  </div>
                </Link>

                <Link
                  to={PORTAL_LINKS.registerInstitution}
                  className="es-mobile-portal-card highlight"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheck size={18} className="es-portal-card-icon register" />
                  <div>
                    <strong>Register Your College</strong>
                    <span>Start a multi-department trial in 15 minutes</span>
                  </div>
                </Link>

                <Link
                  to={PORTAL_LINKS.superAdminLogin}
                  className="es-mobile-portal-card"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Lock size={18} className="es-portal-card-icon super" />
                  <div>
                    <strong>Super Admin Console</strong>
                    <span>System governance &amp; tenant security audit</span>
                  </div>
                </Link>

                <Link
                  to={PORTAL_LINKS.demoRequest}
                  className="es-btn es-btn-lime es-btn-full"
                  style={{ marginTop: '14px' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Book Enterprise Demo</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
