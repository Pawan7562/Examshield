// services/emailService.js
require('dotenv').config();

const nodemailer = require('nodemailer');
const winston = require('winston');
const { Resend } = require('resend');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// ─────────────────────────────────────────────────────────────
// Singleton transporter — created once at module load time
// so every sendMail call reuses the same SMTP connection pool
// ─────────────────────────────────────────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, RESEND_API_KEY } = process.env;

  if (RESEND_API_KEY) {
     console.log('✅ Resend API Key detected — SMTP transporter will be bypassed.');
  }

  console.log('🔧 Email config check:', {
    EMAIL_HOST: EMAIL_HOST || 'NOT SET',
    EMAIL_USER: EMAIL_USER || 'NOT SET',
    EMAIL_PASS: EMAIL_PASS ? '***SET***' : 'NOT SET',
    EMAIL_PORT: EMAIL_PORT || 'NOT SET',
    RESEND_API_KEY: RESEND_API_KEY ? '***SET***' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    if (!RESEND_API_KEY) {
      console.warn('⚠️  Email NOT configured — falling back to mock transporter.');
      console.warn('   Set EMAIL_HOST/USER/PASS or RESEND_API_KEY in your env vars.');
    }
    _transporter = {
      sendMail: async (opts) => {
        console.log('📧 [MOCK] Would send to:', opts.to, '| Subject:', opts.subject);
        return { status: 'mock' };
      },
    };
    return _transporter;
  }

  // PORT 587 + STARTTLS is the most reliable option across all cloud platforms
  // (Render, Railway, Fly.io, etc.). Port 465 (SSL) is often blocked by egress firewalls.
  const port = parseInt(EMAIL_PORT) || 587;
  const secure = port === 465; // true only for SSL; 587 uses STARTTLS

  console.log(`✅ Creating real SMTP transporter — host: ${EMAIL_HOST}, port: ${port}, secure: ${secure}`);

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST,   // smtp.gmail.com from env
    port,
    secure,             // false for 587 (STARTTLS), true for 465
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // allow self-signed certs on some hosts
    },
    // Connection pool settings (valid nodemailer options only)
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 30000,  // 30 s
    greetingTimeout: 15000,    // 15 s
    socketTimeout: 30000,      // 30 s
  });

  return _transporter;
};

// ─────────────────────────────────────────────────────────────
// Internal helper: send with retry
// ─────────────────────────────────────────────────────────────
const sendWithRetry = async (mailOptions, maxRetries = 3, retryDelayMs = 5000) => {
  const from =
    mailOptions.from ||
    process.env.EMAIL_FROM ||
    `ExamShield <${process.env.EMAIL_USER || 'noreply@examshield.com'}>`;

  const opts = { ...mailOptions, from };

  // Prioritize Resend over SMTP if API key exists. Render FREE blocks SMTP completely.
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log(`📤 [Resend] Attempting to send to ${opts.to} | Subject: ${opts.subject}`);

    try {
      const { data, error } = await resend.emails.send({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ [Resend] Delivered via HTTPS. MessageId: ${data?.id}`);
      logger.info('Email sent successfully via Resend API', { to: opts.to, id: data?.id });
      return { messageId: data?.id };
    } catch (err) {
      console.error(`❌ [Resend] Failed via API: ${err.message}`);
      throw err;
    }
  }

  // Fallback to Nodemailer SMTP
  const transporter = getTransporter();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 [SMTP] Attempt ${attempt}/${maxRetries} → ${opts.to} | ${opts.subject}`);
      const info = await transporter.sendMail(opts);
      console.log(`✅ [SMTP] Sent! MessageId: ${info.messageId}`);
      logger.info('Email sent via SMTP', { to: opts.to, subject: opts.subject, messageId: info.messageId });
      return info;
    } catch (err) {
      console.error(`❌ [SMTP] Attempt ${attempt} failed: ${err.message} (code: ${err.code})`);
      // Auth errors won't be fixed by retrying
      if (err.code === 'EAUTH') {
        logger.error('Email auth failed — check EMAIL_USER and EMAIL_PASS', { error: err.message });
        throw err;
      }
      if (attempt === maxRetries) {
        logger.error('Email failed after all retries', { to: opts.to, error: err.message });
        throw err;
      }
      // Reset the singleton so the next attempt creates a fresh connection
      _transporter = null;
      console.log(`🔄 [SMTP] Retrying in ${retryDelayMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
};

// ─────────────────────────────────────────────────────────────
// HTML base template
// ─────────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fb; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 32px; text-align: center; }
    .header h1 { color: #e94560; font-size: 28px; letter-spacing: 2px; font-weight: 800; }
    .header p { color: #a0aec0; margin-top: 4px; font-size: 13px; letter-spacing: 1px; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1a1a2e; }
    .text { font-size: 14px; line-height: 1.7; color: #555; margin-bottom: 20px; }
    .credentials-box { background: #f8faff; border: 2px dashed #e94560; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .credential-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
    .credential-item:last-child { border-bottom: none; }
    .credential-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; }
    .credential-value { font-size: 15px; font-weight: 700; color: #1a1a2e; font-family: 'Courier New', monospace; }
    .btn { display: inline-block; background: #e94560; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 20px 0; letter-spacing: 0.5px; }
    .warning-box { background: #fff8e1; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 20px 0; }
    .warning-box p { font-size: 13px; color: #856404; }
    .exam-card { background: #f0f7ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .exam-card h3 { color: #1a1a2e; font-size: 16px; margin-bottom: 12px; }
    .exam-detail { font-size: 13px; color: #555; margin: 6px 0; }
    .exam-detail strong { color: #1a1a2e; }
    .footer { background: #f8faff; padding: 24px 32px; text-align: center; border-top: 1px solid #eee; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.6; }
    .footer a { color: #e94560; text-decoration: none; }
    .badge { display: inline-block; background: #e94560; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EXAMSHIELD</h1>
      <p>SECURE ONLINE EXAMINATION PLATFORM</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from ExamShield. Please do not reply to this email.</p>
      <p>© ${new Date().getFullYear()} ExamShield. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Send student credentials email
 * NOTE: This is intentionally awaitable so callers can catch real errors.
 * Use .catch() in fire-and-forget contexts.
 */
const sendStudentCredentials = async ({ name, email, studentId, password, collegeName, loginUrl }) => {
  console.log('\n🎓 STUDENT CREDENTIALS:');
  console.log('  Name:', name, '| Email:', email, '| ID:', studentId, '| College:', collegeName);

  const content = `
    <div class="badge">ACCOUNT CREATED</div>
    <p class="greeting">Welcome, ${name}!</p>
    <p class="text">Your student account has been created on ExamShield by <strong>${collegeName}</strong>. Use the credentials below to log in to your exam portal.</p>

    <div class="credentials-box">
      <div class="credential-item">
        <span class="credential-label">Student ID</span>
        <span class="credential-value">${studentId}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Email</span>
        <span class="credential-value">${email}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Password</span>
        <span class="credential-value">${password}</span>
      </div>
    </div>

    <div style="text-align:center;">
      <a href="${loginUrl}" class="btn">Login to ExamShield →</a>
    </div>

    <div class="warning-box">
      <p>⚠️ <strong>Important:</strong> Please change your password after your first login. Keep your credentials secure and do not share them with anyone.</p>
    </div>
  `;

  await sendWithRetry({
    to: email,
    subject: `Welcome to ExamShield — Your Login Credentials`,
    html: baseTemplate(content),
  });

  logger.info(`Credentials email sent to ${email}`);
};

/**
 * Send exam notification to student
 */
const sendExamNotification = async ({ name, email, examName, examDate, examDuration, examKey, subject, type, loginUrl }) => {
  if (!examKey || examKey === 'N/A') {
    throw new Error('Valid exam key is required for email notification');
  }

  const formattedDate = new Date(examDate).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  });

  const content = `
    <div class="badge">EXAM SCHEDULED</div>
    <p class="greeting">Hello, ${name}</p>
    <p class="text">You have been registered for an upcoming examination. Please review the details below.</p>

    <div class="exam-card">
      <h3>📝 ${examName}</h3>
      <p class="exam-detail"><strong>Subject:</strong> ${subject || 'N/A'}</p>
      <p class="exam-detail"><strong>Type:</strong> ${type.toUpperCase()}</p>
      <p class="exam-detail"><strong>Date &amp; Time:</strong> ${formattedDate} (IST)</p>
      <p class="exam-detail"><strong>Duration:</strong> ${examDuration} minutes</p>
    </div>

    <div class="credentials-box">
      <div class="credential-item">
        <span class="credential-label">Exam Key</span>
        <span class="credential-value">${examKey}</span>
      </div>
    </div>

    <p class="text">You will need this exam key to start your exam. <strong>Do not share this key.</strong></p>

    <div style="text-align:center;">
      <a href="${loginUrl}" class="btn">Go to Exam Portal →</a>
    </div>

    <div class="warning-box">
      <p>⚠️ Ensure you have a stable internet connection, a working webcam, and a quiet environment. Log in at least 10 minutes before exam starts.</p>
    </div>
  `;

  const info = await sendWithRetry({
    to: email,
    subject: `Exam Scheduled: ${examName} — ${formattedDate}`,
    html: baseTemplate(content),
  });

  logger.info(`Exam notification sent to ${email} for exam ${examName}`);
  return { success: true, messageId: info?.messageId };
};

/**
 * Send exam reminder (1 hour before)
 */
const sendExamReminder = async ({ name, email, examName, examDate, examDuration, examKey }) => {
  const formattedDate = new Date(examDate).toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  });

  const content = `
    <div class="badge">EXAM REMINDER</div>
    <p class="greeting">⏰ Reminder: Exam in 1 Hour!</p>
    <p class="text">Hi ${name}, this is a reminder that your exam <strong>${examName}</strong> is starting at <strong>${formattedDate} IST</strong> — just 1 hour from now.</p>

    <div class="exam-card">
      <h3>Pre-Exam Checklist</h3>
      <p class="exam-detail">✅ Stable internet connection</p>
      <p class="exam-detail">✅ Working webcam &amp; microphone</p>
      <p class="exam-detail">✅ Quiet environment</p>
      <p class="exam-detail">✅ Full-screen mode ready</p>
      <p class="exam-detail">✅ No other browser tabs open</p>
    </div>

    <div class="credentials-box">
      <div class="credential-item">
        <span class="credential-label">Your Exam Key</span>
        <span class="credential-value">${examKey}</span>
      </div>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.STUDENT_LOGIN_URL}" class="btn">Login Now →</a>
    </div>
  `;

  await sendWithRetry({
    to: email,
    subject: `⏰ Exam Reminder: ${examName} starts in 1 hour!`,
    html: baseTemplate(content),
  });
};

/**
 * Send result to student
 */
const sendResultNotification = async ({ name, email, examName, marksObtained, totalMarks, percentage, grade, status }) => {
  const statusColor = status === 'pass' ? '#22c55e' : '#ef4444';

  const content = `
    <div class="badge">RESULT PUBLISHED</div>
    <p class="greeting">Your Result is Available!</p>
    <p class="text">Hi ${name}, the results for <strong>${examName}</strong> have been published. Here's your performance summary:</p>

    <div class="exam-card">
      <h3>${examName}</h3>
      <p class="exam-detail"><strong>Marks Obtained:</strong> ${marksObtained} / ${totalMarks}</p>
      <p class="exam-detail"><strong>Percentage:</strong> ${percentage}%</p>
      <p class="exam-detail"><strong>Grade:</strong> ${grade}</p>
      <p class="exam-detail"><strong>Status:</strong> <span style="color:${statusColor};font-weight:700;">${status.toUpperCase()}</span></p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.STUDENT_LOGIN_URL}" class="btn">View Detailed Result →</a>
    </div>
  `;

  await sendWithRetry({
    to: email,
    subject: `Result Published: ${examName}`,
    html: baseTemplate(content),
  });
};

/**
 * Send college welcome email
 */
const sendCollegeWelcome = async ({ name, email, collegeName }) => {
  const content = `
    <div class="badge">WELCOME</div>
    <p class="greeting">Welcome to ExamShield, ${name}!</p>
    <p class="text"><strong>${collegeName}</strong> has been successfully registered on ExamShield. You can now start managing your students and conducting secure online examinations.</p>

    <div class="exam-card">
      <h3>Getting Started</h3>
      <p class="exam-detail">1. Log in to your Admin Dashboard</p>
      <p class="exam-detail">2. Add students (individually or bulk CSV)</p>
      <p class="exam-detail">3. Create your first exam</p>
      <p class="exam-detail">4. Monitor students in real-time</p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.PLATFORM_URL}/admin/login" class="btn">Go to Admin Dashboard →</a>
    </div>
  `;

  await sendWithRetry({
    to: email,
    subject: `Welcome to ExamShield — Your College is Ready!`,
    html: baseTemplate(content),
  });
};

module.exports = {
  sendStudentCredentials,
  sendExamNotification,
  sendExamReminder,
  sendResultNotification,
  sendCollegeWelcome,
};
