import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  LockKeyhole,
  Play,
  Pause,
  X,
  Volume2,
  Building,
  Sparkles,
  FileText,
  Brain,
  AlertTriangle,
  Eye,
  Activity,
  Code,
  Terminal,
  Check,
  Cpu,
  Layers,
  Radio,
  Award,
  Zap
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PORTAL_LINKS } from '../../../content/landingContent';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

// Institutional partners
const PLACEHOLDER_CUSTOMER_LOGOS = [
  { id: 'apex', name: 'Apex Institute of Technology', abbr: 'AIT' },
  { id: 'northfield', name: 'State Medical & Health Sciences Board', abbr: 'SMHB' },
  { id: 'polytech', name: 'National Polytechnic Council', abbr: 'NPC' },
  { id: 'bar-council', name: 'Global Bar Examination Standards', abbr: 'GBES' },
  { id: 'testing-auth', name: 'Autonomous Technical University', abbr: 'ATU' },
];

export default function HeroSection() {
  const { user } = useAuth();

  // Interactive Simulator State
  const [simTab, setSimTab] = useState('cockpit'); // 'cockpit' | 'dossier' | 'ai_studio'
  const [simThreat, setSimThreat] = useState('normal'); // 'normal' | 'tab_switch' | 'gaze_loss' | 'multi_face'
  const [simTimer, setSimTimer] = useState(2534); // seconds in session
  const [threatToast, setThreatToast] = useState(null);

  // Demo modal state
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoTriggerRef = useRef(null);
  const modalCloseBtnRef = useRef(null);
  const modalRef = useRef(null);

  const dashboardPath = dashboardPathFor(user?.role);
  const primaryCtaTarget = user ? dashboardPath : PORTAL_LINKS.registerInstitution;
  const primaryCtaLabel = user ? 'Open Console' : 'Start Institutional Trial';
  const studentTarget = user?.role === 'student' ? '/student/dashboard' : PORTAL_LINKS.studentLogin;

  // Session timer increment
  useEffect(() => {
    const timer = setInterval(() => {
      setSimTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Threat simulation trigger
  const triggerSimulation = (type) => {
    setSimThreat(type);
    if (type === 'tab_switch') {
      setThreatToast('WINDOW_BLUR_INTERCEPTED: Fullscreen lockdown triggered. Warning notice dispatched.');
    } else if (type === 'gaze_loss') {
      setThreatToast('GAZE_DEVIATION_ALERT: Face yaw exceeded 35° threshold for >3.0s.');
    } else if (type === 'multi_face') {
      setThreatToast('SECONDARY_SUBJECT_DETECTED: Unauthorized face entered candidate bounding box.');
    } else {
      setThreatToast('ALL_CLEAR: Biometric telemetry normalized (99.8% confidence).');
    }
    setTimeout(() => setThreatToast(null), 4000);
  };

  // Modal handlers
  const openDemoModal = () => setIsDemoOpen(true);
  const closeDemoModal = useCallback(() => {
    setIsDemoOpen(false);
    setTimeout(() => demoTriggerRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (!isDemoOpen) return;
    setTimeout(() => modalCloseBtnRef.current?.focus(), 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDemoModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isDemoOpen, closeDemoModal]);

  return (
    <section id="hero" className="es-hero-section" aria-labelledby="hero-heading">
      <div className="es-container es-hero-container">
        {/* Left Column: Hero Outcomes & Value Proposition */}
        <div className="es-hero-copy">
          <div className="es-hero-eyebrow-wrapper">
            <span className="es-hero-eyebrow">
              <span className="es-live-beacon" aria-hidden="true">
                <span className="beacon-ping" />
                <span className="beacon-core" />
              </span>
              <ShieldCheck size={14} className="es-eyebrow-icon" aria-hidden="true" />
              <span>NEXIFY EXAMINA ENTERPRISE v4.2 · SOVEREIGN AI PROCTORING</span>
            </span>
          </div>

          <h1 id="hero-heading" className="es-hero-heading">
            Secure every examination.
            <br />
            <span className="es-heading-highlight">Safeguard academic integrity.</span>
          </h1>

          <p className="es-hero-description">
            The autonomous AI exam-proctoring engine for universities, certification boards, and testing agencies. Zero software installation, multi-candidate biometric surveillance, Gemini AI Question Studio, and court-admissible forensic audit dossiers.
          </p>

          {/* Primary Action Buttons */}
          <div className="es-hero-cta-group" role="group" aria-label="Hero primary actions">
            <Link
              to={primaryCtaTarget}
              className="es-btn es-btn-lime es-btn-lg"
              aria-label={user ? 'Open your dashboard' : 'Start institutional trial'}
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>

            <Link
              to={studentTarget}
              className="es-btn es-btn-secondary es-btn-lg"
              aria-label="Continue to candidate exam room portal"
            >
              <Zap size={16} aria-hidden="true" style={{ color: '#0a74da' }} />
              <span>Candidate Exam Portal</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {/* Secondary Action: Interactive Demo Trigger */}
          <div className="es-hero-demo-trigger-wrap">
            <button
              ref={demoTriggerRef}
              type="button"
              className="es-hero-demo-trigger"
              onClick={openDemoModal}
              aria-haspopup="dialog"
              aria-label="Watch 90-second platform architecture overview"
            >
              <span className="es-demo-trigger-icon" aria-hidden="true">
                <Play size={12} fill="currentColor" />
              </span>
              <span>Platform architecture walkthrough (90s)</span>
            </button>
          </div>

          {/* Core Outcomes Checklist */}
          <div className="es-hero-outcomes-list" role="list" aria-label="Platform capabilities">
            <div className="es-outcome-item" role="listitem">
              <CheckCircle2 size={16} className="es-outcome-icon" aria-hidden="true" />
              <span>Sub-180ms Neural Biometrics</span>
            </div>
            <div className="es-outcome-item" role="listitem">
              <CheckCircle2 size={16} className="es-outcome-icon" aria-hidden="true" />
              <span>Zero-Kernel Browser Lockdown</span>
            </div>
            <div className="es-outcome-item" role="listitem">
              <CheckCircle2 size={16} className="es-outcome-icon" aria-hidden="true" />
              <span>Cryptographic Audit Dossiers</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Flight-Deck Proctor Simulator */}
        <div className="es-hero-video-column">
          <div className="es-hero-video-wrapper">
            {/* Floating Status Badges */}
            <div className="es-floating-badge es-badge-verified" aria-hidden="true">
              <span className="es-badge-pulse-dot" />
              <ShieldCheck size={13} className="es-badge-icon" />
              <span className="es-badge-label">
                {simThreat === 'normal' ? 'Identity 99.8% verified' : simThreat === 'tab_switch' ? 'Lockdown triggered' : 'Telemetry anomaly'}
              </span>
            </div>

            <div className="es-floating-badge es-badge-locked" aria-hidden="true">
              <LockKeyhole size={13} className="es-badge-icon" />
              <span className="es-badge-label">Single Monitor Enforced</span>
            </div>

            {/* Browser Flight-Deck Window Frame */}
            <div className="es-browser-window-frame" role="region" aria-label="Interactive Live Session Review flight deck simulator">
              {/* Chrome Top Bar */}
              <div className="es-window-chrome-bar">
                <div className="es-window-controls" aria-hidden="true">
                  <span className="es-win-dot red" />
                  <span className="es-win-dot yellow" />
                  <span className="es-win-dot green" />
                </div>

                {/* Simulator Mode Tabs */}
                <div className="es-sim-tabs" role="tablist">
                  <button
                    type="button"
                    className={`es-sim-tab ${simTab === 'cockpit' ? 'active' : ''}`}
                    onClick={() => setSimTab('cockpit')}
                  >
                    <Radio size={12} />
                    <span>Live Cockpit</span>
                  </button>
                  <button
                    type="button"
                    className={`es-sim-tab ${simTab === 'dossier' ? 'active' : ''}`}
                    onClick={() => setSimTab('dossier')}
                  >
                    <FileText size={12} />
                    <span>Audit Dossier</span>
                  </button>
                  <button
                    type="button"
                    className={`es-sim-tab ${simTab === 'ai_studio' ? 'active' : ''}`}
                    onClick={() => setSimTab('ai_studio')}
                  >
                    <Brain size={12} />
                    <span>AI Studio</span>
                  </button>
                </div>

                <div className="es-window-session-tag">
                  <span className="es-skel-live-dot" />
                  <span>{formatTimer(simTimer)}</span>
                </div>
              </div>

              {/* Viewport Content */}
              <div className="es-video-viewport" style={{ background: '#0a0f1d' }}>
                {threatToast && (
                  <div className="es-sim-toast" role="alert">
                    <AlertTriangle size={14} color="#f59e0b" />
                    <span>{threatToast}</span>
                  </div>
                )}

                {/* TAB 1: LIVE PROCTORING COCKPIT */}
                {simTab === 'cockpit' && (
                  <div className="es-sim-cockpit-view">
                    {/* Header session strip */}
                    <div className="es-sim-header-strip">
                      <div>
                        <span className="es-sim-sub-tag">SESSION #EX-9041</span>
                        <strong className="es-sim-subject-name">CS402 Distributed Systems &amp; Cloud Security</strong>
                      </div>
                      <div className="es-sim-status-chip">
                        <Activity size={12} color="#10b981" />
                        <span>Real-Time Invigilation</span>
                      </div>
                    </div>

                    {/* Main surveillance screen + telemetry split */}
                    <div className="es-sim-cockpit-body">
                      {/* Left: Video feed simulation */}
                      <div className={`es-sim-feed-frame ${simThreat !== 'normal' ? 'has-warning' : ''}`}>
                        {/* Candidate Avatar & Biometric Reticle */}
                        <div className="es-sim-avatar-box">
                          {/* Corner Reticles */}
                          <div className="es-sim-corner tl" />
                          <div className="es-sim-corner tr" />
                          <div className="es-sim-corner bl" />
                          <div className="es-sim-corner br" />

                          {/* Candidate Face Silhouette */}
                          <div className={`es-sim-face ${simThreat === 'gaze_loss' ? 'shifted-gaze' : ''}`}>
                            <div className="es-sim-head-mesh">
                              <span className="mesh-point p1" />
                              <span className="mesh-point p2" />
                              <span className="mesh-point p3" />
                              <span className="mesh-point p4" />
                            </div>
                            <div className="es-sim-torso-mesh" />
                          </div>

                          {/* Secondary Person Overlay if simulated */}
                          {simThreat === 'multi_face' && (
                            <div className="es-sim-secondary-face">
                              <span className="es-sim-secondary-tag">SUBJECT #2 DETECTED</span>
                            </div>
                          )}

                          {/* Tab Switch Overlay if simulated */}
                          {simThreat === 'tab_switch' && (
                            <div className="es-sim-lockdown-overlay">
                              <AlertTriangle size={32} color="#ef4444" />
                              <strong>WINDOW BLUR INTERCEPTED</strong>
                              <span>Unauthorized tab switch detected. Focus lost (1.4s).</span>
                            </div>
                          )}

                          {/* Biometric Stream HUD Chips */}
                          <div className="es-sim-hud-top">
                            <span className="es-hud-tag green">
                              <CheckCircle2 size={11} />
                              {simThreat === 'normal' ? 'Candidate Verified · Sarah M.' : simThreat === 'gaze_loss' ? 'Gaze Loss: Amber Flag' : 'Infraction Telemetry'}
                            </span>
                            <span className="es-hud-tag dark">
                              Yaw: {simThreat === 'gaze_loss' ? '+38.4°' : '+1.2°'} | Pitch: -0.4°
                            </span>
                          </div>

                          <div className="es-sim-hud-bottom">
                            <div className="es-hud-audio-bars">
                              <Volume2 size={11} style={{ opacity: 0.8 }} />
                              <span className="audio-bar b1" />
                              <span className="audio-bar b2" />
                              <span className="audio-bar b3" />
                              <span className="audio-bar b4" />
                              <span style={{ fontSize: '0.68rem', marginLeft: '4px' }}>14 dB Ambient</span>
                            </div>
                            <span className="es-hud-score">
                              Integrity: <strong>{simThreat === 'normal' ? '99.8%' : '84.2%'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Candidate meta bar */}
                        <div className="es-sim-candidate-footer">
                          <div>
                            <strong>Sarah Mitchell</strong>
                            <span>Roll: CS-2025-041</span>
                          </div>
                          <span className="es-sim-kiosk-pill">
                            <LockKeyhole size={11} />
                            Lockdown Active
                          </span>
                        </div>
                      </div>

                      {/* Right: Telemetry & Infraction Ledger */}
                      <div className="es-sim-telemetry-col">
                        <div className="es-sim-panel-title">INTEGRITY DEFENSE MATRIX</div>
                        <div className="es-sim-check-list">
                          <div className="es-sim-check-row passed">
                            <Check size={11} />
                            <span>Biometric Identity Verified</span>
                          </div>
                          <div className={`es-sim-check-row ${simThreat === 'tab_switch' ? 'flagged' : 'passed'}`}>
                            {simThreat === 'tab_switch' ? <AlertTriangle size={11} /> : <Check size={11} />}
                            <span>Fullscreen Kiosk Sandbox</span>
                          </div>
                          <div className={`es-sim-check-row ${simThreat === 'multi_face' ? 'flagged' : 'passed'}`}>
                            {simThreat === 'multi_face' ? <AlertTriangle size={11} /> : <Check size={11} />}
                            <span>Single Person in Frame</span>
                          </div>
                          <div className={`es-sim-check-row ${simThreat === 'gaze_loss' ? 'flagged' : 'passed'}`}>
                            {simThreat === 'gaze_loss' ? <AlertTriangle size={11} /> : <Check size={11} />}
                            <span>Neural Gaze Tracking</span>
                          </div>
                        </div>

                        <div className="es-sim-panel-title" style={{ marginTop: '12px' }}>LIVE SESSION AUDIT LOG</div>
                        <div className="es-sim-log-flow">
                          <div className="es-sim-log-item">
                            <span className="time">00:00:12</span>
                            <span>Face biometric baseline enrolled</span>
                          </div>
                          <div className="es-sim-log-item">
                            <span className="time">00:14:30</span>
                            <span>Single display profile verified</span>
                          </div>
                          {simThreat !== 'normal' && (
                            <div className="es-sim-log-item alert">
                              <span className="time">{formatTimer(simTimer)}</span>
                              <span>
                                {simThreat === 'tab_switch' ? 'Tab switch intercepted (Warning 1/3)' : simThreat === 'gaze_loss' ? 'Gaze angle deviation logged' : 'Secondary subject identified'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Threat Simulator Buttons Bar */}
                    <div className="es-sim-threat-bar">
                      <span className="es-sim-bar-label">Test Real-Time Defense:</span>
                      <button
                        type="button"
                        className={`es-threat-btn ${simThreat === 'tab_switch' ? 'active' : ''}`}
                        onClick={() => triggerSimulation('tab_switch')}
                      >
                        ⚡ Tab Switch
                      </button>
                      <button
                        type="button"
                        className={`es-threat-btn ${simThreat === 'gaze_loss' ? 'active' : ''}`}
                        onClick={() => triggerSimulation('gaze_loss')}
                      >
                        👁️ Gaze Loss
                      </button>
                      <button
                        type="button"
                        className={`es-threat-btn ${simThreat === 'multi_face' ? 'active' : ''}`}
                        onClick={() => triggerSimulation('multi_face')}
                      >
                        👥 Second Face
                      </button>
                      <button
                        type="button"
                        className="es-threat-btn reset"
                        onClick={() => triggerSimulation('normal')}
                      >
                        ✓ All Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: FORENSIC AUDIT DOSSIER */}
                {simTab === 'dossier' && (
                  <div className="es-sim-dossier-view">
                    <div className="es-dossier-card">
                      <div className="es-dossier-header">
                        <div>
                          <div className="es-dossier-stamp">COURT-ADMISSIBLE FORENSIC REPORT</div>
                          <h4>Certificate of Examination Integrity</h4>
                          <span className="es-dossier-hash">SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</span>
                        </div>
                        <div className="es-dossier-badge-valid">
                          <Award size={20} />
                          <span>100% VALIDATED</span>
                        </div>
                      </div>

                      <div className="es-dossier-grid">
                        <div className="es-dossier-stat">
                          <span className="lbl">Candidate Name</span>
                          <strong>Sarah Mitchell (CS-2025-041)</strong>
                        </div>
                        <div className="es-dossier-stat">
                          <span className="lbl">Examination Code</span>
                          <strong>CS402-FINAL-2025-WINTER</strong>
                        </div>
                        <div className="es-dossier-stat">
                          <span className="lbl">Biometric Consistency</span>
                          <strong style={{ color: '#10b981' }}>99.82% Confidence (Passed)</strong>
                        </div>
                        <div className="es-dossier-stat">
                          <span className="lbl">Infraction Incidents</span>
                          <strong style={{ color: '#0a74da' }}>0 Sanctioned Violations</strong>
                        </div>
                      </div>

                      <div className="es-dossier-timeline-summary">
                        <strong>Cryptographic Verification Sign-Off:</strong>
                        <p>
                          Digitally attested by Nexify Autonomous Kernel with continuous biometric hashing and anti-tamper timestamps. Admissible under ISO 27001 &amp; University Examination By-Laws.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AI QUESTION STUDIO */}
                {simTab === 'ai_studio' && (
                  <div className="es-sim-studio-view">
                    <div className="es-studio-code-card">
                      <div className="es-studio-top">
                        <div className="es-studio-pill">
                          <Brain size={13} color="#0a74da" />
                          <span>Gemini AI Question Synthesizer</span>
                        </div>
                        <span className="es-studio-diff medium">MEDIUM DSA</span>
                      </div>
                      <div className="es-studio-code-header">
                        <strong>Problem: Dynamic Subsequence Reconstruction</strong>
                        <span className="es-studio-meta">LeetCode / Codeforces Benchmark Aligned</span>
                      </div>
                      <pre className="es-studio-code-snippet">
                        <code>{`// Auto-generated deterministic test suite
function maxSubsequenceScore(nums, k) {
  nums.sort((a, b) => b[1] - a[1]);
  const minHeap = new MinPriorityQueue();
  let sum = 0, maxScore = 0;
  for (const [val, speed] of nums) {
    sum += val; minHeap.enqueue(val);
    if (minHeap.size() > k) sum -= minHeap.dequeue().element;
    if (minHeap.size() === k) maxScore = Math.max(maxScore, sum * speed);
  }
  return maxScore;
}`}</code>
                      </pre>
                      <div className="es-studio-footer">
                        <span>Automated Test Cases: <strong>12/12 Verified</strong></span>
                        <span style={{ color: '#10b981' }}>● Code Sandbox Ready</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Trust Strip */}
      <div className="es-hero-trust-strip">
        <div className="es-container">
          <div className="es-trust-strip-inner">
            {/* Compliance Certifications */}
            <div className="es-compliance-badges-group" role="list" aria-label="Security and compliance standards">
              <div className="es-compliance-pill" role="listitem">
                <ShieldCheck size={14} className="es-compliance-icon" aria-hidden="true" />
                <span>FERPA Aligned</span>
              </div>
              <span className="es-compliance-dot" aria-hidden="true">·</span>
              <div className="es-compliance-pill" role="listitem">
                <ShieldCheck size={14} className="es-compliance-icon" aria-hidden="true" />
                <span>GDPR Privacy Compliant</span>
              </div>
              <span className="es-compliance-dot" aria-hidden="true">·</span>
              <div className="es-compliance-pill" role="listitem">
                <ShieldCheck size={14} className="es-compliance-icon" aria-hidden="true" />
                <span>ISO 27001 Certified</span>
              </div>
              <span className="es-compliance-dot" aria-hidden="true">·</span>
              <div className="es-compliance-pill" role="listitem">
                <ShieldCheck size={14} className="es-compliance-icon" aria-hidden="true" />
                <span>SOC 2 Type II Aligned</span>
              </div>
            </div>

            {/* Customer Logo Row */}
            <div className="es-trust-logos-row" role="list" aria-label="Partner institutions">
              {PLACEHOLDER_CUSTOMER_LOGOS.map((logo) => (
                <div key={logo.id} className="es-customer-logo-pill" role="listitem">
                  <Building size={14} className="es-customer-logo-icon" aria-hidden="true" />
                  <span className="es-customer-logo-name">{logo.name}</span>
                </div>
              ))}
            </div>

            <p className="es-trust-logos-disclaimer">
              Accredited university partners &amp; state certification examination boards
            </p>
          </div>
        </div>
      </div>

      {/* 90-Second Demo Video Modal */}
      {isDemoOpen && (
        <div
          className="es-demo-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDemoModal();
          }}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="es-demo-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
          >
            {/* Modal Header */}
            <div className="es-demo-modal-header">
              <div className="es-demo-header-copy">
                <h2 id="demo-modal-title" className="es-demo-modal-title">
                  Nexify Examina — Platform Architecture Walkthrough
                </h2>
                <p className="es-demo-modal-desc">
                  Autonomous neural biometrics, browser kiosk sandbox, and tamper-evident audit dossiers.
                </p>
              </div>
              <button
                ref={modalCloseBtnRef}
                type="button"
                className="es-demo-modal-close-btn"
                onClick={closeDemoModal}
                aria-label="Close demo"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="es-demo-modal-body">
              <div className="es-demo-player-container">
                <div className="es-demo-fallback-slate" aria-live="polite">
                  <div className="es-demo-fallback-inner">
                    <div className="es-demo-placeholder-icon" aria-hidden="true">
                      <ShieldCheck size={36} color="#0a74da" />
                    </div>
                    <h3>Nexify Sovereign Proctoring Architecture</h3>
                    <p>
                      Our zero-driver, WebRTC-accelerated proctoring engine operates entirely in the browser with sub-180ms inference speeds.
                    </p>
                    <div className="es-demo-chapters-preview">
                      <strong>Core Architectural Pillars (90s Tour):</strong>
                      <ul>
                        <li>00:00 – Frictionless candidate check-in with zero software install</li>
                        <li>00:20 – Continuous neural biometric face mesh &amp; eye-gaze tracking</li>
                        <li>00:40 – Browser kiosk lockdown, multi-monitor interception &amp; clipboard freeze</li>
                        <li>01:00 – Acoustic whisper analyzer &amp; ambient sound telemetry</li>
                        <li>01:20 – Cryptographic audit dossiers with SHA-256 tamper-evident seals</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <Link to={PORTAL_LINKS.registerInstitution} className="es-btn es-btn-lime es-btn-sm" onClick={closeDemoModal}>
                        <span>Request Architecture Briefing</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
