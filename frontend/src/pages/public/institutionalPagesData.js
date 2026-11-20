// frontend/src/pages/public/institutionalPagesData.js

export const institutionalPages = {
  'online-examination-software': {
    slug: 'online-examination-software',
    seoTitle: 'Online Examination Software in India — AI Proctoring & CBT Platform',
    metaDesc: 'India\'s top enterprise online examination software for colleges, schools, and universities. Zero installation, 2,000+ concurrent students, coding compiler, and AI proctoring.',
    keywords: 'online examination software in India, best online exam software, computer based test software India, CBT platform, university examination management software, secure exam platform, anti cheating exam software',
    badge: 'National Online Examination Platform',
    h1: 'Enterprise Online Examination Software for Indian Educational Institutions',
    subtitle: 'Conduct high-stakes semester, entrance, and recruitment examinations with continuous biometric verification, browser kiosk lockdown, and high-concurrency 2,000+ student stability.',
    targetAudience: 'Colleges, Universities, Examination Boards & Schools across India',
    metrics: [
      { label: 'Concurrent Capacity', value: '2,000+', desc: 'Load-tested simultaneous test takers' },
      { label: 'Installation Required', value: 'Zero', desc: '100% Web browser-native execution' },
      { label: 'Cheating Detection', value: '6 Layers', desc: 'Face, gaze, sound, and screen tracking' },
      { label: 'Evaluation Speed', value: 'Instant', desc: 'Automated MCQ & coding test evaluation' },
    ],
    features: [
      {
        title: 'Full Computer-Based Testing (CBT) Suite',
        desc: 'Support for multiple-choice questions (MCQs), multi-select, subjective answers, and live programming challenges with automated grading.'
      },
      {
        title: 'Zero-Download Browser Kiosk Lockdown',
        desc: 'Students take exams directly inside Google Chrome, Microsoft Edge, or Safari without installing invasive desktop software or system extensions.'
      },
      {
        title: 'High-Concurrency Cluster Architecture',
        desc: 'Powered by an active 16-node load-balanced cluster and Redis auto-save buffers, preventing website freezing or slow response times during peak exams.'
      },
      {
        title: 'Court-Admissible Audit Dossiers',
        desc: 'Every session records timestamped tab-switch logs, webcam biometric snapshots, and connection events into immutable compliance records.'
      }
    ],
    useCases: [
      { title: 'College & University Semester Exams', desc: 'Conduct internal term tests and end-of-semester examinations across hundreds of departments without paper printing or server slowdowns.' },
      { title: 'Campus Placement & Recruitment Tests', desc: 'Screen thousands of engineering and degree students with combined aptitude MCQs and programming challenges.' },
      { title: 'Certification & Entrance Examinations', desc: 'Administer high-stakes entrance exams with continuous biometric monitoring and automated percentile scorecards.' }
    ],
    faqs: [
      {
        q: 'What makes Nexify Examina the best online examination software in India?',
        a: 'Nexify Examina combines zero-install browser security, multi-language coding compiler sandboxes, and an active 16-node server cluster proven to host 2,000+ concurrent students without lag, freezing, or data loss.'
      },
      {
        q: 'Can students take examinations on low-bandwidth connections?',
        a: 'Yes. Nexify Examina features an intelligent offline auto-save buffer. If a student experiences a temporary network drop, their answers remain cached in local memory and automatically synchronize the moment connectivity resumes.'
      },
      {
        q: 'How does Nexify Examina prevent students from switching tabs or using search engines?',
        a: 'The platform enforces full-screen kiosk lockdown, intercepts window blur events, blocks key combinations (Alt+Tab, Ctrl+C, Ctrl+V, PrintScreen), and triggers automated warnings or exam termination upon repeated violations.'
      },
      {
        q: 'Is technical training required for college faculties and invigilators?',
        a: 'No. The College Admin portal features an intuitive AI Question Generator, simple Excel/CSV student roster uploads, and a one-click Live Invigilation Command Center.'
      }
    ]
  },

  'college-examination-software': {
    slug: 'college-examination-software',
    seoTitle: 'College Examination Software in India — AI Proctoring & Coding Tests',
    metaDesc: 'Comprehensive college examination software for degree and engineering colleges in India. Semester exams, campus placement coding tests, and NAAC-compliant audit logs.',
    keywords: 'college examination software India, online exam platform for colleges, engineering college coding exam platform, college internal test software, autonomous college exam software, NAAC exam audit records',
    badge: 'Higher Education & Autonomous Colleges',
    h1: 'Secure College Examination Software for Degree & Engineering Colleges',
    subtitle: 'Streamline mid-term internal tests, end-semester examinations, and placement coding assessments across all academic departments with automated grading and live proctoring.',
    targetAudience: 'Engineering Colleges, Degree Colleges & Autonomous Higher Education Institutions',
    metrics: [
      { label: 'Department Coverage', value: '100%', desc: 'Engineering, Science, Arts & Commerce' },
      { label: 'Coding Support', value: 'Python, C++, Java', desc: 'Sandboxed code execution compiler' },
      { label: 'Roster Ingestion', value: '1-Click', desc: 'Excel / CSV bulk student enrollment' },
      { label: 'Audit Trail', value: 'NAAC Ready', desc: 'Tamper-proof academic dossiers' },
    ],
    features: [
      {
        title: 'Integrated Coding Exam Compiler',
        desc: 'Engineered specifically for computer science and IT departments. Evaluate students on Python, Java, C++, and JavaScript with hidden test cases and memory/time limit checks.'
      },
      {
        title: 'Multi-Department Roster Management',
        desc: 'Effortlessly organize students by department (AIML, CSE, ECE, Mechanical, Commerce), semester, and academic batch with automated roll-number mapping.'
      },
      {
        title: 'Live Invigilation Command Center',
        desc: 'Invigilators monitor hundreds of active exam candidates simultaneously on a unified radar screen with real-time anomaly alerts for face anomalies or tab switching.'
      },
      {
        title: 'Automated Grade & Scorecard Publishing',
        desc: 'Generate individual student transcripts, section-wise performance breakdowns, and export official merit lists to Excel with one click.'
      }
    ],
    useCases: [
      { title: 'End-Semester Theory & Practical Exams', desc: 'Conduct major semester examinations with strict time synchronizations, automatic submissions, and full audit logs.' },
      { title: 'Coding Lab Practical Examinations', desc: 'Replace physical computer lab practicals with secure browser-locked programming tests and automated test-case evaluation.' },
      { title: 'Campus Placement Mock Drives', desc: 'Prepare graduating batches with TCS, Infosys, and Cognizant pattern aptitude and coding assessment simulations.' }
    ],
    faqs: [
      {
        q: 'How does Nexify Examina handle college campus placement coding tests?',
        a: 'The platform includes a built-in isolated sandbox supporting Python, Java, C++, and JavaScript. Code is compiled against predefined public and hidden test cases with execution time limits and syntax error feedback.'
      },
      {
        q: 'Can department heads and faculty members create exams independently?',
        a: 'Yes. College administrators can create exams, import question banks from Excel or use the built-in AI Question Generator, assign exams to specific departments and batches, and schedule exam windows.'
      },
      {
        q: 'Does it support NAAC and NBA accreditation compliance?',
        a: 'Yes. All exam results, invigilation audit trails, student attendance records, and question-level performance statistics are permanently preserved and exportable for accreditation audits.'
      }
    ]
  },

  'university-examination-software': {
    slug: 'university-examination-software',
    seoTitle: 'University Examination Management Software — Scalable for 2,000+ Students',
    metaDesc: 'Enterprise university examination management software built for large-scale multi-college universities. High-concurrency 2,000+ student cluster, role-based governance, and AI invigilation.',
    keywords: 'university examination management software, large scale online exam platform, state university exam software, deemed university online exam system, university examination controller software, multi-tenant university exam portal',
    badge: 'Central & State Universities',
    h1: 'Large-Scale University Examination Management System',
    subtitle: 'Built on a distributed 16-node microservices architecture designed to withstand simultaneous examinations for 2,000+ concurrent students across affiliated colleges without downtime.',
    targetAudience: 'State Universities, Central Universities, Deemed Universities & Private Institutions',
    metrics: [
      { label: 'Cluster Architecture', value: '16 Nodes', desc: 'Least-connection balanced cluster' },
      { label: 'Database Scalability', value: 'PostgreSQL 18', desc: 'Dedicated unpooled & pooled connections' },
      { label: 'Data Integrity', value: 'Zero Loss', desc: 'Instant multi-layer answer auto-save' },
      { label: 'SLA Guarantee', value: '99.98%', desc: 'High availability during examination sessions' },
    ],
    features: [
      {
        title: 'Multi-Tenant College Architecture',
        desc: 'Govern hundreds of constituent and affiliated colleges under one centralized University Super Admin portal with separate department spaces and roll lists.'
      },
      {
        title: 'Dynamic Question Randomization & Shuffling',
        desc: 'Eliminate student answer copying by automatically randomizing question sequence and multiple-choice options uniquely for every enrolled student.'
      },
      {
        title: 'Robust Anti-Cheating Surveillance',
        desc: 'Enforce continuous facial presence monitoring, secondary screen prevention, and background speech anomaly detection with instant proctor alerts.'
      },
      {
        title: 'Institutional Grade Ledger & Analytics',
        desc: 'Comprehensive grade book analytics, percentile distribution curves, and university-wide performance reports accessible to the Controller of Examinations.'
      }
    ],
    useCases: [
      { title: 'Statewide University Final Exams', desc: 'Administer final semester exams across 50+ affiliated campuses simultaneously without server crashes or bottleneck delays.' },
      { title: 'Common University Entrance Tests', desc: 'Deliver secure entrance assessments for postgraduate and undergraduate admissions with verified identity proctoring.' },
      { title: 'Distance Learning & Online Degree Programs', desc: 'Deliver compliant remote examinations for distance education students with verified biometric identity audit trails.' }
    ],
    faqs: [
      {
        q: 'Can the platform reliably support 2,000+ students taking exams at the exact same second?',
        a: 'Yes. Nexify Examina has undergone rigorous load testing with 2,000 concurrent students performing simultaneous logins, answering questions, running coding compilers, and submitting final papers without lag or server timeouts.'
      },
      {
        q: 'How does Nexify Examina prevent answer loss if a student\'s computer crashes or loses power?',
        a: 'Every answer is instantly saved to Redis memory buffers and written to persistent PostgreSQL storage. If a device restarts, the student logs back in and resumes from the exact question and remaining time without losing a single answer.'
      },
      {
        q: 'Can university administrators inspect proctoring evidence before approving results?',
        a: 'Yes. The evaluation dashboard provides a complete forensic dossier for every candidate, displaying recorded tab switches, face anomalies, and timestamped events alongside exam answers.'
      }
    ]
  },

  'school-examination-software': {
    slug: 'school-examination-software',
    seoTitle: 'School Examination Software in India — CBSE, ICSE & State Board Exams',
    metaDesc: 'Easy-to-use school examination software for CBSE, ICSE, and state board schools. Conduct unit tests, term exams, and Olympiads with browser lockdown and auto-grading.',
    keywords: 'school examination software India, online exam platform for schools, CBSE online test software, ICSE school exam portal, K-12 online examination system, school periodic assessment software',
    badge: 'K-12 Schools & Educational Trusts',
    h1: 'Simplified Online Examination Software for K-12 Schools',
    subtitle: 'Empower teachers to create engaging unit tests, periodic assessments, and term examinations with automated grading, student progress tracking, and zero technical complexity.',
    targetAudience: 'CBSE, ICSE, International, and State Board Schools across India',
    metrics: [
      { label: 'Setup Time', value: '< 5 Mins', desc: 'Instant exam creation with AI generator' },
      { label: 'Ease of Use', value: '100%', desc: 'No student app download required' },
      { label: 'Evaluation', value: 'Automatic', desc: 'Instant report cards and answer keys' },
      { label: 'Parent Confidence', value: 'High', desc: 'Transparent anti-cheating audit' },
    ],
    features: [
      {
        title: 'AI Question Generator from Syllabus',
        desc: 'Teachers simply type the subject, topic (e.g. Class 10 Science - Chemical Reactions), and difficulty level to generate complete question papers with answer keys in seconds.'
      },
      {
        title: 'Child-Friendly Browser Interface',
        desc: 'Clean, distraction-free examination screen designed so young students can navigate questions, review flagged answers, and submit with zero confusion.'
      },
      {
        title: 'Automated Grading & Instant Report Cards',
        desc: 'Eliminate hundreds of hours of manual paper correction. Objective tests are graded instantly, delivering class-wide performance analytics to principals and teachers.'
      },
      {
        title: 'Simple Student Onboarding',
        desc: 'Students log in with their assigned Roll Number or Student ID and a secure password — eliminating complicated software configurations.'
      }
    ],
    useCases: [
      { title: 'Periodic Unit Assessments & Term Tests', desc: 'Conduct weekly or monthly chapter assessments to monitor student understanding and learning outcomes.' },
      { title: 'Inter-School Quizzes & Olympiads', desc: 'Host school-wide or regional science, mathematics, and general knowledge competitions with live leaderboards.' },
      { title: 'Board Exam Preparation & Mock Tests', desc: 'Prepare Class 10 and Class 12 students with simulated board examination environments and timed practice papers.' }
    ],
    faqs: [
      {
        q: 'Do school students need to download any special software or apps?',
        a: 'No. Students can take exams on any desktop computer, laptop, Chromebook, or tablet using Google Chrome, Microsoft Edge, or Safari with zero installations.'
      },
      {
        q: 'Can teachers add mathematical equations, diagrams, and images to questions?',
        a: 'Yes. The exam creator supports rich text, images, diagrams, multiple choice options, and descriptive questions.'
      },
      {
        q: 'How does it help teachers save time on grading?',
        a: 'All objective questions are evaluated automatically upon exam submission. Teachers receive complete class performance scorecards, individual student marks, and answer key breakdowns immediately.'
      }
    ]
  },

  'coaching-institute-examination-software': {
    slug: 'coaching-institute-examination-software',
    seoTitle: 'Coaching Institute Examination Software — JEE, NEET & Competitive Mock Tests',
    metaDesc: 'High-performance examination software for coaching institutes in India. Deliver JEE Main, NEET, GATE, and SSC mock tests with instant percentile rankings and negative marking.',
    keywords: 'coaching institute examination software, JEE mock test platform, NEET online test software, competitive exam coaching portal, test series software for institutes, negative marking exam software India',
    badge: 'Coaching Academies & Test Series Centers',
    h1: 'High-Performance Test Series Platform for Coaching Institutes',
    subtitle: 'Deliver authentic NTA-style online mock examinations with negative marking, section timers, question palettes, and instant all-India percentile rankings for your students.',
    targetAudience: 'JEE, NEET, CUET, Banking, SSC, and UPSC Coaching Institutes',
    metrics: [
      { label: 'Exam Formats', value: 'NTA Style', desc: 'Exact JEE & NEET test layout' },
      { label: 'Marking Engine', value: '+4 / -1', desc: 'Configurable positive & negative scores' },
      { label: 'Rankings', value: 'Instant', desc: 'Batch and overall percentile scores' },
      { label: 'Scalability', value: 'High Load', desc: 'Supports simultaneous Sunday mega-tests' },
    ],
    features: [
      {
        title: 'Authentic NTA-Style Question Palette',
        desc: 'Familiar exam room interface with marked for review, answered, unanswered, and not visited status buttons matching national competitive exams.'
      },
      {
        title: 'Advanced Negative Marking & Section Timers',
        desc: 'Configure flexible scoring rules (+4, -1, 0), section-wise time locks (Physics, Chemistry, Maths), and sectional cutoffs.'
      },
      {
        title: 'Instant All-Batch Percentile & Rank Lists',
        desc: 'Generate immediate batch ranks, accuracy percentages, time spent per question, and comparative student analytics.'
      },
      {
        title: 'Comprehensive Question Bank Storage',
        desc: 'Store thousands of questions tagged by subject, chapter, topic, and difficulty level for rapid test assembly.'
      }
    ],
    useCases: [
      { title: 'Weekly & Monthly Mock Test Series', desc: 'Conduct high-stakes Sunday test series across multiple center branches simultaneously with real-time rank lists.' },
      { title: 'Topic-Wise Practice Tests', desc: 'Assign targeted practice tests after completing specific chapters to reinforce concept mastery.' },
      { title: 'Scholarship & Admission Entrance Tests', desc: 'Screen prospective coaching students with secure scholarship tests featuring AI biometric cheating prevention.' }
    ],
    faqs: [
      {
        q: 'Does Nexify Examina support negative marking for competitive exams?',
        a: 'Yes. Administrators can configure custom positive marks, negative penalty marks for incorrect answers, and zero marks for unattempted questions.'
      },
      {
        q: 'Can coaching institutes conduct tests across multiple city branches simultaneously?',
        a: 'Yes. Nexify Examina is cloud-hosted and auto-scaling, allowing students from Delhi, Kota, Hyderabad, Patna, and other branches to take the same mock test simultaneously.'
      },
      {
        q: 'Can students review detailed solution explanations after the exam closes?',
        a: 'Yes. Once results are published by the administrator, students can view their question-by-question analysis, time spent, correct answer keys, and explanations.'
      }
    ]
  },

  'ai-proctoring-software': {
    slug: 'ai-proctoring-software',
    seoTitle: 'AI Proctoring Software in India — Facial Biometrics & Kiosk Lockdown',
    metaDesc: 'Enterprise AI proctoring software for cheat-proof online examinations. Neural facial verification, gaze tracking, browser kiosk lockdown, and court-admissible audit reports.',
    keywords: 'AI proctoring software India, online exam proctoring system, facial biometric exam verification, automated online invigilation, browser lockdown kiosk, anti-cheating exam technology, remote exam monitoring software',
    badge: 'Enterprise AI Exam Security',
    h1: 'AI-Powered Proctoring & Automated Online Invigilation Platform',
    subtitle: 'Protect institutional examination integrity with 6 layers of continuous AI surveillance: biometric facial match, gaze tracking, browser kiosk lockdown, and forensic incident auditing.',
    targetAudience: 'Universities, Examination Controllers, Certification Authorities & Colleges',
    metrics: [
      { label: 'Facial Verification', value: 'Real-Time', desc: 'Neural biometric identity checks' },
      { label: 'Anomalies Detected', value: '6 Types', desc: 'Face loss, multiple faces, blur, audio' },
      { label: 'Browser Lockdown', value: '100%', desc: 'Blocks Alt+Tab, copy-paste, devtools' },
      { label: 'Evidence Logs', value: 'Timestamped', desc: 'Forensic audit snapshots & reports' },
    ],
    features: [
      {
        title: 'Continuous Biometric Face Presence Check',
        desc: 'The webcam neural detector confirms the student\'s presence throughout the exam, flagging multiple faces, missing face, or impersonation attempts instantly.'
      },
      {
        title: 'Strict Browser Kiosk Lockdown',
        desc: 'Forces full-screen mode, prevents switching to external tabs or applications, and blocks inspect element, print screen, and clipboard shortcuts.'
      },
      {
        title: 'Live Invigilation Command Center',
        desc: 'Faculties and proctors view real-time student webcam feeds on a multi-tile monitoring grid, receiving immediate red alerts for suspicious behavior.'
      },
      {
        title: 'Forensic Audit Dossiers',
        desc: 'Every violation is cataloged with timestamped screenshots, violation category, and duration, providing concrete evidence before results are certified.'
      }
    ],
    useCases: [
      { title: 'High-Stakes University Examinations', desc: 'Ensure degree examinations held remotely meet stringent university regulatory and legal integrity standards.' },
      { title: 'Professional Certification & Licensure', desc: 'Conduct remote proctored certification assessments without requiring students to travel to physical testing centers.' },
      { title: 'Campus Placement & Recruitment Screening', desc: 'Prevent candidate impersonation and unauthorized assistance during nationwide technical hiring drives.' }
    ],
    faqs: [
      {
        q: 'Does AI proctoring violate student privacy?',
        a: 'Nexify Examina adheres to strict data privacy principles. Webcams and proctoring streams are active only during the examination window, encrypted in transit, and strictly accessible only to authorized university proctors.'
      },
      {
        q: 'What happens if a student accidentally looks away or someone walks in behind them?',
        a: 'The AI flags suspicious moments as warnings in the invigilator\'s dashboard. The system does not automatically disqualify students for minor transient events, allowing human proctors to review context.'
      },
      {
        q: 'Can proctors issue live warnings or terminate an exam for misconduct?',
        a: 'Yes. Invigilators can monitor candidates live, review violation tallies, and take action if repeated deliberate cheating is detected.'
      }
    ]
  },

  'coding-assessment-platform': {
    slug: 'coding-assessment-platform',
    seoTitle: 'Coding Assessment Platform in India — In-Browser Compiler & Sandboxed Tests',
    metaDesc: 'Enterprise coding assessment platform for engineering colleges and tech recruitment. Multi-language in-browser compiler for Python, Java, C++, and JS with automated test cases.',
    keywords: 'coding assessment platform India, online coding exam software, college programming test platform, campus recruitment coding compiler, engineering college coding lab software, Python Java C++ online compiler exam',
    badge: 'Technical & Engineering Assessments',
    h1: 'Online Coding Assessment Platform for Colleges & Tech Recruitment',
    subtitle: 'Conduct automated programming examinations with an in-browser sandboxed compiler supporting Python, Java, C++, and JavaScript with hidden test case verification and anti-cheating lockdown.',
    targetAudience: 'Engineering Colleges, Computer Science Departments & Tech Recruiters',
    metrics: [
      { label: 'Supported Languages', value: '4+ Core', desc: 'Python 3, Java, C++, JavaScript' },
      { label: 'Execution Sandbox', value: 'Isolated', desc: 'Memory, CPU & time-limited execution' },
      { label: 'Test Case Engine', value: 'Public & Hidden', desc: 'Automated I/O validation' },
      { label: 'Cheating Lockdown', value: 'Active', desc: 'Clipboard & tab-switch blocked in code room' },
    ],
    features: [
      {
        title: 'Sandboxed Multi-Language Compiler',
        desc: 'Run student code in isolated secure execution environments with strict execution timeouts (5-10s) and memory constraints, preventing infinite loops and malicious scripts.'
      },
      {
        title: 'Public & Hidden Test Case Evaluation',
        desc: 'Students can test against sample inputs while final score calculation rigorously validates against hidden edge cases, boundary conditions, and large data inputs.'
      },
      {
        title: 'Code Editor with Syntax Highlighting',
        desc: 'Modern code editor with line numbering, theme support, code indentation, and custom test input consoles for a native developer experience.'
      },
      {
        title: 'Plagiarism & Anti-Copy Protection',
        desc: 'Copy-paste operations from external applications into the code editor are strictly disabled, preventing students from pasting pre-written code or AI solutions.'
      }
    ],
    useCases: [
      { title: 'Engineering College Semester Lab Exams', desc: 'Conduct mid-term and final practical coding exams for Data Structures, Algorithms, Object-Oriented Programming, and Web Development.' },
      { title: 'Campus Placement Technical Coding Rounds', desc: 'Filter thousands of engineering applicants with automated algorithmic coding challenges and instant scorecards.' },
      { title: 'Inter-College Hackathons & Coding Contests', desc: 'Host real-time coding competitions with automated submission scoring and live student leaderboards.' }
    ],
    faqs: [
      {
        q: 'Which programming languages are supported in the Nexify Examina compiler?',
        a: 'The platform currently supports Python 3, Java, C++ (GCC), and JavaScript (Node.js), which cover 98% of engineering curricula and campus placement coding assessments in India.'
      },
      {
        q: 'How are coding answers evaluated and scored?',
        a: 'When a student clicks "Run Code", it tests against visible sample cases. When they click "Submit", the system compiles the code and runs it against all hidden test cases, calculating a score proportional to passed test cases.'
      },
      {
        q: 'Can students copy code from ChatGPT or external websites?',
        a: 'No. The coding examination environment disables the clipboard, intercepts keyboard paste commands, and locks the browser in full-screen kiosk mode, triggering alerts if the student switches windows.'
      }
    ]
  },

  'online-assessment-software': {
    slug: 'online-assessment-software',
    seoTitle: 'Online Assessment Software in India — Corporate & Academic Evaluations',
    metaDesc: 'Versatile online assessment software for talent screening, campus hiring, and academic evaluations. Objective MCQs, aptitude tests, coding sandbox, and detailed analytics.',
    keywords: 'online assessment software India, talent assessment platform, campus hiring assessment tool, employee skill evaluation software, pre-employment testing platform, corporate assessment system',
    badge: 'Skill Assessment & Talent Evaluation',
    h1: 'Enterprise Online Assessment Software for Hiring & Academic Screening',
    subtitle: 'Evaluate student aptitude, domain knowledge, and programming capabilities on a single unified assessment platform with automated scoring and cheating prevention.',
    targetAudience: 'Corporates, Training Academies, Certification Bodies & Universities',
    metrics: [
      { label: 'Question Types', value: 'MCQ & Coding', desc: 'Aptitude, Domain & Programming' },
      { label: 'Invigilation', value: 'Proctored', desc: 'AI webcam and screen surveillance' },
      { label: 'Report Delivery', value: 'Real-Time', desc: 'In-depth skill breakdown scorecards' },
      { label: 'Candidate Experience', value: 'Seamless', desc: 'Works on any laptop or desktop' },
    ],
    features: [
      {
        title: 'Aptitude, Reasoning & Domain Assessments',
        desc: 'Create comprehensive multi-section assessments covering quantitative aptitude, logical reasoning, verbal ability, and specialized subject domains.'
      },
      {
        title: 'Integrated Coding & Problem Solving',
        desc: 'Combine multiple-choice questions with practical coding problems in the same unified candidate assessment test session.'
      },
      {
        title: 'Automated Candidate Shortlisting',
        desc: 'Set section-wise cutoff marks and overall score thresholds to automatically identify and shortlist top candidates from thousands of applicants.'
      },
      {
        title: 'Brand-Customized Candidate Portal',
        desc: 'Present a polished, professional testing portal with institutional branding, customized instructions, and secure credential access.'
      }
    ],
    useCases: [
      { title: 'Graduate Campus Hiring Drives', desc: 'Screen thousands of college applicants simultaneously with automated scoring and anti-cheating verification.' },
      { title: 'Corporate Skill Upgrading Assessments', desc: 'Measure employee technical proficiency and training effectiveness with objective periodic tests.' },
      { title: 'Admission Entrance Evaluations', desc: 'Assess incoming candidates on foundational domain competencies with tamper-proof proctoring audit trails.' }
    ],
    faqs: [
      {
        q: 'Can an assessment include both aptitude MCQs and programming questions?',
        a: 'Yes. Nexify Examina supports hybrid examinations containing multiple sections, allowing students to complete objective aptitude questions and write code in the same session.'
      },
      {
        q: 'How quickly are assessment results and candidate scorecards available?',
        a: 'Results are computed immediately upon test submission. Administrators can view ranked candidate lists, section scores, and proctoring audit logs instantly.'
      },
      {
        q: 'Can the assessment platform be white-labeled with our institution name?',
        a: 'Yes. Each institution gets a customized portal with their institution name, logo, student roster, and official examination guidelines.'
      }
    ]
  }
};
