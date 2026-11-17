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
  FileText
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PORTAL_LINKS } from '../../../content/landingContent';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

// Clearly marked placeholder institutional partner logos
const PLACEHOLDER_CUSTOMER_LOGOS = [
  { id: 'apex', name: 'Apex State University', abbr: 'ASU' },
  { id: 'northfield', name: 'Northfield Medical Board', abbr: 'NMB' },
  { id: 'polytech', name: 'Central Polytechnic Institute', abbr: 'CPI' },
  { id: 'bar-council', name: 'Global Bar Examination Council', abbr: 'GBEC' },
  { id: 'testing-auth', name: 'Imperial Standards Testing Authority', abbr: 'ISTA' },
];

export default function HeroSection() {
  const { user } = useAuth();

  // Video playback & availability state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isReducedMotionOrSaveData, setIsReducedMotionOrSaveData] = useState(false);

  // Demo modal state
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoVideoError, setDemoVideoError] = useState(false);

  // Element Refs
  const heroVideoRef = useRef(null);
  const heroFrameRef = useRef(null);
  const demoVideoRef = useRef(null);
  const demoTriggerRef = useRef(null);
  const modalCloseBtnRef = useRef(null);
  const modalRef = useRef(null);

  const dashboardPath = dashboardPathFor(user?.role);
  const primaryCtaTarget = user ? dashboardPath : PORTAL_LINKS.registerInstitution;
  const primaryCtaLabel = user ? 'Open Console' : 'Start Institutional Trial';
  const studentTarget = user?.role === 'student' ? '/student/dashboard' : PORTAL_LINKS.studentLogin;

  // 1. Motion & Network Preferences Check
  const checkMotionAndData = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const isSaveData = navigator.connection?.saveData === true;
    return Boolean(prefersReduced || isSaveData);
  }, []);

  useEffect(() => {
    const isRestricted = checkMotionAndData();
    setIsReducedMotionOrSaveData(isRestricted);
  }, [checkMotionAndData]);

  // 2. IntersectionObserver: Autoplay only in viewport, pause when off-screen
  useEffect(() => {
    const video = heroVideoRef.current;
    const container = heroFrameRef.current;
    if (!video || !container) return;

    if (isReducedMotionOrSaveData) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch(() => {
                  // Browser policy or missing media fallback
                  setIsPlaying(false);
                });
            }
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isReducedMotionOrSaveData]);

  // Accessible Play/Pause toggle
  const togglePlayPause = () => {
    const video = heroVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  // 3. Demo Modal Handlers: Focus Trap & Escape Key Listener
  const openDemoModal = () => {
    setIsDemoOpen(true);
  };

  const closeDemoModal = useCallback(() => {
    setIsDemoOpen(false);
    if (demoVideoRef.current) {
      demoVideoRef.current.pause();
      demoVideoRef.current.currentTime = 0;
    }
    // Return focus to trigger button
    setTimeout(() => {
      demoTriggerRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    if (!isDemoOpen) return;

    // Set initial focus to close button
    setTimeout(() => {
      modalCloseBtnRef.current?.focus();
    }, 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDemoModal();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), video'
        );
        if (focusable.length === 0) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isDemoOpen, closeDemoModal]);

  return (
    <section id="hero" className="es-hero-section" aria-labelledby="hero-heading">
      <div className="es-container es-hero-container">
        {/* Left Column: Hero Outcomes & Value Proposition */}
        <div className="es-hero-copy">
          <div className="es-hero-eyebrow-wrapper">
            <span className="es-hero-eyebrow">
              <ShieldCheck size={14} className="es-eyebrow-icon" aria-hidden="true" />
              <span>Institutional Assessment Security</span>
            </span>
          </div>

          <h1 id="hero-heading" className="es-hero-heading">
            Secure every exam.
            <br />
            <span className="es-heading-highlight">Protect institutional integrity.</span>
          </h1>

          <p className="es-hero-description">
            Nexify Examina delivers autonomous AI and live invigilation for universities, certification boards, and testing agencies. Continuous identity verification, browser lockdown, audio anomaly detection, and tamper-evident audit reports.
          </p>

          {/* Primary Action Buttons (Existing CTAs Preserved) */}
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
              aria-label="Continue to student exam portal"
            >
              <span>Student Exam Portal</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {/* Secondary Action: Watch 90-second demo button */}
          <div className="es-hero-demo-trigger-wrap">
            <button
              ref={demoTriggerRef}
              type="button"
              className="es-hero-demo-trigger"
              onClick={openDemoModal}
              aria-haspopup="dialog"
              aria-label="Watch 90-second platform overview video"
            >
              <span className="es-demo-trigger-icon" aria-hidden="true">
                <Play size={13} fill="currentColor" />
              </span>
              <span>Watch 90-second demo</span>
            </button>
          </div>

          {/* Core Outcomes Checklist */}
          <div className="es-hero-outcomes-list" role="list" aria-label="Platform capabilities">
            <div className="es-outcome-item" role="listitem">
              <CheckCircle2 size={16} className="es-outcome-icon" aria-hidden="true" />
              <span>Continuous identity verification</span>
            </div>
            <div className="es-outcome-item" role="listitem">
              <CheckCircle2 size={16} className="es-outcome-icon" aria-hidden="true" />
              <span>Browser lockdown kiosk</span>
            </div>
            <div className="es-outcome-item" role="listitem">
              <CheckCircle2 size={16} className="es-outcome-icon" aria-hidden="true" />
              <span>Tamper-evident audit reports</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Video Frame (Replaces old dark visual) */}
        <div className="es-hero-video-column">
          <div className="es-hero-video-wrapper" ref={heroFrameRef}>
            {/* Floating Badge 1: Identity Verified (Grid-aligned, hidden on mobile) */}
            <div className="es-floating-badge es-badge-verified" aria-hidden="true">
              <span className="es-badge-pulse-dot" />
              <ShieldCheck size={13} className="es-badge-icon" />
              <span className="es-badge-label">Identity verified</span>
            </div>

            {/* Floating Badge 2: Browser Locked (Grid-aligned, hidden on mobile) */}
            <div className="es-floating-badge es-badge-locked" aria-hidden="true">
              <span className="es-badge-pulse-dot" />
              <LockKeyhole size={13} className="es-badge-icon" />
              <span className="es-badge-label">Browser locked</span>
            </div>

            {/* Light Browser-Window Frame with Subtle Chrome */}
            <div className="es-browser-window-frame" role="region" aria-label="Live Session Review product demonstration">
              {/* Chrome Top Bar */}
              <div className="es-window-chrome-bar">
                <div className="es-window-controls" aria-hidden="true">
                  <span className="es-win-dot red" />
                  <span className="es-win-dot yellow" />
                  <span className="es-win-dot green" />
                </div>

                <div className="es-window-title">
                  <span className="es-live-session-beacon" aria-hidden="true" />
                  <span>Live Session Review</span>
                </div>

                <div className="es-window-actions">
                  <button
                    type="button"
                    className="es-video-play-btn"
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Pause live preview' : 'Play live preview'}
                    title={isPlaying ? 'Pause live preview' : 'Play live preview'}
                  >
                    {isPlaying ? (
                      <Pause size={12} aria-hidden="true" />
                    ) : (
                      <Play size={12} fill="currentColor" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Viewport with Reserved 16:10 Aspect Ratio to Eliminate Layout Shift */}
              <div className="es-video-viewport">
                {/*
                  TODO: Replace placeholder video files when available:
                  - /videos/hero-loop.webm (VP9, 1920x1200, < 3MB)
                  - /videos/hero-loop.mp4 (H.264, 1920x1200, < 3MB)
                  - /images/hero-poster.jpg (1920x1200 poster frame)
                */}
                <video
                  ref={heroVideoRef}
                  className="es-hero-video-element"
                  muted
                  loop
                  playsInline
                  autoPlay={!isReducedMotionOrSaveData}
                  preload="metadata"
                  poster="/images/hero-poster.jpg"
                  onError={() => setVideoError(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src="/videos/hero-loop.webm" type="video/webm" />
                  <source src="/videos/hero-loop.mp4" type="video/mp4" />
                </video>

                {/* Graceful Fallback: Enterprise Proctor Dashboard Skeleton */}
                <div
                  className={`es-proctor-skeleton-fallback ${videoError || isReducedMotionOrSaveData ? 'is-visible' : ''}`}
                  aria-hidden={!videoError && !isReducedMotionOrSaveData}
                >
                  {/* Dashboard Header Bar */}
                  <div className="es-skel-header">
                    <div className="es-skel-session-info">
                      <span className="es-skel-session-tag">SESSION #EX-8941</span>
                      <span className="es-skel-course">CS401 Distributed Systems Finals</span>
                    </div>
                    <div className="es-skel-status-pill">
                      <span className="es-skel-live-dot" />
                      <span>Active (42m 10s)</span>
                    </div>
                  </div>

                  {/* Dashboard Main Grid: Candidate Stream + Telemetry Log */}
                  <div className="es-skel-body">
                    {/* Left: Candidate Stream Card */}
                    <div className="es-skel-candidate-card">
                      <div className="es-skel-feed-wrap">
                        {/* Realistic Candidate Silhouette / Avatar */}
                        <div className="es-skel-candidate-avatar" aria-hidden="true">
                          <div className="es-skel-head" />
                          <div className="es-skel-torso" />
                          {/* Corner Reticle Markers (Clean & Minimal) */}
                          <div className="es-skel-reticle top-left" />
                          <div className="es-skel-reticle top-right" />
                          <div className="es-skel-reticle bottom-left" />
                          <div className="es-skel-reticle bottom-right" />
                        </div>

                        {/* Stream Badges */}
                        <div className="es-skel-stream-chip top">
                          <CheckCircle2 size={11} className="es-chip-green" />
                          <span>Candidate present &amp; verified</span>
                        </div>

                        <div className="es-skel-stream-chip bottom">
                          <Volume2 size={11} className="es-chip-gray" />
                          <span>Ambient audio: 14 dB baseline</span>
                        </div>
                      </div>

                      <div className="es-skel-candidate-footer">
                        <div>
                          <strong className="es-skel-cand-name">Sarah Mitchell</strong>
                          <span className="es-skel-cand-id">Candidate ID: CS-2025-041</span>
                        </div>
                        <span className="es-skel-desk-badge">Single Monitor Enforced</span>
                      </div>
                    </div>

                    {/* Right: Live Verification Checklist & Timeline */}
                    <div className="es-skel-telemetry-panel">
                      <div className="es-skel-panel-section">
                        <div className="es-skel-section-title">INTEGRITY CONTROLS</div>
                        <div className="es-skel-check-rows">
                          <div className="es-skel-row passed">
                            <CheckCircle2 size={12} className="es-skel-check-icon" />
                            <span>Continuous identity verification</span>
                          </div>
                          <div className="es-skel-row passed">
                            <CheckCircle2 size={12} className="es-skel-check-icon" />
                            <span>Browser lockdown active</span>
                          </div>
                          <div className="es-skel-row passed">
                            <CheckCircle2 size={12} className="es-skel-check-icon" />
                            <span>Secondary display: None</span>
                          </div>
                          <div className="es-skel-row baseline">
                            <span className="es-skel-bullet-dot" />
                            <span>Audio anomaly detection: Normal</span>
                          </div>
                        </div>
                      </div>

                      <div className="es-skel-panel-section">
                        <div className="es-skel-section-title">SESSION LOG</div>
                        <div className="es-skel-log-list">
                          <div className="es-skel-log-item">
                            <span className="es-skel-time">00:00:15</span>
                            <span className="es-skel-log-desc">Pre-check identity authenticated</span>
                          </div>
                          <div className="es-skel-log-item">
                            <span className="es-skel-time">00:18:42</span>
                            <span className="es-skel-log-desc">Browser sandbox focus verified</span>
                          </div>
                          <div className="es-skel-log-item">
                            <span className="es-skel-time">00:41:20</span>
                            <span className="es-skel-log-desc">Tamper-evident audit log synced</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Trust Strip (Compliance Standards & Customer Logos) */}
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
                <span>GDPR Compliant</span>
              </div>
              <span className="es-compliance-dot" aria-hidden="true">·</span>
              <div className="es-compliance-pill" role="listitem">
                <ShieldCheck size={14} className="es-compliance-icon" aria-hidden="true" />
                <span>ISO 27001 Aligned</span>
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

            {/* Disclaimer for Placeholder Logos */}
            <p className="es-trust-logos-disclaimer">
              Placeholder institutional marks · Production partner logos to be supplied
            </p>
          </div>
        </div>
      </div>

      {/* 90-Second Demo Video Modal (Accessible, Focus Trapped) */}
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
                  Nexify Examina — 90-Second Platform Overview
                </h2>
                <p className="es-demo-modal-desc">
                  Continuous identity verification, kiosk lockdown, and tamper-evident audit dossiers.
                </p>
              </div>
              <button
                ref={modalCloseBtnRef}
                type="button"
                className="es-demo-modal-close-btn"
                onClick={closeDemoModal}
                aria-label="Close demo video"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Video Player */}
            <div className="es-demo-modal-body">
              <div className="es-demo-player-container">
                {/*
                  TODO: Replace demo video files when available:
                  - /videos/demo.mp4 (H.264, 1920x1200 or 1080p, ~90s)
                  - /videos/demo.vtt (WebVTT captions track)
                  - /images/demo-poster.jpg (Demo poster frame)
                */}
                <video
                  ref={demoVideoRef}
                  className="es-demo-video-tag"
                  controls
                  playsInline
                  preload="metadata"
                  poster="/images/demo-poster.jpg"
                  onError={() => setDemoVideoError(true)}
                >
                  <source src="/videos/demo.mp4" type="video/mp4" />
                  <track
                    kind="captions"
                    src="/videos/demo.vtt"
                    srcLang="en"
                    label="English"
                    default
                  />
                  Your browser does not support HTML5 video.
                </video>

                {/* Graceful Fallback if Demo Video File is Missing */}
                {demoVideoError && (
                  <div className="es-demo-fallback-slate" aria-live="polite">
                    <div className="es-demo-fallback-inner">
                      <div className="es-demo-placeholder-icon" aria-hidden="true">
                        <Play size={28} />
                      </div>
                      <h3>Demo Video Asset Pending</h3>
                      <p>
                        The product walkthrough video is being produced. Place <code>/videos/demo.mp4</code> and <code>/videos/demo.vtt</code> into <code>frontend/public/</code> to display here.
                      </p>
                      <div className="es-demo-chapters-preview">
                        <strong>Demo Topics Covered (90s):</strong>
                        <ul>
                          <li>00:00 – Candidate check-in with zero software install</li>
                          <li>00:15 – Continuous biometric facial verification</li>
                          <li>00:35 – Full-screen kiosk lockdown &amp; display profiles</li>
                          <li>00:55 – Acoustic whisper filter &amp; anomaly detection</li>
                          <li>01:15 – Cryptographic tamper-evident audit dossier export</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
