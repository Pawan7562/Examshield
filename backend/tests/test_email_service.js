// tests/test_email_service.js
require('dotenv').config();
const { sendStudentCredentials } = require('../services/emailService');

async function testEmail() {
  console.log('====================================================');
  console.log('🚀 ExamShield Email Service Verification Test');
  console.log('====================================================');
  console.log(`Configured Host:   ${process.env.EMAIL_HOST}`);
  console.log(`Configured Port:   ${process.env.EMAIL_PORT}`);
  console.log(`Configured User:   ${process.env.EMAIL_USER}`);
  console.log(`Configured From:   ${process.env.EMAIL_FROM}`);
  console.log(`Brevo API Key:     ${process.env.BREVO_API_KEY ? 'Present' : 'Not set (using SMTP)'}`);
  console.log('----------------------------------------------------');

  const targetEmail = process.argv[2] || process.env.TEST_EMAIL_RECIPIENT || 'test@nexifyforge.in';

  console.log(`Sending sample student credential notification to: ${targetEmail}`);
  const startTime = Date.now();

  try {
    await sendStudentCredentials({
      name: 'Verification Candidate',
      email: targetEmail,
      studentId: 'STU-TEST-9901',
      password: 'ExamShield@2026!Secure',
      collegeName: 'Apex Institute of Technology & Engineering',
      examName: 'Advanced Data Structures & Algorithms Exam',
      examKey: 'EXAM-2026-X9Z',
      examDate: new Date(Date.now() + 86400000).toISOString(),
      examDuration: 120,
      subject: 'Computer Science',
      isReset: false
    });

    const elapsed = Date.now() - startTime;
    console.log('====================================================');
    console.log(`🎉 SUCCESS! Email dispatched in ${elapsed}ms`);
    console.log(`Check inbox at: ${targetEmail}`);
    console.log('====================================================');
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error('====================================================');
    console.error(`❌ FAILED after ${elapsed}ms:`, err.message);
    console.error('====================================================');
    process.exit(1);
  }
}

testEmail();
