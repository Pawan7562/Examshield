import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatBot from '../common/ChatBot';
import './PublicLayout.css';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

export default function PublicLayout({ children }) {
  const { user } = useAuth();
  const dashboardPath = dashboardPathFor(user?.role);
  const loginTarget = user ? dashboardPath : '/login';
  const startExamTarget = user?.role === 'student' ? '/student/dashboard' : '/student/login';

  return (
    <>
      <div className="public-theme">
      <div className="landing-glow landing-glow-top" aria-hidden="true" />
      <div className="landing-glow landing-glow-bottom" aria-hidden="true" />

      <header className="public-header" role="banner">
        <div className="public-shell">
          <div className="public-header-inner">
            <Link to="/" className="landing-brand" aria-label="Exam Monitoring home page">
              <span className="landing-brand-mark" aria-hidden="true">
                <span className="landing-brand-dot" />
              </span>
              <span className="landing-brand-text">Exam Monitoring</span>
            </Link>

            <nav className="public-nav" aria-label="Primary navigation">
              <NavLink to="/" end className={({ isActive }) => `public-nav-link${isActive ? ' public-nav-link-active' : ''}`}>
                Home
              </NavLink>
              <NavLink to="/features" className={({ isActive }) => `public-nav-link${isActive ? ' public-nav-link-active' : ''}`}>
                Features
              </NavLink>
              <NavLink to="/how-it-works" className={({ isActive }) => `public-nav-link${isActive ? ' public-nav-link-active' : ''}`}>
                How It Works
              </NavLink>
              <NavLink to="/pricing" className={({ isActive }) => `public-nav-link${isActive ? ' public-nav-link-active' : ''}`}>
                Pricing
              </NavLink>
              <NavLink to="/contact" className={({ isActive }) => `public-nav-link${isActive ? ' public-nav-link-active' : ''}`}>
                Contact Us
              </NavLink>
            </nav>

            <div className="public-header-actions">
              <Link to={loginTarget} className="landing-login-button" aria-label={user ? 'Go to your dashboard' : 'Sign in to your account'}>
                {user ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="public-page-main" role="main">{children}</main>

      <footer className="public-footer enhanced-footer" role="contentinfo">
        <div className="public-shell">
          <div className="enhanced-footer-content">
            <div className="footer-main">
              <div className="footer-brand-section">
                <Link to="/" className="landing-brand enhanced-footer-brand" aria-label="Exam Monitoring home page">
                  <span className="landing-brand-mark" aria-hidden="true">
                    <span className="landing-brand-dot" />
                  </span>
                  <span className="landing-brand-text">Exam Monitoring</span>
                </Link>
                <p className="enhanced-footer-description">
                  Secure online exams with live monitoring, AI alerts, screen tracking, and automated reports.
                  Trusted by thousands of institutions worldwide.
                </p>

                <div className="footer-stats">
                  <div className="footer-stat">
                    <strong>10,000+</strong>
                    <span>Students</span>
                  </div>
                  <div className="footer-stat">
                    <strong>99.9%</strong>
                    <span>Uptime</span>
                  </div>
                  <div className="footer-stat">
                    <strong>24/7</strong>
                    <span>Support</span>
                  </div>
                </div>

                <div className="footer-cta-section">
                  <h4>Ready to get started?</h4>
                  <p>Join thousands of institutions using our secure exam platform.</p>
                  <Link to="/admin/register" className="enhanced-footer-cta-button" aria-label="Get started with Exam Monitoring">
                    Start Free Trial
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="footer-links-section">
                <div className="footer-column">
                  <h3>Product</h3>
                  <NavLink to="/" className={({ isActive }) => isActive ? 'current-page' : ''}>Home</NavLink>
                  <NavLink to="/features" className={({ isActive }) => isActive ? 'current-page' : ''}>Features</NavLink>
                  <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'current-page' : ''}>How It Works</NavLink>
                  <NavLink to="/pricing" className={({ isActive }) => isActive ? 'current-page' : ''}>Pricing</NavLink>
                </div>

                <div className="footer-column">
                  <h3>Solutions</h3>
                  <Link to={startExamTarget}>For Students</Link>
                  <Link to={loginTarget}>{user ? 'Dashboard' : 'For Institutions'}</Link>
                  <Link to="/admin/register">Register College</Link>
                  <Link to="/super-admin/login">Super Admin</Link>
                </div>

                <div className="footer-column">
                  <h3>Features</h3>
                  <span>Live Proctoring</span>
                  <span>AI Detection</span>
                  <span>Screen Tracking</span>
                  <span>Audio Monitoring</span>
                  <span>Instant Reports</span>
                  <span>24/7 Support</span>
                </div>

                <div className="footer-column">
                  <h3>Company</h3>
                  <span>About Us</span>
                  <span>Security</span>
                  <span>Compliance</span>
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>Contact Us</span>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <div className="footer-bottom-left">
                <span>© {new Date().getFullYear()} Exam Monitoring. All rights reserved.</span>
                <span>Built for secure and scalable online examinations.</span>
              </div>
              
              <div className="footer-bottom-right">
                <div className="footer-social-links">
                  <a href="#" className="social-link" aria-label="Twitter">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                    </svg>
                  </a>
                  <a href="#" className="social-link" aria-label="LinkedIn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                  <a href="#" className="social-link" aria-label="GitHub">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                    </svg>
                  </a>
                </div>
                <div className="footer-legal-links">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                  <a href="#">Cookie Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <ChatBot />
  </>);
}
