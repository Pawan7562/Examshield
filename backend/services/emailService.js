const fs = require('fs');
const path = require('path');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');
const winston = require('winston');
const { Resend } = require('resend');

// Pre-load Nexify Forge official logo for inline CID email embedding
const logoPath = path.join(__dirname, '../assets/nexifyforge-logo.jpg');
let logoBase64 = null;
try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (e) {
  console.warn('Could not read Nexify Forge logo:', e.message);
}

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
// Fresh transporter factory — creates a new SMTP connection
// per email. Supports custom config or fallback credentials.
// ─────────────────────────────────────────────────────────────
const createTransporterFromConfig = (config = {}) => {
  const service = config.service;
  const host = config.host || (!service ? process.env.EMAIL_HOST : null);
  const user = config.user || process.env.EMAIL_USER;
  const pass = (config.pass !== undefined ? config.pass : process.env.EMAIL_PASS || '').trim();
  const port = parseInt(config.port || process.env.EMAIL_PORT) || 587;
  const isGmail = service === 'gmail' || (host || '').toLowerCase().includes('gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });
  }

  const secure = port === 465;
  return nodemailer.createTransport({
    host: host || 'smtp-relay.brevo.com',
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
  });
};

const createFreshTransporter = () => {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS || EMAIL_PASS.includes('YOUR_BREVO_SMTP_KEY')) {
    throw new Error(
      'Brevo SMTP password/key is missing. Please set EMAIL_PASS to your Brevo SMTP key (starts with xsmtpsib-...) in backend/.env'
    );
  }

  return createTransporterFromConfig({
    host: EMAIL_HOST,
    user: EMAIL_USER,
    pass: EMAIL_PASS,
    port: EMAIL_PORT,
  });
};

// ─────────────────────────────────────────────────────────────
// Brevo (Sendinblue) Transactional REST API integration
// Uses HTTPS port 443 — guaranteed zero firewall/port blocking in cloud
// ─────────────────────────────────────────────────────────────
const parseEmailSender = (raw) => {
  if (!raw) {
    return {
      name: 'Nexify Examina',
      email: process.env.EMAIL_USER || 'exam@nexifyforge.in'
    };
  }
  const match = raw.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/["']/g, '').trim(), email: match[2].trim() };
  }
  return { name: 'Nexify Examina', email: raw.trim() };
};

const sendViaBrevoApi = async (apiKey, opts) => {
  const sender = parseEmailSender(opts.from || process.env.EMAIL_FROM || 'Nexify Examina <exam@nexifyforge.in>');
  const replyTo = parseEmailSender(opts.replyTo || 'exam@nexifyforge.in');

  const toList = Array.isArray(opts.to)
    ? opts.to.map((t) => (typeof t === 'string' ? { email: t } : t))
    : [{ email: opts.to }];

  const attachments = [];
  if (Array.isArray(opts.attachments)) {
    for (const att of opts.attachments) {
      if (att.content || att.url) {
        attachments.push({
          name: att.name || att.filename || 'attachment',
          content: att.content,
          url: att.url
        });
      } else if (att.path && fs.existsSync(att.path)) {
        attachments.push({
          name: att.filename || path.basename(att.path),
          content: fs.readFileSync(att.path).toString('base64')
        });
      }
    }
  }

  // Ensure official Nexify Forge logo is attached if not already present
  if (!attachments.some(a => a.name === 'nexifyforge-logo.jpg') && logoBase64) {
    attachments.push({
      name: 'nexifyforge-logo.jpg',
      content: logoBase64
    });
  }

  const payload = {
    sender,
    to: toList,
    replyTo,
    subject: opts.subject,
    htmlContent: opts.html,
    textContent: opts.text || (opts.html ? opts.html.replace(/<[^>]*>?/gm, '') : ''),
    headers: {
      'X-Mailer': 'Nexify Examina Dispatcher v2.0',
      'Feedback-ID': 'exam-monitoring:nexifyexamina:transactional',
      ...(opts.headers || {})
    },
    ...(attachments.length > 0 ? { attachment: attachments } : {})
  };

  console.log(`📤 [Brevo API] Sending to ${opts.to} | From: ${sender.name} <${sender.email}> | Subject: ${opts.subject}`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey.trim(),
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data?.message || data?.code || res.statusText || 'Brevo API call failed';
    throw new Error(`Brevo API Error (${res.status}): ${errorMsg}`);
  }

  const messageId = data.messageId || data.messageIds?.[0] || 'brevo-sent';
  console.log(`✅ [Brevo API] Delivered! MessageId: ${messageId}`);
  logger.info('Email sent via Brevo API', { to: opts.to, messageId });
  return { messageId };
};

// ─────────────────────────────────────────────────────────────
// Internal helper: send with retry
// ─────────────────────────────────────────────────────────────
const sendWithRetry = async (mailOptions, maxRetries = 3, retryDelayMs = 4000) => {
  const defaultSender = 'Nexify Examina <exam@nexifyforge.in>';

  const from =
    mailOptions.from ||
    process.env.EMAIL_FROM ||
    defaultSender;
  const replyTo =
    mailOptions.replyTo ||
    process.env.EMAIL_REPLY_TO ||
    'exam@nexifyforge.in';

  const headers = {
    'X-Priority': '3',
    'X-Mailer': 'Nexify Examina Mailer v2.0',
    'Feedback-ID': 'exam-monitoring:nexifyexamina:transactional',
    'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER || 'support@nexifyforge.in'}?subject=Unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    ...(mailOptions.headers || {})
  };

  const mailAttachments = [
    ...(mailOptions.attachments || []),
    ...(logoBase64 ? [{
      filename: 'nexifyforge-logo.jpg',
      content: logoBase64,
      encoding: 'base64',
      cid: 'nexifyforge-logo.jpg'
    }] : (fs.existsSync(logoPath) ? [{
      filename: 'nexifyforge-logo.jpg',
      path: logoPath,
      cid: 'nexifyforge-logo.jpg'
    }] : []))
  ];

  const opts = { ...mailOptions, from, replyTo, headers, attachments: mailAttachments };

  // ── Priority 1: Brevo REST API (Fastest, uses HTTPS 443, immune to cloud SMTP port blocks) ──
  const brevoApiKey = process.env.BREVO_API_KEY || 
    (process.env.EMAIL_PASS && process.env.EMAIL_PASS.startsWith('xkeysib-') ? process.env.EMAIL_PASS : null) ||
    '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';

  let brevoApiError = null;
  if (brevoApiKey) {
    try {
      return await sendViaBrevoApi(brevoApiKey, opts);
    } catch (brevoErr) {
      brevoApiError = brevoErr;
      console.error(`❌ [Brevo API] Failed: ${brevoErr.message}`);
      console.log('🔄 Brevo API failed, falling back to SMTP...');
    }
  }

  // ── Priority 2: Resend API (Inbox delivery, verified domains) ───────────────────────────
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const resendFrom =
      process.env.RESEND_FROM ||
      (process.env.RESEND_DOMAIN
        ? `Nexify Examina <noreply@${process.env.RESEND_DOMAIN}>`
        : 'Nexify Examina <onboarding@resend.dev>');

    console.log(`📤 [Resend] Sending to ${opts.to} | From: ${resendFrom} | Subject: ${opts.subject}`);
    try {
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: opts.to,
        reply_to: process.env.EMAIL_USER || opts.replyTo,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      if (error) throw new Error(error.message);
      console.log(`✅ [Resend] Delivered. MessageId: ${data?.id}`);
      logger.info('Email sent via Resend API', { to: opts.to, id: data?.id });
      return { messageId: data?.id };
    } catch (err) {
      console.error(`❌ [Resend] Failed: ${err.message}`);
      console.log('🔄 Resend failed, falling back to SMTP...');
    }
  }

  // ── Priority 3: Direct SMTP (Brevo SMTP or custom SMTP) ──────────────────────────────────
  const isBrevoSmtp = (process.env.EMAIL_HOST || '').toLowerCase().includes('brevo.com') ||
                      (process.env.EMAIL_HOST || '').toLowerCase().includes('sendinblue.com');
  const isGmail = (process.env.EMAIL_HOST || '').toLowerCase().includes('gmail.com');
  const isCloudOrProd =
    process.env.NODE_ENV === 'production' ||
    !!process.env.RENDER ||
    !!process.env.RENDER_SERVICE_ID;

  // Brevo SMTP works reliably on cloud hosts without needing the legacy Vercel Gmail relay
  if (isBrevoSmtp || (!isCloudOrProd && process.env.USE_EMAIL_RELAY !== 'true')) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let transporter = null;
      try {
        transporter = createFreshTransporter();
        console.log(`📤 [SMTP${isBrevoSmtp ? ' - Brevo' : ''}] Attempt ${attempt}/${maxRetries} → ${opts.to}`);
        const info = await transporter.sendMail(opts);
        console.log(`✅ [SMTP${isBrevoSmtp ? ' - Brevo' : ''}] Sent! MessageId: ${info.messageId}`);
        logger.info('Email sent via SMTP', { to: opts.to, messageId: info.messageId });
        transporter.close();
        return info;
      } catch (err) {
        lastError = err;
        console.error(`❌ [SMTP] Attempt ${attempt} failed: ${err.message} (code: ${err.code})`);
        if (transporter) transporter.close();
        
        if (err.code === 'ETIMEDOUT' && isCloudOrProd) {
          logger.warn('Direct SMTP timed out (outbound port 587 is blocked by cloud provider). Aborting SMTP retries.');
          break;
        }
        if (err.code === 'EAUTH' || (err.message && err.message.includes('Authentication failed'))) {
          logger.warn('Primary SMTP auth failed — engaging resilient fallback provider');
          break;
        }
        if (attempt === maxRetries) break;
        console.log(`🔄 [SMTP] Retrying in ${retryDelayMs / 1000}s…`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }

    // ── Resilient Fallback: If primary Brevo SMTP failed, engage verified fallback ──
    const fallbackUser = process.env.FALLBACK_EMAIL_USER || process.env.EMAIL_USER;
    const fallbackPass = (process.env.FALLBACK_EMAIL_PASS || '').trim();

    if (fallbackUser && fallbackPass && !fallbackUser.includes('pawankumar')) {
      console.log(`🛡️ [Resilient Fallback] Primary failed. Dispatching via backup account (${fallbackUser})…`);
      try {
        const fallbackTransporter = createTransporterFromConfig({
          service: fallbackUser.includes('gmail.com') ? 'gmail' : undefined,
          host: fallbackUser.includes('gmail.com') ? undefined : (process.env.EMAIL_HOST || 'smtp-relay.brevo.com'),
          user: fallbackUser,
          pass: fallbackPass,
        });
        const fallbackOpts = {
          ...opts,
          from: opts.from || 'Nexify Examina <exam@nexifyforge.in>',
        };
        const info = await fallbackTransporter.sendMail(fallbackOpts);
        console.log(`✅ [Resilient Fallback] Delivered successfully! MessageId: ${info.messageId}`);
        logger.info('Email sent via resilient fallback', { to: opts.to, messageId: info.messageId });
        fallbackTransporter.close();
        return info;
      } catch (fbErr) {
        console.error(`❌ [Resilient Fallback] Backup also failed: ${fbErr.message}`);
      }
    }

    if (lastError) {
      if (brevoApiError) {
        throw new Error(`${brevoApiError.message}. Cloud SMTP blocked: ${lastError.message}`);
      }
      throw lastError;
    }
    return;
  }

  // ── Priority 4: Legacy Cloud Relay (Used only for Gmail on Render/cloud) ─────────────────
  const relayUrl = process.env.EMAIL_RELAY_URL || 'https://examshield.vercel.app/api/send-email';
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

  // Final direct SMTP attempt if relay failed
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
};

// ─────────────────────────────────────────────────────────────
// URL Resolution Helpers
// Ensures email buttons always link to a working, reachable portal.
// Sanitizes invalid www prefixes and routes around unconfigured DNS.
// ─────────────────────────────────────────────────────────────
const resolveStudentLoginUrl = (url, examKey, studentEmail) => {
  let target = (url || process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login').trim();
  // Strip non-existent www. prefix
  target = target.replace(/www\.exam\.nexifyforge\.in/g, 'exam.nexifyforge.in');
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = 'https://' + target;
  }
  try {
    const parsed = new URL(target);
    if (examKey && examKey !== 'N/A' && examKey !== 'TBD') {
      parsed.searchParams.set('examKey', examKey);
    }
    if (studentEmail) {
      parsed.searchParams.set('email', studentEmail);
    }
    return parsed.toString();
  } catch (e) {
    return target;
  }
};

const resolvePortalBaseUrl = (url) => {
  let target = (url || process.env.PLATFORM_URL || 'https://exam.nexifyforge.in').trim();
  target = target.replace(/www\.exam\.nexifyforge\.in/g, 'exam.nexifyforge.in');
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = 'https://' + target;
  }
  return target;
};

/**
 * Dynamically resolves the college name from database if not explicitly provided
 */
const resolveCollegeNameFromDb = async ({ collegeName, collegeId, examId, examKey, studentId, studentEmail } = {}) => {
  if (collegeName && collegeName !== 'Your Institution' && collegeName !== 'Unknown College') {
    return collegeName;
  }
  try {
    const { pool } = require('../config/database');
    if (collegeId) {
      const res = await pool.query('SELECT name FROM colleges WHERE id = $1 LIMIT 1', [collegeId]);
      if (res.rows[0]?.name) return res.rows[0].name;
    }
    if (examId) {
      const res = await pool.query('SELECT c.name FROM exams e JOIN colleges c ON e.college_id = c.id WHERE e.id = $1 LIMIT 1', [examId]);
      if (res.rows[0]?.name) return res.rows[0].name;
    }
    if (examKey && examKey !== 'N/A' && examKey !== 'TBD') {
      const res = await pool.query('SELECT c.name FROM exams e JOIN colleges c ON e.college_id = c.id WHERE e.exam_code = $1 OR e.exam_key = $1 LIMIT 1', [examKey]);
      if (res.rows[0]?.name) return res.rows[0].name;
    }
    if (studentEmail) {
      const res = await pool.query('SELECT c.name FROM students s JOIN colleges c ON s.college_id = c.id WHERE s.email = $1 LIMIT 1', [studentEmail]);
      if (res.rows[0]?.name) return res.rows[0].name;
    }
    if (studentId) {
      const res = await pool.query('SELECT c.name FROM students s JOIN colleges c ON s.college_id = c.id WHERE s.student_id = $1 OR s.id = $1 LIMIT 1', [studentId]);
      if (res.rows[0]?.name) return res.rows[0].name;
    }
  } catch (err) {
    // Non-fatal, fallback gracefully
  }
  return collegeName || 'Your Institution';
};

// ─────────────────────────────────────────────────────────────
// Industry-Standard HTML Base Template
// Nexify Examina (Primary Brand) + Nexify Forge (Engineering Attribution)
// + Prominent Academic Institution Showcase
// ─────────────────────────────────────────────────────────────
const baseTemplate = (content, {
  title = 'Nexify Examina — Examination Notice',
  collegeName = 'Your Institution',
  preheader = 'Official examination notice from Nexify Examina',
  badgeText = 'OFFICIAL INVITATION'
} = {}) => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .responsive-table { width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <!-- Hidden Preheader for Inbox Preview -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container (600px Max) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
          
          <!-- 1. Sleek Modern Header with Nexify Examina Branding -->
          <tr>
            <td class="mobile-padding" style="background-color: #ffffff; padding: 22px 32px 20px; border-bottom: 2px solid #0f2744;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="width: 44px; padding-right: 14px;">
                          <!-- Nexify Examina Monogram Logo -->
                          <img src="cid:nexifyforge-logo.jpg" alt="Nexify Examina" width="42" height="42" style="display: block; width: 42px; height: 42px; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: contain; background-color: #ffffff;" />
                        </td>
                        <td valign="middle">
                          <div style="font-size: 16px; font-weight: 800; color: #0f2744; letter-spacing: 0.8px; text-transform: uppercase; line-height: 1.2;">
                            NEXIFY EXAMINA
                          </div>
                          <div style="font-size: 11px; font-weight: 600; color: #2563eb; letter-spacing: 0.3px; margin-top: 2px;">
                            Intelligent Examination &amp; Assessment Platform
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Main Email Body -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 32px 28px; background-color: #ffffff;">
              
              <!-- Authoritative Academic Institution Organizer Banner -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1e3a8a; border-radius: 8px; padding: 18px 20px; margin-bottom: 26px;">
                <tr>
                  <td valign="middle">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">
                      Examination Conducted &amp; Organized By
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f2744; margin-top: 3px; line-height: 1.3;">
                      ${collegeName}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                      Administered via <strong>Nexify Examina</strong> &bull; Powered by <strong>Nexify Forge</strong>
                    </div>
                  </td>
                </tr>
              </table>

              ${content}

            </td>
          </tr>

          <!-- 3. Professional Corporate & Regulatory Footer -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 32px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; line-height: 1.6; color: #64748b;">
              
              <!-- Required Product & Platform Declaration -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; color: #0f2744; line-height: 1.5;">
                      Nexify Examina is an intelligent examination and assessment platform.
                    </div>
                    <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.6;">
                      &bull; <strong>Conducting Institution:</strong> ${collegeName}<br>
                      &bull; <strong>Examination Platform:</strong> Nexify Examina<br>
                      &bull; <strong>Engineering &amp; Technology:</strong> Developed &amp; Powered by <a href="https://nexifyforge.in" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">Nexify Forge</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="margin: 0 0 10px; color: #475569; font-size: 11px; line-height: 1.55;">
                🔒 <strong>Security &amp; Integrity Notice:</strong> Nexify Examina and ${collegeName} will never ask for your password via email. If you receive suspicious communications, please notify <a href="mailto:support@nexifyforge.in" style="color: #2563eb; text-decoration: underline;">support@nexifyforge.in</a>.
              </p>

              <p style="margin: 0 0 16px; color: #64748b; font-size: 11px; line-height: 1.55;">
                For questions regarding your exam schedule, enrollment, or examination rules, please reach out directly to the examination department at <strong>${collegeName}</strong>.
              </p>

              <!-- Copyright & Links with Brand Seal -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" valign="middle" style="font-size: 11px; color: #94a3b8;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td valign="middle" style="padding-right: 10px;">
                            <img src="cid:nexifyforge-logo.jpg" alt="NE" width="22" height="22" style="display: block; width: 22px; height: 22px; border-radius: 4px; border: 1px solid #e2e8f0;" />
                          </td>
                          <td valign="middle" style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
                            &copy; ${new Date().getFullYear()} <strong>Nexify Examina</strong>. All rights reserved.<br>
                            Developed and powered by <strong>Nexify Forge</strong>.
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" valign="middle" style="font-size: 11px; color: #94a3b8;">
                      <a href="https://exam.nexifyforge.in" target="_blank" style="color: #64748b; text-decoration: none; font-weight: 600;">Nexify Examina</a> &bull;
                      <a href="https://nexifyforge.in" target="_blank" style="color: #64748b; text-decoration: none; font-weight: 600;">Nexify Forge</a> &bull;
                      <a href="${resolveStudentLoginUrl()}" target="_blank" style="color: #64748b; text-decoration: none; font-weight: 600;">Exam Portal</a>
                    </td>
                  </tr>
                </table>
              </div>

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
// Public API Methods
// ─────────────────────────────────────────────────────────────

/**
 * Send student credentials email
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
    collegeName: rawCollegeName, 
    collegeId,
    examId,
    loginUrl,
    examName,
    examKey,
    examDate,
    examDuration,
    subject,
    isReset = false
  } = opts;

  if (!email) {
    throw new Error('Recipient email is required for credentials dispatch.');
  }

  // Dynamically resolve college name from database if not explicitly set
  const collegeName = await resolveCollegeNameFromDb({
    collegeName: rawCollegeName,
    collegeId,
    examId,
    examKey,
    studentId,
    studentEmail: email
  });

  console.log('\n🎓 [Nexify Examina] STUDENT CREDENTIALS:');
  console.log('  Name:', name, '| Email:', email, '| ID:', studentId, '| College:', collegeName, '| isReset:', isReset);

  const effectiveLoginUrl = resolveStudentLoginUrl(loginUrl, examKey, email);
  const safeHref = effectiveLoginUrl.replace(/&/g, '&amp;');

  const formattedDate = examDate ? new Date(examDate).toLocaleString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) : null;

  const actionNotice = isReset
    ? `Your examination portal access password has been updated by <strong>${collegeName}</strong> on <strong>Nexify Examina</strong>. Below are your verified sign-in credentials.`
    : `Your official examination access account has been registered by <strong>${collegeName}</strong> on <strong>Nexify Examina</strong>.${examKey ? ' You have also been assigned to an upcoming proctored examination.' : ' Use the credentials below to access your student examination portal.'}`;

  const content = `
    <div style="display: inline-block; padding: 4px 12px; border-radius: 4px; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 16px;">
      ${isReset ? 'Account Security Notice' : (examKey ? 'Examination Access Issued' : 'Candidate Account Registered')}
    </div>

    <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0f2744; letter-spacing: -0.2px;">
      ${isReset ? 'Password Updated' : 'Examination Invitation & Access Credentials'}
    </h2>

    <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b; font-weight: 600;">
      Dear ${name || 'Candidate'},
    </p>

    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.65; color: #334155;">
      ${actionNotice}
    </p>

    <!-- Student Login Credentials Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 24px; padding: 18px 20px;">
      <tr>
        <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Conducting Academic Institution</div>
          <div style="font-size: 15px; font-weight: 700; color: #0f2744; margin-top: 3px;">${collegeName}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Candidate Student ID</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f2744; margin-top: 3px; font-family: monospace;">${studentId}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Registered Institutional Email</div>
          <div style="font-size: 14px; color: #0f2744; margin-top: 3px; font-weight: 500;">${email}</div>
        </td>
      </tr>
      <tr>
        <td style="padding-top: 12px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${isReset ? 'Updated Password' : 'Temporary Password'}</div>
          <div style="margin-top: 6px;">
            <span style="display: inline-block; background-color: #0f2744; color: #ffffff; padding: 6px 14px; border-radius: 4px; font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">${password}</span>
          </div>
        </td>
      </tr>
    </table>

    ${examKey ? `
    <!-- Scheduled Examination Details Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; margin: 0 0 24px; padding: 18px 20px;">
      <tr>
        <td>
          <div style="font-size: 11px; font-weight: 700; color: #0f2744; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
            Scheduled Examination Details
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #0f2744; margin-bottom: 8px;">${examName || 'Scheduled Examination'}</div>
          ${subject ? `<div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Subject:</strong> ${subject}</div>` : ''}
          ${formattedDate ? `<div style="font-size: 13px; color: #475569; margin-bottom: 4px;"><strong>Scheduled Time:</strong> ${formattedDate} (IST)</div>` : ''}
          ${examDuration ? `<div style="font-size: 13px; color: #475569; margin-bottom: 16px;"><strong>Duration:</strong> ${examDuration} Minutes</div>` : ''}
          
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border: 1.5px dashed #2563eb; border-radius: 6px; padding: 14px; text-align: center;">
            <tr>
              <td align="center">
                <div style="font-size: 10px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.08em;">Your Unique Exam Access Key</div>
                <div style="font-size: 24px; font-weight: 800; color: #1e3a8a; font-family: monospace; letter-spacing: 2px; margin-top: 4px;">${examKey}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Call to Action Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 6px; background-color: #0f2744;">
                <a href="${safeHref}" target="_blank" style="background-color: #0f2744; border: 1px solid #0f2744; border-radius: 6px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; line-height: 1.2; padding: 14px 36px; text-decoration: none; text-align: center; -webkit-text-size-adjust: none;">
                  Access Your Examination &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Direct URL Fallback -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
        If you experience any issues clicking the button, copy and paste this URL into your browser:<br>
        <a href="${safeHref}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all; font-size: 11px;">${effectiveLoginUrl}</a>
      </p>
    </div>

    <!-- Candidate Guidelines & System Requirements -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 3px solid #1e3a8a; border-radius: 0 6px 6px 0; padding: 14px 16px; margin: 10px 0 0;">
      <tr>
        <td>
          <div style="font-size: 11px; font-weight: 700; color: #0f2744; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Important Examination Guidelines:</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
            <li>Use a desktop or laptop computer with a functioning webcam and microphone.</li>
            <li>Connect to a stable high-speed internet connection prior to starting.</li>
            ${examKey ? `<li>Keep your <strong>Exam Access Key (${examKey})</strong> ready to unlock the assessment.</li>` : ''}
            <li>Remain in full-screen mode; tab switching or external monitors are strictly prohibited by the monitoring system.</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  const subjectLine = isReset
    ? `[Nexify Examina] Password Updated — ${collegeName}`
    : (examKey
        ? `[Nexify Examina] Examination Invitation & Credentials — ${collegeName}`
        : `[Nexify Examina] Student Account Credentials — ${collegeName}`);

  const plainText = [
    `NEXIFY EXAMINA (ONLINE EXAMINATION PLATFORM)`,
    `Developed and powered by Nexify Forge Technologies (https://nexifyforge.in)`,
    `ORGANIZED & CONDUCTED BY: ${collegeName}`,
    `==================================================`,
    ``,
    `Dear ${name || 'Candidate'},`,
    ``,
    actionNotice.replace(/<[^>]*>?/gm, ''),
    ``,
    `YOUR PORTAL LOGIN CREDENTIALS:`,
    `- Conducting Institution: ${collegeName}`,
    `- Student ID: ${studentId}`,
    `- Registered Email: ${email}`,
    `- ${isReset ? 'Updated Password' : 'Temporary Password'}: ${password}`,
    examKey ? `- Exam Access Key: ${examKey}` : '',
    examName ? `- Scheduled Exam: ${examName}` : '',
    formattedDate ? `- Date & Time: ${formattedDate} (IST)` : '',
    examDuration ? `- Duration: ${examDuration} Minutes` : '',
    ``,
    `Access Your Examination URL: ${effectiveLoginUrl}`,
    ``,
    `EXAMINATION GUIDELINES:`,
    `1. Use a computer equipped with a functional webcam and microphone.`,
    `2. Ensure a reliable high-speed internet connection.`,
    examKey ? `3. Enter your Exam Access Key (${examKey}) to start your test.` : '',
    `4. Tab switching and external applications are monitored and flagged.`,
    ``,
    `--------------------------------------------------`,
    `Nexify Examina is an intelligent examination platform developed and powered by Nexify Forge.`,
    `Conducting Institution: ${collegeName}`,
    `Website: https://nexifyforge.in | Examination Portal: ${effectiveLoginUrl}`
  ].filter(Boolean).join('\n');

  await sendWithRetry({
    to: email,
    subject: subjectLine,
    text: plainText,
    html: baseTemplate(content, {
      title: subjectLine,
      collegeName,
      preheader: `Your examination credentials for ${collegeName} on Nexify Examina`
    }),
  }, 3, 3000);

  logger.info(`Credentials email dispatched to ${email} for ${collegeName}`);
};

/**
 * Send exam notification to student
 */
const sendExamNotification = async ({ 
  name, 
  email, 
  examName, 
  examDate, 
  examDuration, 
  examKey, 
  subject, 
  type, 
  loginUrl, 
  collegeName: rawCollegeName,
  collegeId,
  examId,
  studentId
}) => {
  if (!examKey || examKey === 'N/A') {
    throw new Error('Valid exam key is required for email notification');
  }

  // Dynamically resolve college name from database if not explicitly provided
  const collegeName = await resolveCollegeNameFromDb({
    collegeName: rawCollegeName,
    collegeId,
    examId,
    examKey,
    studentId,
    studentEmail: email
  });

  const effectiveLoginUrl = resolveStudentLoginUrl(loginUrl, examKey, email);
  const safeHref = effectiveLoginUrl.replace(/&/g, '&amp;');

  const formattedDate = new Date(examDate).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  });

  const content = `
    <div style="display: inline-block; padding: 4px 12px; border-radius: 4px; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 16px;">
      EXAMINATION INVITATION
    </div>

    <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0f2744; letter-spacing: -0.2px;">
      Examination Invitation
    </h2>

    <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b; font-weight: 600;">
      Dear ${name || 'Candidate'},
    </p>

    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.65; color: #334155;">
      You are officially invited by <strong>${collegeName}</strong> to take your scheduled examination on <strong>Nexify Examina</strong>. Please review your examination details and instructions below.
    </p>

    <!-- Structured Examination Information Section -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
        Examination Details
      </div>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155;">
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; width: 40%; color: #64748b;"><strong>Exam Title:</strong></td>
          <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f2744;">${examName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Conducting College:</strong></td>
          <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f2744;">${collegeName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Subject / Paper:</strong></td>
          <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f2744;">${subject || 'General Assessment'}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Candidate Name:</strong></td>
          <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f2744;">${name || 'Candidate'}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Assessment Format:</strong></td>
          <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #2563eb;">${String(type || 'proctored').toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Date &amp; Scheduled Time:</strong></td>
          <td align="right" style="padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f2744;">${formattedDate} (IST)</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #64748b;"><strong>Session Duration:</strong></td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0f2744;">${examDuration} Minutes</td>
        </tr>
      </table>

      <!-- Exam Key Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border: 1.5px dashed #2563eb; border-radius: 6px; padding: 14px; text-align: center; margin-top: 16px;">
        <tr>
          <td align="center">
            <div style="font-size: 10px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.08em;">Your Confidential Exam Access Key</div>
            <div style="font-size: 24px; font-weight: 800; color: #1e3a8a; font-family: monospace; letter-spacing: 2px; margin-top: 4px;">${examKey}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">Enter this key when prompted in the examination room</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Call to Action Button: Exact user requirement -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 6px; background-color: #0f2744;">
                <a href="${safeHref}" target="_blank" style="background-color: #0f2744; border: 1px solid #0f2744; border-radius: 6px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; line-height: 1.2; padding: 14px 36px; text-decoration: none; text-align: center; -webkit-text-size-adjust: none;">
                  Access Your Examination &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Direct URL Fallback -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
        If you experience any issues clicking the button, copy and paste this URL into your browser:<br>
        <a href="${safeHref}" target="_blank" style="color: #2563eb; text-decoration: underline; word-break: break-all; font-size: 11px;">${effectiveLoginUrl}</a>
      </p>
    </div>

    <!-- Candidate Guidelines & System Requirements -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 3px solid #1e3a8a; border-radius: 0 6px 6px 0; padding: 14px 16px;">
      <tr>
        <td>
          <div style="font-size: 11px; font-weight: 700; color: #0f2744; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Important Candidate Instructions:</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
            <li>Log in at least <strong>10 minutes prior</strong> to the scheduled commencement time.</li>
            <li>Ensure a functional webcam and microphone are connected and authorized in your browser.</li>
            <li>Maintain a stable internet connection in a well-lit, isolated room.</li>
            <li>Tab switching, secondary displays, or background tools will be flagged by the automated integrity monitor.</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  const subjectLine = `[Nexify Examina] Examination Invitation: ${examName} — ${collegeName}`;
  const plainText = [
    `NEXIFY EXAMINA (ONLINE EXAMINATION PLATFORM)`,
    `Developed and powered by Nexify Forge Technologies (https://nexifyforge.in)`,
    `ORGANIZED & CONDUCTED BY: ${collegeName}`,
    `==================================================`,
    `EXAMINATION INVITATION`,
    ``,
    `Dear ${name || 'Candidate'},`,
    ``,
    `You are officially invited by ${collegeName} to take your scheduled examination on Nexify Examina.`,
    ``,
    `EXAMINATION DETAILS:`,
    `- Exam Title: ${examName}`,
    `- Conducting Institution: ${collegeName}`,
    `- Subject: ${subject || 'General Assessment'}`,
    `- Date & Time: ${formattedDate} (IST)`,
    `- Duration: ${examDuration} Minutes`,
    `- Exam Access Key: ${examKey}`,
    ``,
    `Access Your Examination URL: ${effectiveLoginUrl}`,
    ``,
    `INSTRUCTIONS:`,
    `1. Please log in 10 minutes before the exam commences.`,
    `2. Keep your webcam active and avoid tab switching.`,
    ``,
    `Nexify Examina is an intelligent examination platform developed and powered by Nexify Forge.`
  ].join('\n');

  const info = await sendWithRetry({
    to: email,
    subject: subjectLine,
    text: plainText,
    html: baseTemplate(content, {
      title: subjectLine,
      collegeName,
      badgeText: 'EXAMINATION INVITATION',
      preheader: `Exam invitation for ${examName} organized by ${collegeName} on Nexify Examina`
    }),
  });

  logger.info(`Exam notification sent to ${email} for exam ${examName} at ${collegeName}`);
  return { success: true, messageId: info?.messageId };
};

/**
 * Send exam reminder (1 hour before)
 */
const sendExamReminder = async ({ 
  name, 
  email, 
  examName, 
  examDate, 
  examDuration, 
  examKey, 
  loginUrl, 
  collegeName: rawCollegeName,
  collegeId,
  examId,
  studentId
}) => {
  const collegeName = await resolveCollegeNameFromDb({
    collegeName: rawCollegeName,
    collegeId,
    examId,
    examKey,
    studentId,
    studentEmail: email
  });

  const effectiveLoginUrl = resolveStudentLoginUrl(loginUrl, examKey, email);
  const safeHref = effectiveLoginUrl.replace(/&/g, '&amp;');

  const formattedDate = new Date(examDate).toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  });

  const content = `
    <div style="display: inline-block; padding: 4px 12px; border-radius: 4px; background-color: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 16px;">
      FINAL REMINDER &bull; STARTING IN 1 HOUR
    </div>

    <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0f2744;">
      ⏰ Exam Commencing in 1 Hour!
    </h2>

    <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b; font-weight: 600;">
      Dear ${name || 'Candidate'},
    </p>

    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.65; color: #334155;">
      This is a scheduled reminder that your examination <strong>${examName}</strong> organized by <strong>${collegeName}</strong> will commence at <strong>${formattedDate} IST</strong> on <strong>Nexify Examina</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 10px; font-size: 14px; color: #0f2744; text-transform: uppercase; letter-spacing: 0.05em;">Pre-Exam Readiness Checklist</h3>
      <ul style="margin: 0 0 16px; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
        <li>High-speed, stable internet connection active</li>
        <li>Functioning webcam and microphone tested</li>
        <li>Quiet, well-lit examination room</li>
        <li>Chrome or Edge browser updated to latest version</li>
        <li>No other applications, background tabs, or secondary monitors connected</li>
      </ul>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border: 1.5px dashed #2563eb; border-radius: 6px; padding: 14px; text-align: center;">
        <tr>
          <td align="center">
            <div style="font-size: 10px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.08em;">Your Confidential Exam Access Key</div>
            <div style="font-size: 24px; font-weight: 800; color: #1e3a8a; font-family: monospace; letter-spacing: 2px; margin-top: 4px;">${examKey}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Call to Action Button: Exact user requirement -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 6px; background-color: #0f2744;">
                <a href="${safeHref}" target="_blank" style="background-color: #0f2744; border: 1px solid #0f2744; border-radius: 6px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; line-height: 1.2; padding: 14px 36px; text-decoration: none; text-align: center; -webkit-text-size-adjust: none;">
                  Access Your Examination &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 11px; color: #64748b;">
        Direct URL: <a href="${safeHref}" target="_blank" style="color: #2563eb; text-decoration: underline;">${effectiveLoginUrl}</a>
      </p>
    </div>
  `;

  const subjectLine = `[Nexify Examina] ⏰ Reminder: ${examName} starts in 1 hour — ${collegeName}`;
  const plainText = [
    `NEXIFY EXAMINA (ONLINE EXAMINATION PLATFORM)`,
    `Developed and powered by Nexify Forge Technologies (https://nexifyforge.in)`,
    `ORGANIZED & CONDUCTED BY: ${collegeName}`,
    `==================================================`,
    `⏰ REMINDER: Your exam "${examName}" starts in 1 hour at ${formattedDate} IST.`,
    `Exam Access Key: ${examKey}`,
    `Portal URL: ${effectiveLoginUrl}`,
    `Ensure your webcam is working and background apps are closed.`,
    `Nexify Examina is an intelligent examination platform developed and powered by Nexify Forge.`
  ].join('\n');

  await sendWithRetry({
    to: email,
    subject: subjectLine,
    text: plainText,
    html: baseTemplate(content, {
      title: subjectLine,
      collegeName,
      badgeText: 'FINAL REMINDER',
      preheader: `Exam reminder: ${examName} at ${collegeName} starts in 1 hour at ${formattedDate} IST on Nexify Examina`
    }),
  });
};

/**
 * Send result to student
 */
const sendResultNotification = async ({ 
  name, 
  email, 
  examName, 
  marksObtained, 
  totalMarks, 
  percentage, 
  grade, 
  status, 
  loginUrl, 
  collegeName: rawCollegeName,
  collegeId,
  examId,
  studentId
}) => {
  const isPassed = status === 'pass' || status === 'PASSED';
  const statusColor = isPassed ? '#16a34a' : '#dc2626';

  const collegeName = await resolveCollegeNameFromDb({
    collegeName: rawCollegeName,
    collegeId,
    examId,
    studentId,
    studentEmail: email
  });

  const effectiveLoginUrl = resolveStudentLoginUrl(loginUrl, null, email);
  const safeHref = effectiveLoginUrl.replace(/&/g, '&amp;');

  const content = `
    <div style="display: inline-block; padding: 4px 12px; border-radius: 4px; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 16px;">
      OFFICIAL EVALUATION PUBLISHED
    </div>

    <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0f2744;">
      Examination Evaluation Published
    </h2>

    <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b; font-weight: 600;">
      Dear ${name || 'Candidate'},
    </p>

    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.65; color: #334155;">
      The official evaluation for <strong>${examName}</strong> conducted by <strong>${collegeName}</strong> on <strong>Nexify Examina</strong> has been published.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: #0f2744;">${examName}</h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Conducting College:</strong></td>
          <td align="right" style="font-weight: 700; color: #0f2744;">${collegeName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Marks Obtained:</strong></td>
          <td align="right" style="font-weight: 700; color: #0f2744;">${marksObtained} / ${totalMarks}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Percentage:</strong></td>
          <td align="right" style="font-weight: 700; color: #0f2744;">${percentage}%</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Grade:</strong></td>
          <td align="right" style="font-weight: 700; color: #2563eb;">${grade || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-top: 1px solid #e2e8f0; margin-top: 6px; color: #64748b;"><strong>Result Status:</strong></td>
          <td align="right" style="padding: 6px 0; border-top: 1px solid #e2e8f0; font-weight: 800; color: ${statusColor}; text-transform: uppercase;">
            ${status}
          </td>
        </tr>
      </table>
    </div>

    <!-- Call to Action Button: Exact user requirement -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 6px; background-color: #0f2744;">
                <a href="${safeHref}" target="_blank" style="background-color: #0f2744; border: 1px solid #0f2744; border-radius: 6px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; line-height: 1.2; padding: 14px 36px; text-decoration: none; text-align: center; -webkit-text-size-adjust: none;">
                  Access Your Examination &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 11px; color: #64748b;">
        Direct Portal: <a href="${safeHref}" target="_blank" style="color: #2563eb; text-decoration: underline;">${effectiveLoginUrl}</a>
      </p>
    </div>
  `;

  const subjectLine = `[Nexify Examina] Result Published: ${examName} — ${collegeName}`;
  const plainText = [
    `NEXIFY EXAMINA (ONLINE EXAMINATION PLATFORM)`,
    `Developed and powered by Nexify Forge Technologies (https://nexifyforge.in)`,
    `Conducting College: ${collegeName}`,
    `==================================================`,
    `Assessment Result for ${examName}:`,
    `- Marks: ${marksObtained} / ${totalMarks} (${percentage}%)`,
    `- Grade: ${grade || 'N/A'}`,
    `- Status: ${String(status).toUpperCase()}`,
    `View details: ${effectiveLoginUrl}`,
    `Nexify Examina is an intelligent examination platform developed and powered by Nexify Forge.`
  ].join('\n');

  await sendWithRetry({
    to: email,
    subject: subjectLine,
    text: plainText,
    html: baseTemplate(content, {
      title: subjectLine,
      collegeName,
      badgeText: 'RESULT PUBLISHED',
      preheader: `Your result for ${examName} at ${collegeName} on Nexify Examina: ${marksObtained}/${totalMarks} (${String(status).toUpperCase()})`
    }),
  });
};

/**
 * Send college welcome email
 */
const sendCollegeWelcome = async ({ name, email, collegeName }) => {
  const adminLoginUrl = `${resolvePortalBaseUrl()}/admin/login`;
  const safeAdminHref = adminLoginUrl.replace(/&/g, '&amp;');

  const content = `
    <div style="display: inline-block; padding: 4px 12px; border-radius: 4px; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 16px;">
      ENTERPRISE ONBOARDING CONFIRMED
    </div>

    <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #0f2744;">
      Welcome to Nexify Examina, ${name}!
    </h2>

    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.65; color: #334155;">
      <strong>${collegeName}</strong> has been successfully registered and onboarded onto <strong>Nexify Examina</strong> &mdash; Intelligent Examination & Assessment Platform, developed and powered by <strong>Nexify Forge</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 15px; color: #0f2744;">Platform Quick Start Guide for ${collegeName}</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: #475569;">
        <li>Log in to your Institution Admin Cockpit</li>
        <li>Batch enroll candidate rosters via CSV bulk import</li>
        <li>Configure proctored exam sessions (MCQ, Coding, Subjective)</li>
        <li>Monitor candidates with live video streams and AI integrity flags</li>
        <li>Publish evaluated scorecards with automated grade calculations</li>
      </ol>
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 20px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius: 6px; background-color: #0f2744;">
                <a href="${safeAdminHref}" target="_blank" style="background-color: #0f2744; border: 1px solid #0f2744; border-radius: 6px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; line-height: 1.2; padding: 14px 36px; text-decoration: none; text-align: center; -webkit-text-size-adjust: none;">
                  Access Institutional Cockpit &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const subjectLine = `[Nexify Examina] Welcome ${collegeName} — Examination Platform`;
  const plainText = [
    `WELCOME TO NEXIFY EXAMINA`,
    `Institution: ${collegeName}`,
    `Administrator: ${name}`,
    `Admin Login: ${adminLoginUrl}`,
    `Nexify Examina is developed and powered by Nexify Forge (https://nexifyforge.in)`
  ].join('\n');

  await sendWithRetry({
    to: email,
    subject: subjectLine,
    text: plainText,
    html: baseTemplate(content, {
      title: subjectLine,
      collegeName,
      badgeText: 'INSTITUTION ONBOARDING',
      preheader: `Welcome to Nexify Examina (powered by Nexify Forge) for ${collegeName}`
    }),
  });
};

module.exports = {
  sendStudentCredentials,
  sendExamNotification,
  sendExamReminder,
  sendResultNotification,
  sendCollegeWelcome,
  resolveStudentLoginUrl,
  resolvePortalBaseUrl
};
