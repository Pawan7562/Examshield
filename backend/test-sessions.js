const { pool } = require('./config/database');

async function checkSessions() {
  try {
    const sessions = await pool.query('SELECT id, exam_id, student_id, status, started_at, submitted_at FROM exam_sessions ORDER BY started_at DESC LIMIT 10');
    console.log('Recent exam_sessions:');
    console.table(sessions.rows);

    const exams = await pool.query('SELECT id, title, type, status, duration, total_marks FROM exams ORDER BY created_at DESC LIMIT 5');
    console.log('Recent exams:');
    console.table(exams.rows);

    const answers = await pool.query('SELECT id, session_id, question_id, student_id, selected_language, SUBSTRING(code_submission, 1, 30) as code_snip FROM answers ORDER BY updated_at DESC LIMIT 5');
    console.log('Recent answers:');
    console.table(answers.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkSessions();
