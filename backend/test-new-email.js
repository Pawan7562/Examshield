require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔧 Testing new Gmail credentials...');
  console.log('USER:', process.env.EMAIL_USER);
  console.log('PASS (first 4 chars):', (process.env.EMAIL_PASS || '').substring(0, 4) + '...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || '').trim(),
    },
    connectionTimeout: 20000,
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'ExamShield Test Email - ' + new Date().toISOString(),
      text: 'This is a test email from ExamShield to verify the new Gmail App Password works correctly.',
      html: '<p>✅ <b>ExamShield test email</b> — Gmail App Password is working correctly!</p><p>Time: ' + new Date().toLocaleString('en-IN') + '</p>',
    });

    console.log('✅ Test email sent! Message ID:', info.messageId);
    console.log('📬 Check your inbox at:', process.env.EMAIL_USER);
  } catch (err) {
    console.error('❌ Email test failed:', err.message);
    console.error('Code:', err.code);
    if (err.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed! Steps to fix:');
      console.error('  1. Go to https://myaccount.google.com/apppasswords');
      console.error('  2. Create a new App Password for "Mail" > "Other"');
      console.error('  3. Update EMAIL_PASS in .env with the 16-char password (with spaces)');
    }
  }
  process.exit(0);
}

testEmail();
