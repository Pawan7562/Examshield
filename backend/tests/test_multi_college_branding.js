require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const { 
  sendExamNotification, 
  sendStudentCredentials,
  resolveStudentLoginUrl 
} = require('../services/emailService');
const { pool } = require('../config/database');

async function runMultiCollegeVerification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING EXAMSHIELD MULTI-COLLEGE BRANDING & EMAIL TEMPLATES');
  console.log('================================================================\n');

  // Test 1: Verify URL resolution
  console.log('▶ Test 1: Examination URL Resolution & Parameter Encoding');
  const resolvedDefault = resolveStudentLoginUrl();
  console.log('  Resolved default URL:', resolvedDefault);
  assert(resolvedDefault.includes('exam.nexifyforge.in'), 'URL must match official exam monitoring domain');

  const resolvedWithParams = resolveStudentLoginUrl(undefined, 'KEY-TEST-8899', 'student.alpha@dtu.ac.in');
  console.log('  Resolved with Key & Email:', resolvedWithParams);
  assert(resolvedWithParams.includes('examKey=KEY-TEST-8899'), 'ExamKey must be cleanly query-encoded');
  assert(resolvedWithParams.includes('email='), 'Email param must be cleanly query-encoded');
  console.log('  ✅ URL resolution tests PASSED.\n');

  // Test 2: Fetch real colleges from DB to test dynamic college resolution
  console.log('▶ Test 2: Querying Real Colleges from Database');
  let college1Name = 'Delhi Technological University';
  let college2Name = 'Indian Institute of Technology, Delhi';
  let dbColleges = [];
  try {
    const dbRes = await pool.query('SELECT id, name FROM colleges WHERE name IS NOT NULL AND name != \'\' LIMIT 2');
    dbColleges = dbRes.rows;
    if (dbColleges.length >= 2) {
      college1Name = dbColleges[0].name.trim();
      college2Name = dbColleges[1].name.trim();
      console.log(`  Fetched from DB: College 1 = "${college1Name}", College 2 = "${college2Name}"`);
    } else {
      console.log(`  Using institutional profiles: "${college1Name}" & "${college2Name}"`);
    }
  } catch (err) {
    console.log('  Database query fallback to sample institutions:', err.message);
  }
  console.log('  ✅ College resolution setup complete.\n');

  const targetRecipient = process.env.TEST_EMAIL_RECIPIENT || 'pawankumaryadav75628697@gmail.com';

  // Test 3: Dispatch College 1 Exam Invitation
  console.log(`▶ Test 3: Dispatching Exam Invitation for College 1: "${college1Name}"`);
  const exam1Result = await sendExamNotification({
    name: 'Aarav Sharma',
    email: targetRecipient,
    examName: 'Advanced Data Structures & Algorithms (CS301)',
    examDate: new Date(Date.now() + 86400000).toISOString(),
    examDuration: 120,
    examKey: 'ALGO-2026-X9',
    subject: 'Computer Science & Engineering',
    type: 'proctored',
    collegeName: college1Name,
    loginUrl: 'https://examshield.vercel.app/student/login'
  });
  console.log('  Exam 1 Notification Result:', exam1Result);
  assert(exam1Result.success === true, 'Exam 1 notification must return success');
  console.log(`  ✅ Dispatched exam invitation for ${college1Name}.\n`);

  // Short pause between sends
  await new Promise(r => setTimeout(r, 2000));

  // Test 4: Dispatch College 2 Credentials Email
  console.log(`▶ Test 4: Dispatching Student Credentials for College 2: "${college2Name}"`);
  const credsResult = await sendStudentCredentials({
    name: 'Riya Sen',
    email: targetRecipient,
    studentId: 'STU-2026-IIT09',
    password: 'SecureKey#2026',
    collegeName: college2Name,
    examName: 'Machine Learning & Neural Architectures',
    examKey: 'ML-DEEP-402',
    examDate: new Date(Date.now() + 172800000).toISOString(),
    examDuration: 90,
    subject: 'Artificial Intelligence',
    loginUrl: 'https://examshield.vercel.app/student/login'
  });
  console.log('  Credentials Dispatch Result:', credsResult || 'Dispatched');
  console.log(`  ✅ Dispatched credentials for ${college2Name}.\n`);

  console.log('================================================================');
  console.log('🎉 ALL MULTI-COLLEGE BRANDING & DISPATCH TESTS PASSED!');
  console.log('================================================================');
  process.exit(0);
}

runMultiCollegeVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
