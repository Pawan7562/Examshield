require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function verifyCompleteFlow() {
  console.log('====================================================');
  console.log('🚀 TESTING FULL END-TO-END FLOW:');
  console.log('   Student Creation → Credential Generation → Email Delivery → Student Login');
  console.log('====================================================\n');

  const collegeId = '69ec2a7e-f3ed-4087-88fd-beee7dfa2c4f'; // CGC University
  const adminToken = jwt.sign({
    id: collegeId,
    role: 'college_admin',
    email: 'pawankumaryadav75628697@gmail.com',
    name: 'CGC University'
  }, process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456', { expiresIn: '1d' });

  const testEmail = `e2e_student_${Date.now()}@gmail.com`;
  const testRoll = `RL${Date.now().toString().slice(-5)}`;
  const testName = 'E2E Verified Student';

  // STEP 1: Add student via Admin API
  console.log('1️⃣ Step 1: Admin adds student via POST /api/admin/students...');
  const addRes = await fetch('http://localhost:5000/api/admin/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      rollNo: testRoll,
      department: 'Computer Science',
      batch: '2026'
    })
  });

  const addData = await addRes.json();
  console.log('Add Student Response:', addData);

  if (!addData.success) {
    throw new Error('Failed to add student: ' + JSON.stringify(addData));
  }

  const { student_id, password, emailSent, exam_key, id: studentUuid } = addData.data;
  console.log(`\n✅ Student Created Successfully!`);
  console.log(`   UUID: ${studentUuid}`);
  console.log(`   Student ID: ${student_id}`);
  console.log(`   Generated Password: ${password}`);
  console.log(`   Email Sent Status: ${emailSent}`);
  console.log(`   Exam Key: ${exam_key || 'None'}`);

  if (!student_id || !password) {
    throw new Error('Student ID or password was not generated!');
  }

  // STEP 2: Verify in Neon Database
  console.log('\n2️⃣ Step 2: Verifying database record in PostgreSQL...');
  const dbCheck = await pool.query(
    'SELECT id, student_id, name, email, roll_no, password, is_active FROM students WHERE id = $1',
    [studentUuid]
  );

  const dbStudent = dbCheck.rows[0];
  if (!dbStudent) {
    throw new Error('Student not found in PostgreSQL database!');
  }
  console.log(`✅ DB record verified: ID = ${dbStudent.student_id}, is_active = ${dbStudent.is_active}`);

  // Verify password hash matches
  const hashMatches = await bcrypt.compare(password, dbStudent.password);
  console.log(`✅ Password hash matches plaintext password: ${hashMatches}`);
  if (!hashMatches) {
    throw new Error('Stored password hash does not match generated password!');
  }

  // STEP 3: Test Student Login via Student ID
  console.log('\n3️⃣ Step 3: Testing Student Login with Student ID + Password...');
  const loginRes1 = await fetch('http://localhost:5000/api/auth/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: student_id,
      password: password
    })
  });

  const loginData1 = await loginRes1.json();
  console.log('Login with Student ID Response:', loginData1);

  if (!loginData1.success || !loginData1.data?.accessToken) {
    throw new Error('Login with Student ID failed: ' + JSON.stringify(loginData1));
  }
  console.log(`✅ Student ID login successful! AccessToken generated.`);

  // STEP 4: Test Student Login via Email
  console.log('\n4️⃣ Step 4: Testing Student Login with Email + Password...');
  const loginRes2 = await fetch('http://localhost:5000/api/auth/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: password
    })
  });

  const loginData2 = await loginRes2.json();
  console.log('Login with Email Response:', loginData2);

  if (!loginData2.success || !loginData2.data?.accessToken) {
    throw new Error('Login with Email failed: ' + JSON.stringify(loginData2));
  }
  console.log(`✅ Email login successful! Student details returned.`);

  // STEP 5: Test Resend Credentials Endpoint
  console.log('\n5️⃣ Step 5: Testing Admin Resend Credentials Endpoint...');
  const resendRes = await fetch(`http://localhost:5000/api/admin/students/${studentUuid}/resend-credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const resendData = await resendRes.json();
  console.log('Resend Response:', resendData);
  if (!resendData.success) {
    throw new Error('Resend credentials failed: ' + JSON.stringify(resendData));
  }
  console.log(`✅ Resend credentials successful! New password: ${resendData.data?.temporaryPassword}`);

  // Test login with the newly generated password from resend
  console.log('\n6️⃣ Step 6: Testing Login with New Resent Password...');
  const loginRes3 = await fetch('http://localhost:5000/api/auth/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: student_id,
      password: resendData.data.temporaryPassword
    })
  });

  const loginData3 = await loginRes3.json();
  if (!loginData3.success) {
    throw new Error('Login with new resent password failed: ' + JSON.stringify(loginData3));
  }
  console.log(`✅ Login with new resent password successful!`);

  console.log('\n====================================================');
  console.log('🎉 ALL 6 VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

verifyCompleteFlow().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  process.exit(1);
});
