import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  Volume2,
  LockKeyhole,
  Sparkles,
  Check
} from 'lucide-react';
import {
  INITIAL_CANDIDATE_STREAMS,
  ANOMALY_TIMELINE_EVENTS,
  DOSSIER_SAMPLE
} from '../../../mocks/radarMockData';
import { PORTAL_LINKS } from '../../../content/landingContent';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('cockpit'); // cockpit | threats | report
  const [candidateStreams, setCandidateStreams] = useState(INITIAL_CANDIDATE_STREAMS);
  const [toastMessage, setToastMessage] = useState(null);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  // Pause simulation if element is scrolled out of view or reduced-motion is requested
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Periodic simulated telemetry fluctuation for realism
  useEffect(() => {
    if (!isVisible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      setCandidateStreams((prev) =>
        prev.map((c) => {
          if (c.id === 'cand-02') {
            // Fluctuate gaze state on candidate 2
            const isWarn = Math.random() > 0.4;
            return {
              ...c,
              lookingAway: isWarn,
              feedStatus: isWarn ? 'warning' : 'safe',
              statusText: isWarn ? 'Looking Away (3.2s)' : 'Gaze Recovered',
              statusTag: isWarn ? 'Flagged: Gaze Loss' : '96.2% Normal',
            };
          }
          return c;
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Interactive handler for Invigilator Actions
  const handleWhisper = (candName) => {
    setToastMessage(`Discreet 1-on-1 audio whisper connected to ${candName}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleWarn = (candName) => {
    setToastMessage(`Calibrated warning notice dispatched to ${candName}'s screen`);
    setCandidateStreams((prev) =>
      prev.map((c) =>
        c.name === candName
          ? { ...c, feedStatus: 'safe', statusText: 'Warning Acknowledged', statusTag: '98% Normal' }
          : c
      )
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <section
      id="command-center"
      ref={sectionRef}
      className="es-section es-command-center-section"
      aria-labelledby="cockpit-heading"
    >
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <Monitor size={15} aria-hidden="true" />
            <span>ADMINISTRATOR WORKSPACE</span>
          </div>
          <h2 id="cockpit-heading" className="es-section-title">
            Live invigilation command center
          </h2>
          <p className="es-section-desc">
            Explore the production cockpit utilized by exam coordinators and invigilators to monitor concurrent sessions, review alerts, and compile dossiers.
          </p>
        </div>

        {/* Command Center Outer Frame */}
        <div className="es-command-center-frame">
          {/* View Selection Tabs */}
          <div className="es-cc-tabs-bar" role="tablist" aria-label="Command center views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cockpit'}
              className={`es-cc-tab ${activeTab === 'cockpit' ? 'active' : ''}`}
              onClick={() => setActiveTab('cockpit')}
            >
              <Monitor size={16} aria-hidden="true" />
              <span>Multi-Stream Invigilator View</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'threats'}
              className={`es-cc-tab ${activeTab === 'threats' ? 'active' : ''}`}
              onClick={() => setActiveTab('threats')}
            >
              <AlertTriangle size={16} aria-hidden="true" />
              <span>AI Anomaly Timeline</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'report'}
              className={`es-cc-tab ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <FileText size={16} aria-hidden="true" />
              <span>Certified Audit Dossier</span>
            </button>
          </div>

          {/* Interactive Simulation Toast */}
          {toastMessage && (
            <div className="es-cc-toast" role="status" aria-live="polite">
              <Sparkles size={14} className="es-toast-sparkle" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Tab Content Panels */}
          <div className="es-cc-viewport">
            {/* TAB 1: Multi-Stream Invigilator Cockpit Grid */}
            {activeTab === 'cockpit' && (
              <div className="es-cc-panel" role="tabpanel">
                {/* Cockpit Status Header */}
                <div className="es-cc-cockpit-header">
                  <div className="es-cc-exam-meta">
                    <h3 className="es-cc-exam-title">
                      Active Exam: Final Computer Science Examination (CS-402)
                    </h3>
                    <div className="es-cc-live-tag">
                      <span className="es-live-beacon" aria-hidden="true">
                        <span className="beacon-ping" />
                        <span className="beacon-core" />
                      </span>
                      <span>Live Supervised • 128 Candidates Active</span>
                    </div>
                  </div>

                  <div className="es-cc-stats-strip">
                    <div className="es-cc-stat-box">
                      <strong>128</strong>
                      <span>Candidates In Room</span>
                    </div>
                    <div className="es-cc-stat-box">
                      <strong>125</strong>
                      <span>Low Risk (Safe)</span>
                    </div>
                    <div className="es-cc-stat-box warning">
                      <strong>3</strong>
                      <span>Flagged for Review</span>
                    </div>
                  </div>
                </div>

                {/* 4 Candidate Stream Tiles Grid */}
                <div className="es-cc-stream-grid" role="list">
                  {candidateStreams.map((cand) => (
                    <div
                      key={cand.id}
                      className={`es-stream-tile ${cand.feedStatus === 'warning' ? 'warning-glow' : ''}`}
                      role="listitem"
                    >
                      {/* Tile Top Bar */}
                      <div className="es-tile-top">
                        <span className="es-tile-cand-id">
                          Candidate #{cand.number} • {cand.name}
                        </span>
                        <span className={`es-tile-tag ${cand.feedStatus === 'warning' ? 'warning' : 'safe'}`}>
                          {cand.statusTag}
                        </span>
                      </div>

                      {/* Synthetic Video Viewport */}
                      <div className="es-tile-feed">
                        <div className={`es-tile-avatar ${cand.feedStatus === 'warning' ? 'looking-away' : 'focused'}`}>
                          <div className="es-avatar-face" />
                          <div className="es-avatar-body" />
                        </div>

                        {/* Telemetry Strip */}
                        <div className={`es-tile-telemetry ${cand.feedStatus === 'warning' ? 'warning' : ''}`}>
                          <span>{cand.statusText}</span>
                        </div>
                      </div>

                      {/* Quick Invigilator Actions */}
                      <div className="es-tile-actions">
                        {cand.feedStatus === 'warning' ? (
                          <button
                            type="button"
                            className="es-tile-btn warn"
                            onClick={() => handleWarn(cand.name)}
                          >
                            <span>Issue Warning</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="es-tile-btn whisper"
                            onClick={() => handleWhisper(cand.name)}
                          >
                            <span>Whisper</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="es-tile-btn inspect"
                          onClick={() => handleWhisper(cand.name)}
                        >
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: AI Anomaly Timeline Trace */}
            {activeTab === 'threats' && (
              <div className="es-cc-panel" role="tabpanel">
                <div className="es-timeline-header">
                  <div>
                    <h3 className="es-timeline-title">Forensic Timeline Analysis</h3>
                    <p className="es-timeline-sub">
                      Chronological trace of flagged events with video offset timestamps and AI confidence metrics.
                    </p>
                  </div>
                  <span className="es-timeline-session-badge">Session #EX-84920</span>
                </div>

                <div className="es-timeline-list" role="list">
                  {ANOMALY_TIMELINE_EVENTS.map((event) => (
                    <div
                      key={event.id}
                      className={`es-timeline-row ${event.status}`}
                      role="listitem"
                    >
                      <span className="es-t-time">{event.time}</span>
                      <div className={`es-t-badge ${event.status}`}>{event.badge}</div>
                      <div className="es-t-desc">
                        <strong>{event.title}</strong>
                        <span>{event.description}</span>
                      </div>
                      <span className="es-t-tag">{event.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Certified Audit Dossier */}
            {activeTab === 'report' && (
              <div className="es-cc-panel" role="tabpanel">
                <div className="es-dossier-card">
                  <div className="es-dossier-top">
                    <div>
                      <span className="es-dossier-kicker">OFFICIAL EXAMINATION AUDIT DOSSIER</span>
                      <h3 className="es-dossier-title">Integrity Certification Report #{DOSSIER_SAMPLE.id}</h3>
                      <p className="es-dossier-meta">
                        {DOSSIER_SAMPLE.institution} • Course: {DOSSIER_SAMPLE.course}
                      </p>
                    </div>
                    <div className="es-dossier-stamp">
                      <ShieldCheck size={26} />
                      <span>{DOSSIER_SAMPLE.verdict.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="es-dossier-grid">
                    <div className="es-dossier-stat-box">
                      <span className="label">Integrity Trust Score</span>
                      <strong className="value highlight">{DOSSIER_SAMPLE.score}</strong>
                      <span className="sub">Verdict: Cleared</span>
                    </div>

                    <div className="es-dossier-stat-box">
                      <span className="label">Total Duration</span>
                      <strong className="value">{DOSSIER_SAMPLE.duration}</strong>
                      <span className="sub">{DOSSIER_SAMPLE.coverage}</span>
                    </div>

                    <div className="es-dossier-stat-box">
                      <span className="label">Critical Violations</span>
                      <strong className="value">{DOSSIER_SAMPLE.violations}</strong>
                      <span className="sub">No Disqualification</span>
                    </div>

                    <div className="es-dossier-stat-box">
                      <span className="label">LMS Grade Status</span>
                      <strong className="value highlight">Synchronized</strong>
                      <span className="sub">Grade: 92/100 (A)</span>
                    </div>
                  </div>

                  <div className="es-dossier-footer">
                    <div className="es-dossier-hash">
                      <span>Cryptographic Hash:</span>
                      <code>{DOSSIER_SAMPLE.hash}</code>
                    </div>

                    <Link to={PORTAL_LINKS.contact} className="es-btn es-btn-lime es-btn-sm">
                      <FileText size={14} />
                      <span>Export Official PDF Dossier</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Link Action */}
        <div className="es-section-action-center">
          <Link
            to={PORTAL_LINKS.registerInstitution}
            className="es-link-inline-cta"
            aria-label="Deploy live proctoring with an institutional trial"
          >
            <span>Deploy Live Proctoring with an Institutional Trial</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
