// scripts/prepare_test_exam.js
// Ensures test exam is active, duration is open, and all 10 load test students are assigned
const { pool } = require('../backend/config/database');

async function prepareTestExam() {
  const examId = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
  console.log(`🔧 Preparing test exam ${examId} for active testing...`);

  try {
    // 1. Set exam status to 'published' or 'active', ensure window is open
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await pool.query(`
      UPDATE exams
      SET status = 'published',
          exam_code = '9ZVF3QHP',
          duration = 180,
          date_time = NOW() - INTERVAL '10 minutes'
      WHERE id = $1
    `, [examId]);
    console.log('✅ Exam status updated to published with open duration window.');

    // 2. Fetch 10 load test students
    const studentsRes = await pool.query(`
      SELECT id FROM students WHERE email LIKE '%@load.test' ORDER BY id ASC LIMIT 10
    `);
    const studentIds = studentsRes.rows.map(r => r.id);
    console.log(`✅ Loaded ${studentIds.length} test student IDs.`);

    // 3. Clear any old completed exam sessions or results for these test students on this exam
    await pool.query(`
      DELETE FROM answers WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [examId, studentIds]);

    await pool.query(`
      DELETE FROM results WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [examId, studentIds]);

    await pool.query(`
      DELETE FROM exam_sessions WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [examId, studentIds]);

    console.log('✅ Cleaned previous test sessions & results.');

    // 4. Ensure students are assigned in exam_assignments
    for (const sId of studentIds) {
      await pool.query(`
        INSERT INTO exam_assignments (exam_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [examId, sId]);
    }
    console.log('✅ Exam assignments verified for all 10 test students.');

    console.log('🎉 Staging exam is 100% ready for lifecycle test!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error preparing exam:', err.message);
    await pool.end();
    process.exit(1);
  }
}

prepareTestExam();
