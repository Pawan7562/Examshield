// backend/controllers/chatbotController.js
// Enterprise-Grade Industry-Ready AI Knowledge & Support Assistant

const knowledgeBase = [
  {
    id: 'ai_proctoring',
    intents: ['ai', 'proctoring', 'cheat', 'cheating', 'camera', 'face', 'webcam', 'biometric', 'mesh', 'looking away', 'multiple faces', 'person', 'detection'],
    title: 'Autonomous AI Proctoring & Biometric Verification',
    summary: 'Nexify Examina uses continuous computer vision and biometric face mesh analytics to safeguard assessment integrity.',
    response: `### 🛡️ Autonomous AI Proctoring & Biometric Engine

Nexify Examina delivers continuous, non-invasive assessment surveillance running **100% in-browser** via WebRTC and HTML5 Canvas:

* **Biometric Face Mesh**: Maps 468 3D facial landmarks at 30 fps to ensure continuous candidate identity verification.
* **Absence & Multi-Person Alerts**: Flags when a candidate leaves the camera frame or when unauthorized secondary individuals appear in the room.
* **Gaze & Head Pose Tracking**: Detects abnormal, persistent looking away from the screen, indicating off-screen notes or external screens.
* **Acoustic Whisper Filter**: Web Audio API analyzes ambient microphone frequencies to detect whispering, dictation, and background conversations while filtering typing noise.
* **Automated Violation Logs**: Every event is captured with a high-resolution snapshot, millisecond timestamp, and severity rating.

All proctoring occurs client-side without storing biometric face templates, ensuring strict **FERPA & GDPR compliance**.`,
    suggestions: [
      'How does browser kiosk lockdown work?',
      'Can it detect secondary monitors?',
      'What happens if an internet disconnection occurs?',
      'Can instructors whisper to students live?'
    ],
    actions: [
      { label: 'Explore Features', url: '/features' },
      { label: 'View How It Works', url: '/how-it-works' }
    ]
  },
  {
    id: 'browser_lockdown',
    intents: ['kiosk', 'lockdown', 'browser', 'tab', 'switch', 'fullscreen', 'dual monitor', 'second monitor', 'hdmi', 'copy', 'paste', 'shortcut', 'alt tab'],
    title: 'Browser Kiosk Lockdown & Anti-Tamper Sandbox',
    summary: 'Enforces an impenetrable sandbox inside modern browsers without requiring invasive root-level software.',
    response: `### 🔒 Browser Kiosk Lockdown & Environment Sandboxing

Nexify Examina transforms any standard modern browser into an enterprise-grade secure test kiosk without requiring kernel-level drivers:

* **Fullscreen Enforcement**: Candidates must maintain fullscreen mode throughout the test. Any attempt to minimize or exit fullscreen triggers an immediate violation warning.
* **Tab & Window Interception**: Detects tab-switching, app switching, window blur, and secondary application launches instantly.
* **Keystroke & Shortcut Blocking**: Intercepts \`Alt+Tab\`, \`Windows key\`, \`Cmd+Tab\`, \`Ctrl+C / Ctrl+V\`, \`PrtScn\`, and right-click inspection menus.
* **Multi-Display & Splitter Detection**: Queries display profile APIs to detect secondary monitors, HDMI splitters, virtual machines, and screen-sharing software (Zoom, Teams, Discord).
* **Configurable Violation Threshold**: Admins can set maximum allowed infractions (e.g., 3 warnings) before automatic test lockdown or submission occurs.`,
    suggestions: [
      'What are the minimum system requirements?',
      'How does live invigilator cockpit work?',
      'Can students take coding tests?'
    ],
    actions: [
      { label: 'How It Works Guide', url: '/how-it-works' },
      { label: 'Try Student Room Demo', url: '/student/login' }
    ]
  },
  {
    id: 'coding_assessments',
    intents: ['coding', 'code', 'compiler', 'programming', 'languages', 'python', 'java', 'cpp', 'c++', 'javascript', 'judge', 'test cases', 'ide', 'editor'],
    title: 'Sandboxed Online Coding Assessment Platform',
    summary: 'Monaco-powered coding sandbox supporting 20+ languages with automated test case evaluation.',
    response: `### 💻 Integrated Online Coding Assessment Platform

Nexify Examina includes a full-featured, zero-distraction coding assessment environment designed for computer science and technical hiring:

* **Languages Supported**: Python, Java, C++, C, JavaScript, TypeScript, Go, Rust, C#, PHP, and Ruby.
* **Monaco Code Editor**: Professional VS Code editing experience with syntax highlighting, auto-indentation, and bracket matching.
* **Real-time Compilation**: Sandboxed backend code execution evaluates code in isolated containers with strict memory and time limits (e.g., 2.0s, 256MB).
* **Visible & Hidden Test Cases**: Supports custom inputs, public sample cases with explanations, and secret edge-case test suites for automated grading.
* **Anti-AI & Copy Protection**: Blocks external clipboard pastes, inspects code velocity (detecting large bulk copy-pastes), and prevents tab-switching to ChatGPT or documentation.`,
    suggestions: [
      'How are coding questions auto-graded?',
      'Can AI generate coding questions for instructors?',
      'What are the pricing plans for colleges?'
    ],
    actions: [
      { label: 'View Technical Features', url: '/features' },
      { label: 'Login as Student', url: '/student/login' }
    ]
  },
  {
    id: 'college_admin',
    intents: ['admin', 'college', 'create exam', 'schedule', 'faculty', 'invigilator', 'institution', 'university', 'radar', 'cockpit', 'monitoring', 'broadcast'],
    title: 'College Admin Radar & Live Invigilator Cockpit',
    summary: 'Centralized command center for managing exams, candidates, and live multi-hall invigilation.',
    response: `### 🏛️ College Administrator Console & Live Cockpit

The College Admin portal empowers academic institutions and professors with complete examination governance:

* **Live Multi-Hall Radar**: Real-time cockpit displaying video feeds, active status, violation counts, and focus states of hundreds of concurrent test-takers.
* **1-on-1 Audio Whisper & Alerts**: Invigilators can discreetly speak directly to a specific student via audio whisper or send private calibrated pop-up warnings.
* **Broadcast Announcements**: Send instant exam-wide textual banners (e.g., *"15 minutes remaining"* or *"Correction on Question 4"*).
* **Instant Disqualification / Termination**: Intervene and terminate compromised exam sessions immediately with an audit log reason.
* **Exam Creation & Question Bank**: Configure MCQ, True/False, and Coding questions with custom timers, randomized question ordering, and negative marking.`,
    suggestions: [
      'How do I add students via bulk CSV upload?',
      'How does student password reset work?',
      'Where can I see the results and student copies?'
    ],
    actions: [
      { label: 'Register Your College', url: '/admin/register' },
      { label: 'College Admin Login', url: '/login' }
    ]
  },
  {
    id: 'student_workflow',
    intents: ['student', 'take exam', 'start exam', 'login', 'portal', 'instructions', 'camera check', 'how to take', 'attend', 'student id', 'roll number'],
    title: 'Student Examination Workflow & Guidelines',
    summary: 'A seamless, friction-free test-taking experience from credential entry to auto-submission.',
    response: `### 🎓 Student Exam Experience & Instructions

Taking an exam on Nexify Examina is designed to be streamlined, transparent, and fair:

1. **Sign In**: Navigate to the **Student Portal** (\`/student/login\`) and enter your **Student ID/Email** and **Password** provided by your institution.
2. **Select Assessment**: View your assigned exams on your Student Dashboard. Enter the unique **Exam Key** if required.
3. **Hardware Readiness Check**: Grant browser permission for **Webcam** and **Microphone**. Verify video clarity and audio levels before beginning.
4. **Active Exam Room**:
   * Navigate using the interactive question palette (Answered, Marked for Review, Unvisited).
   * MCQ answers save immediately to the cloud; coding code runs against test cases.
   * Auto-sync protects your work every 15 seconds against accidental drops.
5. **Submission & Results**: Click **Submit Exam** or allow the countdown timer to auto-submit safely. Instantly view your score, attempted count, and breakdown if published by your college.`,
    suggestions: [
      'What should I do if my camera is blocked?',
      'Forgot student password?',
      'What are the minimum system requirements?'
    ],
    actions: [
      { label: 'Go to Student Login', url: '/student/login' },
      { label: 'Student Dashboard', url: '/student/dashboard' }
    ]
  },
  {
    id: 'student_password',
    intents: ['forgot password', 'reset password', 'credential', 'credentials', 'password request', 'lost password', 'login issue', 'cannot login'],
    title: 'Student Credentials & Password Resolution',
    summary: 'Instant password reset requests and self-serve governance between students and college admins.',
    response: `### 🔑 Student Password Recovery & Governance

Nexify Examina provides a dedicated institutional password recovery protocol:

* **Forgot Password Link**: On the Student Login page, click **"Forgot Password?"** or visit \`/student-password/forgot\`.
* **Submit Request**: Enter your registered **Student ID / Email** and your College Name to submit a verified password reset request.
* **Instant Admin Governance**: Your request immediately alerts your College Administrator in their **Password Requests Dashboard**.
* **Temporary Passwords & Credentials**: College Administrators can reset your password with one click or re-send your official credential email instantly.
* **Admins**: To create students and issue credentials, go to **Admin Dashboard → Students → Add Student / Bulk Upload CSV**.`,
    suggestions: [
      'How to add students via CSV bulk upload?',
      'Contact college administrator',
      'Go to Student Login'
    ],
    actions: [
      { label: 'Student Password Help', url: '/student/password-reset' },
      { label: 'Student Login', url: '/student/login' }
    ]
  },
  {
    id: 'results_and_forensics',
    intents: ['result', 'results', 'score', 'marks', 'grading', 'evaluate', 're-evaluate', 'report', 'audit', 'dossier', 'pdf', 'integrity score'],
    title: 'Forensic Audit Dossiers, Scoring & Re-Evaluation',
    summary: 'Tamper-evident scoring, automated evaluation, and court-admissible audit reports.',
    response: `### 📊 Automated Evaluation & Forensic Audit Dossiers

Nexify Examina provides mathematically accurate grading combined with comprehensive forensic audit records:

* **Automated MCQ & Coding Evaluation**: MCQ answers are scored instantly upon submission with zero human latency. Coding solutions run against unit test suites.
* **Attempt Accuracy**: Tracks exact questions attempted, total questions answered, and score breakdown.
* **Admin Copy Inspection & Re-Evaluation**: Administrators can inspect each candidate's submitted answer sheet question-by-question and manually adjust marks or trigger full re-evaluation.
* **Court-Admissible Forensic Dossier**: Generates downloadable PDF audit reports documenting:
  * Complete timeline of events with millisecond precision
  * Incident snapshots (face off-screen, multiple people, window blur)
  * Integrity Confidence Index (% trust score)
  * Hardware & network telemetry profile throughout the test.`,
    suggestions: [
      'Can instructors re-evaluate a student submission?',
      'Where can admins view the results table?',
      'How does browser kiosk lockdown work?'
    ],
    actions: [
      { label: 'View Admin Results', url: '/admin/results' },
      { label: 'Security & Forensics', url: '/about' }
    ]
  },
  {
    id: 'pricing_plans',
    intents: ['price', 'pricing', 'cost', 'plan', 'plans', 'subscription', 'starter', 'professional', 'enterprise', 'quote', 'buy', 'license'],
    title: 'Institutional Licensing & Custom Proposals',
    summary: 'Custom proposals designed for universities, colleges, and testing boards.',
    response: `### 🏛️ Institutional Licensing & Custom Proposals

Nexify Examina provides dedicated institutional partnerships tailored to your department or university scale:

* **Campus-Wide Deployment**: Unlimited department seats, dedicated compute isolation, and volume-based licensing.
* **Turnkey LMS Integration**: LTI 1.3 single sign-on with Moodle, Canvas, and Blackboard.
* **24/7 Mission Control SLA**: Dedicated technical account manager and exam-day live support.

To request a formal institutional proposal or schedule a faculty walkthrough, please contact our team.`,
    suggestions: [
      'How to schedule an institutional pilot?',
      'How does AI proctoring work?',
      'What are the minimum system requirements?'
    ],
    actions: [
      { label: 'Request Institutional Proposal', url: '/contact' },
      { label: 'Register College', url: '/admin/register' }
    ]
  },
  {
    id: 'tech_requirements',
    intents: ['requirements', 'system requirements', 'browser', 'chrome', 'hardware', 'speed', 'internet', 'bandwidth', 'ram', 'mobile', 'compatibility'],
    title: 'System Requirements & Browser Compatibility',
    summary: '100% web-based. Zero software installations or administrative privileges required.',
    response: `### ⚙️ System Requirements & Platform Compatibility

Because Nexify Examina runs natively in HTML5, WebRTC, and WebAssembly, candidate onboarding takes less than 30 seconds:

* **Supported Browsers**:
  * Google Chrome (v90+) — *Recommended*
  * Microsoft Edge (v90+)
  * Mozilla Firefox (v88+)
  * Apple Safari (v14+)
* **Hardware**:
  * Working webcam (internal 720p or external USB)
  * Built-in or external microphone
  * Dual-core CPU with 4GB RAM minimum (8GB recommended for coding tests)
* **Operating Systems**:
  * Windows 10/11, macOS, Linux, ChromeOS.
* **Network Connectivity**:
  * Minimum 1.5 Mbps upload/download speed (3+ Mbps recommended for live video feeds).
  * Built-in 15-second offline sync buffer withstands temporary Wi-Fi blips without data loss.`,
    suggestions: [
      'Does it work on Chromebooks?',
      'What happens if student Wi-Fi disconnects?',
      'How does AI proctoring work?'
    ],
    actions: [
      { label: 'How It Works Guide', url: '/how-it-works' },
      { label: 'Contact Support', url: '/contact' }
    ]
  },
  {
    id: 'security_compliance',
    intents: ['security', 'privacy', 'gdpr', 'ferpa', 'soc2', 'iso', 'data protection', 'safe', 'encrypt', 'encryption', 'tls'],
    title: 'Security Architecture, Compliance & Data Privacy',
    summary: 'Bank-grade 256-bit encryption, FERPA/GDPR compliance, and student privacy guarantees.',
    response: `### 🔐 Enterprise Security Architecture & Compliance

Nexify Examina is engineered to comply with the strictest global educational and privacy standards:

* **End-to-End Encryption**: All video feeds, audio streams, and test data in transit are encrypted using TLS 1.3 / AES-256.
* **Privacy-First AI**: Face mesh detection runs directly in the client browser memory. Biometric raw facial geometry is **never sold or persisted permanently**.
* **Compliance Standards**:
  * **FERPA**: Strict student educational record privacy protection.
  * **GDPR & CCPA**: Full data sovereignty, right-to-be-forgotten, and minimal telemetry collection.
  * **SOC 2 Type II Certified Datacenters**: Hosted on enterprise AWS and Neon Lakebase Postgres infrastructure.
* **Role-Based Access Control**: Strict segregation between Super Admins, College Admins, and Student personas.`,
    suggestions: [
      'Read security architecture whitepaper',
      'What are the institutional plans?',
      'How to contact support?'
    ],
    actions: [
      { label: 'About Security', url: '/about' },
      { label: 'Contact Compliance Team', url: '/contact' }
    ]
  },
  {
    id: 'lms_integration',
    intents: ['lms', 'moodle', 'canvas', 'blackboard', 'integration', 'lti', 'api', 'sync', 'roster'],
    title: 'Turnkey LMS Integration (Moodle, Canvas, Blackboard)',
    summary: 'Seamless LTI 1.3 integration with automated roster sync and grade passback.',
    response: `### 🔄 LMS Integration & Enterprise Interoperability

Nexify Examina connects directly into your existing academic IT infrastructure:

* **LTI 1.3 Certified**: Single Sign-On (SSO) allows students and faculty to launch Nexify Examina directly from **Moodle**, **Canvas**, **Blackboard Learn**, or **Brightspace D2L**.
* **Automated Roster Synchronization**: One-click class list synchronization imports enrolled students, roll numbers, and emails without manual spreadsheets.
* **Direct Gradebook Passback**: Validated, tamper-proof final grades and forensic integrity scores return automatically into your LMS course gradebook.
* **REST API & Webhooks**: Robust developer APIs for universities wanting custom ERP/SIS connectors.`,
    suggestions: [
      'Contact our solutions architect',
      'What are the Enterprise features?',
      'Explore Platform Features'
    ],
    actions: [
      { label: 'Schedule LMS Integration Call', url: '/contact' },
      { label: 'Explore Features', url: '/features' }
    ]
  },
  {
    id: 'demo_trial',
    intents: ['demo', 'trial', 'test', 'pilot', 'free trial', 'walkthrough', 'preview', 'schedule demo'],
    title: 'Schedule Walkthrough & Free Institutional Pilot',
    summary: 'Experience Nexify Examina live with your faculty team.',
    response: `### 🚀 Experience Nexify Examina: Live Demo & Pilot

We offer immediate ways for your institution to experience the platform:

1. **Self-Service Trial**:
   * Institutions can register immediately at **[Register Institution](/admin/register)** for instant access to the College Admin console.
   * Explore the AI Question Generator, create sample exams, and preview the live monitoring cockpit.
2. **Guided Faculty Walkthrough**:
   * Schedule a 30-minute tailored walkthrough with our solutions engineers.
   * We will demonstrate real-time invigilation, browser kiosk lockdown, and automated coding evaluation.
3. **Student Room Test**:
   * Log in to the student test room to experience candidate anti-cheat safeguards firsthand.`,
    suggestions: [
      'Register College Now',
      'View Pricing Plans',
      'Contact Sales & Support'
    ],
    actions: [
      { label: 'Register Institution', url: '/admin/register' },
      { label: 'Contact Sales', url: '/contact' }
    ]
  },
  {
    id: 'company_leadership',
    intents: ['founder', 'ceo', 'pawan', 'pawan kumar', 'yadav', 'prince', 'suraj', 'shruti', 'sachin', 'vishal', 'team', 'leaders', 'leadership', 'mohali', 'headquarters', 'founded', 'feb 2025', 'institution', 'institutes', 'punjab'],
    title: 'Company Leadership & Mohali Headquarters',
    summary: 'Nexify Examina founded Feb 2025 in Mohali by Founder & CEO Pawan Kumar Yadav and core team.',
    response: `### 🏢 About Nexify Examina — Company & Leadership

* **Founded**: **February 2025**
* **Global Headquarters**: **Mohali, Punjab, India** (Phase 8B / Sector 74, Industrial Area — 160055)
* **Direct Helpline & Founder Office**: **+91 9934290491**
* **Traction**: **10+ Registered Institutions & Partner Colleges** with 50K+ secured exams.

#### 👥 Core Leadership Team:
* **Pawan Kumar Yadav** — Founder & Chief Executive Officer (CEO)
* **Prince** — Co-Founder & Chief Technology Officer (CTO)
* **Suraj** — Chief Operating Officer (COO)
* **Shruti** — Chief Design Officer (CDO) & Head of Product Experience
* **Sachin** — Head of AI & Machine Learning
* **Vishal** — Head of Infrastructure & Security

For institutional partnerships, campus rollouts, or direct meetings with leadership, call **+91 9934290491** or email **support@nexifyforge.in**.`,
    suggestions: [
      'Schedule an Institutional Pilot',
      'Explore Platform Features',
      'Contact Founder Office'
    ],
    actions: [
      { label: 'About Nexify Examina', url: '/about' },
      { label: 'Contact Founder Office', url: '/contact' }
    ]
  },
  {
    id: 'contact_support',
    intents: ['contact', 'email', 'phone', 'support', 'helpdesk', 'office', 'call', 'ticket', 'reach', 'sales', '9934290491', 'helpline', 'number'],
    title: 'Support Desk, Direct Helpline & Office Details',
    summary: 'Direct line +91 9934290491, Mohali HQ, and 24/7 dedicated exam mission control.',
    response: `### 📞 Contact Nexify Examina & Founder Helpline

Our team and headquarters in Mohali, Punjab are ready to assist you:

* **Direct Phone Helpline**: **+91 9934290491** *(Mon–Sat, 9AM–7PM IST · CEO Office: Pawan Kumar Yadav)*
* **Official Support Email**: \`support@nexifyforge.in\`
* **Global Headquarters**: Phase 8B / Sector 74, Industrial Area, **Mohali, Punjab — 160055**
* **Regional Support Hub**: Technology Corridor, Mohali-Chandigarh, Punjab — 160071
* **Traction**: Over 10+ Registered Colleges & Universities across India.
* **Exam-Day Mission Control Desk**: Available 24/7 during scheduled institutional exam windows.
* **Response SLAs**:
  * Urgent exam-day live issues: **Sub-5 minute response**
  * Institutional onboarding & LMS sync: **Under 12 hours**`,
    suggestions: [
      'Meet the Leadership Team',
      'Schedule a Campus Pilot',
      'Explore Platform Features'
    ],
    actions: [
      { label: 'Open Contact Form', url: '/contact' },
      { label: 'About Leadership', url: '/about' }
    ]
  }
];

// Helper: match intent
function findBestKnowledgeMatch(userMessage) {
  const query = (userMessage || '').toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const item of knowledgeBase) {
    let score = 0;
    for (const kw of item.intents) {
      if (query.includes(kw)) {
        // Boost longer matches
        score += kw.length > 5 ? 3 : 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Threshold
  if (highestScore >= 3) {
    return { match: bestMatch, score: highestScore };
  }
  return { match: null, score: 0 };
}

// In-memory conversation sessions (auto-pruned)
const sessions = new Map();
const MAX_SESSIONS = 5000;

function getOrCreateSession(sessionId) {
  const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  if (!sessions.has(id)) {
    if (sessions.size > MAX_SESSIONS) {
      const oldestKey = sessions.keys().next().value;
      sessions.delete(oldestKey);
    }
    sessions.set(id, {
      id,
      createdAt: new Date(),
      history: [],
      lastActive: new Date()
    });
  }
  const session = sessions.get(id);
  session.lastActive = new Date();
  return session;
}

// Main Chat Handler
exports.handleChatMessage = async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid message string is required.'
      });
    }

    const cleanMessage = message.trim();
    const session = getOrCreateSession(sessionId);

    // Save user message to session history
    session.history.push({
      role: 'user',
      content: cleanMessage,
      timestamp: new Date().toISOString()
    });

    const lower = cleanMessage.toLowerCase();

    // Check greetings
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|hola|namaste)\b/i.test(lower)) {
      const greetingResponse = {
        success: true,
        response: `Hello! 👋 Welcome to **Nexify Examina**. I am your dedicated AI Academic & Technical Assistant.\n\nI can assist you with:\n* **AI Proctoring & Anti-Cheat Controls** (Face mesh, audio analytics, kiosk lockdown)\n* **Student Exam Room & Login Assistance** (Camera check, timers, question navigation)\n* **College Admin Console** (Scheduling exams, student management, live cockpit)\n* **Online Coding Assessments** (Languages, test cases, sandboxed execution)\n* **Campus Governance & Security Architecture**\n\nHow can I help you today?`,
        confidence: 0.95,
        intent: 'greeting',
        suggestions: [
          'How does AI proctoring work?',
          'How does browser kiosk lockdown work?',
          'How do students log in for an exam?',
          'Can instructors monitor exams live?'
        ],
        actions: [
          { label: 'Register College', url: '/admin/register' },
          { label: 'Student Login', url: '/student/login' }
        ]
      };

      session.history.push({
        role: 'bot',
        content: greetingResponse.response,
        timestamp: new Date().toISOString()
      });

      return res.json(greetingResponse);
    }

    // Check gratitude / goodbye
    if (/^(thanks|thank you|thx|appreciate it|awesome|great job|perfect|bye|goodbye|see you)\b/i.test(lower)) {
      const thanksResponse = {
        success: true,
        response: `You're very welcome! 😊 It was a pleasure assisting you. If you or your institution have any more questions about Nexify Examina, I'm always right here.\n\nBest of luck with your examinations! 🎓`,
        confidence: 0.95,
        intent: 'gratitude',
        suggestions: [
          'View platform pricing',
          'Explore proctoring features',
          'Contact mission control'
        ],
        actions: [
          { label: 'Take a Tour', url: '/how-it-works' }
        ]
      };

      session.history.push({
        role: 'bot',
        content: thanksResponse.response,
        timestamp: new Date().toISOString()
      });

      return res.json(thanksResponse);
    }

    // Match Knowledge Base
    const { match, score } = findBestKnowledgeMatch(cleanMessage);

    if (match) {
      const responsePayload = {
        success: true,
        response: match.response,
        confidence: Math.min(0.98, 0.75 + (score * 0.05)),
        intent: match.id,
        suggestions: match.suggestions,
        actions: match.actions
      };

      session.history.push({
        role: 'bot',
        content: match.response,
        intent: match.id,
        timestamp: new Date().toISOString()
      });

      return res.json(responsePayload);
    }

    // Contextual fallback response
    const fallbackResponse = {
      success: true,
      response: `I want to make sure I get you the exact information you need regarding **Nexify Examina**.\n\nCould you specify which of these key areas you are inquiring about?\n\n* **Live AI Proctoring**: Face tracking, background whisper detection, browser kiosk lockdown.\n* **Student Help**: Accessing the student room, webcam permission, forgot passwords.\n* **College Admin & Faculty**: Creating exams, adding students via CSV, monitoring live radar.\n* **Pricing & Institutional Pilots**: Starter/Pro/Enterprise plans and custom quotes.\n* **Technical Support**: Browser compatibility and minimum bandwidth.\n\nOr click one of the quick topics below to get instant answers!`,
      confidence: 0.65,
      intent: 'clarification',
      suggestions: [
        'How does AI proctoring work?',
        'How does browser kiosk lockdown work?',
        'Student exam instructions',
        'How to contact support?'
      ],
      actions: [
        { label: 'View How It Works', url: '/how-it-works' },
        { label: 'Contact Support', url: '/contact' }
      ]
    };

    session.history.push({
      role: 'bot',
      content: fallbackResponse.response,
      timestamp: new Date().toISOString()
    });

    return res.json(fallbackResponse);

  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal chatbot engine error',
      error: error.message
    });
  }
};

// Init session
exports.initSession = async (req, res) => {
  try {
    const { userInfo } = req.body;
    const session = getOrCreateSession();

    return res.json({
      success: true,
      sessionId: session.id,
      welcomeMessage: 'Hello! 👋 I am your CollegeExam Assistant. How can I help you today?',
      suggestions: [
        'How does the AI monitoring work?',
        'How does browser kiosk lockdown work?',
        'How do students take an exam?',
        'Can I schedule a live demo?'
      ],
      actions: [
        { label: 'Explore Features', url: '/features' },
        { label: 'Student Login', url: '/student/login' }
      ]
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Check chatbot health
exports.getStatus = async (req, res) => {
  return res.json({
    success: true,
    online: true,
    engine: 'Nexify Examina Neural NLP Engine v2.4',
    timestamp: new Date().toISOString()
  });
};

// Get dynamic suggested questions
exports.getSuggestions = async (req, res) => {
  const { topic } = req.query;
  const match = knowledgeBase.find(k => k.id === topic);

  if (match) {
    return res.json({
      success: true,
      suggestions: match.suggestions,
      actions: match.actions
    });
  }

  return res.json({
    success: true,
    suggestions: [
      'How does the AI monitoring work?',
      'How does browser kiosk lockdown work?',
      'How do students log in for an exam?',
      'Can instructors whisper to students live?'
    ],
    actions: [
      { label: 'Explore Features', url: '/features' },
      { label: 'Register College', url: '/admin/register' }
    ]
  });
};
