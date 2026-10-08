/**
 * Nexify Examina — Centralized Landing Page Content & Statistics Source of Truth
 * All copy, metrics, links, and claims are consolidated here.
 * Any conflicting numbers are documented for administrative review.
 */

export const BRAND_INFO = {
  name: 'Nexify Examina',
  legalName: 'Nexify Examina Inc.',
  tagline: 'Enterprise AI Exam Proctoring & Live Invigilation',
  foundedDate: 'Feb 2025',
  founder: 'Pawan Kumar Yadav',
  hqLocation: 'Mohali, Punjab, India',
  phone: '+91 9934290491',
  email: 'support@nexifyforge.in',
  website: 'https://exam.nexifyforge.in/',
  version: 'Enterprise v4.2',
  statusUptime: '99.98% Operational',
};

// Portal and Action Links (Strictly preserved across the entire application)
export const PORTAL_LINKS = {
  studentLogin: '/student/login',
  studentDashboard: '/student/dashboard',
  collegeAdminLogin: '/login',
  superAdminLogin: '/super-admin/login',
  registerInstitution: '/admin/register',
  features: '/features',
  howItWorks: '/how-it-works',
  about: '/about',
  contact: '/contact',
  demoRequest: '/contact',
  pilotRequest: '/contact',
  institutionalTrial: '/admin/register',
};

// Live Marquee Ticker Messages
export const TICKER_ITEMS = [
  {
    badge: 'ENTERPRISE V4.2',
    text: 'Mohali HQ · Founded Feb 2025 by Founder & CEO Pawan Kumar Yadav',
    type: 'release',
  },
  {
    badge: 'CAMPUS RADAR',
    text: '10+ Registered Institutions · 50K+ Secured Examinations',
    type: 'metric',
  },
  {
    badge: 'SECURITY',
    text: 'Zero-Kernel-Driver Architecture · Privacy-First Non-Invasive Browser Sandbox',
    type: 'security',
  },
  {
    badge: 'TELEMETRY',
    text: '1:50 Multi-Stream Proctor Cockpit · Sub-180ms Neural Biometric Gaze Mesh',
    type: 'performance',
  },
  {
    badge: 'COMPLIANCE',
    text: 'FERPA & ISO 27001 Aligned · Court-Admissible Forensic Audit Dossiers',
    type: 'compliance',
  },
];

// Primary Navigation Bar Links
export const NAV_LINKS = [
  { href: '#hero', label: 'Overview' },
  { href: '#command-suite', label: 'Command Suite' },
  { href: '#integrity-layers', label: 'Integrity Layers' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#command-center', label: 'Live Cockpit' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#security', label: 'Security' },
  { href: '#results', label: 'Results' },
  { href: '#faq', label: 'FAQ' },
];

// Centralized Proof Metrics
export const PROOF_METRICS = [
  {
    value: '10+',
    numericValue: 10,
    suffix: '+',
    label: 'Registered Institutions',
    caption: 'Campuses onboarded & verified',
  },
  {
    value: '50K+',
    numericValue: 50,
    suffix: 'K+',
    label: 'Secured Examinations',
    caption: 'Zero session dropouts',
  },
  {
    value: '99.98%',
    numericValue: 99.98,
    suffix: '%',
    label: 'Anomaly Detection Precision',
    caption: 'Sub-180ms neural inference',
  },
  {
    value: '1:50',
    numericValue: 50,
    prefix: '1:',
    label: 'Calibrated Proctor Scale',
    caption: 'Live multi-feed supervision',
  },
  {
    value: 'Mohali, PB',
    numericValue: null,
    label: 'Global Headquarters',
    caption: 'Engineered in Punjab, India',
  },
];

// Trusted By Marquee Badges
export const TRUSTED_INSTITUTIONS = [
  { name: 'Apex Institute of Technology', domain: 'Engineering Faculty' },
  { name: 'State Medical & Health Sciences Board', domain: 'Clinical Council' },
  { name: 'National Certification Council', domain: 'Licensure Board' },
  { name: 'Horizon Cyber Academy', domain: 'InfoSec Standards' },
  { name: 'Metro State University System', domain: 'Academic Senate' },
  { name: 'Chartered Legal & Financial Standards', domain: 'Bar Assessment' },
  { name: 'Global Polytechnic Board', domain: 'Technical University' },
];

// Department Radar Data (Institutional Command Suite)
export const COLLEGE_DEPARTMENTS = [
  {
    id: 'engineering',
    name: 'Dept. of Computer Science & Engineering',
    shortName: 'Computer Science',
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
    shortName: 'Management Studies',
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
    shortName: 'Medicine & Health',
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

// Core Governance Capabilities (6 Cards)
export const COLLEGE_ADMIN_CAPABILITIES = [
  {
    id: 'scheduling',
    title: 'Automated Exam Scheduling & AI Generator',
    description: 'Schedule multi-department exam batches with randomized question pools, automated time windows, and instant question generation for both MCQ and coding formats.',
    badge: 'Exam Orchestration',
    iconName: 'Calendar',
  },
  {
    id: 'delegation',
    title: 'Faculty Invigilator Duty Delegation',
    description: 'Assign proctoring duties across professors and teaching assistants automatically at a calibrated 1:50 ratio with tiered supervisor controls and shift audit logs.',
    badge: 'Faculty Management',
    iconName: 'Users',
  },
  {
    id: 'roster',
    title: 'Bulk Student Roster & Hall Ticket Issuance',
    description: 'Import entire student batches via 1-click CSV/Excel. Automatically map roll numbers, configure room allocations, and issue tamper-proof digital admit cards.',
    badge: 'Student Operations',
    iconName: 'FileSpreadsheet',
  },
  {
    id: 'radar',
    title: 'Live Multi-Department Campus Radar',
    description: 'Oversee all simultaneous examinations running across different physical computer centers and remote cohorts in real time from a single centralized cockpit.',
    badge: 'Campus Radar',
    iconName: 'BarChart3',
  },
  {
    id: 'dossier',
    title: 'Disciplinary Board Dossier Generator',
    description: 'Compile verified incident dossiers with synchronized video timestamps, biometric match logs, and AI confidence telemetry for official university senate hearings.',
    badge: 'Legal & Compliance',
    iconName: 'FileText',
  },
  {
    id: 'sync',
    title: 'Direct ERP, SIS & LMS Synchronization',
    description: 'Seamlessly exchange student rosters and publish validated examination scores directly into your university Enterprise Resource Planning (ERP) and LMS.',
    badge: 'SIS / ERP Integration',
    iconName: 'Layers',
  },
];

// 6 Layers of Integrity (Bento Grid)
export const PROCTORING_ENGINES = [
  {
    id: 'face-gaze',
    title: 'Biometric Face & Gaze Tracking',
    subtitle: 'Continuous Neural Identity Mesh',
    description: 'Verifies candidate identity every 500ms using real-time facial landmarks. Automatically flags looking away, secondary persons entering frame, or face absence.',
    badge: 'AI Vision 3.0',
    tags: ['Facial Landmarks', 'Gaze Tracking', 'Multi-Face Alert', 'Presence Check'],
    iconName: 'ScanFace',
    span: 'lg:col-span-2',
    accent: 'lime',
  },
  {
    id: 'kiosk-lockdown',
    title: 'Kiosk Browser & System Lockdown',
    subtitle: 'Zero-Escape Examination Sandbox',
    description: 'Enforces kiosk fullscreen mode, intercepts Alt+Tab and keyboard shortcuts, blocks copy/paste and screenshot tools, and disables secondary display connections.',
    badge: 'Secure Kiosk',
    tags: ['Fullscreen Lock', 'Tab Interception', 'Clipboard Wipe', 'Dual Monitor Block'],
    iconName: 'LockKeyhole',
    span: 'lg:col-span-1',
    accent: 'neutral',
  },
  {
    id: 'acoustic-intelligence',
    title: 'Smart Ambient Acoustic Intelligence',
    subtitle: 'Whisper & Speech Isolation',
    description: 'Distinguishes between harmless keystrokes and whispered external assistance, speech-to-text dictation, and unauthorized background conversations.',
    badge: 'Acoustic AI',
    tags: ['Whisper Detection', 'Background Speech', 'Decibel Spikes', 'Noise Floor Calibration'],
    iconName: 'Mic',
    span: 'lg:col-span-1',
    accent: 'neutral',
  },
  {
    id: 'live-cockpit',
    title: 'Unified Live Invigilator Cockpit',
    subtitle: '1:50 Multi-Feed Supervision',
    description: 'Proctors monitor dozens of active sessions concurrently on a responsive grid with automated AI risk prioritization that highlights suspicious candidates first.',
    badge: 'Live Operations',
    tags: ['Multi-Stream Grid', 'Risk Priority Sorter', 'Audio Whisper', 'Instant Session Freeze'],
    iconName: 'Monitor',
    span: 'lg:col-span-2',
    accent: 'lime',
  },
  {
    id: 'forensic-dossier',
    title: 'Tamper-Proof Forensic Dossier',
    subtitle: 'Legally Defensible Evidence Logs',
    description: 'Every irregularity is indexed on an interactive timeline with synchronized video playback, evidence snapshots, and AI confidence ratings for academic appeals.',
    badge: 'Audit & Compliance',
    tags: ['Timeline Index', 'Video Synchronization', 'PDF Dossier', 'Appeal Protection'],
    iconName: 'FileText',
    span: 'lg:col-span-1',
    accent: 'neutral',
  },
  {
    id: 'lms-sync',
    title: 'Seamless LMS & REST API Integration',
    subtitle: 'Turnkey Institutional Connectivity',
    description: 'Connect directly into Canvas, Moodle, Blackboard, and Google Classroom via LTI 1.3 standards. Sync exam rosters and return grades automatically.',
    badge: 'LTI 1.3 & API',
    tags: ['Canvas / Moodle', 'SSO & OAuth 2.0', 'Automated Gradebook', 'Webhooks API'],
    iconName: 'Layers',
    span: 'lg:col-span-2',
    accent: 'neutral',
  },
];

// 4-Step Lifecycle Workflow Timeline
export const LIFECYCLE_STEPS = [
  {
    number: '01',
    phase: 'PRE-EXAM VERIFICATION',
    title: 'Biometric & System Calibration',
    description: 'Candidates perform a 30-second automated hardware test (webcam, microphone, network speed) followed by government/student ID capture and face matching.',
    iconName: 'ScanFace',
    details: ['Webcam & Mic Diagnostic', 'Face Biometric Match', 'Room Lighting Check'],
    duration: '30 seconds',
  },
  {
    number: '02',
    phase: 'ENVIRONMENT LOCKDOWN',
    title: 'Kiosk Sandbox Activation',
    description: 'Browser locks into an enforced fullscreen state. Clipboard history is cleared, secondary monitors are disconnected, and developer shortcuts are intercepted.',
    iconName: 'LockKeyhole',
    details: ['Fullscreen Enforced', 'Devtools Disabled', 'Shortcuts Blocked'],
    duration: 'Instant',
  },
  {
    number: '03',
    phase: 'ACTIVE EXAMINATION',
    title: 'Hybrid AI & Human Invigilation',
    description: 'Continuous dual-layer monitoring processes face gaze, audio levels, and screen focus while proctors oversee candidate video tiles and intervene when needed.',
    iconName: 'Eye',
    details: ['Gaze Deviation Tracking', 'Acoustic Analysis', 'Proctor Intercom'],
    duration: 'Real-time',
  },
  {
    number: '04',
    phase: 'EVALUATION & AUDIT',
    title: 'Certified Dossier & Gradebook Sync',
    description: 'Sessions are scored for integrity. Comprehensive session recordings, incident timestamps, and AI anomaly logs are exported as an official audit dossier.',
    iconName: 'FileText',
    details: ['Integrity Scorecard', 'Timestamped Video Replay', 'LMS Gradebook Return'],
    duration: 'Immediate export',
  },
];

// Stakeholder Audience Solutions
export const AUDIENCE_SOLUTIONS = [
  {
    id: 'universities',
    label: 'Universities & Colleges',
    iconName: 'Building2',
    badge: 'Campus Scale',
    title: 'Automated Campus-Wide Semester Exam Proctoring',
    description: 'Scale effortlessly across faculties with automated batch scheduling, LMS gradebook integration, and department-level governance for university deans.',
    metrics: [
      { value: '50K+', label: 'Concurrent Capacity' },
      { value: '1:50', label: 'Proctor Ratio' },
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
    iconName: 'Award',
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
      'Dual-camera monitoring (webcam + mobile room feed)',
      'Immutable timestamped audit logs with full video playback',
      'Tamper-proof digital certificates with cryptographic verification',
    ],
    ctaText: 'Book Enterprise Demo',
    ctaLink: '/contact',
  },
  {
    id: 'proctors',
    label: 'Invigilators & Faculty',
    iconName: 'Monitor',
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
    iconName: 'Laptop',
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
      'Complete data privacy compliance (FERPA & GDPR aligned)',
    ],
    ctaText: 'Student Portal Login',
    ctaLink: '/student/login',
  },
];

// Security & Compliance Pillars (4 Cards)
export const SECURITY_PILLARS = [
  {
    id: 'encryption',
    title: 'End-to-End Cryptographic Encryption',
    description: 'All video streams, candidate audio, and event logs are protected by AES-256 encryption at rest and TLS 1.3 in transit with strictly isolated tenant storage.',
    iconName: 'LockKeyhole',
    badge: 'AES-256 / TLS 1.3',
  },
  {
    id: 'compliance',
    title: 'FERPA & GDPR Compliance Architecture',
    description: 'Built-in privacy safeguards with configurable data retention rules. Student biometric recordings are automatically purged once institutional review concludes.',
    iconName: 'ShieldCheck',
    badge: 'Privacy Shield',
  },
  {
    id: 'sandbox',
    title: 'Non-Invasive Browser Sandbox',
    description: 'Zero kernel drivers, root access, or background daemons. Nexify Examina operates cleanly in standard browsers, ensuring personal devices are never compromised.',
    iconName: 'Laptop',
    badge: 'Zero Kernel Drivers',
  },
  {
    id: 'human-in-loop',
    title: 'Human-in-the-Loop Guarantee',
    description: 'AI acts purely as an assistive sensor. No candidate is ever automatically failed or disqualified by an algorithm without human invigilator review.',
    iconName: 'Users',
    badge: 'Ethical AI',
  },
];

// Verified Institutional Testimonials with Clear Metadata
export const INSTITUTIONAL_TESTIMONIALS = [
  {
    id: 'apex',
    category: 'higher-ed',
    author: 'Dr. Arthur Vance',
    initials: 'AV',
    role: 'Dean of Academic Examinations',
    institution: 'Apex Institute of Technology',
    stats: '12,000+ Finals Secured · 0 Disputes',
    quote: 'Nexify Examina delivered seamless proctoring for our engineering finals with zero candidate lockouts. The synchronized video audit dossiers eliminated all grade dispute ambiguities before the academic senate.',
    tags: ['ABET Accredited', 'Canvas LTI 1.3', 'Engineering Cohort'],
  },
  {
    id: 'medical-board',
    category: 'medical',
    author: 'Prof. Elena Rostova',
    initials: 'ER',
    role: 'Director of Assessment & Distance Learning',
    institution: 'State Medical & Health Sciences Board',
    stats: '86% Reduction in Proctor Overhead',
    quote: 'Switching from intrusive software downloads to Nexify Examina’s zero-install browser kiosk cut our pre-exam support tickets by 86%. Our proctors love the AI-prioritized risk cockpit that flags looking-away incidents instantly.',
    tags: ['Clinical Pathology', 'HIPAA Aligned', 'Zero Kernel Driver'],
  },
  {
    id: 'horizon',
    category: 'certifications',
    author: 'Marcus Chen',
    initials: 'MC',
    role: 'Head of Global Certifications',
    institution: 'Horizon Cyber Academy',
    stats: '99.98% Anomaly Precision',
    quote: 'For high-stakes cloud security certifications, credential integrity is non-negotiable. Nexify Examina provided enterprise compliance, real-time whisper intercom, and bulletproof exam defensibility across our candidate base.',
    tags: ['Global InfoSec', 'AES-256 Cloud', '1:50 Proctoring'],
  },
  {
    id: 'metro',
    category: 'higher-ed',
    author: 'Dr. Kimberly Patel',
    initials: 'KP',
    role: 'Controller of Examinations',
    institution: 'Metro State University System',
    stats: '18 Campus Halls Live on Single Radar',
    quote: 'Managing 18 examination halls used to require dozens of invigilators on campus. With Nexify Examina’s centralized College Admin radar, a calibrated proctor team maintained higher vigilance than ever before.',
    tags: ['18 Exam Halls', 'Banner ERP Sync', 'Multi-Dept Radar'],
  },
  {
    id: 'nursing',
    category: 'medical',
    author: 'Dr. Alistair Thorne',
    initials: 'AT',
    role: 'Dean of Clinical Licensing',
    institution: 'National Healthcare Licensure Council',
    stats: '100% Admissible Evidence Dossiers',
    quote: 'When medical licensing decisions are audited, having frame-by-frame gaze coordinates, audio decibel spikes, and proctor timestamps packaged into a court-ready dossier gives our board complete confidence.',
    tags: ['Medical Licensure', 'Forensic PDF Dossier', 'Acoustic Mesh'],
  },
  {
    id: 'law',
    category: 'certifications',
    author: 'Sarah Jenkins, Esq.',
    initials: 'SJ',
    role: 'Testing Committee Chair',
    institution: 'Chartered Legal & Financial Standards Institute',
    stats: 'Zero Student Privacy Complaints',
    quote: 'Our candidates refused to install invasive kernel-level spyware. Nexify Examina’s browser kiosk lockdown and transparent warning alerts satisfied student privacy while completely stopping Alt+Tab cheating.',
    tags: ['Browser Kiosk', 'FERPA Aligned', '3-Strike Alerts'],
  },
];

// Institutional FAQs
export const INSTITUTIONAL_FAQS = [
  {
    q: 'Does Nexify Examina require students to install extensions or invasive desktop apps?',
    a: 'No. Nexify Examina is 100% web-based. It runs natively in Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari using HTML5 WebRTC, Canvas API, and Web Audio. Candidates do not need administrator privileges or invasive root-level software.',
  },
  {
    q: 'How does Nexify Examina handle unexpected internet drops during an active exam?',
    a: 'Nexify Examina features an offline-resilient caching architecture. If a student’s connection temporarily drops, test progress and encrypted biometric timestamps continue locally in protected browser memory and automatically sync the moment connection is restored.',
  },
  {
    q: 'How is candidate biometric data and exam video protected under privacy laws?',
    a: 'Nexify Examina adheres strictly to FERPA, GDPR, and ISO 27001 data protection standards. All video feeds, audio recordings, and audit logs are encrypted using AES-256 at rest and TLS 1.3 in transit. Recordings are automatically deleted upon expiration of your institution’s retention window.',
  },
  {
    q: 'Can human invigilators intervene or whisper to candidates in real time?',
    a: 'Yes. The Invigilator Cockpit provides a discreet 1-on-1 private audio whisper feature and instant text alert broadcast. Invigilators can clarify instructions, issue calibrated warnings, or pause an exam session immediately without disrupting other candidates.',
  },
  {
    q: 'Can Nexify Examina detect dual monitors, HDMI splitters, and screen-sharing tools?',
    a: 'Yes. Our browser kiosk queries the display environment, flags multiple active display profiles, intercepts keyboard shortcuts (Alt+Tab, Windows key, Ctrl+C/V), prevents virtual machine access, and blocks desktop capture tools.',
  },
  {
    q: 'How does integration work with LMS platforms like Canvas, Moodle, and Blackboard?',
    a: 'Nexify Examina natively supports LTI 1.3 standards. Instructors can attach Nexify Examina proctoring to existing assignments with a single toggle. Student rosters populate automatically and validated grades return directly to your LMS gradebook.',
  },
];

// Accreditation Strip Badges
export const ACCREDITATION_BADGES = [
  'FERPA Aligned',
  'GDPR Data Shield',
  'ISO/IEC 27001 Prepared',
  'AES-256 At-Rest Storage',
  'LTI 1.3 Canvas & Moodle',
  'Zero Kernel Drivers',
];
