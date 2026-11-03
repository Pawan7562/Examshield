const { pool } = require('../backend/config/database');

async function check() {
  const examId = '47b1e442-d797-4253-b506-99c170c5d702';
  const exam = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
  console.log('Exam:', exam.rows[0]);

  const ea = await pool.query('SELECT * FROM exam_assignments WHERE exam_id = $1', [examId]);
  console.log('Assignments count:', ea.rowCount, ea.rows);

  const es = await pool.query('SELECT * FROM exam_sessions WHERE exam_id = $1', [examId]);
  console.log('Sessions count:', es.rowCount, es.rows);

  const q = await pool.query('SELECT count(*) FROM questions WHERE exam_id = $1', [examId]);
  console.log('Questions count:', q.rows[0].count);

  process.exit(0);
}

check();
