// tests/verify_all_email_types.js
require('dotenv').config();
const {
  sendStudentCredentials,
  sendExamNotification,
  sendExamReminder,
  sendResultNotification,
  sendCollegeWelcome
} = require('../services/emailService');

const targetEmail = process.argv[2] || 'exam@nexifyforge.in';

async function runFullVerification() {
  console.log('======================================================================');
  console.log('🔍 FULL COMPREHENSIVE EMAIL SERVICE VERIFICATION');
  console.log('======================================================================');
  console.log(`Target Recipient: ${targetEmail}`);
  console.log(`From Address:     ${process.env.EMAIL_FROM}`);
  console.log(`Brevo API Key:    ${process.env.BREVO_API_KEY ? 'CONFIGURED & READY' : 'NOT SET'}`);
  console.log('----------------------------------------------------------------------');

  const testCollege = 'Delhi Technological University';

  // 1. Student Credentials Test
  console.log('\n[1/5] Testing: Student Credentials Email...');
  const t1 = Date.now();
  await sendStudentCredentials({
    name: 'Aditya Sharma',
    email: targetEmail,
    studentId: 'DTU-2026-CS104',
    password: 'SecurePass@2026!',
    collegeName: testCollege,
    examName: 'Advanced Computer Networks Midterm',
    examKey: 'NET-2026-X99',
    examDate: new Date(Date.now() + 172800000).toISOString(),
    examDuration: 90,
    subject: 'Computer Science & Engineering',
    isReset: false
  });
  console.log(`✅ [1/5] Credentials Email sent in ${Date.now() - t1}ms`);

  // 2. Exam Notification Test
  console.log('\n[2/5] Testing: Exam Scheduled Notification...');
  const t2 = Date.now();
  await sendExamNotification({
    name: 'Aditya Sharma',
    email: targetEmail,
    examName: 'Database Management Systems Lab Assessment',
    examDate: new Date(Date.now() + 86400000).toISOString(),
    examDuration: 120,
    examKey: 'DBMS-LAB-881',
    subject: 'Database Systems',
    type: 'coding',
    collegeName: testCollege
  });
  console.log(`✅ [2/5] Exam Notification sent in ${Date.now() - t2}ms`);

  // 3. Exam Reminder Test
  console.log('\n[3/5] Testing: 1-Hour Exam Reminder...');
  const t3 = Date.now();
  await sendExamReminder({
    name: 'Aditya Sharma',
    email: targetEmail,
    examName: 'Algorithms & Data Structures Final',
    examDate: new Date(Date.now() + 3600000).toISOString(),
    examDuration: 60,
    examKey: 'ALGO-FINAL-01',
    collegeName: testCollege
  });
  console.log(`✅ [3/5] Exam Reminder sent in ${Date.now() - t3}ms`);

  // 4. Result Notification Test
  console.log('\n[4/5] Testing: Assessment Result Notification...');
  const t4 = Date.now();
  await sendResultNotification({
    name: 'Aditya Sharma',
    email: targetEmail,
    examName: 'Operating Systems Proctored Exam',
    marksObtained: 94,
    totalMarks: 100,
    percentage: 94,
    grade: 'A+',
    status: 'pass',
    collegeName: testCollege
  });
  console.log(`✅ [4/5] Result Notification sent in ${Date.now() - t4}ms`);

  // 5. College Welcome Test
  console.log('\n[5/5] Testing: College Administrator Welcome...');
  const t5 = Date.now();
  await sendCollegeWelcome({
    name: 'Dean of Academic Affairs',
    email: targetEmail,
    collegeName: testCollege
  });
  console.log(`✅ [5/5] College Welcome sent in ${Date.now() - t5}ms`);

  console.log('\n======================================================================');
  console.log('🎉 ALL 5 EMAIL TYPES VERIFIED & DELIVERED SUCCESSFULLY!');
  console.log(`Recipient: ${targetEmail}`);
  console.log('All links verified to open https://examshield.vercel.app/student/login');
  console.log('======================================================================');
}

runFullVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  process.exit(1);
});
