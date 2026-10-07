import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  ChevronUp,
  MapPin,
  Sparkles
} from 'lucide-react';
import logoImg from '../../../assets/logo.png';
import { BRAND_INFO, PORTAL_LINKS } from '../../../content/landingContent';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="es-footer" role="contentinfo">
      <div className="es-container">
        {/* Main 5-Column Content Grid */}
        <div className="es-footer-grid">
          {/* Column 1: Brand & Overview */}
          <div className="es-footer-col es-footer-col-brand">
            <a href="#" className="es-footer-brand-logo" aria-label="ExamShield home">
              <img src={logoImg} alt="ExamShield Logo" className="es-footer-logo-img" />
              <span className="es-brand-name">
                Exam<span className="es-brand-accent">Shield</span>
              </span>
            </a>

            <p className="es-footer-brand-desc">
              Founded {BRAND_INFO.foundedDate} in {BRAND_INFO.hqLocation} by Founder &amp; CEO {BRAND_INFO.founder}. Autonomous AI proctoring and browser-lockdown platform trusted across partner institutions.
            </p>

            <div className="es-footer-contact-items">
              <div className="es-footer-contact-row">
                <MapPin size={14} className="es-contact-icon" aria-hidden="true" />
                <span>HQ: Mohali, Punjab, India</span>
              </div>
              <div className="es-footer-contact-row">
                <Phone size={14} className="es-contact-icon" aria-hidden="true" />
                <a href={`tel:${BRAND_INFO.phone}`}>{BRAND_INFO.phone}</a>
              </div>
              <div className="es-footer-contact-row">
                <Mail size={14} className="es-contact-icon" aria-hidden="true" />
                <a href={`mailto:${BRAND_INFO.email}`}>{BRAND_INFO.email}</a>
              </div>
            </div>

            <div className="es-footer-pills-row">
              <span className="es-trust-pill">Mohali PB HQ</span>
              <span className="es-trust-pill">FERPA Aligned</span>
              <span className="es-trust-pill">ISO 27001 Prep</span>
              <span className="es-trust-pill">Zero Kernel Drivers</span>
            </div>
          </div>

          {/* Column 2: AI Platform Architecture */}
          <div className="es-footer-col">
            <h4 className="es-footer-heading">AI Defense Matrix</h4>
            <ul className="es-footer-links-list" role="list">
              <li><a href="#integrity-layers">Continuous Face &amp; Gaze Mesh</a></li>
              <li><a href="#integrity-layers">Kiosk Fullscreen Sandbox</a></li>
              <li><a href="#integrity-layers">Acoustic Whisper Isolation</a></li>
              <li><a href="#command-center">1:50 Invigilator Cockpit</a></li>
              <li><a href="#command-center">Court-Ready PDF Dossier</a></li>
              <li><a href="#integrity-layers">LTI 1.3 LMS Connectivity</a></li>
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div className="es-footer-col">
            <h4 className="es-footer-heading">Campus Solutions</h4>
            <ul className="es-footer-links-list" role="list">
              <li><a href="#solutions">Universities &amp; Colleges</a></li>
              <li><a href="#solutions">Certification Boards</a></li>
              <li><a href="#solutions">Invigilators &amp; Faculty</a></li>
              <li><a href="#solutions">Students &amp; Candidates</a></li>
              <li><Link to={PORTAL_LINKS.contact}>Custom Institutional SLA</Link></li>
              <li><Link to={PORTAL_LINKS.contact}>Faculty Accreditation Pilot</Link></li>
            </ul>
          </div>

          {/* Column 4: Access Portals */}
          <div className="es-footer-col">
            <h4 className="es-footer-heading">Access Portals</h4>
            <ul className="es-footer-links-list" role="list">
              <li>
                <Link to={PORTAL_LINKS.studentLogin} className="es-footer-live-link">
                  <span className="es-live-link-dot" aria-hidden="true" />
                  Student Exam Room
                </Link>
              </li>
              <li><Link to={PORTAL_LINKS.collegeAdminLogin}>College Admin Console</Link></li>
              <li><Link to={PORTAL_LINKS.registerInstitution}>Register Institution</Link></li>
              <li><Link to={PORTAL_LINKS.superAdminLogin}>Super Admin Console</Link></li>
              <li><Link to={PORTAL_LINKS.demoRequest}>Schedule Enterprise Demo</Link></li>
              <li><Link to={PORTAL_LINKS.pilotRequest}>Request Campus Pilot</Link></li>
            </ul>
          </div>

          {/* Column 5: Governance & Trust */}
          <div className="es-footer-col">
            <h4 className="es-footer-heading">Governance &amp; Trust</h4>
            <ul className="es-footer-links-list" role="list">
              <li><a href="#security">Security Architecture</a></li>
              <li><a href="#security">Zero-Data Retention Policy</a></li>
              <li><a href="#security">Human-in-the-Loop Standard</a></li>
              <li><a href="#faq">Institutional FAQ</a></li>
              <li><Link to={PORTAL_LINKS.contact}>Contact Support</Link></li>
              <li><a href="https://exam.nexifyforge.in/">Production Host</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="es-footer-bottom">
          <div className="es-footer-bottom-left">
            <span className="es-footer-copyright">
              &copy; {new Date().getFullYear()} {BRAND_INFO.legalName}. All rights reserved.
            </span>
            <span className="es-footer-mesh-badge">
              <span className="es-live-status-dot" aria-hidden="true" />
              Neural Mesh: {BRAND_INFO.statusUptime}
            </span>
          </div>

          <div className="es-footer-socials">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="es-social-btn"
              aria-label="ExamShield on X"
              title="ExamShield on X"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="es-social-btn"
              aria-label="ExamShield on LinkedIn"
              title="ExamShield on LinkedIn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="es-social-btn"
              aria-label="ExamShield on GitHub"
              title="ExamShield on GitHub"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* Back to top button */}
            <button
              type="button"
              onClick={scrollToTop}
              className="es-back-to-top-btn"
              aria-label="Scroll back to top"
              title="Back to top"
            >
              <span>Top</span>
              <ChevronUp size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
