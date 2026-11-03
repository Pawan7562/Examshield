require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');

async function reset() {
  const examId = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
  try {
    const res1 = await pool.query("DELETE FROM results WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@load.test') AND exam_id = $1", [examId]);
    const res2 = await pool.query("DELETE FROM answers WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@load.test') AND exam_id = $1", [examId]);
    const res3 = await pool.query("DELETE FROM exam_sessions WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@load.test') AND exam_id = $1", [examId]);

    // Check assignments
    const assignCount = await pool.query("SELECT count(*) FROM exam_assignments ea JOIN students s ON ea.student_id = s.id WHERE s.email LIKE '%@load.test' AND ea.exam_id = $1", [examId]);

    console.log(JSON.stringify({
      deletedResults: res1.rowCount,
      deletedAnswers: res2.rowCount,
      deletedSessions: res3.rowCount,
      assignedStudentsCount: parseInt(assignCount.rows[0].count)
    }, null, 2));

  } catch (err) {
    console.error('Reset error:', err);
  } finally {
    await pool.end();
  }
}

reset();
