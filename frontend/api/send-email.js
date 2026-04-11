const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // 1. Setup CORS to allow Render backend to call this function
  res.setHeader('Access-Control-Allow-Credentials', true);
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

    // 2. Simple security check so random bots can't abuse the relay
    if (internalSecret !== 'examshield-secure-relay-9921') {
      return res.status(401).json({ success: false, message: 'Unauthorized Relay Access' });
    }

    if (!user || !pass || !mailOptions) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log(`[Vercel Relay] Sending email to ${mailOptions.to} via ${host}:${port}`);

    // 3. Create SMTP Transporter natively in Vercel
    // Vercel does NOT block port 587/465, unlike Render.
    const transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    // 4. Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Vercel Relay] Success: ${info.messageId}`);
    
    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('[Vercel Relay] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message, code: error.code });
  }
}
