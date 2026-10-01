// frontend/src/services/chatBotService.js
// Enterprise-Grade ChatBot Client Service with Hybrid Network + Local Knowledge Fallback

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'
    : 'https://examshield-3-wydj.onrender.com/api';
};

class ChatBotService {
  constructor() {
    this.apiEndpoint = `${getApiBaseUrl()}/chatbot`;
    this.sessionId = this.getOrInitSessionId();
    this.conversationHistory = [];
  }

  getOrInitSessionId() {
    try {
      let stored = sessionStorage.getItem('examshield_chat_session_id');
      if (!stored) {
        stored = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('examshield_chat_session_id', stored);
      }
      return stored;
    } catch (e) {
      return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  async checkStatus() {
    try {
      const res = await fetch(`${this.apiEndpoint}/status`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
    } catch (e) {
      // Return local ready
    }
    return { online: true, engine: 'Client Hybrid NLP Engine' };
  }

  async sendMessage(messageText, context = {}) {
    const trimmed = (messageText || '').trim();
    if (!trimmed) return null;

    // Record user history
    this.conversationHistory.push({
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`${this.apiEndpoint}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: this.sessionId,
          context: {
            ...context,
            url: window.location.pathname,
            history: this.conversationHistory.slice(-6)
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        this.conversationHistory.push({
          role: 'bot',
          content: data.response,
          timestamp: new Date().toISOString()
        });
        return {
          response: data.response,
          confidence: data.confidence || 0.9,
          intent: data.intent || 'general',
          suggestions: data.suggestions || [],
          actions: data.actions || []
        };
      }
    } catch (err) {
      console.warn('Backend chatbot API unreachable, using resilient client NLP engine:', err.message);
    }

    // High-fidelity client NLP fallback
    const localResult = this.generateLocalFallback(trimmed);
    this.conversationHistory.push({
      role: 'bot',
      content: localResult.response,
      timestamp: new Date().toISOString()
    });
    return localResult;
  }

  generateLocalFallback(input) {
    const q = input.toLowerCase();

    if (q.includes('founder') || q.includes('ceo') || q.includes('pawan') || q.includes('mohali') || q.includes('team') || q.includes('prince') || q.includes('suraj') || q.includes('shruti') || q.includes('sachin') || q.includes('vishal') || q.includes('location') || q.includes('office') || q.includes('phone') || q.includes('9934290491') || q.includes('address') || q.includes('headquarters') || q.includes('call') || q.includes('contact number')) {
      return {
        response: `### 🏢 About ExamShield — Company & Leadership\n\n* **Founded**: **February 2025**\n* **Global Headquarters**: **Mohali, Punjab, India** (Phase 8B / Sector 74, Industrial Area — 160055)\n* **Direct Helpline**: **+91 9934290491**\n* **Traction**: **10+ Registered Institutions & Partner Colleges** with 50K+ secured exams.\n\n#### 👥 Core Leadership Team:\n* **Pawan Kumar Yadav** — Founder & Chief Executive Officer (CEO)\n* **Prince** — Co-Founder & Chief Technology Officer (CTO)\n* **Suraj** — Chief Operating Officer (COO)\n* **Shruti** — Chief Design Officer (CDO) & Head of Product Experience\n* **Sachin** — Head of AI & Machine Learning\n* **Vishal** — Head of Infrastructure & Security\n\nFor institutional inquiries, campus pilots, or direct founder meetings, call **+91 9934290491** or email **support@examshield.com**.`,
        confidence: 0.99,
        intent: 'company_info',
        suggestions: [
          'Schedule an Institutional Pilot',
          'Explore Platform Features',
          'How does AI proctoring work?'
        ],
        actions: [
          { label: 'About ExamShield', url: '/about' },
          { label: 'Contact Founder Office', url: '/contact' }
        ]
      };
    }

    if (/^(hi|hello|hey|greetings|hola)\b/i.test(q)) {
      return {
        response: `Hello! 👋 Welcome to **ExamShield**. I'm your dedicated AI Academic & Technical Assistant.\n\nI can assist you with:\n* **AI Proctoring & Anti-Cheat Controls** (Face mesh, audio analytics, kiosk lockdown)\n* **Student Exam Room & Login Assistance** (Camera check, timers, question navigation)\n* **College Admin Console** (Scheduling exams, student management, live cockpit)\n* **Online Coding Assessments** (Languages, test cases, sandboxed execution)\n* **Institutional Pricing & Licensing**\n\nHow can I help you today?`,
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
    }

    if (q.includes('proctor') || q.includes('cheat') || q.includes('camera') || q.includes('face') || q.includes('gaze') || q.includes('biometric')) {
      return {
        response: `### 🛡️ Autonomous AI Proctoring & Biometric Engine\n\nExamShield delivers continuous, non-invasive assessment surveillance running **100% in-browser** via WebRTC and HTML5 Canvas:\n\n* **Biometric Face Mesh**: Maps 468 3D facial landmarks at 30 fps to ensure continuous candidate identity verification.\n* **Absence & Multi-Person Alerts**: Flags when a candidate leaves the camera frame or when unauthorized secondary individuals appear.\n* **Gaze & Head Pose Tracking**: Detects abnormal, persistent looking away from the screen.\n* **Acoustic Whisper Filter**: Web Audio API analyzes ambient microphone frequencies to detect whispering and dictation.\n* **Automated Violation Logs**: Every event is captured with a high-resolution snapshot, millisecond timestamp, and severity rating.`,
        confidence: 0.98,
        intent: 'proctoring',
        suggestions: [
          'How does browser kiosk lockdown work?',
          'Can it detect secondary monitors?',
          'What are the minimum system requirements?'
        ],
        actions: [
          { label: 'Explore Features', url: '/features' },
          { label: 'View How It Works', url: '/how-it-works' }
        ]
      };
    }

    if (q.includes('lockdown') || q.includes('kiosk') || q.includes('tab') || q.includes('fullscreen') || q.includes('alt tab') || q.includes('monitor')) {
      return {
        response: `### 🔒 Browser Kiosk Lockdown & Sandbox\n\nExamShield transforms any standard modern browser into a secure test kiosk without requiring kernel-level drivers:\n\n* **Fullscreen Enforcement**: Candidates must maintain fullscreen mode throughout the test.\n* **Tab & Window Interception**: Detects tab-switching, app switching, window blur, and secondary application launches.\n* **Keystroke & Shortcut Blocking**: Intercepts \`Alt+Tab\`, \`Windows key\`, \`Cmd+Tab\`, \`Ctrl+C / Ctrl+V\`, and \`PrtScn\`.\n* **Multi-Display & Splitter Detection**: Queries display profile APIs to detect secondary monitors, HDMI splitters, and virtual machines.`,
        confidence: 0.96,
        intent: 'lockdown',
        suggestions: [
          'What are the minimum system requirements?',
          'Can students take coding tests?',
          'How does the Live Cockpit work?'
        ],
        actions: [
          { label: 'How It Works Guide', url: '/how-it-works' }
        ]
      };
    }

    if (q.includes('price') || q.includes('pricing') || q.includes('cost') || q.includes('plan') || q.includes('subscription')) {
      return {
        response: `### 🏛️ Institutional Licensing & Custom Quotes\n\nExamShield provides custom institutional licensing tailored to your campus or testing board's scale:\n\n* **Academic & State Boards**: Unlimited department seats, dedicated Neon/AWS compute isolation, and volume-based licensing.\n* **Turnkey LMS Integration**: LTI 1.3 single sign-on with Moodle, Canvas, and Blackboard.\n* **24/7 Mission Control SLA**: Dedicated technical account manager and exam-day live support.\n\nTo request a tailored institutional proposal or schedule a faculty pilot, please contact our solutions team.`,
        confidence: 0.95,
        intent: 'institutional_licensing',
        suggestions: [
          'How to schedule an institutional pilot?',
          'How does AI proctoring work?',
          'What are the minimum system requirements?'
        ],
        actions: [
          { label: 'Request Institutional Proposal', url: '/contact' },
          { label: 'Register College', url: '/admin/register' }
        ]
      };
    }

    if (q.includes('code') || q.includes('coding') || q.includes('compiler') || q.includes('python') || q.includes('java') || q.includes('programming')) {
      return {
        response: `### 💻 Integrated Online Coding Assessment Platform\n\n* **20+ Languages**: Python, Java, C++, C, JavaScript, TypeScript, Go, Rust, C#, and PHP.\n* **Monaco Code Editor**: Professional VS Code editing experience with syntax highlighting.\n* **Real-time Compilation**: Sandboxed backend execution with isolated memory and execution limits.\n* **Visible & Hidden Test Cases**: Test public sample cases with explanations and secret edge-case test suites for automated grading.\n* **Clipboard Protection**: Blocks external copy-pasting and monitors typing velocity against AI code generators.`,
        confidence: 0.96,
        intent: 'coding',
        suggestions: [
          'How are coding questions auto-graded?',
          'What are the pricing plans?',
          'Try Student Login'
        ],
        actions: [
          { label: 'Explore Features', url: '/features' },
          { label: 'Student Login', url: '/student/login' }
        ]
      };
    }

    if (q.includes('student') || q.includes('login') || q.includes('exam key') || q.includes('instructions')) {
      return {
        response: `### 🎓 Student Exam Experience & Instructions\n\n1. **Sign In**: Navigate to \`/student/login\` using your **Student ID / Email** and **Password** provided by your college.\n2. **Select Exam**: Enter the unique **Exam Key** if prompted.\n3. **Hardware Readiness**: Allow browser permissions for **Webcam** and **Microphone**.\n4. **Exam Room**: Answer questions using the interactive palette. Answers are continuously auto-saved.\n5. **Submission**: Click **Submit Exam** or allow timer auto-submit. Your result and score breakdown will be generated immediately.`,
        confidence: 0.94,
        intent: 'student',
        suggestions: [
          'Forgot student password?',
          'What are the minimum system requirements?',
          'How does AI proctoring work?'
        ],
        actions: [
          { label: 'Go to Student Login', url: '/student/login' },
          { label: 'Student Password Help', url: '/student/password-reset' }
        ]
      };
    }

    return {
      response: `I'm here to help with any aspect of **ExamShield**:\n\n* **Live AI Proctoring**: Face tracking, whisper detection, browser kiosk lockdown.\n* **Student Support**: Accessing exams, hardware readiness, password resets.\n* **College Admin & Faculty**: Creating exams, bulk CSV student upload, live invigilator cockpit.\n* **Pricing & Institutional Pilots**: Starter/Pro/Enterprise plans and custom quotes.\n* **Technical Requirements**: Supported browsers and minimum network speeds.\n\nClick any topic below or type your question!`,
      confidence: 0.7,
      intent: 'general',
      suggestions: [
        'How does AI proctoring work?',
        'What are the pricing plans?',
        'How do students take an exam?',
        'How to contact support?'
      ],
      actions: [
        { label: 'View How It Works', url: '/how-it-works' },
        { label: 'Contact Support', url: '/contact' }
      ]
    };
  }

  clearHistory() {
    this.conversationHistory = [];
    try {
      sessionStorage.removeItem('examshield_chat_session_id');
      this.sessionId = this.getOrInitSessionId();
    } catch (e) {}
  }

  exportHistory() {
    const lines = [
      `# ExamShield Academic Assistant - Conversation Transcript`,
      `Session ID: ${this.sessionId}`,
      `Exported: ${new Date().toLocaleString()}`,
      `-------------------------------------------------------`,
      ''
    ];
    this.conversationHistory.forEach((msg, idx) => {
      lines.push(`[${msg.role === 'user' ? 'Candidate/User' : 'ExamShield Assistant'}] ${msg.timestamp}`);
      lines.push(msg.content);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExamShield-Chat-Transcript-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

const chatBotService = new ChatBotService();
export default chatBotService;
