// api/send-email.js — Vercel Serverless Function (Email Relay)
// Uses CommonJS module syntax (no "export default") for Vercel compatibility
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // CORS headers so Render backend can POST to this function
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { internalSecret, mailOptions, host, port, user, pass } = req.body;

    // Simple security guard
    if (internalSecret !== 'examshield-secure-relay-9921') {
      return res.status(401).json({ success: false, message: 'Unauthorized Relay Access' });
    }

    if (!mailOptions || !mailOptions.to || !mailOptions.subject || !mailOptions.html) {
      return res.status(400).json({ success: false, message: 'Missing required mailOptions fields' });
    }

    // Resolve SMTP credentials — prefer request body, fall back to env vars
    const smtpHost = host || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(port) || parseInt(process.env.EMAIL_PORT) || 587;
    const smtpUser = user || process.env.EMAIL_USER;
    const smtpPass = pass || process.env.EMAIL_PASS;

    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ success: false, message: 'SMTP credentials missing' });
    }

    console.log(`[Vercel Relay] Sending to ${mailOptions.to} via ${smtpHost}:${smtpPort}`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for SSL; STARTTLS for 587
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    // Ensure a proper "from" address
    const from =
      mailOptions.from ||
      process.env.EMAIL_FROM ||
      `ExamShield <${smtpUser}>`;

    const info = await transporter.sendMail({ ...mailOptions, from });
    console.log(`[Vercel Relay] ✅ Success: ${info.messageId}`);

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('[Vercel Relay] ❌ Error:', error.message, '| code:', error.code);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN',
    });
  }
};
