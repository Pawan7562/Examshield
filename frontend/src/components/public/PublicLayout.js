import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  User,
  Building2,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatBot from '../common/ChatBot';
import logoImg from '../../assets/logo.png';
import './PublicLayout.css';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

export default function PublicLayout({ children, className = '' }) {
  const { user } = useAuth();
  const location = useLocation();
  const dashboardPath = dashboardPathFor(user?.role);
  const loginTarget = user ? dashboardPath : '/login';
  const startExamTarget = user?.role === 'student' ? '/student/dashboard' : '/student/login';

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Sticky header scroll detection
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
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

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/features', label: 'Features' },
    { to: '/how-it-works', label: 'How It Works' },
    { href: '/#college-admin', label: 'Institutions' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <div className={`public-theme exam-landing-theme ${className}`.trim()}>
        <div className="landing-glow landing-glow-top" aria-hidden="true" />
        <div className="landing-glow landing-glow-bottom" aria-hidden="true" />

        {/* ──── STICKY MASTHEAD (TOP MARQUEE + NAVBAR) ──── */}
        <div className={`public-masthead-sticky ${scrolled ? 'masthead-scrolled' : ''}`}>
          {/* ──── COMPANY ENTERPRISE TOP MARQUEE (RIGHT TO LEFT ANIMATION) ──── */}
          <div className="company-top-announcement" role="region" aria-label="Enterprise security notice">
            <div className="company-top-inner">
              {/* Fixed Left Status Badge */}
              <div className="top-live-badge">
                <span className="top-status-indicator">
                  <span className="status-ping" />
                  <span className="status-core" />
                </span>
                <span className="top-badge-text">LIVE RADAR</span>
              </div>

              {/* Seamless Infinite Right-to-Left Scrolling Ticker */}
              <div className="top-ticker-viewport" tabIndex="0" aria-label="Live platform status ticker">
                <div className="top-ticker-track">
                  {/* Track Group 1 */}
                  <div className="top-ticker-group">
                    <span className="ticker-item"><Sparkles size={12} className="ticker-icon" /> <strong>ENTERPRISE V4.2</strong> · Founded Feb 2025 in Mohali by Pawan Kumar Yadav</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><GraduationCap size={12} className="ticker-icon" /> <strong>10+ Registered Institutions</strong> · 50K+ Secured Examinations</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><ShieldCheck size={12} className="ticker-icon" /> <strong>Mohali (Punjab) HQ</strong> · Direct Helpline: +91 9934290491</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><Building2 size={12} className="ticker-icon" /> <strong>1:50 Proctor Cockpit</strong> · Live Multi-Department Invigilation &amp; Shift Logs</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><CheckCircle2 size={12} className="ticker-icon" /> <strong>99.98% Accuracy</strong> · Sub-180ms Biometric Gaze &amp; Acoustic Mesh</span>
                    <span className="ticker-bullet">✦</span>
                  </div>
                  {/* Track Group 2 (Duplicate for seamless continuous loop) */}
                  <div className="top-ticker-group" aria-hidden="true">
                    <span className="ticker-item"><Sparkles size={12} className="ticker-icon" /> <strong>ENTERPRISE V4.2</strong> · Founded Feb 2025 in Mohali by Pawan Kumar Yadav</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><GraduationCap size={12} className="ticker-icon" /> <strong>10+ Registered Institutions</strong> · 50K+ Secured Examinations</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><ShieldCheck size={12} className="ticker-icon" /> <strong>Mohali (Punjab) HQ</strong> · Direct Helpline: +91 9934290491</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><Building2 size={12} className="ticker-icon" /> <strong>1:50 Proctor Cockpit</strong> · Live Multi-Department Invigilation &amp; Shift Logs</span>
                    <span className="ticker-bullet">✦</span>
                    <span className="ticker-item"><CheckCircle2 size={12} className="ticker-icon" /> <strong>99.98% Accuracy</strong> · Sub-180ms Biometric Gaze &amp; Acoustic Mesh</span>
                    <span className="ticker-bullet">✦</span>
                  </div>
                </div>
              </div>

              {/* Fixed Right Action */}
              <div className="top-action-group">
                <Link to="/contact" className="top-link-action">
                  <span>Request Campus Pilot</span>
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* ──── MAIN HEADER ──── */}
          <header className={`public-header ${scrolled ? 'header-scrolled' : ''}`} role="banner">
            <div className="public-shell">
              <div className="public-header-inner">
                {/* Brand Logo */}
                <Link to="/" className="landing-brand" aria-label="ExamShield home page">
                  <img src={logoImg} alt="ExamShield Logo" className="brand-header-logo" />
                  <div className="brand-text-stack">
                    <span className="landing-brand-text">ExamShield</span>
                    <span className="brand-subtext">Enterprise SaaS</span>
                  </div>
                </Link>

                {/* Navigation Links - Island Capsule */}
                <nav className={`public-nav ${mobileMenuOpen ? 'nav-mobile-open' : ''}`} aria-label="Primary navigation">
                  <div
                    className="mobile-nav-backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                  />

                  <div className="nav-links-container">
                    <div className="mobile-nav-header">
                      <Link to="/" className="landing-brand" aria-label="ExamShield home page" onClick={() => setMobileMenuOpen(false)}>
                        <img src={logoImg} alt="ExamShield Logo" style={{ height: '30px', borderRadius: '4px' }} />
                        <span className="landing-brand-text">ExamShield</span>
                      </Link>
                      <button
                        type="button"
                        className="mobile-close-btn"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation menu"
                      >
                        <X size={22} />
                      </button>
                    </div>

                    <div className="mobile-menu-sections">
                      <div className="mobile-menu-group-label">NAVIGATION</div>
                      <div className="nav-capsule">
                        {navLinks.map((link) =>
                          link.href ? (
                            <a
                              key={link.label}
                              href={link.href}
                              className="public-nav-link"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span>{link.label}</span>
                            </a>
                          ) : (
                            <NavLink
                              key={link.to}
                              to={link.to}
                              end={link.end}
                              className={({ isActive }) =>
                                `public-nav-link${isActive ? ' public-nav-link-active' : ''}`
                              }
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span>{link.label}</span>
                            </NavLink>
                          )
                        )}
                      </div>

                      {/* Mobile Portal Links */}
                      <div className="mobile-menu-group-label" style={{ marginTop: '16px' }}>PORTAL ACCESS</div>
                      <div className="mobile-nav-auth">
                        {user ? (
                          <Link
                            to={loginTarget}
                            className="landing-primary-button header-dash-btn"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User size={15} aria-hidden="true" />
                            <span>Enter Dashboard</span>
                            <ArrowRight size={14} aria-hidden="true" />
                          </Link>
                        ) : (
                          <div className="mobile-auth-grid">
                            <Link
                              to={startExamTarget}
                              className="header-student-btn mobile-full-btn"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <GraduationCap size={16} aria-hidden="true" />
                              <span>Student Exam Portal</span>
                            </Link>
                            <Link
                              to="/login"
                              className="header-admin-btn mobile-full-btn"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Building2 size={16} aria-hidden="true" />
                              <span>College Admin Console</span>
                            </Link>
                            <Link
                              to="/contact"
                              className="header-trial-btn mobile-full-btn"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Sparkles size={16} aria-hidden="true" />
                              <span>Schedule Enterprise Demo</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </nav>

                {/* Header Right Action Group */}
                <div className="public-header-actions anim-slide-right">
                  {user ? (
                    <Link to={loginTarget} className="landing-primary-button header-dash-btn" aria-label="Go to your dashboard">
                      <User size={15} aria-hidden="true" />
                      <span>Dashboard</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  ) : (
                    <div className="header-auth-group">
                      <Link to={startExamTarget} className="header-student-btn" aria-label="Sign in to student exam portal">
                        <GraduationCap size={15} aria-hidden="true" />
                        <span>Student Portal</span>
                      </Link>
                      <Link to="/login" className="header-admin-btn" aria-label="Sign in to College Admin Portal">
                        <Building2 size={15} aria-hidden="true" />
                        <span>College Admin</span>
                      </Link>
                      <Link to="/contact" className="header-trial-btn" aria-label="Book demo or trial">
                        <span>Book Demo</span>
                        <ArrowRight size={13} className="btn-arrow-right" aria-hidden="true" />
                      </Link>
                    </div>
                  )}

                  {/* Mobile hamburger button */}
                  <button
                    type="button"
                    className="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                </div>
              </div>
            </div>
          </header>
        </div>

        <main className="public-page-main" role="main">{children}</main>

        {/* ──── COMPANY FOOTER ──── */}
        <footer className="public-footer enhanced-footer" role="contentinfo">
          <div className="public-shell">
            {/* Pre-Footer Institutional Callout Ribbon */}
            <div className="footer-pre-ribbon">
              <div className="footer-ribbon-glow" aria-hidden="true" />
              <div className="footer-ribbon-left">
                <div className="footer-ribbon-badge">
                  <Sparkles size={13} aria-hidden="true" />
                  <span>Enterprise Academic Infrastructure</span>
                </div>
                <h3 className="footer-ribbon-title">
                  Ready to safeguard academic integrity across your university?
                </h3>
                <p className="footer-ribbon-desc">
                  Deploy ExamShield's autonomous AI cheating detection, kiosk browser lockdown, and live invigilation command center. Pilot onboarding in under 48 hours.
                </p>
                <div className="footer-ribbon-stats">
                  <span className="ribbon-stat-item">
                    <CheckCircle2 size={13} className="ribbon-stat-icon" /> 99.98% Proctor Uptime
                  </span>
                  <span className="ribbon-stat-item">
                    <CheckCircle2 size={13} className="ribbon-stat-icon" /> Sub-100ms Neural Inference
                  </span>
                  <span className="ribbon-stat-item">
                    <CheckCircle2 size={13} className="ribbon-stat-icon" /> FERPA &amp; SOC2 Certified
                  </span>
                </div>
              </div>

              <div className="footer-ribbon-actions">
                <Link to="/contact" className="footer-ribbon-btn-primary" aria-label="Request institutional consultation">
                  <span>Request University Pilot</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link to="/features" className="footer-ribbon-btn-secondary">
                  <span>Explore AI Capabilities</span>
                </Link>
              </div>
            </div>

            {/* Main Footer Content Grid */}
            <div className="footer-main-grid">
              {/* Brand & Overview Column */}
              <div className="footer-brand-col">
                <Link to="/" className="footer-brand-link" aria-label="ExamShield home page">
                  <img src={logoImg} alt="ExamShield Logo" className="footer-brand-logo" />
                  <span className="footer-brand-name">
                    Exam<span>Shield</span>
                  </span>
                </Link>

                <p className="footer-brand-desc">
                  Founded Feb 2025 in Mohali, Punjab by Founder &amp; CEO Pawan Kumar Yadav. Autonomous AI proctoring and browser-lockdown platform trusted across 10+ registered partner institutions.
                </p>

                <div className="footer-compliance-badges">
                  <span className="footer-badge-pill">Mohali HQ</span>
                  <span className="footer-badge-pill">10+ Institutions</span>
                  <span className="footer-badge-pill">FERPA Compliant</span>
                  <span className="footer-badge-pill">ISO 27001</span>
                </div>

                <div className="footer-contact-mini">
                  <a href="tel:+919934290491" className="footer-mini-link">
                    <Phone size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                    +91 9934290491
                  </a>
                  <span className="footer-mini-dot">•</span>
                  <a href="mailto:support@examshield.com" className="footer-mini-link">
                    <Mail size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                    Mohali, Punjab
                  </a>
                </div>
              </div>

              {/* Column 1: AI Platform */}
              <div className="footer-nav-col">
                <h4 className="footer-col-title">AI Platform</h4>
                <ul className="footer-links-list">
                  <li><NavLink to="/features">Neural AI Invigilation</NavLink></li>
                  <li><NavLink to="/how-it-works">Kiosk Browser Lockdown</NavLink></li>
                  <li><NavLink to="/features">Biometric Face Mesh</NavLink></li>
                  <li><NavLink to="/features">Acoustic Whisper Filter</NavLink></li>
                  <li><NavLink to="/features">Automated Audit Dossiers</NavLink></li>
                  <li><NavLink to="/features">Sandboxed Code Execution</NavLink></li>
                </ul>
              </div>

              {/* Column 2: Solutions */}
              <div className="footer-nav-col">
                <h4 className="footer-col-title">Campuses &amp; Solutions</h4>
                <ul className="footer-links-list">
                  <li><NavLink to="/contact">University Examinations</NavLink></li>
                  <li><NavLink to="/features">Professional Certifications</NavLink></li>
                  <li><NavLink to="/how-it-works">Remote Candidate Verification</NavLink></li>
                  <li><NavLink to="/about">Multi-Department Tenancy</NavLink></li>
                  <li><NavLink to="/contact">Institutional Custom SLA</NavLink></li>
                  <li><NavLink to="/about">Integrity Research Whitepaper</NavLink></li>
                </ul>
              </div>

              {/* Column 3: Portals & Access */}
              <div className="footer-nav-col">
                <h4 className="footer-col-title">Access Portals</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link to={startExamTarget} className="footer-highlight-link">
                      <span className="footer-portal-dot" />
                      Student Exam Room
                    </Link>
                  </li>
                  <li><Link to="/login">College Admin Console</Link></li>
                  <li><Link to="/admin/register">Register Institution</Link></li>
                  <li><Link to="/super-admin/login">Super Admin Console</Link></li>
                  <li><Link to="/contact">Faculty Accreditation Pilot</Link></li>
                </ul>
              </div>

              {/* Column 4: Trust & Company */}
              <div className="footer-nav-col">
                <h4 className="footer-col-title">Trust &amp; Governance</h4>
                <ul className="footer-links-list">
                  <li><NavLink to="/about">About ExamShield</NavLink></li>
                  <li><NavLink to="/about">Security Architecture</NavLink></li>
                  <li><NavLink to="/contact">Support &amp; Contact</NavLink></li>
                  <li><Link to="/how-it-works">How It Works Guide</Link></li>
                  <li><NavLink to="/about">AI Fairness &amp; Privacy</NavLink></li>
                  <li><NavLink to="/contact">Enterprise Inquiries</NavLink></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar: Copyright, Live Health, Legal Links, Social Icons */}
            <div className="footer-bottom-bar">
              <div className="footer-bottom-left">
                <span className="footer-copyright">
                  &copy; {new Date().getFullYear()} ExamShield Inc. All rights reserved.
                </span>
                <span className="footer-uptime-badge">
                  <span className="live-status-dot" />
                  Mesh Status: 99.98% Operational
                </span>
              </div>

              <div className="footer-legal-links">
                <NavLink to="/about">Privacy Policy</NavLink>
                <span className="footer-legal-dot">•</span>
                <NavLink to="/about">Terms of Service</NavLink>
                <span className="footer-legal-dot">•</span>
                <NavLink to="/about">Security Architecture</NavLink>
                <span className="footer-legal-dot">•</span>
                <NavLink to="/contact">Compliance Inquiries</NavLink>
              </div>

              <div className="footer-social-links">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="ExamShield on X" title="ExamShield on X">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="ExamShield on LinkedIn" title="ExamShield on LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="ExamShield on GitHub" title="ExamShield on GitHub">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <ChatBot />
    </>
  );
}
