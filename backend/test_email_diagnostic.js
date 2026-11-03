require('dotenv').config();
const { sendStudentCredentials } = require('./services/emailService');

async function test() {
  const targetEmail = process.argv[2] || 'sinkukumariyadav7292@gmail.com';
  console.log('Testing email dispatch to:', targetEmail);
  try {
    const res = await sendStudentCredentials({
      name: 'Diagnostic Test Student',
      email: targetEmail,
      studentId: 'ES-2026-TEST01',
      password: 'TestPassword123#',
      collegeName: 'CGC University',
      loginUrl: 'http://localhost:3000/student/login'
    });
    console.log('✅ Send succeeded! Result:', res);
  } catch (err) {
    console.error('❌ Send failed! Error:', err);
  }
}

test();
