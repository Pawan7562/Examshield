// test-deliver-credentials.js
const pool = require('./config/database');
const bcrypt = require('bcryptjs');
const { sendStudentCredentials } = require('./services/emailService');

(async () => {
  try {
    const listRes = await pool.query('SELECT student_id, name, email FROM students ORDER BY created_at DESC LIMIT 10');
    console.log('--- RECENT STUDENTS IN DB ---');
    console.table(listRes.rows);

    const studentsToDeliver = [
      { email: 'sachinkumar913595@gmail.com', name: 'Sachin Kumar', password: 'ExamStudent@2026' },
      { email: 'shuklasuraj997@gmail.com', name: 'Suraj', password: 'ExamStudent@2026' }
    ];

    for (const item of studentsToDeliver) {
      console.log(`\n========================================`);
      console.log(`Processing student: ${item.email}`);
      const hashed = await bcrypt.hash(item.password, 12);

      const res = await pool.query(
        'UPDATE students SET password = $1, is_active = true WHERE email = $2 RETURNING id, student_id, name, email',
        [hashed, item.email]
      );

      if (res.rows.length === 0) {
        console.log(`⚠️ Student not found in DB: ${item.email}`);
        continue;
      }

      const s = res.rows[0];
      console.log(`Found student in DB: ID = ${s.student_id}, Name = ${s.name}`);

      console.log(`Sending credentials email to ${s.email}...`);
      await sendStudentCredentials({
        name: s.name || item.name,
        email: s.email,
        studentId: s.student_id,
        password: item.password,
        collegeName: 'ExamShield System',
        loginUrl: 'https://www.exam.nexifyforge.in/student/login',
        examName: 'AI Proctored Examination 2026',
        examKey: 'EXAM-2026-KEY'
      });

      console.log(`✅ Success! Email delivered for: ${s.email} (Student ID: ${s.student_id})`);
    }

    console.log(`\n========================================`);
    console.log('All student credential dispatches completed.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during credential delivery:', err);
    process.exit(1);
  }
})();
