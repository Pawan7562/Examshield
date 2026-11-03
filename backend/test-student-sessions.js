const { pool } = require('./config/database');

async function checkStudentSessions() {
  try {
    const res = await pool.query(`
      SELECT s.id, s.exam_id, e.title, e.type, s.status, s.started_at, s.submitted_at, s.is_auto_submitted, s.auto_submit_reason
      FROM exam_sessions s
      JOIN exams e ON s.exam_id = e.id
      WHERE s.student_id = '21590169-4c18-4704-91d5-df23b9d70a23'
      ORDER BY s.started_at DESC;
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkStudentSessions();
