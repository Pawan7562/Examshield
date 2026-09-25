import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ShieldCheck,
  LockKeyhole,
  ScanFace,
  Eye,
  Monitor,
  Mic,
  FileText,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Volume2,
  Layers,
  Clock,
  Laptop,
  Building2,
  Activity,
  AlertTriangle,
  GraduationCap,
  Calendar,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PublicLayout from '../../components/public/PublicLayout';
import './Home.css';

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

// College Admin Department Radar Data
const collegeDepartments = [
  {
    id: 'engineering',
    name: 'Dept. of Computer Science & Engineering',
    faculty: 'Faculty of Engineering & Technology',
    dean: 'Dr. Richard Sterling (Controller of Exams)',
    activeExam: 'CS-402 Advanced Distributed Systems & Cloud Security',
    totalStudents: 480,
    hallsActive: 8,
    proctorsOnDuty: 10,
    integrityScore: '99.4%',
    hallBreakdown: [
      { name: 'Computer Lab Alpha (Room 201)', students: 60, status: 'Normal', alertCount: 0 },
      { name: 'Computer Lab Beta (Room 202)', students: 60, status: '1 Minor Check', alertCount: 1 },
      { name: 'Main Auditorium Hall (Room 101)', students: 120, status: 'Normal', alertCount: 0 },
      { name: 'Remote Online Cohort (Virtual)', students: 240, status: 'Kiosk Enforced', alertCount: 0 },
    ],
  },
  {
    id: 'management',
    name: 'Faculty of Management Studies',
    faculty: 'School of Business & Finance',
    dean: 'Prof. Margaret Hayes (Academic Chair)',
    activeExam: 'MGT-301 Quantitative Corporate Finance & Valuation',
    totalStudents: 320,
    hallsActive: 5,
    proctorsOnDuty: 7,
    integrityScore: '99.8%',
    hallBreakdown: [
      { name: 'Business Lab A (Hall B1)', students: 80, status: 'Normal', alertCount: 0 },
      { name: 'Executive Seminar Room 3', students: 40, status: 'Normal', alertCount: 0 },
      { name: 'Main Exam Hall 2', students: 100, status: 'Normal', alertCount: 0 },
      { name: 'Hybrid Distance Cohort', students: 100, status: 'Normal', alertCount: 0 },
    ],
  },
  {
    id: 'medical',
    name: 'College of Medicine & Health Sciences',
    faculty: 'Faculty of Medical Education',
    dean: 'Dr. Alistair Thorne (Dean of Medical Exams)',
    activeExam: 'MED-502 Advanced Clinical Pathology & Diagnostics',
    totalStudents: 220,
    hallsActive: 4,
    proctorsOnDuty: 6,
    integrityScore: '99.9%',
    hallBreakdown: [
      { name: 'Clinical Simulation Hall 1', students: 50, status: 'Normal', alertCount: 0 },
      { name: 'Pathology Testing Lab 3', students: 50, status: 'Normal', alertCount: 0 },
      { name: 'Memorial Lecture Theatre', students: 80, status: 'Normal', alertCount: 0 },
      { name: 'Remote Resident Cohort', students: 40, status: 'Kiosk Enforced', alertCount: 0 },
    ],
  },
];

// College Admin Core Features
const collegeAdminCapabilities = [
  {
    icon: Calendar,
    title: 'Automated Exam Scheduling & AI Generator',
    description: 'Schedule multi-department exam batches with randomized question pools, automated time windows, and instant question generation for both MCQ and coding formats.',
    badge: 'Exam Orchestration',
  },
  {
    icon: Users,
    title: 'Faculty Invigilator Duty Delegation',
    description: 'Assign proctoring duties across professors and teaching assistants automatically at a calibrated 1:50 ratio with tiered supervisor controls and shift audit logs.',
    badge: 'Faculty Management',
  },
  {
    icon: FileSpreadsheet,
    title: 'Bulk Student Roster & Hall Ticket Issuance',
    description: 'Import entire student batches via 1-click CSV/Excel. Automatically map roll numbers, configure room allocations, and issue tamper-proof digital admit cards.',
    badge: 'Student Operations',
  },
  {
    icon: BarChart3,
    title: 'Live Multi-Department Campus Radar',
    description: 'Oversee all simultaneous examinations running across different physical computer centers and remote cohorts in real time from a single centralized cockpit.',
    badge: 'Campus Radar',
  },
  {
    icon: FileText,
    title: 'Disciplinary Board Dossier Generator',
    description: 'Compile verified incident dossiers with synchronized video timestamps, biometric match logs, and AI confidence telemetry for official university senate hearings.',
    badge: 'Legal & Compliance',
  },
  {
    icon: Layers,
    title: 'Direct ERP, SIS & LMS Synchronization',
    description: 'Seamlessly exchange student rosters and publish validated examination scores directly into your university Enterprise Resource Planning (ERP) and LMS.',
    badge: 'SIS / ERP Integration',
  },
];

// Audience Solutions Matrix Data
const audienceSolutions = [
  {
    id: 'universities',
    label: 'Universities & Colleges',
    icon: Building2,
    badge: 'Campus Scale',
    title: 'Automated Campus-Wide Semester Exam Proctoring',
    description: 'Scale effortlessly to 50,000+ simultaneous test-takers across multiple faculties with automated batch scheduling, LMS integration, and department-level governance.',
    metrics: [
      { value: '50k+', label: 'Concurrent Test Takers' },
      { value: '1:50', label: 'Proctor-to-Student Ratio' },
      { value: '100%', label: 'LMS Gradebook Sync' },
    ],
    features: [
      'Canvas, Moodle, and Blackboard LTI 1.3 direct sync',
      'Automated batch scheduling & tiered department permissions',
      'Continuous facial identity verification against college records',
      'Role-based consoles for Deans, Department Heads, and Faculty',
    ],
    ctaText: 'Register Institution',
    ctaLink: '/admin/register',
  },
  {
    id: 'certifications',
    label: 'Certification Boards',
    icon: Award,
    badge: 'High Stakes',
    title: 'Court-Admissible Integrity for Professional Licensing',
    description: 'Protect professional certifications in IT, finance, healthcare, and law from proxy test-taking and credential fraud with cryptographic evidence dossiers.',
    metrics: [
      { value: '99.98%', label: 'Detection Accuracy' },
      { value: '360°', label: 'Room & Screen Scans' },
      { value: '100%', label: 'Legally Defensible Logs' },
    ],
    features: [
      'Government ID & biometric passport cross-validation',
      'Dual-camera monitoring (webcam + mobile 360° room feed)',
      'Immutable timestamped audit logs with full video playback',
      'Tamper-proof digital certificates with cryptographic verification',
    ],
    ctaText: 'Book Enterprise Demo',
    ctaLink: '/contact',
  },
  {
    id: 'proctors',
    label: 'Invigilators & Faculty',
    icon: Monitor,
    badge: 'Human in the Loop',
    title: 'A Calm, Focused Command Center for Live Invigilation',
    description: 'Equip proctors with intelligent AI sorting that bubbles suspicious sessions to the top, allowing 1-on-1 private whispers, custom warnings, or exam freeze without chaos.',
    metrics: [
      { value: '<180ms', label: 'Live Stream Latency' },
      { value: '3-Click', label: 'Intervention Flow' },
      { value: 'Zero', label: 'Student Disruption' },
    ],
    features: [
      'AI-prioritized risk heatmap sorting active sessions by threat level',
      'Private 1-on-1 audio whisper to warn students without alerting others',
      'Instant screen lockdown and custom warning broadcast',
      'One-click video playback tied directly to flagged violation timestamps',
    ],
    ctaText: 'Explore Proctor Tools',
    ctaLink: '/features',
  },
  {
    id: 'students',
    label: 'Students & Candidates',
    icon: Laptop,
    badge: 'Fair & Transparent',
    title: 'Frictionless, Privacy-First, Zero-Install Testing',
    description: 'No invasive kernel drivers or slow software downloads. Candidates take exams smoothly in standard web browsers with transparent pre-checks and a fair appeal system.',
    metrics: [
      { value: '0MB', label: 'Software Download Needed' },
      { value: '<500kbps', label: 'Bandwidth Requirement' },
      { value: '100%', label: 'Data Encryption' },
    ],
    features: [
      '100% browser-based kiosk running natively in Chrome, Edge & Safari',
      'Pre-flight system check for webcam, microphone, and internet speed',
      'Transparent 3-strike warning policy with clear audio/visual alerts',
      'Complete data privacy compliance (FERPA & GDPR certified)',
    ],
    ctaText: 'Student Portal Login',
    ctaLink: '/student/login',
  },
];

// Core Proctoring Engines
const proctoringEngines = [
  {
    icon: ScanFace,
    title: 'Biometric Face & Gaze Tracking',
    subtitle: 'Continuous Neural Identity Mesh',
    description: 'Verifies candidate identity every 500ms using real-time facial landmarks. Automatically flags looking away, secondary persons entering frame, or face absence.',
    badge: 'AI Vision 3.0',
    tags: ['Facial Landmarks', 'Gaze Tracking', 'Multi-Face Alert', 'Presence Check'],
  },
  {
    icon: LockKeyhole,
    title: 'Kiosk Browser & System Lockdown',
    subtitle: 'Zero-Escape Examination Sandbox',
    description: 'Enforces kiosk fullscreen mode, intercepts Alt+Tab and keyboard shortcuts, blocks copy/paste and screenshot tools, and disables secondary display connections.',
    badge: 'Secure Kiosk',
    tags: ['Fullscreen Lock', 'Tab Interception', 'Clipboard Wipe', 'Dual Monitor Block'],
  },
  {
    icon: Mic,
    title: 'Smart Ambient Acoustic Intelligence',
    subtitle: 'Whisper & Speech Isolation',
    description: 'Distinguishes between harmless keystrokes and whispered external assistance, speech-to-text dictation, and unauthorized background conversations.',
    badge: 'Acoustic AI',
    tags: ['Whisper Detection', 'Background Speech', 'Decibel Spikes', 'Noise Floor Calibration'],
  },
  {
    icon: Monitor,
    title: 'Unified Live Invigilator Cockpit',
    subtitle: '1:50 Multi-Feed Supervision',
    description: 'Proctors monitor dozens of active sessions concurrently on a responsive grid with automated AI risk prioritization that highlights suspicious candidates first.',
    badge: 'Live Operations',
    tags: ['Multi-Stream Grid', 'Risk Priority Sorter', 'Audio Whisper', 'Instant Session Freeze'],
  },
  {
    icon: FileText,
    title: 'Tamper-Proof Forensic Dossier',
    subtitle: 'Legally Defensible Evidence Logs',
    description: 'Every irregularity is indexed on an interactive timeline with synchronized video playback, evidence snapshots, and AI confidence ratings for academic appeals.',
    badge: 'Audit & Compliance',
    tags: ['Timeline Index', 'Video Synchronization', 'PDF Dossier', 'Appeal Protection'],
  },
  {
    icon: Layers,
    title: 'Seamless LMS & REST API Integration',
    subtitle: 'Turnkey Institutional Connectivity',
    description: 'Connect directly into Canvas, Moodle, Blackboard, and Google Classroom via LTI 1.3 standards. Sync exam rosters and return grades automatically.',
    badge: 'LTI 1.3 & API',
    tags: ['Canvas / Moodle', 'SSO & OAuth 2.0', 'Automated Gradebook', 'Webhooks API'],
  },
];

// 4-Step Lifecycle Workflow
const lifecycleSteps = [
  {
    number: '01',
    phase: 'PRE-EXAM VERIFICATION',
    title: 'Biometric & System Calibration',
    description: 'Candidates perform a 30-second automated hardware test (webcam, microphone, network speed) followed by government/student ID capture and face matching.',
    icon: ScanFace,
    details: ['Webcam & Mic Diagnostic', 'Face Biometric Match', 'Room Lighting Check'],
  },
  {
    number: '02',
    phase: 'ENVIRONMENT LOCKDOWN',
    title: 'Kiosk Sandbox Activation',
    description: 'Browser locks into an enforced fullscreen state. Clipboard history is cleared, secondary monitors are disconnected, and developer shortcuts are intercepted.',
    icon: LockKeyhole,
    details: ['Fullscreen Enforced', 'Devtools Disabled', 'Shortcuts Blocked'],
  },
  {
    number: '03',
    phase: 'ACTIVE EXAMINATION',
    title: 'Hybrid AI & Human Invigilation',
    description: 'Continuous dual-layer monitoring processes face gaze, audio levels, and screen focus while proctors oversee candidate video tiles and intervene when needed.',
    icon: Eye,
    details: ['Gaze Deviation Tracking', 'Acoustic Analysis', 'Proctor Intercom'],
  },
  {
    number: '04',
    phase: 'EVALUATION & AUDIT',
    title: 'Certified Dossier & Gradebook Sync',
    description: 'Sessions are scored for integrity. Comprehensive session recordings, incident timestamps, and AI anomaly logs are exported as an official audit dossier.',
    icon: FileText,
    details: ['Integrity Scorecard', 'Timestamped Video Replay', 'LMS Gradebook Return'],
  },
];

// Verified Institutional Testimonials
const institutionalTestimonials = [
  {
    quote: 'ExamShield delivered seamless proctoring for our 12,000 engineering finals with zero student lockouts. The synchronized video audit dossiers eliminated all grade dispute ambiguities.',
    author: 'Dr. Arthur Vance',
    role: 'Dean of Academic Examinations',
    institution: 'Apex Institute of Technology',
    stats: '12,000+ Exams Secured',
  },
  {
    quote: 'Switching from intrusive software downloads to ExamShield’s browser kiosk cut our pre-exam support tickets by 86%. Our proctors love the AI-prioritized risk sorting.',
    author: 'Prof. Elena Rostova',
    role: 'Director of Distance Learning',
    institution: 'State Medical & Health Sciences Board',
    stats: '86% Reduction in Support Issues',
  },
  {
    quote: 'For high-stakes corporate certifications, integrity is non-negotiable. ExamShield gave us enterprise compliance, FERPA adherence, and bulletproof exam defense.',
    author: 'Marcus Chen',
    role: 'Head of Global Certifications',
    institution: 'Horizon Cyber Academy',
    stats: '99.98% Anomaly Precision',
  },
];

// Institutional FAQs
const institutionalFaqs = [
  {
    q: 'Does ExamShield require students to install extensions or invasive desktop apps?',
    a: 'No. ExamShield is 100% web-based. It runs natively in Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari using HTML5 WebRTC, Canvas API, and Web Audio. Candidates do not need administrator privileges or invasive root-level software.',
  },
  {
    q: 'How does ExamShield handle unexpected internet drops during an active exam?',
    a: 'ExamShield features an offline-resilient caching architecture. If a student’s connection temporarily drops, test progress and encrypted biometric timestamps continue locally in protected browser memory and automatically sync the moment connection is restored.',
  },
  {
    q: 'How is candidate biometric data and exam video protected under privacy laws?',
    a: 'ExamShield adheres strictly to FERPA, GDPR, and ISO 27001 data protection standards. All video feeds, audio recordings, and audit logs are encrypted using AES-256 at rest and TLS 1.3 in transit. Recordings are automatically deleted upon expiration of your institution’s retention window.',
  },
  {
    q: 'Can human invigilators intervene or whisper to candidates in real time?',
    a: 'Yes. The Invigilator Cockpit provides a discreet 1-on-1 private audio whisper feature and instant text alert broadcast. Invigilators can clarify instructions, issue calibrated warnings, or pause an exam session immediately without disrupting other candidates.',
  },
  {
    q: 'Can ExamShield detect dual monitors, HDMI splitters, and screen-sharing tools?',
    a: 'Yes. Our browser kiosk queries the display environment, flags multiple active display profiles, intercepts keyboard shortcuts (Alt+Tab, Windows key, Ctrl+C/V), prevents virtual machine access, and blocks desktop capture tools.',
  },
  {
    q: 'How does integration work with LMS platforms like Canvas, Moodle, and Blackboard?',
    a: 'ExamShield natively supports LTI 1.3 standards. Instructors can attach ExamShield proctoring to existing assignments with a single toggle. Student rosters populate automatically and validated grades return directly to your LMS gradebook.',
  },
];

export default function Home() {
  const { user } = useAuth();
  const dashboardPath = dashboardPathFor(user?.role);
  const startExamTarget = user?.role === 'student' ? '/student/dashboard' : '/student/login';
  const ctaTarget = user ? dashboardPath : '/admin/register';

  // Interactive states
  const [activeDepartment, setActiveDepartment] = useState('engineering');
  const [activeAudience, setActiveAudience] = useState('universities');
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('cockpit');
  const [activeFaq, setActiveFaq] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  const goToNextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => Math.min(prev + 1, institutionalTestimonials.length - 1));
  };

  const goToPreviousTestimonial = () => {
    setCurrentTestimonialIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonialIndex(index);
  };

  const selectedDepartment = collegeDepartments.find((d) => d.id === activeDepartment) || collegeDepartments[0];
  const selectedAudience = audienceSolutions.find((item) => item.id === activeAudience) || audienceSolutions[0];

  return (
    <PublicLayout className="exam-landing-theme">
      {/* Hero Section */}
      <section className="public-shell landing-hero" aria-labelledby="hero-heading">
        <div className="landing-copy">
          <div className="landing-eyebrow-wrapper">
            <span className="landing-eyebrow-pill">
              <ShieldCheck size={14} aria-hidden="true" />
              Institutional-Grade Exam Integrity
            </span>
          </div>

          <h1 id="hero-heading">
            Secure every exam.<br />
            <span>Protect institutional integrity.</span>
          </h1>

          <p className="landing-hero-description">
            ExamShield is the complete AI and live proctoring platform for high-stakes assessments. Prevent cheating with continuous biometric face verification, browser kiosk lockdown, ambient sound analytics, and court-admissible audit reports.
          </p>

          <div className="landing-actions" role="group" aria-label="Primary actions">
            <Link to={ctaTarget} className="landing-primary-button" aria-label={user ? 'Open your dashboard' : 'Start institutional trial'}>
              {user ? 'Open Dashboard' : 'Start Institutional Trial'}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <Link to={startExamTarget} className="landing-secondary-button" aria-label="Continue to student exam portal">
              Student Exam Portal
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="landing-trust-checklist">
            <div className="trust-check-item">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Zero Software Install (100% In-Browser)</span>
            </div>
            <div className="trust-check-item">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>FERPA, GDPR & ISO 27001 Compliant</span>
            </div>
            <div className="trust-check-item">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>99.98% Anomaly Detection Accuracy</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive SaaS Proctoring Cockpit Mockup */}
        <div className="landing-hero-cockpit-wrapper" aria-label="ExamShield live proctoring cockpit preview">
          <div className="hero-cockpit-frame">
            {/* Cockpit Window Header */}
            <div className="hero-cockpit-header">
              <div className="cockpit-dots" aria-hidden="true">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>

              <div className="cockpit-session-meta">
                <span className="session-id">SESSION #EX-84920</span>
                <span className="candidate-name">Sarah Mitchell (ID: CS-2024-81)</span>
              </div>

              <div className="cockpit-live-status">
                <span className="live-pulsar" aria-hidden="true" />
                <span>REC ● 1080p WebRTC</span>
              </div>
            </div>

            {/* Cockpit Main Feed & Telemetry HUD */}
            <div className="hero-cockpit-main">
              <div className="hero-video-viewport">
                <img
                  className="hero-candidate-feed"
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"
                  alt="Live candidate taking an online exam with face mesh overlay"
                  fetchPriority="high"
                />

                {/* AI HUD Detection Overlay */}
                <div className="ai-hud-overlay" aria-hidden="true">
                  <div className="face-bounding-box">
                    <div className="corner top-left" />
                    <div className="corner top-right" />
                    <div className="corner bottom-left" />
                    <div className="corner bottom-right" />
                    <div className="ai-match-pill">
                      <ScanFace size={13} />
                      <span>Face Verified 99.4%</span>
                    </div>
                  </div>

                  <div className="hud-telemetry-badge top-right">
                    <span className="hud-signal good">
                      <Eye size={12} />
                      Gaze: Center (0° Dev)
                    </span>
                  </div>

                  <div className="hud-telemetry-badge bottom-left">
                    <span className="hud-signal good">
                      <Volume2 size={12} />
                      Audio: 22dB (Calm)
                    </span>
                  </div>

                  <div className="hud-risk-badge">
                    <span className="risk-score-value">2% RISK</span>
                    <span className="risk-label">Verified Safe</span>
                  </div>
                </div>
              </div>

              {/* Cockpit Side Event Ticker */}
              <div className="hero-cockpit-sidebar">
                <div className="cockpit-sidebar-header">
                  <Activity size={14} aria-hidden="true" />
                  <strong>Real-Time AI Signals</strong>
                </div>

                <div className="cockpit-event-list">
                  <div className="cockpit-event-item passed">
                    <span className="event-time">10:00:02</span>
                    <div className="event-body">
                      <strong>Biometric Identity Match</strong>
                      <span>Facial landmarks matched with student ID</span>
                    </div>
                  </div>

                  <div className="cockpit-event-item passed">
                    <span className="event-time">10:04:15</span>
                    <div className="event-body">
                      <strong>Browser Kiosk Locked</strong>
                      <span>Fullscreen active • Devtools disabled</span>
                    </div>
                  </div>

                  <div className="cockpit-event-item passed">
                    <span className="event-time">10:18:40</span>
                    <div className="event-body">
                      <strong>Multi-Person Check</strong>
                      <span>Single candidate in frame (1 face verified)</span>
                    </div>
                  </div>

                  <div className="cockpit-event-item notice">
                    <span className="event-time">10:32:11</span>
                    <div className="event-body">
                      <strong>Acoustic Baseline</strong>
                      <span>Ambient noise floor calibrated to room</span>
                    </div>
                  </div>
                </div>

                {/* Invigilator Action Bar */}
                <div className="cockpit-action-bar">
                  <button type="button" className="cockpit-btn primary" title="Send a private audio whisper to candidate">
                    <Mic size={13} aria-hidden="true" />
                    Whisper
                  </button>
                  <button type="button" className="cockpit-btn secondary" title="Flag a timestamp for post-exam review">
                    <Clock size={13} aria-hidden="true" />
                    Flag
                  </button>
                  <button type="button" className="cockpit-btn warning" title="Enforce warning to candidate">
                    <ShieldAlert size={13} aria-hidden="true" />
                    Warn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Proof & Metrics Strip */}
      <section className="landing-proof-band" aria-label="Institutional scale and metrics">
        <div className="public-shell landing-proof-inner">
          <div className="proof-metric-item">
            <strong>1.2M+</strong>
            <span>Exams Monitored Safely</span>
          </div>
          <i aria-hidden="true" />

          <div className="proof-metric-item">
            <strong>99.98%</strong>
            <span>Detection Precision</span>
          </div>
          <i aria-hidden="true" />

          <div className="proof-metric-item">
            <strong>&lt; 180ms</strong>
            <span>Live Stream Latency</span>
          </div>
          <i aria-hidden="true" />

          <div className="proof-metric-item">
            <strong>150+</strong>
            <span>Colleges & Testing Boards</span>
          </div>
        </div>
      </section>

      {/* Institutional Accreditation & Trust Badges Strip */}
      <section className="landing-clients-strip" aria-label="Trusted by institutions">
        <div className="public-shell landing-clients-inner">
          <p className="clients-heading">TRUSTED BY UNIVERSITIES, STATE EXAM BOARDS & PROFESSIONAL CERTIFIERS</p>
          <div className="clients-logos-grid" role="list">
            <span className="client-badge" role="listitem">Apex Institute of Tech</span>
            <span className="client-badge" role="listitem">State Medical Board</span>
            <span className="client-badge" role="listitem">National Certification Council</span>
            <span className="client-badge" role="listitem">Horizon Cyber Academy</span>
            <span className="client-badge" role="listitem">Global Polytechnic Board</span>
          </div>
        </div>
      </section>

      {/* DEDICATED COLLEGE ADMIN SECTION */}
      <section id="college-admin" className="public-shell landing-section college-admin-section" aria-labelledby="college-admin-heading">
        <div className="landing-section-title">
          <div className="landing-eyebrow-wrapper">
            <span className="landing-eyebrow-pill">
              <GraduationCap size={15} aria-hidden="true" />
              Campus-Wide Governance
            </span>
          </div>
          <h2 id="college-admin-heading">The College Admin & Institutional Command Suite</h2>
          <p>
            Equip University Deans, Examination Controllers, and Department Heads with a central control plane to orchestrate semester schedules, delegate invigilator rosters, batch-enroll students, and export indisputable integrity forensics.
          </p>
        </div>

        {/* Interactive College Admin Radar Cockpit */}
        <div className="college-admin-cockpit-card">
          <div className="admin-cockpit-top-bar">
            <div className="admin-cockpit-title-group">
              <Building2 size={20} className="admin-icon" aria-hidden="true" />
              <div>
                <h3>University Examination Command Radar</h3>
                <span>Real-Time Multi-Department Semester Session Monitoring</span>
              </div>
            </div>

            <div className="admin-dept-switcher" role="tablist" aria-label="Department switchers">
              {collegeDepartments.map((dept) => {
                const isActive = activeDepartment === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`dept-switch-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveDepartment(dept.id)}
                  >
                    <span>{dept.name.split(' ')[0]} {dept.name.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="admin-dept-overview-grid">
            <div className="admin-dept-hero-card">
              <div className="dept-meta-header">
                <div>
                  <span className="dept-faculty-tag">{selectedDepartment.faculty}</span>
                  <h4>{selectedDepartment.name}</h4>
                  <p className="dept-dean-text">Presiding Officer: <strong>{selectedDepartment.dean}</strong></p>
                </div>
                <div className="dept-integrity-badge">
                  <ShieldCheck size={18} />
                  <span>{selectedDepartment.integrityScore} Normal</span>
                </div>
              </div>

              <div className="dept-active-exam-banner">
                <span className="exam-status-dot" aria-hidden="true" />
                <div className="exam-banner-info">
                  <strong>CURRENT ACTIVE EXAM:</strong>
                  <span>{selectedDepartment.activeExam}</span>
                </div>
              </div>

              <div className="dept-quick-stats-row">
                <div className="dept-stat-box">
                  <strong>{selectedDepartment.totalStudents}</strong>
                  <span>Enrolled Candidates</span>
                </div>
                <div className="dept-stat-box">
                  <strong>{selectedDepartment.hallsActive} Halls</strong>
                  <span>Active Exam Rooms</span>
                </div>
                <div className="dept-stat-box">
                  <strong>{selectedDepartment.proctorsOnDuty} Proctors</strong>
                  <span>Invigilators on Duty</span>
                </div>
                <div className="dept-stat-box highlight">
                  <strong>100%</strong>
                  <span>Kiosk Sandboxed</span>
                </div>
              </div>

              <div className="admin-actions-bar">
                <Link to="/admin/register" className="admin-quick-btn primary">
                  <Calendar size={14} aria-hidden="true" />
                  Schedule Exam Batch
                </Link>
                <Link to="/admin/register" className="admin-quick-btn secondary">
                  <FileSpreadsheet size={14} aria-hidden="true" />
                  Import Student CSV
                </Link>
                <Link to="/contact" className="admin-quick-btn secondary">
                  <FileText size={14} aria-hidden="true" />
                  Disciplinary Dossier
                </Link>
              </div>
            </div>

            <div className="admin-halls-overview-card">
              <div className="halls-header">
                <strong>Live Examination Halls Telemetry</strong>
                <span className="halls-counter">{selectedDepartment.hallsActive} Active Rooms</span>
              </div>

              <div className="halls-list" role="list">
                {selectedDepartment.hallBreakdown.map((hall) => (
                  <div key={hall.name} className="hall-item" role="listitem">
                    <div className="hall-name-col">
                      <strong>{hall.name}</strong>
                      <span>{hall.students} Active Test Takers</span>
                    </div>
                    <div className="hall-status-col">
                      <span className={`hall-pill ${hall.alertCount > 0 ? 'warning' : 'safe'}`}>
                        {hall.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-onboarding-callout">
                <GraduationCap size={20} aria-hidden="true" />
                <div>
                  <strong>Institutional Fast-Track Onboarding</strong>
                  <span>Setup your faculty, courses, and exam rooms in under 15 minutes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Core College Admin Governance Capabilities Grid */}
        <div className="college-capabilities-grid" role="list">
          {collegeAdminCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <article key={cap.title} className="college-cap-card" role="listitem">
                <div className="college-cap-top">
                  <div className="college-cap-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <span className="college-cap-badge">{cap.badge}</span>
                </div>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
              </article>
            );
          })}
        </div>

        <div className="college-admin-banner-cta">
          <div className="banner-cta-content">
            <h3>Ready to modernize your campus examination system?</h3>
            <p>Empower your faculty, eliminate paper leakage, and establish unassailable academic credentials with ExamShield.</p>
          </div>
          <div className="banner-cta-actions">
            <Link to="/admin/register" className="landing-primary-button">
              Register Your College
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/login" className="landing-secondary-button">
              College Admin Portal
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-Audience Solutions Matrix (Interactive Tabs) */}
      <section className="public-shell landing-section" aria-labelledby="audience-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">BUILT FOR YOUR ECOSYSTEM</p>
          <h2 id="audience-heading">Tailored solutions for every stakeholder</h2>
          <p>
            Whether managing university finals, high-stakes licensing, live invigilation, or taking an assessment, ExamShield is tuned to your workflow.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="audience-tab-controls" role="tablist" aria-label="Audience options">
          {audienceSolutions.map((item) => {
            const Icon = item.icon;
            const isActive = activeAudience === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                className={`audience-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveAudience(item.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Audience Card */}
        <article className="audience-active-card" role="tabpanel">
          <div className="audience-card-copy">
            <span className="audience-card-badge">{selectedAudience.badge}</span>
            <h3>{selectedAudience.title}</h3>
            <p>{selectedAudience.description}</p>

            <div className="audience-features-list" role="list">
              {selectedAudience.features.map((feature) => (
                <div key={feature} className="audience-feature-item" role="listitem">
                  <Check size={16} aria-hidden="true" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="audience-card-actions">
              <Link to={selectedAudience.ctaLink} className="landing-primary-button">
                {selectedAudience.ctaText}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="audience-card-metrics">
            <h4>Institutional Highlights</h4>
            <div className="metrics-grid">
              {selectedAudience.metrics.map((metric) => (
                <div key={metric.label} className="metric-box">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>

            <div className="audience-assurance-callout">
              <ShieldCheck size={20} aria-hidden="true" />
              <div>
                <strong>Enterprise Reliability Guarantee</strong>
                <span>Guaranteed 99.9% uptime SLA with real-time failover redundancy</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* 6 Core Proctoring Engines */}
      <section className="public-shell landing-section" aria-labelledby="engines-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">ENGINEERING EXCELLENCE</p>
          <h2 id="engines-heading">Six layers of examination integrity</h2>
          <p>
            An end-to-end defense matrix engineered to detect unfair advantages without placing undue technical burden on candidates.
          </p>
        </div>

        <div className="landing-engines-grid" role="list">
          {proctoringEngines.map((engine) => {
            const Icon = engine.icon;
            return (
              <article key={engine.title} className="engine-card" role="listitem">
                <div className="engine-card-top">
                  <div className="engine-icon-wrapper" aria-hidden="true">
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <span className="engine-badge">{engine.badge}</span>
                </div>

                <h3>{engine.title}</h3>
                <h4 className="engine-subtitle">{engine.subtitle}</h4>
                <p>{engine.description}</p>

                <div className="engine-tags">
                  {engine.tags.map((tag) => (
                    <span key={tag} className="engine-tag">{tag}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="landing-inline-link-row">
          <Link to="/features" className="landing-inline-link" aria-label="Explore all proctoring features in detail">
            Explore all security & proctoring features
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* 4-Step Lifecycle Workflow */}
      <section className="public-shell landing-section" aria-labelledby="workflow-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">SEAMLESS WORKFLOW</p>
          <h2 id="workflow-heading">From candidate check-in to certified audit</h2>
          <p>
            A streamlined 4-phase examination journey that guarantees smooth student entry and indisputable administrative accountability.
          </p>
        </div>

        <div className="landing-step-grid" role="list">
          {lifecycleSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="landing-step-card" key={step.number} role="listitem">
                <div className="landing-step-image" aria-hidden="true">
                  <Icon size={26} strokeWidth={2} />
                  <span>STEP {step.number}</span>
                </div>

                <div className="landing-step-label">
                  <span className="step-phase-pill">{step.phase}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>

                  <div className="step-checklist">
                    {step.details.map((detail) => (
                      <div key={detail} className="step-check-row">
                        <Check size={13} aria-hidden="true" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="landing-inline-link-row">
          <Link to="/how-it-works" className="landing-inline-link" aria-label="View the complete examination lifecycle guide">
            View the complete examination lifecycle guide
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Interactive Platform Showcase (The Admin Workspace) */}
      <section id="platform-preview" className="public-shell landing-dashboard-section enhanced-dashboard-section" aria-labelledby="demo-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">ADMINISTRATOR WORKSPACE</p>
          <h2 id="demo-heading">Live invigilation command center</h2>
          <p>
            Explore the production cockpit utilized by exam coordinators and invigilators to monitor concurrent sessions, review alerts, and compile dossiers.
          </p>
        </div>

        <div className="enhanced-dashboard-container">
          {/* Showcase Tabs */}
          <div className="dashboard-showcase-tabs" role="tablist" aria-label="Dashboard preview views">
            <button
              type="button"
              role="tab"
              aria-selected={activeShowcaseTab === 'cockpit'}
              className={`showcase-tab-btn ${activeShowcaseTab === 'cockpit' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('cockpit')}
            >
              <Monitor size={16} aria-hidden="true" />
              <span>Multi-Stream Invigilator View</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeShowcaseTab === 'threats'}
              className={`showcase-tab-btn ${activeShowcaseTab === 'threats' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('threats')}
            >
              <AlertTriangle size={16} aria-hidden="true" />
              <span>AI Anomaly Timeline</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeShowcaseTab === 'report'}
              className={`showcase-tab-btn ${activeShowcaseTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('report')}
            >
              <FileText size={16} aria-hidden="true" />
              <span>Certified Audit Dossier</span>
            </button>
          </div>

          <div className="dashboard-showcase">
            {/* View 1: Multi-Stream Invigilator Grid */}
            {activeShowcaseTab === 'cockpit' && (
              <div className="showcase-view-panel">
                <div className="dashboard-header">
                  <div className="dashboard-title">
                    <h3>Active Exam: Final Computer Science Examination (CS-402)</h3>
                    <div className="dashboard-status">
                      <span className="status-indicator active" aria-hidden="true" />
                      <span>Live Supervised • 128 Candidates Active</span>
                    </div>
                  </div>

                  <div className="dashboard-stats">
                    <div className="stat-item">
                      <strong>128</strong>
                      <span>Candidates In Room</span>
                    </div>
                    <div className="stat-item">
                      <strong>125</strong>
                      <span>Low Risk (Safe)</span>
                    </div>
                    <div className="stat-item warning">
                      <strong>3</strong>
                      <span>Flagged for Review</span>
                    </div>
                  </div>
                </div>

                <div className="live-stream-grid">
                  <div className="student-stream-tile">
                    <div className="tile-top-bar">
                      <span className="student-id-label">Candidate #01 • Sarah M.</span>
                      <span className="tile-status-tag safe">98% Normal</span>
                    </div>
                    <div className="tile-feed-sim">
                      <div className="tile-placeholder-person normal" />
                      <div className="tile-telemetry">Gaze: Center • Noise: 20dB</div>
                    </div>
                    <div className="tile-actions">
                      <button type="button" className="tile-btn whisper">Whisper</button>
                      <button type="button" className="tile-btn">Inspect</button>
                    </div>
                  </div>

                  <div className="student-stream-tile alert-border">
                    <div className="tile-top-bar">
                      <span className="student-id-label">Candidate #02 • Alex R.</span>
                      <span className="tile-status-tag warning">Flagged: Gaze Loss</span>
                    </div>
                    <div className="tile-feed-sim">
                      <div className="tile-placeholder-person look-away" />
                      <div className="tile-telemetry warning">Looking Away (3.4s)</div>
                    </div>
                    <div className="tile-actions">
                      <button type="button" className="tile-btn warn">Issue Warning</button>
                      <button type="button" className="tile-btn">Inspect</button>
                    </div>
                  </div>

                  <div className="student-stream-tile">
                    <div className="tile-top-bar">
                      <span className="student-id-label">Candidate #03 • Maya P.</span>
                      <span className="tile-status-tag safe">99% Normal</span>
                    </div>
                    <div className="tile-feed-sim">
                      <div className="tile-placeholder-person normal" />
                      <div className="tile-telemetry">Gaze: Center • Kiosk Locked</div>
                    </div>
                    <div className="tile-actions">
                      <button type="button" className="tile-btn whisper">Whisper</button>
                      <button type="button" className="tile-btn">Inspect</button>
                    </div>
                  </div>

                  <div className="student-stream-tile">
                    <div className="tile-top-bar">
                      <span className="student-id-label">Candidate #04 • David K.</span>
                      <span className="tile-status-tag safe">97% Normal</span>
                    </div>
                    <div className="tile-feed-sim">
                      <div className="tile-placeholder-person normal" />
                      <div className="tile-telemetry">Full Focus • Audio Calm</div>
                    </div>
                    <div className="tile-actions">
                      <button type="button" className="tile-btn whisper">Whisper</button>
                      <button type="button" className="tile-btn">Inspect</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: AI Anomaly Timeline */}
            {activeShowcaseTab === 'threats' && (
              <div className="showcase-view-panel">
                <div className="timeline-header">
                  <div>
                    <h4>Forensic Timeline Analysis</h4>
                    <p>Chronological trace of flagged events with video offset timestamps and AI confidence metrics.</p>
                  </div>
                  <span className="timeline-session-badge">Session #EX-84920</span>
                </div>

                <div className="anomaly-timeline-list">
                  <div className="timeline-row pass">
                    <span className="t-time">00:00:15</span>
                    <div className="t-badge pass">PASSED</div>
                    <div className="t-desc">
                      <strong>Government ID & Facial Mesh Verified</strong>
                      <span>Student face matched official record with 99.4% confidence.</span>
                    </div>
                    <span className="t-tag">Biometric ID</span>
                  </div>

                  <div className="timeline-row pass">
                    <span className="t-time">00:14:02</span>
                    <div className="t-badge pass">PASSED</div>
                    <div className="t-desc">
                      <strong>Browser Kiosk Lockdown Confirmed</strong>
                      <span>Fullscreen initialized. Clipboard cleared, devtools and hotkeys disabled.</span>
                    </div>
                    <span className="t-tag">System Quarantine</span>
                  </div>

                  <div className="timeline-row warning">
                    <span className="t-time">00:27:44</span>
                    <div className="t-badge warn">FLAGGED</div>
                    <div className="t-desc">
                      <strong>Off-Screen Gaze Deviation Detected (Duration: 3.2s)</strong>
                      <span>Candidate head pose rotated &gt; 35° towards bottom-left desk area.</span>
                    </div>
                    <span className="t-tag">Vision AI</span>
                  </div>

                  <div className="timeline-row pass">
                    <span className="t-time">00:27:48</span>
                    <div className="t-badge pass">RESOLVED</div>
                    <div className="t-desc">
                      <strong>Focus Re-acquired Automatically</strong>
                      <span>Candidate gaze returned to screen center. No secondary person detected.</span>
                    </div>
                    <span className="t-tag">Vision AI</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Certified Audit Dossier */}
            {activeShowcaseTab === 'report' && (
              <div className="showcase-view-panel">
                <div className="dossier-preview-card">
                  <div className="dossier-top">
                    <div>
                      <span className="dossier-kicker">OFFICIAL EXAMINATION AUDIT DOSSIER</span>
                      <h4>Integrity Certification Report #IR-99201</h4>
                      <p>Institution: Apex Institute of Technology • Course: Distributed Systems (CS-402)</p>
                    </div>
                    <div className="dossier-trust-stamp">
                      <ShieldCheck size={28} />
                      <span>OFFICIALLY VERIFIED</span>
                    </div>
                  </div>

                  <div className="dossier-summary-grid">
                    <div className="dossier-stat-box">
                      <span className="d-label">Integrity Trust Score</span>
                      <strong className="d-val green">97 / 100</strong>
                      <span className="d-sub">Verdict: Cleared</span>
                    </div>

                    <div className="dossier-stat-box">
                      <span className="d-label">Total Duration</span>
                      <strong className="d-val">120 Minutes</strong>
                      <span className="d-sub">100% Stream Logged</span>
                    </div>

                    <div className="dossier-stat-box">
                      <span className="d-label">Critical Violations</span>
                      <strong className="d-val">0 Major / 1 Minor</strong>
                      <span className="d-sub">No Disqualification</span>
                    </div>

                    <div className="dossier-stat-box">
                      <span className="d-label">LMS Grade Status</span>
                      <strong className="d-val green">Synchronized</strong>
                      <span className="d-sub">Score: 92/100 (A)</span>
                    </div>
                  </div>

                  <div className="dossier-footer-actions">
                    <div className="hash-stamp">
                      <span>Cryptographic Hash:</span>
                      <code>SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</code>
                    </div>

                    <Link to="/contact" className="dossier-download-btn">
                      <FileText size={15} />
                      Export Official PDF Dossier
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="landing-inline-link-row">
          <Link to="/admin/register" className="landing-inline-link" aria-label="Test the live proctoring dashboard with a free institutional trial">
            Try the Dashboard Demo with an Institutional Trial
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Enterprise Security, Privacy & Compliance Architecture */}
      <section className="public-shell landing-section" aria-labelledby="security-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">SECURITY & COMPLIANCE</p>
          <h2 id="security-heading">Enterprise data privacy without compromise</h2>
          <p>
            Institutions trust ExamShield because academic integrity must never come at the expense of student safety, privacy rights, or system security.
          </p>
        </div>

        <div className="security-pillars-grid" role="list">
          <article className="security-card" role="listitem">
            <div className="security-icon" aria-hidden="true">
              <LockKeyhole size={24} />
            </div>
            <h3>End-to-End Cryptographic Encryption</h3>
            <p>
              All video streams, candidate audio, and event logs are protected by AES-256 encryption at rest and TLS 1.3 in transit with strictly isolated tenant storage.
            </p>
          </article>

          <article className="security-card" role="listitem">
            <div className="security-icon" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <h3>FERPA & GDPR Compliance</h3>
            <p>
              Built-in privacy safeguards with configurable data retention rules. Student biometric recordings are automatically purged once institutional review concludes.
            </p>
          </article>

          <article className="security-card" role="listitem">
            <div className="security-icon" aria-hidden="true">
              <Laptop size={24} />
            </div>
            <h3>Non-Invasive Browser Sandbox</h3>
            <p>
              Zero kernel drivers, root access, or background daemons. ExamShield operates cleanly in standard browsers, ensuring personal devices are never compromised.
            </p>
          </article>

          <article className="security-card" role="listitem">
            <div className="security-icon" aria-hidden="true">
              <Users size={24} />
            </div>
            <h3>Human-in-the-Loop Guarantee</h3>
            <p>
              AI acts purely as an assistive sensor. No candidate is ever automatically failed or disqualified by an algorithm without human invigilator review.
            </p>
          </article>
        </div>
      </section>

      {/* Institutional Testimonials */}
      <section className="public-shell landing-section" aria-labelledby="testimonials-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">PROVEN RESULTS</p>
          <h2 id="testimonials-heading">Validated by examination leaders</h2>
          <p>Read how academic leaders, certifiers, and faculty trust ExamShield to safeguard their credentials.</p>
        </div>

        {/* Testimonial Carousel */}
        <div className="testimonials-carousel-container">
          <div className="testimonials-slider" role="region" aria-label="Institutional testimonials">
            {/* Testimonial Slides */}
            <div className="testimonials-track">
              {institutionalTestimonials.map((t, index) => (
                <div
                  key={t.author}
                  className={`testimonial-slide ${currentTestimonialIndex === index ? 'active' : ''}`}
                  role="listitem"
                  aria-hidden={currentTestimonialIndex !== index}
                  tabIndex={-1}
                >
                  <article className="testimonial-card">
                    <div className="testimonial-stat-badge">{t.stats}</div>
                    <p className="testimonial-quote">“{t.quote}”</p>
                    <div className="testimonial-author-meta">
                      <div className="author-avatar-badge" aria-hidden="true">
                        {t.author.charAt(3) || 'U'}
                      </div>
                      <div>
                        <strong>{t.author}</strong>
                        <span>{t.role}</span>
                        <small>{t.institution}</small>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="testimonials-navigation" aria-label="Testimonial navigation">
            <button
              type="button"
              className={`testimonial-nav-btn prev ${currentTestimonialIndex === 0 ? 'disabled' : ''}`}
              onClick={goToPreviousTestimonial}
              aria-disabled={currentTestimonialIndex === 0}
            >
              <ArrowLeft size={20} aria-hidden="true" />
              Previous
            </button>

            <div className="testimonials-dots" role="tablist" aria-label="Testimonial slides">
              {institutionalTestimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`testimonial-dot ${currentTestimonialIndex === index ? 'active' : ''}`}
                  role="tab"
                  aria-selected={currentTestimonialIndex === index}
                  onClick={() => goToTestimonial(index)}
                  aria-label={`Testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className={`testimonial-nav-btn next ${currentTestimonialIndex === institutionalTestimonials.length - 1 ? 'disabled' : ''}`}
              onClick={goToNextTestimonial}
              aria-disabled={currentTestimonialIndex === institutionalTestimonials.length - 1}
            >
              Next
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Interactive Accordion) */}
      <section className="public-shell landing-section" aria-labelledby="faq-heading">
        <div className="landing-section-title">
          <p className="landing-section-kicker">FREQUENTLY ASKED QUESTIONS</p>
          <h2 id="faq-heading">Everything you need to know about ExamShield</h2>
          <p>Common questions from academic deans, IT administrators, and testing coordinators.</p>
        </div>

        <div className="institutional-faq-list" role="region" aria-label="Frequently Asked Questions">
          {institutionalFaqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={faq.q} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.q}</span>
                  <span className="faq-toggle-icon" aria-hidden="true">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="faq-answer-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* High-Impact Final Conversion CTA Section */}
      <section className="public-shell landing-cta-section" aria-labelledby="cta-heading">
        <p className="landing-section-kicker">READY TO MODERNIZE YOUR EXAMS?</p>
        <h2 id="cta-heading">
          Safeguard academic integrity.<br />
          Trust every examination result.
        </h2>
        <p>
          Join 150+ colleges, universities, and certification bodies that deliver secure, cheat-proof online assessments with ExamShield.
        </p>

        <div className="cta-button-row">
          <Link to={ctaTarget} className="landing-cta-button" aria-label="Start your institutional trial">
            {user ? 'Open Your Dashboard' : 'Start Institutional Trial'}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>

          <Link to={startExamTarget} className="landing-cta-secondary" aria-label="Student Exam Sign In">
            Student Exam Sign In
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
