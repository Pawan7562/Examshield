// verify-sinku-flow.js
const jwt = require('jsonwebtoken');
const pool = require('./config/database');

(async () => {
  try {
    const cRes = await pool.query("SELECT id, name, email FROM colleges WHERE email = 'pawankumaryadav75628697@gmail.com'");
    const college = cRes.rows[0];

    const sRes = await pool.query("SELECT id, student_id, name, email FROM students WHERE email = 'sinkukumariyadav7292@gmail.com'");
    const student = sRes.rows[0];
    console.log('Testing student:', student);

    const token = jwt.sign(
      { id: college.id, role: 'college_admin', email: college.email, name: college.name },
      process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456',
      { expiresIn: '1h' }
    );

    console.log(`Calling POST /api/admin/students/${student.id}/resend-credentials ...`);
    const resendRes = await fetch(`http://localhost:5000/api/admin/students/${student.id}/resend-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resendData = await resendRes.json();
    console.log('Resend status:', resendRes.status, resendData);
    const tempPass = resendData.data?.temporaryPassword;
    console.log('Generated Temporary Password:', tempPass);

    console.log('\n--- TESTING LOGIN WITH STUDENT ID ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.student_id,
        password: tempPass
      })
    });
    const loginData = await loginRes.json();
    console.log('Login with Student ID HTTP:', loginRes.status, 'Success:', loginData.success, 'Student Name:', loginData.student?.name);

    console.log('\n--- TESTING LOGIN WITH EMAIL ---');
    const loginRes2 = await fetch('http://localhost:5000/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: student.email,
        password: tempPass
      })
    });
    const loginData2 = await loginRes2.json();
    console.log('Login with Email HTTP:', loginRes2.status, 'Success:', loginData2.success, 'Student Name:', loginData2.student?.name);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
