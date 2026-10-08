import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PORTAL_LINKS } from '../../../content/landingContent';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

export default function FinalCta() {
  const { user } = useAuth();
  const dashboardPath = dashboardPathFor(user?.role);
  const ctaTarget = user ? dashboardPath : PORTAL_LINKS.registerInstitution;
  const ctaLabel = user ? 'Open Your Dashboard' : 'Start Institutional Trial';
  const studentTarget = user?.role === 'student' ? '/student/dashboard' : PORTAL_LINKS.studentLogin;

  return (
    <section className="es-final-cta-section" aria-labelledby="final-cta-heading">
      <div className="es-final-cta-glow" aria-hidden="true" />
      <div className="es-container">
        <div className="es-final-cta-card">
          <div className="es-final-cta-eyebrow">
            <Sparkles size={14} className="es-cta-sparkle-icon" aria-hidden="true" />
            <span>READY TO MODERNIZE YOUR EXAMINATIONS?</span>
          </div>

          <h2 id="final-cta-heading" className="es-final-cta-title">
            Safeguard academic integrity.
            <br />
            <span>Trust every examination result.</span>
          </h2>

          <p className="es-final-cta-desc">
            Deploy Nexify Examina's autonomous AI cheating prevention, kiosk browser lockdown, and live invigilation command center. Pilot onboarding in under 48 hours.
          </p>

          <div className="es-final-cta-actions">
            <Link
              to={ctaTarget}
              className="es-btn es-btn-lime es-btn-lg"
              aria-label={ctaLabel}
            >
              <span>{ctaLabel}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>

            <Link
              to={studentTarget}
              className="es-btn es-btn-secondary es-btn-lg"
              aria-label="Student Exam Sign In"
            >
              <span>Student Exam Sign In</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="es-final-cta-proof" role="list">
            <div className="es-final-proof-item" role="listitem">
              <CheckCircle2 size={15} className="proof-check" aria-hidden="true" />
              <span>Zero Software Install (100% Web)</span>
            </div>
            <div className="es-final-proof-item" role="listitem">
              <CheckCircle2 size={15} className="proof-check" aria-hidden="true" />
              <span>FERPA &amp; ISO 27001 Aligned</span>
            </div>
            <div className="es-final-proof-item" role="listitem">
              <CheckCircle2 size={15} className="proof-check" aria-hidden="true" />
              <span>99.98% Anomaly Precision</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
