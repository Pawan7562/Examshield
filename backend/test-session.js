const { query } = require('./config/database');

async function run() {
  const res = await query('SELECT id, session_id, student_id, exam_id FROM results LIMIT 5');
  console.log('Results with session_id:', res.rows);
  const exam = await query('SELECT id, college_id FROM exams LIMIT 5');
  console.log('Exams with college_id:', exam.rows);
  process.exit(0);
}
run();
