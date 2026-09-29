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
const createFreshTransporter = () => {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      'Email is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file.'
    );
  }

  const cleanPass = (EMAIL_PASS || '').trim();
  const isGmail = (EMAIL_HOST || '').toLowerCase().includes('gmail.com');

  console.log(`🔧 [SMTP] Creating fresh transporter → ${EMAIL_HOST} | user: ${EMAIL_USER}`);

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: cleanPass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  const port = parseInt(EMAIL_PORT) || 587;
  const secure = port === 465;

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
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

// Legacy alias so existing code that calls getTransporter() still works.
// It now returns a fresh instance every time (no singleton).
const getTransporter = () => createFreshTransporter();

// ─────────────────────────────────────────────────────────────
// Internal helper: send with retry
// ─────────────────────────────────────────────────────────────
const sendWithRetry = async (mailOptions, maxRetries = 3, retryDelayMs = 5000) => {
  const from =
    mailOptions.from ||
    process.env.EMAIL_FROM ||
    `ExamShield <${process.env.EMAIL_USER || 'noreply@examshield.com'}>`;
  const replyTo =
    mailOptions.replyTo ||
    process.env.EMAIL_USER ||
    'pawankumaryadav75628697@gmail.com';

  const headers = {
    'X-Priority': '3',
    'X-Mailer': 'ExamShield Academic Portal',
    'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER || 'pawankumaryadav75628697@gmail.com'}?subject=Unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    ...(mailOptions.headers || {})
  };

  const opts = { ...mailOptions, from, replyTo, headers };

  // ── Priority 1: Resend API (most reliable, works everywhere) ──────────────
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

  // ── Priority 2: Direct SMTP (works on local dev and many cloud hosts) ─────
  // Local dev always tries SMTP directly — no relay needed.
  // Cloud/production (Render) tries relay first since Render blocks SMTP ports.
  const isCloudOrProd =
    process.env.NODE_ENV === 'production' ||
    !!process.env.RENDER ||
    !!process.env.RENDER_SERVICE_ID;
  const relayUrl =
    process.env.EMAIL_RELAY_URL ||
    'https://examshield.vercel.app/api/send-email';

  // ── Priority 2a: Local dev — use direct SMTP ───────────────────────────
  if (!isCloudOrProd && process.env.USE_EMAIL_RELAY !== 'true') {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Create a fresh transporter each attempt — reusing the same
      // connection between students causes Gmail to silently drop emails.
      const transporter = createFreshTransporter();
      try {
        console.log(`📤 [SMTP] Attempt ${attempt}/${maxRetries} → ${opts.to}`);
        const info = await transporter.sendMail(opts);
        console.log(`✅ [SMTP] Sent! MessageId: ${info.messageId}`);
        logger.info('Email sent via SMTP', { to: opts.to, messageId: info.messageId });
        transporter.close();
        return info;
      } catch (err) {
        console.error(`❌ [SMTP] Attempt ${attempt} failed: ${err.message} (code: ${err.code})`);
        transporter.close();
        if (err.code === 'EAUTH') {
          logger.error('Gmail auth failed — check EMAIL_USER and EMAIL_PASS (use App Password)', { error: err.message });
          throw new Error(
            `Gmail authentication failed (EAUTH). Make sure:\n` +
            `  1. 2-Step Verification is ON for ${process.env.EMAIL_USER}\n` +
            `  2. EMAIL_PASS is a 16-char Gmail App Password (not your normal password)\n` +
            `Original: ${err.message}`
          );
        }
        if (attempt === maxRetries) throw err;
        console.log(`🔄 [SMTP] Retrying in ${retryDelayMs / 1000}s…`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
    return; // shouldn't reach here
  }

  // ── Priority 2b: Cloud / production — try Vercel relay first ─────────────
  console.log(`📤 [Vercel Relay] Sending to ${opts.to} via ${relayUrl}`);
  try {
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  } catch (relayErr) {
    console.error(`❌ [Vercel Relay] Failed: ${relayErr.message}`);
    console.log('🔄 Falling back to direct SMTP…');
  }

  // ── Priority 2c: Fallback to direct SMTP (cloud) ─────────────────────────
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Fresh transporter each retry so a broken connection doesn't block subsequent emails
    const transporter = createFreshTransporter();
    try {
      console.log(`📤 [SMTP Fallback] Attempt ${attempt}/${maxRetries} → ${opts.to}`);
      const info = await transporter.sendMail(opts);
      console.log(`✅ [SMTP Fallback] Sent! MessageId: ${info.messageId}`);
      logger.info('Email sent via SMTP fallback', { to: opts.to, messageId: info.messageId });
      transporter.close();
      return info;
    } catch (err) {
      console.error(`❌ [SMTP Fallback] Attempt ${attempt} failed: ${err.message}`);
      transporter.close();
      if (err.code === 'EAUTH') {
        logger.error('Gmail SMTP auth failed', { error: err.message });
        throw err;
      }
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
};

// ─────────────────────────────────────────────────────────────
// HTML base template
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// HTML base template
// ─────────────────────────────────────────────────────────────
const baseTemplate = (content, { title = 'ExamShield Examination Services', collegeName = 'Your Institution' } = {}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">ExamShield</div>
                    <div style="font-size: 13px; color: #94a3b8; margin-top: 3px;">Online Examination Portal &bull; ${collegeName}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; line-height: 1.6; color: #64748b; text-align: left;">
              <p style="margin: 0 0 8px; color: #475569;">
                This is an official administrative notice sent on behalf of <strong>${collegeName}</strong>.
              </p>
              <p style="margin: 0 0 8px; color: #64748b;">
                Need help or have questions regarding your examination? Please contact your college examination administrator or reply directly to this message.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                &copy; ${new Date().getFullYear()} ExamShield Assessment Services. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
const sendStudentCredentials = async (firstArg, secondArg) => {
  let opts = {};
  if (typeof firstArg === 'string') {
    opts = { ...(secondArg || {}), email: firstArg };
  } else if (firstArg && typeof firstArg === 'object') {
    opts = firstArg;
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

  const actionNotice = isReset
    ? `Your student portal password on ExamShield has been reset by <strong>${collegeName}</strong>. Below are your updated access credentials.`
    : `Your student examination account has been registered on ExamShield by <strong>${collegeName}</strong>.${examKey ? ' You have also been assigned to an upcoming examination.' : ' Use the credentials below to access your student portal.'}`;

  const content = `
    <div style="display: inline-block; padding: 4px 10px; border-radius: 4px; background-color: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
      ${isReset ? 'Account Password Update' : (examKey ? 'Examination Access Issued' : 'Account Created')}
    </div>

    <h2 style="margin: 0 0 12px; font-size: 19px; font-weight: 700; color: #0f172a;">
      ${isReset ? 'Hello' : 'Welcome'}, ${name || 'Candidate'}!
    </h2>

    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
      ${actionNotice}
    </p>

    <!-- Student Login Credentials Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; margin: 0 0 24px; padding: 18px 20px;">
      <tr>
        <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Student ID</div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; font-family: monospace;">${studentId}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Registered Email</div>
          <div style="font-size: 14px; color: #0f172a; margin-top: 2px;">${email}</div>
        </td>
      </tr>
      <tr>
        <td style="padding-top: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${isReset ? 'New Password' : 'Temporary Password'}</div>
          <div style="font-size: 16px; font-weight: 700; color: #2563eb; margin-top: 2px; font-family: monospace;">${password}</div>
        </td>
      </tr>
    </table>

    ${examKey ? `
    <!-- Examination Key Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin: 0 0 24px; padding: 18px 20px;">
      <tr>
        <td>
          <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 8px;">Scheduled Examination Details</div>
          <div style="font-size: 14px; color: #1e293b; margin-bottom: 4px;"><strong>Exam:</strong> ${examName || 'Scheduled Examination'}</div>
          ${subject ? `<div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Subject:</strong> ${subject}</div>` : ''}
          ${formattedDate ? `<div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Scheduled Time:</strong> ${formattedDate} (IST)</div>` : ''}
          ${examDuration ? `<div style="font-size: 13px; color: #475569; margin-bottom: 12px;"><strong>Duration:</strong> ${examDuration} Minutes</div>` : ''}
          
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #86efac; border-radius: 4px; padding: 12px; text-align: center;">
            <tr>
              <td align="center">
                <div style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Your Exam Access Key</div>
                <div style="font-size: 20px; font-weight: 800; color: #14532d; font-family: monospace; letter-spacing: 2px; margin-top: 4px;">${examKey}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Call to Action -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; display: inline-block; padding: 13px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Sign In to Exam Portal &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Guidelines -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 0 4px 4px 0; padding: 14px 16px; margin: 20px 0 0;">
      <tr>
        <td>
          <div style="font-size: 13px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px;">Important Candidate Instructions:</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
            <li>Use a computer or laptop equipped with a functional webcam and microphone.</li>
            <li>Ensure a reliable high-speed internet connection prior to launching the exam.</li>
            ${examKey ? `<li>Keep your <strong>Exam Access Key (${examKey})</strong> ready to unlock your exam session.</li>` : ''}
            <li>Do not navigate away from the test window or switch browser tabs during the session.</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  const subjectLine = isReset
    ? `Student Portal Password Update - ${collegeName}`
    : (examKey
        ? `Examination Access & Student Portal Details - ${collegeName}`
        : `Student Portal Account Details - ${collegeName}`);

  const plainText = [
    `ExamShield Online Examination Portal`,
    `Institution: ${collegeName}`,
    `----------------------------------------`,
    ``,
    `${isReset ? 'Hello' : 'Welcome'}, ${name || 'Candidate'}!`,
    ``,
    actionNotice.replace(/<[^>]*>?/gm, ''),
    ``,
    `Your Student Portal Login Details:`,
    `- Student ID: ${studentId}`,
    `- Registered Email: ${email}`,
    `- ${isReset ? 'New Password' : 'Temporary Password'}: ${password}`,
    examKey ? `- Exam Access Key: ${examKey}` : '',
    examName ? `- Exam: ${examName}` : '',
    formattedDate ? `- Scheduled Date: ${formattedDate} (IST)` : '',
    examDuration ? `- Duration: ${examDuration} Minutes` : '',
    ``,
    `Portal Login URL: ${loginUrl}`,
    ``,
    `Candidate Instructions:`,
    `1. Use a computer with a functional webcam and microphone.`,
    `2. Ensure a stable internet connection before launching your exam.`,
    examKey ? `3. Enter your Exam Access Key (${examKey}) to start the exam.` : '',
    `4. Do not switch tabs or minimize the test window during the session.`,
    ``,
    `This is an automated administrative notification sent on behalf of ${collegeName}.`
  ].filter(Boolean).join('\n');

  await sendWithRetry({
    to: email,
    subject: subjectLine,
    text: plainText,
    html: baseTemplate(content, { title: subjectLine, collegeName }),
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
