import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  ScanFace,
  Eye,
  LockKeyhole,
  Volume2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PORTAL_LINKS } from '../../../content/landingContent';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

export default function HeroSection() {
  const { user } = useAuth();
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeChipStep, setActiveChipStep] = useState(0);
  const [audioLevel, setAudioLevel] = useState([30, 45, 60, 40, 75, 50, 35, 65]);

  const dashboardPath = dashboardPathFor(user?.role);
  const primaryCtaTarget = user ? dashboardPath : PORTAL_LINKS.registerInstitution;
  const primaryCtaLabel = user ? 'Open Console' : 'Start Institutional Trial';
  const studentTarget = user?.role === 'student' ? '/student/dashboard' : PORTAL_LINKS.studentLogin;

  // Stagger status chips appearing in sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveChipStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Subtle audio waveform bounce simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel([
        Math.floor(20 + Math.random() * 40),
        Math.floor(25 + Math.random() * 50),
        Math.floor(30 + Math.random() * 60),
        Math.floor(20 + Math.random() * 45),
        Math.floor(35 + Math.random() * 55),
        Math.floor(25 + Math.random() * 40),
        Math.floor(18 + Math.random() * 35),
        Math.floor(22 + Math.random() * 50),
      ]);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Subtle 3D tilt calculation on card
  const handleMouseMove = (e) => {
    if (!cardRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 10;
    const rotateY = (x / rect.width) * 10;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const statusChips = [
    { id: 0, text: 'Verified Candidate', icon: CheckCircle2, status: 'ok' },
    { id: 1, text: 'No Multiple Faces', icon: ScanFace, status: 'ok' },
    { id: 2, text: 'Fullscreen Active', icon: LockKeyhole, status: 'ok' },
    { id: 3, text: 'Dual Display Blocked', icon: ShieldCheck, status: 'ok' },
  ];

  return (
    <section id="hero" className="es-hero-section" aria-labelledby="hero-heading">
      {/* Background Ambience Layers: Mesh glow and hairline grid */}
      <div className="es-hero-bg-glow" aria-hidden="true" />
      <div className="es-hero-grid-pattern" aria-hidden="true" />

      <div className="es-container es-hero-container">
        {/* Left Column: Hero Copy & Value Proposition */}
        <div className="es-hero-copy">
          <div className="es-hero-eyebrow-wrapper">
            <span className="es-hero-eyebrow">
              <ShieldCheck size={14} className="es-eyebrow-icon" aria-hidden="true" />
              <span>Institutional-Grade Exam Integrity</span>
            </span>
          </div>

          <h1 id="hero-heading" className="es-hero-heading">
            Secure every exam.
            <br />
            <span className="es-heading-highlight">Protect institutional integrity.</span>
          </h1>

          <p className="es-hero-description">
            ExamShield is the complete AI and live proctoring platform for high-stakes assessments. Prevent cheating with continuous biometric face verification, browser kiosk lockdown, ambient sound analytics, and court-admissible audit reports.
          </p>

          {/* Primary Action Buttons */}
          <div className="es-hero-cta-group" role="group" aria-label="Hero actions">
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

          {/* Trust Row Checklist */}
          <div className="es-hero-trust-row" role="list">
            <div className="es-trust-item" role="listitem">
              <CheckCircle2 size={16} className="es-trust-check-icon" aria-hidden="true" />
              <span>Zero Software Install (100% In-Browser)</span>
            </div>
            <div className="es-trust-item" role="listitem">
              <CheckCircle2 size={16} className="es-trust-check-icon" aria-hidden="true" />
              <span>FERPA, GDPR &amp; ISO 27001 Aligned</span>
            </div>
            <div className="es-trust-item" role="listitem">
              <CheckCircle2 size={16} className="es-trust-check-icon" aria-hidden="true" />
              <span>99.98% Anomaly Detection Accuracy</span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Coded Live Proctoring Card */}
        <div className="es-hero-mockup-wrapper">
          <div
            ref={cardRef}
            className="es-proctor-card"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
            aria-label="Live AI Proctoring telemetry dashboard demonstration"
          >
            {/* Top Chrome Bar */}
            <div className="es-card-chrome-bar">
              <div className="es-chrome-dots" aria-hidden="true">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="es-chrome-title">
                <span className="es-chrome-live-pulse" />
                <span>EXAMSHIELD NEURAL COCKPIT • STREAM #01</span>
              </div>
              <span className="es-chrome-latency">142ms</span>
            </div>

            {/* Candidate Stream Viewport */}
            <div className="es-proctor-viewport">
              {/* Synthetic Camera Feed Overlay */}
              <div className="es-viewport-feed">
                {/* Silhouette / Face Vector Placeholder */}
                <div className="es-face-silhouette">
                  <div className="es-head-contour" />
                  <div className="es-shoulders-contour" />
                </div>

                {/* Animated Neural Face Mesh Bounding Box */}
                <div className="es-bounding-box" aria-hidden="true">
                  <div className="corner top-left" />
                  <div className="corner top-right" />
                  <div className="corner bottom-left" />
                  <div className="corner bottom-right" />
                  <div className="es-box-label">
                    <ScanFace size={11} />
                    <span>FACE-ID: 99.4%</span>
                  </div>
                  <div className="es-reticle-center" />
                </div>

                {/* Live Gaze Vector Floating Tag */}
                <div className="es-gaze-vector-tag" aria-hidden="true">
                  <Eye size={12} className="es-gaze-icon" />
                  <span>Gaze: Center (0.02, 0.01)</span>
                </div>

                {/* Audio Waveform Meter */}
                <div className="es-audio-waveform-meter" aria-label="Microphone decibel level">
                  <Volume2 size={12} className="es-waveform-icon" aria-hidden="true" />
                  <div className="es-waveform-bars" aria-hidden="true">
                    {audioLevel.map((lvl, i) => (
                      <span
                        key={i}
                        className="waveform-bar"
                        style={{ height: `${lvl}%` }}
                      />
                    ))}
                  </div>
                  <span className="es-waveform-text">18dB Baseline</span>
                </div>

                {/* Live Floating Alert Toast */}
                <div className="es-viewport-toast">
                  <div className="toast-glow-ring" />
                  <Sparkles size={13} className="toast-icon" aria-hidden="true" />
                  <div>
                    <strong>Neural Mesh Active</strong>
                    <span>No proxy candidate detected</span>
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry HUD */}
              <div className="es-proctor-hud">
                <div className="hud-candidate-info">
                  <span className="hud-cand-name">Sarah Mitchell</span>
                  <span className="hud-cand-id">CS-2025-041 • Distributed Systems</span>
                </div>

                <div className="hud-integrity-pill">
                  <span className="hud-score-value">99.8%</span>
                  <span className="hud-score-label">Integrity</span>
                </div>
              </div>
            </div>

            {/* Sequence Status Verification Chips */}
            <div className="es-card-chips-bar" role="list">
              {statusChips.map((chip, idx) => {
                const Icon = chip.icon;
                const isPassed = idx <= activeChipStep;
                return (
                  <div
                    key={chip.id}
                    className={`es-chip-item ${isPassed ? 'passed' : 'pending'}`}
                    role="listitem"
                  >
                    <Icon size={12} className="es-chip-icon" aria-hidden="true" />
                    <span>{chip.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
