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
// Fresh transporter factory — creates a new SMTP connection
// per email. Gmail's SMTP rejects subsequent sends on a
// reused pooled connection (only the first student gets mail).
// Creating a fresh transporter per send is the correct pattern
// for transactional email.
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Fresh transporter factory — creates a new SMTP connection
// per email. Gmail's SMTP rejects subsequent sends on a
// reused pooled connection (only the first student gets mail).
// Creating a fresh transporter per send is the correct pattern
// for transactional email.
// ─────────────────────────────────────────────────────────────
const createFreshTransporter = () => {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      'Email is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file.'
    );
  }

  const port = parseInt(EMAIL_PORT) || 587;
  const secure = port === 465; // true = SSL; false = STARTTLS (port 587)
  const cleanPass = (EMAIL_PASS || '').trim();

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure,
    auth: {
      user: EMAIL_USER,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 12000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
};

// Legacy alias so existing code that calls getTransporter() still works.
const getTransporter = () => createFreshTransporter();

// ─────────────────────────────────────────────────────────────
// Internal helper: send with retry
// ─────────────────────────────────────────────────────────────
const sendWithRetry = async (mailOptions, maxRetries = 2, retryDelayMs = 2000) => {
  const from =
    mailOptions.from ||
    process.env.EMAIL_FROM ||
    `ExamShield <${process.env.EMAIL_USER || 'noreply@examshield.com'}>`;

  const targetTo = (mailOptions.to || '').trim().toLowerCase();
  const opts = { ...mailOptions, to: targetTo, from };

  // ── Priority 1: Resend API (most reliable if key provided) ────────────────
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log(`📤 [Resend] Sending to ${opts.to} | Subject: ${opts.subject}`);
    try {
      const { data, error } = await resend.emails.send({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      if (error) throw new Error(error.message);
      console.log(`✅ [Resend] Delivered. MessageId: ${data?.id}`);
      logger.info('Email sent via Resend API', { to: opts.to, id: data?.id });
      return { messageId: data?.id };
    } catch (err) {
      console.error(`❌ [Resend] Failed: ${err.message}`);
      throw err;
    }
  }

  const isCloudOrProd =
    process.env.NODE_ENV === 'production' ||
    !!process.env.RENDER ||
    !!process.env.RENDER_SERVICE_ID;
  const relayUrl =
    process.env.EMAIL_RELAY_URL ||
    'https://examshield.vercel.app/api/send-email';

  // Helper to send via Vercel HTTPS Relay
  const sendViaRelay = async () => {
    console.log(`📤 [Vercel Relay] Sending to ${opts.to} via ${relayUrl}`);
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12000), // 12s timeout
      body: JSON.stringify({
        internalSecret: 'examshield-secure-relay-9921',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        mailOptions: opts,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Vercel Relay rejected the request');
    }
    console.log(`✅ [Vercel Relay] Delivered! MessageId: ${data.messageId}`);
    logger.info('Email sent via Vercel Relay', { to: opts.to, messageId: data.messageId });
    return data;
  };

  // Helper to send via direct fresh SMTP
  const sendViaDirectSMTP = async () => {
    const transporter = createFreshTransporter();
    try {
      console.log(`📤 [Direct SMTP] Sending to ${opts.to}`);
      const info = await transporter.sendMail(opts);
      console.log(`✅ [Direct SMTP] Sent! MessageId: ${info.messageId}`);
      logger.info('Email sent via SMTP', { to: opts.to, messageId: info.messageId });
      return info;
    } finally {
      transporter.close();
    }
  };

  // ── Strategy A: Cloud / Production (Render blocks direct SMTP, so Relay first) ─
  if (isCloudOrProd || process.env.USE_EMAIL_RELAY === 'true') {
    try {
      return await sendViaRelay();
    } catch (relayErr) {
      console.error(`❌ [Vercel Relay] Failed: ${relayErr.message}`);
      console.log('🔄 Falling back to direct SMTP…');
      try {
        return await sendViaDirectSMTP();
      } catch (smtpErr) {
        console.error(`❌ [SMTP Fallback] Failed: ${smtpErr.message}`);
        throw new Error(`Email delivery failed via Relay and direct SMTP: ${relayErr.message}`);
      }
    }
  }

  // ── Strategy B: Local Development (Direct SMTP first, Relay as instant fallback) ─
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendViaDirectSMTP();
    } catch (smtpErr) {
      console.error(`❌ [SMTP] Attempt ${attempt}/${maxRetries} failed: ${smtpErr.message}`);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
      } else {
        console.log('🔄 Local direct SMTP failed; attempting fallback to Vercel Relay…');
        try {
          return await sendViaRelay();
        } catch (relayErr) {
          console.error(`❌ [Relay Fallback] Failed: ${relayErr.message}`);
          throw smtpErr;
        }
      }
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
 * Supports both object signature: sendStudentCredentials({ name, email, studentId, password, ... })
 * and positional signature: sendStudentCredentials(email, studentId, password, name, collegeName, loginUrl)
 */
const sendStudentCredentials = async (...args) => {
  let opts = {};
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    opts = { ...args[0] };
  } else if (typeof args[0] === 'string') {
    if (typeof args[1] === 'object' && args[1] !== null) {
      opts = { ...args[1], email: args[0] };
    } else {
      opts = {
        email: args[0],
        studentId: args[1],
        password: args[2],
        name: args[3],
        collegeName: args[4] || 'Your Institution',
        loginUrl: args[5],
      };
    }
  }

  const { 
    name, 
    email, 
    studentId, 
    password, 
    collegeName = 'Your Institution', 
    loginUrl = process.env.STUDENT_LOGIN_URL || 'https://www.exam.nexifyforge.in/student/login',
    examName,
    examKey,
    examDate,
    examDuration,
    subject,
    isReset = false
  } = opts;

  console.log('\n🎓 STUDENT CREDENTIALS:');
  console.log('  Name:', name, '| Email:', email, '| ID:', studentId, '| College:', collegeName, '| isReset:', isReset);

  if (!email) {
    throw new Error('Recipient email is required for credentials dispatch.');
  }

  const formattedDate = examDate ? new Date(examDate).toLocaleString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) : null;

  const badgeText = isReset 
    ? 'PASSWORD RESET SUCCESSFUL' 
    : (examKey ? 'ACCOUNT & EXAM ACCESS ISSUED' : 'ACCOUNT CREATED');

  const actionNotice = isReset
    ? `Your student portal password on ExamShield has been reset by <strong>${collegeName}</strong>. Please find your updated login credentials below.`
    : `Your student account has been created on ExamShield by <strong>${collegeName}</strong>.${examKey ? ' You have also been enrolled in an upcoming examination.' : ' Use the credentials below to log in to your exam portal.'}`;

  const content = `
    <div class="badge">${badgeText}</div>
    <p class="greeting">${isReset ? 'Hello' : 'Welcome'}, ${name || 'Candidate'}!</p>
    <p class="text">${actionNotice}</p>

    <!-- Student Login Credentials -->
    <div class="credentials-box" style="border: 2px solid #0f3460; background: #f0f7ff; margin-bottom: 20px;">
      <h3 style="color: #0f3460; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">🔐 Student Portal Login Credentials</h3>
      <div class="credential-item">
        <span class="credential-label">Student ID</span>
        <span class="credential-value" style="color: #0f3460; font-size: 16px;">${studentId}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Registered Email</span>
        <span class="credential-value">${email}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">${isReset ? 'New Password' : 'Temporary Password'}</span>
        <span class="credential-value" style="color: #e94560; font-size: 16px;">${password}</span>
      </div>
    </div>

    ${examKey ? `
    <!-- Examination Key & Authorization -->
    <div class="exam-card" style="border: 2px solid #10b981; background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #065f46; font-size: 15px; margin-bottom: 8px;">📝 Examination Authorization</h3>
      <p class="exam-detail" style="font-size: 14px; color: #1f2937;"><strong>Exam Title:</strong> ${examName || 'Scheduled Examination'}</p>
      ${subject ? `<p class="exam-detail" style="font-size: 13px; color: #374151;"><strong>Subject:</strong> ${subject}</p>` : ''}
      ${formattedDate ? `<p class="exam-detail" style="font-size: 13px; color: #374151;"><strong>Scheduled Date:</strong> ${formattedDate} (IST)</p>` : ''}
      ${examDuration ? `<p class="exam-detail" style="font-size: 13px; color: #374151;"><strong>Duration:</strong> ${examDuration} Minutes</p>` : ''}
      
      <div style="background: #ffffff; border: 2px dashed #10b981; border-radius: 6px; padding: 14px; margin-top: 14px; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #047857; margin-bottom: 4px;">YOUR EXAM ACCESS KEY</div>
        <div style="font-size: 22px; font-weight: 800; color: #065f46; font-family: 'Courier New', monospace; letter-spacing: 3px;">${examKey}</div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Keep this key ready — you will enter it to begin the proctored exam.</div>
      </div>
    </div>
    ` : ''}

    <div style="text-align:center; margin: 26px 0;">
      <a href="${loginUrl}" class="btn" style="background: #0f3460; font-size: 15px; padding: 14px 34px;">Login &amp; Enter Exam Portal →</a>
    </div>

    <div class="warning-box">
      <p>⚠️ <strong>Important Instructions:</strong></p>
      <ul style="margin: 8px 0 0 18px; font-size: 13px; line-height: 1.6; color: #856404;">
        <li>Use a laptop or desktop computer with a functional webcam and microphone.</li>
        <li>Ensure you have a stable internet connection before launching the exam.</li>
        ${examKey ? `<li>Copy your <strong>Exam Key (${examKey})</strong> to unlock the exam session.</li>` : ''}
        <li>Do not switch tabs, minimize windows, or use unauthorized secondary devices.</li>
      </ul>
    </div>
  `;

  const subjectLine = isReset
    ? `ExamShield — Your Password Has Been Reset`
    : (examKey
        ? `Welcome to ExamShield — Your Student ID, Password & Exam Key (${examKey})`
        : `Welcome to ExamShield — Your Login Credentials`);

  await sendWithRetry({
    to: email,
    subject: subjectLine,
    html: baseTemplate(content),
  }, 3, 3000); // up to 3 attempts, 3 s apart

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
