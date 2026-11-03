const { query } = require('./config/database');

async function inspectSession() {
  const resultId = '7b183e48-f2ba-4f19-87c1-4b59b9aabe80';
  const r = await query('SELECT * FROM results WHERE id = $1', [resultId]);
  console.log('Result 7b183e48:', r.rows[0]);
  if (r.rows.length > 0) {
    const session = await query('SELECT * FROM exam_sessions WHERE id = $1', [r.rows[0].session_id]);
    console.log('Session details:', session.rows[0]);
    const ans = await query('SELECT * FROM answers WHERE session_id = $1', [r.rows[0].session_id]);
    console.log('Answers with session_id:', ans.rows.length);
    const ansByStudent = await query('SELECT * FROM answers WHERE student_id = $1', [r.rows[0].student_id]);
    console.log('Total answers in DB for this student:', ansByStudent.rows.length);
  }
  process.exit(0);
}
inspectSession().catch(console.error);
