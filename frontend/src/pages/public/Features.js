import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Eye, Mic, Monitor, ShieldCheck, Lock, ScanFace,
  FileText, Layers, Activity, CheckCircle2, Zap, BarChart3,
  Clock, Users, AlertTriangle, ChevronRight, Sparkles, Building2,
  Volume2, LockKeyhole, GraduationCap, Globe, Server, Database,
  TrendingUp, Award, Shield, Cpu, Wifi, RefreshCcw, X,
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import './PublicPages.css';

/* ─── Data ─── */
const featureCategories = [
  { id: 'all', label: 'All Capabilities', count: 9 },
  { id: 'monitoring', label: 'Live Monitoring', count: 2 },
  { id: 'ai', label: 'AI Proctoring', count: 2 },
  { id: 'security', label: 'Security & Lockdown', count: 2 },
  { id: 'reporting', label: 'Reports & Audit', count: 2 },
  { id: 'admin', label: 'Admin & Integration', count: 2 },
];

const allFeatures = [
  {
    id: 'face-tracking',
    category: 'ai',
    icon: ScanFace,
    title: 'Continuous Biometric Face Verification',
    description: 'Every 500ms, our neural mesh engine validates that the registered candidate is still in frame — detecting substitution, face absence, or multiple persons with 99.98% precision. Liveness checks prevent photo and video spoofing.',
    tags: ['Facial Landmarks', 'Liveness Check', 'Anti-Spoofing', 'Sub-500ms Latency'],
    stat: '99.98%',
    statLabel: 'Detection Accuracy',
    badge: 'AI Vision 3.0',
    color: 'green',
    highlights: ['Neural mesh landmark tracking', 'Real-time liveness detection', 'Photo/video spoof prevention', 'Multi-face simultaneous check'],
  },
  {
    id: 'gaze-tracking',
    category: 'monitoring',
    icon: Eye,
    title: 'Gaze Direction & Focus Analysis',
    description: 'Real-time head pose estimation tracks eye gaze vectors and flags when a candidate\'s attention deviates significantly from the screen — quantified in degrees and duration with sub-180ms latency.',
    tags: ['Head Pose Estimation', 'Gaze Vector', 'Deviation Timer', 'Blink Rate'],
    stat: '<180ms',
    statLabel: 'Stream Latency',
    badge: 'Computer Vision',
    color: 'blue',
    highlights: ['3D head pose vector mapping', 'Configurable deviation threshold', 'Automated violation timer', 'Blink-rate anomaly detection'],
  },
  {
    id: 'kiosk-lockdown',
    category: 'security',
    icon: LockKeyhole,
    title: 'Kiosk Browser Sandbox & System Lockdown',
    description: 'Forces fullscreen kiosk mode, intercepts all OS-level shortcuts (Alt+Tab, Windows key, Print Screen), blocks clipboard access, and detects virtual machines and HDMI splitters.',
    tags: ['Fullscreen Lock', 'Hotkey Intercept', 'VM Detection', 'Clipboard Wipe'],
    stat: '100%',
    statLabel: 'Escape Prevention',
    badge: 'Zero-Escape',
    color: 'red',
    highlights: ['OS-level keyboard interception', 'VM & emulator detection', 'Clipboard memory wipe', 'HDMI splitter fingerprinting'],
  },
  {
    id: 'acoustic-ai',
    category: 'ai',
    icon: Volume2,
    title: 'Ambient Acoustic Intelligence Engine',
    description: 'Trained on 2M+ exam audio samples to distinguish harmless keystrokes from whispered assistance, background conversations, and speech-to-text dictation attempts with <5% false-positive rate.',
    tags: ['Whisper Detection', 'Noise Floor Calibration', 'Speech Isolation', 'Decibel Spike Alert'],
    stat: '2M+',
    statLabel: 'Training Samples',
    badge: 'Acoustic AI',
    color: 'orange',
    highlights: ['Whisper-band frequency isolation', 'Background voice separation', 'Keyboard vs. speech classification', '<5% false-positive rate'],
  },
  {
    id: 'live-cockpit',
    category: 'monitoring',
    icon: Monitor,
    title: 'Multi-Stream 1:50 Invigilator Cockpit',
    description: 'Proctors simultaneously supervise up to 50 live candidate streams sorted by AI risk score. Private audio whispers, instant warnings, and session freezes are 3 clicks away.',
    tags: ['50 Concurrent Streams', 'AI Risk Sort', 'Private Whisper', 'Session Freeze'],
    stat: '1:50',
    statLabel: 'Proctor Ratio',
    badge: 'Live Operations',
    color: 'green',
    highlights: ['AI-sorted risk priority queue', 'Private one-on-one audio channel', 'Instant session freeze / override', 'Cross-department multi-hall view'],
  },
  {
    id: 'forensic-dossier',
    category: 'reporting',
    icon: FileText,
    title: 'Tamper-Proof Forensic Audit Dossier',
    description: 'Every flagged event is compiled into a cryptographically signed PDF dossier with synchronized video playback, AI confidence ratings, and timestamps admissible in academic senate hearings.',
    tags: ['SHA-256 Signed', 'Video Sync', 'PDF Export', 'Timeline Index'],
    stat: '100%',
    statLabel: 'Legally Defensible',
    badge: 'Audit & Compliance',
    color: 'blue',
    highlights: ['SHA-256 cryptographic signature', 'Synchronized video timeline', 'AI confidence score overlay', 'Academic appeal-ready format'],
  },
  {
    id: 'lms-integration',
    category: 'admin',
    icon: Layers,
    title: 'LTI 1.3 LMS & REST API Integration',
    description: 'Native Canvas, Moodle, Blackboard, and Google Classroom LTI 1.3 integration auto-populates exam rosters and returns validated grades directly to instructor gradebooks.',
    tags: ['Canvas / Moodle', 'LTI 1.3 Native', 'Grade Passback', 'SSO & OAuth 2.0'],
    stat: '1-click',
    statLabel: 'LMS Connect',
    badge: 'LTI 1.3 Certified',
    color: 'orange',
    highlights: ['Canvas, Moodle, Blackboard LTI 1.3', 'Automated grade passback', 'SSO & OAuth 2.0 identity', 'REST API + Webhooks'],
  },
  {
    id: 'analytics',
    category: 'reporting',
    icon: BarChart3,
    title: 'Institutional Analytics & Exam Insights',
    description: 'Department-level dashboards surface completion rates, score distributions, violation heatmaps, and trend analyses across exam batches for academic quality committees.',
    tags: ['Score Distributions', 'Violation Heatmap', 'Department Reports', 'Trend Analysis'],
    stat: 'Real-time',
    statLabel: 'Dashboard Refresh',
    badge: 'Analytics Suite',
    color: 'green',
    highlights: ['Department-level score trends', 'Violation frequency heatmap', 'Batch-over-batch comparison', 'Exportable committee reports'],
  },
  {
    id: 'exam-scheduling',
    category: 'admin',
    icon: GraduationCap,
    title: 'Automated Batch Exam Scheduling Engine',
    description: 'Schedule semester-wide exam batches across multiple departments with randomized question pools, automated admission card issuance, and configurable time windows.',
    tags: ['Bulk Scheduling', 'Hall Ticket PDF', 'Random Pools', 'Time Windows'],
    stat: '15min',
    statLabel: 'Full Setup Time',
    badge: 'Orchestration',
    color: 'blue',
    highlights: ['Bulk CSV/LMS roster import', 'Randomized question pool engine', 'Digital hall ticket auto-dispatch', 'Multi-timezone window support'],
  },
];

const complianceItems = [
  { label: 'FERPA', desc: 'US Student Privacy Act', icon: Shield },
  { label: 'GDPR', desc: 'EU Data Protection Regulation', icon: Globe },
  { label: 'ISO 27001', desc: 'Info Security Management', icon: Award },
  { label: 'SOC 2 Type II', desc: 'Trust Services Criteria', icon: CheckCircle2 },
  { label: 'AES-256', desc: 'Military-Grade Encryption', icon: Lock },
  { label: 'TLS 1.3', desc: 'Transport Layer Security', icon: Server },
];

const integrationData = [
  { name: 'Canvas', color: '#E66000', category: 'LMS' },
  { name: 'Moodle', color: '#F98012', category: 'LMS' },
  { name: 'Blackboard', color: '#232323', category: 'LMS' },
  { name: 'Google Classroom', color: '#1A73E8', category: 'LMS' },
  { name: 'Brightspace', color: '#0099DC', category: 'LMS' },
  { name: 'Sakai', color: '#22623E', category: 'LMS' },
  { name: 'SAP ERP', color: '#0070F2', category: 'ERP / SIS' },
  { name: 'Banner SIS', color: '#4B0082', category: 'ERP / SIS' },
  { name: 'Microsoft SSO', color: '#0078D4', category: 'Identity' },
  { name: 'Google SSO', color: '#EA4335', category: 'Identity' },
  { name: 'Okta', color: '#007DC1', category: 'Identity' },
  { name: 'LDAP / AD', color: '#1C3557', category: 'Identity' },
];

const vsTableRows = [
  { feature: 'Biometric face verification', examshield: true, generic: false, paper: false },
  { feature: 'Gaze & attention tracking', examshield: true, generic: true, paper: false },
  { feature: 'Kiosk browser lockdown', examshield: true, generic: false, paper: false },
  { feature: 'Acoustic whisper detection', examshield: true, generic: false, paper: false },
  { feature: 'Multi-campus live cockpit', examshield: true, generic: false, paper: false },
  { feature: 'Legally defensible dossiers', examshield: true, generic: false, paper: false },
  { feature: 'LTI 1.3 LMS integration', examshield: true, generic: true, paper: false },
  { feature: 'Zero student software install', examshield: true, generic: false, paper: true },
  { feature: 'AI + human hybrid review', examshield: true, generic: false, paper: true },
  { feature: 'FERPA + GDPR compliance', examshield: true, generic: false, paper: true },
];

const architectureLayers = [
  {
    icon: Globe,
    title: 'Candidate Browser Layer',
    desc: 'WebRTC video/audio capture, kiosk fullscreen enforcement, keystroke interception, and pre-flight diagnostics — zero software install.',
    badge: 'Client',
    color: 'blue',
  },
  {
    icon: Cpu,
    title: 'AI Processing Engine',
    desc: 'On-stream facial landmark mesh, gaze vector computation, acoustic event classification, and behavioral anomaly scoring — all real-time.',
    badge: 'ML Core',
    color: 'green',
  },
  {
    icon: Monitor,
    title: 'Proctor Command Center',
    desc: 'AI-sorted live session grid, private audio channel, intervention controls, and real-time alert notifications.',
    badge: 'Operations',
    color: 'orange',
  },
  {
    icon: Database,
    title: 'Secure Evidence Vault',
    desc: 'AES-256 encrypted video archive, SHA-256 signed event logs, and indexed dossier builder for every exam session.',
    badge: 'Storage',
    color: 'red',
  },
  {
    icon: Wifi,
    title: 'LMS & ERP Integration Bus',
    desc: 'LTI 1.3 grade sync, SIS roster import, SSO identity bridge, and REST webhook relay for your institutional stack.',
    badge: 'Integration',
    color: 'blue',
  },
];

/* ─── Animated Counter Hook ─── */
function useCounter(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const pct = Math.min((timestamp - startTime) / duration, 1);
      setVal(Math.floor(pct * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

/* ─── Stats Strip with IntersectionObserver ─── */
function StatsStrip() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const exams = useCounter(1200000, 2000, visible);
  const accuracy = useCounter(9998, 1500, visible);
  const latency = useCounter(180, 1200, visible);
  const colleges = useCounter(150, 1800, visible);

  return (
    <div className="feat-stats-strip" ref={ref}>
      <div className="feat-stat-item">
        <strong>{visible ? (exams / 1000).toFixed(0) : 0}k+</strong>
        <span>Exams Secured</span>
      </div>
      <div className="feat-stat-divider" />
      <div className="feat-stat-item">
        <strong>{visible ? (accuracy / 100).toFixed(2) : 0}%</strong>
        <span>Detection Accuracy</span>
      </div>
      <div className="feat-stat-divider" />
      <div className="feat-stat-item">
        <strong>&lt;{latency}ms</strong>
        <span>Stream Latency</span>
      </div>
      <div className="feat-stat-divider" />
      <div className="feat-stat-item">
        <strong>{colleges}+</strong>
        <span>Institutions Served</span>
      </div>
    </div>
  );
}

/* ─── Feature Detail Modal ─── */
function FeatureModal({ feature, onClose }) {
  const Icon = feature.icon;
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="feat-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={feature.title}>
      <div className="feat-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="feat-modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <div className={`feat-modal-header feat-icon-${feature.color}`}>
          <Icon size={32} strokeWidth={2} />
          <div>
            <span className="fdc-badge">{feature.badge}</span>
            <h2>{feature.title}</h2>
          </div>
        </div>
        <p className="feat-modal-desc">{feature.description}</p>
        <div className="feat-modal-stat-row">
          <div className={`feat-modal-stat feat-color-${feature.color}`}>
            <strong>{feature.stat}</strong>
            <span>{feature.statLabel}</span>
          </div>
        </div>
        <ul className="feat-modal-highlights">
          {feature.highlights.map(h => (
            <li key={h}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
        <div className="feat-modal-tags">
          {feature.tags.map(tag => (
            <span key={tag} className="fdc-tag">{tag}</span>
          ))}
        </div>
        <Link to="/admin/register" className="feat-cta-primary full-width" onClick={onClose}>
          Start Institutional Trial <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [activeIntegrationGroup, setActiveIntegrationGroup] = useState('All');

  const filtered = activeCategory === 'all'
    ? allFeatures
    : allFeatures.filter(f => f.category === activeCategory);

  const integrationGroups = ['All', ...new Set(integrationData.map(i => i.category))];
  const filteredIntegrations = activeIntegrationGroup === 'All'
    ? integrationData
    : integrationData.filter(i => i.category === activeIntegrationGroup);

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section className="features-hero-section public-shell" aria-labelledby="features-hero-h1">
        <div className="features-hero-eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          <span>Complete Platform Capabilities</span>
        </div>
        <h1 id="features-hero-h1">
          Every tool to run <span>uncompromised</span> exams
        </h1>
        <p className="features-hero-sub">
          Six integrated layers of AI proctoring, browser lockdown, acoustic intelligence, live invigilation, and forensic audit — deployed as a single zero-install SaaS platform trusted by 150+ institutions.
        </p>
        <div className="features-hero-actions">
          <Link to="/admin/register" className="feat-cta-primary">
            Start Institutional Trial
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/contact" className="feat-cta-secondary">
            Schedule a Live Demo
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Animated Stats Strip ── */}
      <section className="public-shell" aria-label="Platform statistics">
        <StatsStrip />
      </section>

      {/* ── Category Filter Tabs ── */}
      <section className="public-shell features-filter-section" aria-label="Filter features by category">
        <div className="features-category-tabs" role="tablist">
          {featureCategories.map(cat => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`feat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
              <span className="feat-tab-count">{cat.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Features Deep-Dive Grid ── */}
      <section className="public-shell features-grid-section" aria-labelledby="features-grid-heading">
        <p className="features-grid-count" aria-live="polite">
          Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'capability' : 'capabilities'}
        </p>
        <div className="features-deep-grid" role="list">
          {filtered.map(feature => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.id}
                className={`feature-deep-card feat-color-${feature.color}`}
                role="listitem"
                onClick={() => setSelectedFeature(feature)}
                style={{ cursor: 'pointer' }}
              >
                <div className="fdc-top">
                  <div className={`fdc-icon-wrap feat-icon-${feature.color}`} aria-hidden="true">
                    <Icon size={26} strokeWidth={2} />
                  </div>
                  <span className="fdc-badge">{feature.badge}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="fdc-highlights">
                  {feature.highlights.slice(0, 3).map(h => (
                    <li key={h}>
                      <CheckCircle2 size={13} aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="fdc-tags" role="list">
                  {feature.tags.map(tag => (
                    <span key={tag} className="fdc-tag" role="listitem">{tag}</span>
                  ))}
                </div>
                <div className="fdc-stat-row">
                  <div className="fdc-stat">
                    <strong>{feature.stat}</strong>
                    <span>{feature.statLabel}</span>
                  </div>
                  <button className="fdc-learn-more" aria-label={`Learn more about ${feature.title}`}>
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Feature Modal ── */}
      {selectedFeature && (
        <FeatureModal feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
      )}

      {/* ── Platform Architecture ── */}
      <section className="public-shell feat-architecture-section" aria-labelledby="architecture-heading">
        <div className="feat-section-header">
          <p className="feat-kicker">HOW IT'S BUILT</p>
          <h2 id="architecture-heading">Five-layer platform architecture</h2>
          <p className="feat-section-sub">
            Every component is purpose-built for academic exam integrity — from the candidate's browser to your institution's ERP system.
          </p>
        </div>
        <div className="feat-arch-timeline">
          {architectureLayers.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div className={`feat-arch-node feat-color-${layer.color}`} key={layer.title}>
                <div className="feat-arch-index">{String(i + 1).padStart(2, '0')}</div>
                <div className={`feat-arch-icon feat-icon-${layer.color}`} aria-hidden="true">
                  <Icon size={24} />
                </div>
                <div className="feat-arch-body">
                  <span className="feat-arch-badge">{layer.badge}</span>
                  <h3>{layer.title}</h3>
                  <p>{layer.desc}</p>
                </div>
                {i < architectureLayers.length - 1 && (
                  <div className="feat-arch-connector" aria-hidden="true">
                    <ChevronRight size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── VS Comparison Table ── */}
      <section className="public-shell feat-vs-section" aria-labelledby="vs-heading">
        <div className="feat-section-header">
          <p className="feat-kicker">PLATFORM COMPARISON</p>
          <h2 id="vs-heading">Nexify Examina vs. the alternatives</h2>
          <p className="feat-section-sub">
            See why leading institutions choose Nexify Examina over generic remote proctoring tools and paper-based methods.
          </p>
        </div>
        <div className="feat-vs-table-wrapper" role="region" aria-label="Feature comparison table">
          <table className="feat-vs-table">
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col" className="feat-vs-col-es">
                  <div className="feat-vs-header-es">
                    <ShieldCheck size={16} aria-hidden="true" />
                    Nexify Examina
                  </div>
                </th>
                <th scope="col">Generic Proctoring</th>
                <th scope="col">Paper Exams</th>
              </tr>
            </thead>
            <tbody>
              {vsTableRows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'feat-vs-row-even' : ''}>
                  <td className="feat-vs-feature">{row.feature}</td>
                  <td className="feat-vs-col-es feat-vs-check">
                    <CheckCircle2 size={18} className="vs-yes" aria-label="Yes" />
                  </td>
                  <td className="feat-vs-check">
                    {row.generic
                      ? <CheckCircle2 size={18} className="vs-partial" aria-label="Partial" />
                      : <X size={16} className="vs-no" aria-label="No" />}
                  </td>
                  <td className="feat-vs-check">
                    {row.paper
                      ? <CheckCircle2 size={18} className="vs-partial" aria-label="Partial" />
                      : <X size={16} className="vs-no" aria-label="No" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Three Guarantees ── */}
      <section className="public-shell features-guarantees-section" aria-label="Platform guarantees">
        <div className="features-guarantees-inner">
          <div className="feat-guarantee-item">
            <div className="feat-guarantee-icon" aria-hidden="true">
              <Zap size={22} />
            </div>
            <div>
              <h4>99.9% Platform Uptime SLA</h4>
              <p>Guaranteed failover redundancy with real-time infrastructure monitoring and automatic regional rerouting during any degradation event.</p>
            </div>
          </div>
          <div className="feat-guarantee-item">
            <div className="feat-guarantee-icon" aria-hidden="true">
              <Lock size={22} />
            </div>
            <div>
              <h4>AES-256 + TLS 1.3 Encryption</h4>
              <p>All candidate video, audio, and event data is encrypted at rest and in transit. Strict per-tenant storage isolation prevents cross-institution access.</p>
            </div>
          </div>
          <div className="feat-guarantee-item">
            <div className="feat-guarantee-icon" aria-hidden="true">
              <Users size={22} />
            </div>
            <div>
              <h4>Human-in-the-Loop Always</h4>
              <p>AI flags candidates — humans decide outcomes. No candidate is ever penalized automatically by an algorithm without a qualified invigilator's final review.</p>
            </div>
          </div>
          <div className="feat-guarantee-item">
            <div className="feat-guarantee-icon" aria-hidden="true">
              <RefreshCcw size={22} />
            </div>
            <div>
              <h4>14-Day Onboarding Guarantee</h4>
              <p>A dedicated customer success engineer guides your institution from account setup to first live exam in 14 days or we extend your trial at no cost.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance Strip ── */}
      <section className="public-shell features-compliance-section" aria-labelledby="compliance-heading">
        <div className="features-compliance-header">
          <ShieldCheck size={22} aria-hidden="true" />
          <h2 id="compliance-heading">Built for enterprise compliance & data governance</h2>
        </div>
        <div className="features-compliance-grid" role="list">
          {complianceItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="compliance-badge-card" role="listitem">
                <Icon size={22} className="compliance-icon" aria-hidden="true" />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Integration Ecosystem ── */}
      <section className="public-shell features-integrations-section" aria-labelledby="integrations-heading">
        <p className="integrations-kicker">NATIVE INTEGRATIONS</p>
        <h2 id="integrations-heading">Connects directly into your institutional ecosystem</h2>
        <p className="integrations-sub">
          Nexify Examina plugs into your LMS, SIS, ERP, and identity systems via certified standards — no middleware, no bespoke IT project.
        </p>
        <div className="integrations-filter-tabs" role="tablist">
          {integrationGroups.map(g => (
            <button
              key={g}
              role="tab"
              aria-selected={activeIntegrationGroup === g}
              className={`integrations-tab-btn ${activeIntegrationGroup === g ? 'active' : ''}`}
              onClick={() => setActiveIntegrationGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="integrations-logo-row" role="list" aria-label="Supported integrations">
          {filteredIntegrations.map(intg => (
            <div key={intg.name} className="integration-logo-pill" role="listitem">
              <span className="intg-dot" style={{ background: intg.color }} aria-hidden="true" />
              <span>{intg.name}</span>
              <span className="intg-cat-label">{intg.category}</span>
            </div>
          ))}
        </div>
        <div className="integrations-api-note">
          <Activity size={16} aria-hidden="true" />
          <span>Full REST API + Webhooks available for custom ERP & SIS integrations</span>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="public-shell features-cta-section" aria-labelledby="features-cta-heading">
        <div className="features-cta-inner">
          <div className="features-cta-left">
            <p className="features-cta-kicker">READY TO MODERNIZE YOUR EXAMS?</p>
            <h2 id="features-cta-heading">
              Experience every feature<br />with a full institutional trial
            </h2>
            <p>
              Get your institution set up in under 15 minutes. No credit card, no IT provisioning, no software downloads for students.
            </p>
            <div className="feat-cta-trust-row">
              <span><CheckCircle2 size={15} /> Trusted by 150+ institutions</span>
              <span><CheckCircle2 size={15} /> FERPA & GDPR compliant</span>
              <span><CheckCircle2 size={15} /> 99.9% uptime SLA</span>
            </div>
          </div>
          <div className="features-cta-right">
            <div className="features-cta-card">
              <p className="cta-card-label">What's included in the trial</p>
              <ul className="cta-feature-checklist">
                {[
                  '14-day full-access institutional trial',
                  'Dedicated onboarding engineer assigned',
                  'Campus walkthrough & faculty training',
                  'LMS integration setup support',
                  'Unlimited exam sessions during trial',
                  'Full forensic dossier access',
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
                Schedule a Campus Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
