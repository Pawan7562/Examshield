import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, ShieldCheck, ScanFace, LockKeyhole,
  Eye, Mic, FileText, Users, Building2, GraduationCap, Sparkles,
  Clock, ChevronRight, Activity, Monitor, AlertTriangle,
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import './PublicPages.css';

const lifecycle = [
  {
    number: '01',
    phase: 'PRE-EXAM SETUP',
    title: 'Institution & Exam Configuration',
    icon: GraduationCap,
    color: 'green',
    duration: '~15 minutes',
    who: 'College Admin / Exam Controller',
    description: 'The Exam Controller logs into the institutional admin console, imports the student roster via CSV or LMS sync, configures the exam window, question pool, and proctoring sensitivity level.',
    steps: [
      'Import student roster from CSV, SIS, or LMS gradebook',
      'Define exam duration, start window, and grace period',
      'Configure AI sensitivity thresholds and violation policies',
      'Auto-generate and dispatch digital hall tickets to students',
    ],
  },
  {
    number: '02',
    phase: 'CANDIDATE ONBOARDING',
    title: 'Biometric Check-In & System Preflight',
    icon: ScanFace,
    color: 'blue',
    duration: '2–3 minutes',
    who: 'Student / Candidate',
    description: 'Each candidate performs a 60-second automated preflight: webcam and microphone diagnostics, network speed test, government or student ID capture, and real-time facial match against the registered profile.',
    steps: [
      'Webcam, microphone, and bandwidth preflight diagnostics',
      'Government / student ID document capture and verification',
      'Real-time facial biometric match against registration photo',
      'Room environment check: lighting, background, and distraction scan',
    ],
  },
  {
    number: '03',
    phase: 'ENVIRONMENT LOCKDOWN',
    title: 'Kiosk Sandbox Activation',
    icon: LockKeyhole,
    color: 'red',
    duration: 'Instant',
    who: 'System (Automated)',
    description: 'The browser transitions into kiosk fullscreen mode. Clipboard history is wiped, all OS-level keyboard shortcuts are intercepted, secondary displays are deactivated, and developer tools are disabled.',
    steps: [
      'Fullscreen kiosk enforced — escape rejected at OS level',
      'Alt+Tab, Windows key, Print Screen fully intercepted',
      'Clipboard cleared; copy-paste of exam content blocked',
      'Dual monitor and HDMI splitter connections detected and flagged',
    ],
  },
  {
    number: '04',
    phase: 'ACTIVE EXAMINATION',
    title: 'Hybrid AI & Human Invigilation',
    icon: Eye,
    color: 'orange',
    duration: 'Exam duration',
    who: 'AI Engine + Invigilator',
    description: 'Continuous dual-layer monitoring processes facial gaze, ambient audio levels, and screen focus at 500ms intervals while human proctors supervise AI-sorted candidate tiles and intervene with precision.',
    steps: [
      'Biometric identity validated every 500ms throughout the exam',
      'AI risk score updates live — suspicious sessions bubble to top',
      'Proctor whispers, warnings, and session freezes available in 3 clicks',
      'All events timestamped and indexed for the forensic dossier',
    ],
  },
  {
    number: '05',
    phase: 'EVALUATION & CERTIFICATION',
    title: 'Dossier Generation & Gradebook Return',
    icon: FileText,
    color: 'green',
    duration: 'Automatic post-exam',
    who: 'System + Admin Review',
    description: 'Session recordings, AI event logs, and integrity scores are compiled into a cryptographically signed PDF dossier. Validated scores are pushed directly back to the LMS gradebook via LTI 1.3.',
    steps: [
      'Integrity Trust Score assigned per candidate (0–100 scale)',
      'Forensic PDF dossier generated with SHA-256 hash verification',
      'Grade automatically returned to LMS gradebook via LTI passback',
      'Incident dossiers flagged for disciplinary board if violations confirmed',
    ],
  },
];

const faqs = [
  {
    q: 'What does a student need to start an exam on Nexify Examina?',
    a: 'Only a standard web browser (Chrome, Edge, Firefox, or Safari), a working webcam, a microphone, and a stable internet connection of at least 500 kbps. No plugins, no software downloads, no administrator permissions required.',
  },
  {
    q: 'How long does the initial institutional setup take?',
    a: 'From account creation to first exam, most institutions are fully configured in under 15 minutes. Our onboarding engineer helps with LMS integration, department configuration, and first exam scheduling during a guided session.',
  },
  {
    q: 'Can invigilators see all candidates simultaneously?',
    a: 'Yes. The Invigilator Cockpit displays a live grid of up to 50 candidate video tiles simultaneously, AI-sorted by risk score so the highest-priority sessions appear first. Proctors can also switch to a single-candidate focused view at any time.',
  },
  {
    q: 'How does Nexify Examina handle unstable internet connections?',
    a: 'Nexify Examina uses an offline-resilient caching architecture. If a student\'s connection drops temporarily, test progress and biometric timestamps are cached locally in encrypted browser storage and sync automatically when connection is restored.',
  },
  {
    q: 'What happens after a violation is detected?',
    a: 'The AI flags the event and escalates it to the invigilator\'s attention without automatically penalizing the candidate. The human invigilator reviews the flagged clip and decides whether to issue a warning, freeze the session, or clear the flag. No candidate is ever penalized by an algorithm alone.',
  },
];

const colorMap = {
  green: '#087f4c',
  blue: '#0a74da',
  red: '#dc2626',
  orange: '#d97706',
};

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const active = lifecycle[activeStep];
  const ActiveIcon = active.icon;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="hiw-hero-section public-shell" aria-labelledby="hiw-hero-h1">
        <div className="hiw-hero-eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          <span>End-to-End Exam Lifecycle</span>
        </div>
        <h1 id="hiw-hero-h1">
          From roster import to<br /><span>certified audit dossier</span>
        </h1>
        <p className="hiw-hero-sub">
          A structured 5-phase examination workflow that eliminates manual coordination, removes technical barriers for students, and delivers indisputable integrity evidence for institutions.
        </p>
        <div className="hiw-hero-actions">
          <Link to="/admin/register" className="feat-cta-primary">
            Register Your Institution
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/features" className="feat-cta-secondary">
            Explore All Features
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Interactive 5-Phase Timeline */}
      <section className="public-shell hiw-lifecycle-section" aria-labelledby="lifecycle-heading">
        <div className="hiw-section-header">
          <p className="hiw-kicker">5-PHASE EXAMINATION LIFECYCLE</p>
          <h2 id="lifecycle-heading">How every exam runs on Nexify Examina</h2>
          <p>Click any phase to explore what happens at each stage of the examination journey.</p>
        </div>

        <div className="hiw-lifecycle-layout">
          {/* Phase Selector Sidebar */}
          <div className="hiw-phase-nav" role="tablist" aria-label="Exam lifecycle phases">
            {lifecycle.map((phase, idx) => (
              <button
                key={phase.number}
                role="tab"
                aria-selected={activeStep === idx}
                className={`hiw-phase-btn ${activeStep === idx ? 'active' : ''}`}
                style={{ '--phase-color': colorMap[phase.color] }}
                onClick={() => setActiveStep(idx)}
              >
                <span className="hiw-phase-number">{phase.number}</span>
                <div className="hiw-phase-btn-text">
                  <span className="hiw-phase-label">{phase.phase}</span>
                  <span className="hiw-phase-title">{phase.title}</span>
                </div>
                <ChevronRight size={16} className="hiw-phase-arrow" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Phase Detail Panel */}
          <div className="hiw-phase-panel" role="tabpanel" aria-label={`Phase ${active.number}: ${active.title}`}>
            <div className={`hiw-panel-header hiw-color-${active.color}`}>
              <div className={`hiw-panel-icon hiw-icon-${active.color}`} aria-hidden="true">
                <ActiveIcon size={28} strokeWidth={2} />
              </div>
              <div>
                <span className="hiw-panel-phase-tag">{active.phase}</span>
                <h3>{active.title}</h3>
              </div>
              <div className="hiw-panel-meta">
                <div className="hiw-meta-item">
                  <Clock size={14} aria-hidden="true" />
                  <span>{active.duration}</span>
                </div>
                <div className="hiw-meta-item">
                  <Users size={14} aria-hidden="true" />
                  <span>{active.who}</span>
                </div>
              </div>
            </div>

            <p className="hiw-panel-description">{active.description}</p>

            <ul className="hiw-panel-steps" role="list">
              {active.steps.map((step, i) => (
                <li key={i} className="hiw-panel-step" role="listitem">
                  <CheckCircle2 size={18} className={`hiw-step-check hiw-check-${active.color}`} aria-hidden="true" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            {/* Progress Dots */}
            <div className="hiw-progress-dots" aria-label={`Step ${activeStep + 1} of ${lifecycle.length}`}>
              {lifecycle.map((_, idx) => (
                <button
                  key={idx}
                  className={`hiw-dot ${activeStep === idx ? 'active' : ''}`}
                  onClick={() => setActiveStep(idx)}
                  aria-label={`Go to phase ${idx + 1}`}
                />
              ))}
            </div>

            {activeStep < lifecycle.length - 1 ? (
              <button
                className={`hiw-next-btn hiw-next-${active.color}`}
                onClick={() => setActiveStep(activeStep + 1)}
              >
                Continue to next phase
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              <Link to="/admin/register" className={`hiw-next-btn hiw-next-${active.color}`}>
                Register Your Institution
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="public-shell hiw-stats-section" aria-label="Platform performance statistics">
        <div className="hiw-stats-grid">
          {[
            { value: '1.2M+', label: 'Exams Monitored', sub: 'Across all institutions' },
            { value: '99.98%', label: 'Detection Accuracy', sub: 'AI anomaly precision' },
            { value: '<15min', label: 'Institution Setup', sub: 'From signup to first exam' },
            { value: '150+', label: 'Colleges Onboarded', sub: 'Universities & boards' },
          ].map(stat => (
            <div key={stat.value} className="hiw-stat-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small>{stat.sub}</small>
            </div>
          ))}
        </div>
      </section>

      {/* Security Architecture */}
      <section className="public-shell hiw-security-section" aria-labelledby="security-arch-heading">
        <div className="hiw-section-header">
          <p className="hiw-kicker">PRIVACY & DATA GOVERNANCE</p>
          <h2 id="security-arch-heading">Security at every layer of the exam lifecycle</h2>
          <p>Nexify Examina is architected so that AI-driven surveillance never compromises student privacy or institutional compliance obligations.</p>
        </div>
        <div className="hiw-security-grid">
          {[
            { icon: LockKeyhole, title: 'AES-256 + TLS 1.3', desc: 'All video streams, audio recordings, and event logs encrypted at rest and in transit. Strictly isolated per-tenant storage.' },
            { icon: ShieldCheck, title: 'FERPA & GDPR Aligned', desc: 'Configurable data retention windows with automated deletion on expiry. No biometric data shared cross-institution.' },
            { icon: Monitor, title: 'Non-Invasive Browser Only', desc: 'Zero kernel drivers, no background daemons, no root permissions. Nexify Examina runs cleanly inside the candidate\'s browser.' },
            { icon: Users, title: 'Human Decision Gateway', desc: 'AI flags and sorts — humans decide. No candidate is disqualified based on an algorithm without invigilator review.' },
            { icon: Activity, title: 'Live Incident Audit Log', desc: 'Every proctor action, AI flag, and system event is immutably logged with ISO 8601 timestamps for governance review.' },
            { icon: AlertTriangle, title: 'No Proxy Test-Taking', desc: 'Continuous biometric verification every 500ms prevents substitution fraud even after initial check-in is completed.' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="hiw-security-card">
                <div className="hiw-sec-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="public-shell hiw-faq-section" aria-labelledby="hiw-faq-heading">
        <div className="hiw-section-header">
          <p className="hiw-kicker">COMMON QUESTIONS</p>
          <h2 id="hiw-faq-heading">Frequently asked by institutions</h2>
        </div>
        <div className="hiw-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`hiw-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="hiw-faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="hiw-faq-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="hiw-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="public-shell features-cta-section hiw-cta-section" aria-labelledby="hiw-cta-heading">
        <div className="features-cta-inner">
          <div className="features-cta-left">
            <p className="features-cta-kicker">START IN 15 MINUTES</p>
            <h2 id="hiw-cta-heading">Ready to run your first<br />monitored exam?</h2>
            <p>Nexify Examina handles every phase — from roster import to certified dossier — so your team can focus on education, not exam logistics.</p>
          </div>
          <div className="features-cta-right">
            <div className="features-cta-card">
              <ul className="cta-feature-checklist">
                {[
                  'No software installation for students',
                  'LMS connected in one click (LTI 1.3)',
                  'First exam live within 15 minutes',
                  'Dedicated onboarding support included',
                ].map(item => (
                  <li key={item}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/admin/register" className="feat-cta-primary full-width">
                <Building2 size={17} aria-hidden="true" />
                Register Your Institution
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/contact" className="feat-cta-secondary full-width">
                Talk to an Onboarding Specialist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
