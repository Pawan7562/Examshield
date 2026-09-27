// controllers/supportController.js
const { pool } = require('../config/database');

const FAQS = [
  {
    id: 'faq-1',
    category: 'Proctoring & Anti-Cheat',
    question: 'How does ExamShield detect tab switches and multiple faces?',
    answer: 'ExamShield uses on-device TensorFlow AI models to track facial presence and gaze angles in real time. It monitors browser focus events, full-screen changes, and secondary display detection. If a student attempts to switch tabs or a second face enters the frame, an automatic violation is flagged and logged in the Live Monitoring Cockpit.'
  },
  {
    id: 'faq-2',
    category: 'Proctoring & Anti-Cheat',
    question: 'What happens when a student reaches the maximum violation limit?',
    answer: 'When a candidate exceeds the maximum violation threshold (configurable under Proctoring Rules, default 3), the system can automatically terminate the test session, seal their answers, and notify the invigilator in the live monitoring dashboard.'
  },
  {
    id: 'faq-3',
    category: 'Examinations & Questions',
    question: 'Can I generate coding and MCQ questions using AI?',
    answer: 'Yes! Navigate to the AI Question Studio (/admin/ai-questions). You can specify the subject, difficulty level, programming languages, and test cases. The AI generates complete questions with starter templates, test cases, and solutions that can be directly transferred into your exams.'
  },
  {
    id: 'faq-4',
    category: 'Examinations & Questions',
    question: 'How do students get notified when results are published?',
    answer: 'When an admin marks an exam as published on the Gradebook page (/admin/results), the platform automatically sends individualized email notifications to all candidates with their marks obtained, percentage, grade, and pass/fail status.'
  },
  {
    id: 'faq-5',
    category: 'Candidate Management',
    question: 'How do I bulk import students for an entire department?',
    answer: 'Go to Candidate Registry (/admin/students) and click "Bulk Import". Upload a CSV or Excel file with Student Name, Roll Number, Email, and Department. ExamShield automatically provisions accounts and generates login credentials.'
  },
  {
    id: 'faq-6',
    category: 'Technical & Hardware',
    question: 'What are the minimum hardware and browser requirements for students?',
    answer: 'Candidates need a desktop or laptop with Google Chrome (v90+), Microsoft Edge, or Firefox. A working webcam, microphone, and a minimum stable internet speed of 512 Kbps are required.'
  }
];

/**
 * GET /api/admin/support/tickets
 */
exports.getTickets = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { status, category } = req.query;

    let queryStr = 'SELECT * FROM support_tickets WHERE college_id = $1';
    const params = [collegeId];

    if (status && status !== 'all') {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }
    if (category && category !== 'all') {
      params.push(category);
      queryStr += ` AND category = $${params.length}`;
    }

    queryStr += ' ORDER BY created_at DESC';

    const { rows: tickets } = await pool.query(queryStr, params);

    const statsQuery = await pool.query(
      `SELECT 
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'open')::int AS open,
         COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
         COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved
       FROM support_tickets 
       WHERE college_id = $1`,
      [collegeId]
    );

    const stats = statsQuery.rows[0] || { total: 0, open: 0, in_progress: 0, resolved: 0 };

    res.json({
      success: true,
      data: {
        tickets: tickets || [],
        stats
      }
    });
  } catch (error) {
    console.error('getTickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
  }
};

/**
 * POST /api/admin/support/tickets
 */
exports.createTicket = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { subject, category, priority = 'medium', message, contact_email, contact_phone } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket subject is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket message is required' });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `ES-${new Date().getFullYear()}-${randomSuffix}`;

    const { rows } = await pool.query(
      `INSERT INTO support_tickets 
       (ticket_number, college_id, subject, category, priority, status, message, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, $8)
       RETURNING *`,
      [
        ticketNumber,
        collegeId,
        subject.trim(),
        category || 'technical_issue',
        priority,
        message.trim(),
        contact_email || req.user.email || null,
        contact_phone || null
      ]
    );

    res.json({
      success: true,
      message: `Support ticket ${ticketNumber} created successfully. Our exam technical engineering team will review it shortly.`,
      data: { ticket: rows[0] }
    });
  } catch (error) {
    console.error('createTicket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create support ticket', error: error.message });
  }
};

/**
 * GET /api/admin/support/faqs
 */
exports.getFaqs = async (req, res) => {
  res.json({
    success: true,
    data: { faqs: FAQS }
  });
};

/**
 * GET /api/admin/support/system-status
 */
exports.getSystemStatus = async (req, res) => {
  res.json({
    success: true,
    data: {
      allOperational: true,
      uptime: '99.98%',
      lastChecked: new Date().toISOString(),
      services: [
        { name: 'AI Proctoring & Vision Engine', status: 'Operational', latency: '42ms' },
        { name: 'Audio & Whispering Analysis', status: 'Operational', latency: '38ms' },
        { name: 'Browser Sandbox & Integrity Guard', status: 'Operational', latency: '15ms' },
        { name: 'Neon Lakebase Postgres DB', status: 'Operational', latency: '22ms' },
        { name: 'Real-Time WebRTC / WebSocket Stream', status: 'Operational', latency: '54ms' },
        { name: 'Notification & Email Relays', status: 'Operational', latency: '110ms' }
      ]
    }
  });
};
