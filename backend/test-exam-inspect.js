const { pool } = require('./config/database');

async function inspect() {
  try {
    const exams = await pool.query("SELECT id, title, type FROM exams WHERE type = 'coding' ORDER BY created_at DESC LIMIT 5");
    console.log('Coding exams:');
    console.table(exams.rows);

    if (exams.rows.length > 0) {
      const examId = exams.rows[0].id;
      const q = await pool.query("SELECT id, exam_id, question_text, type, marks FROM questions WHERE exam_id = $1", [examId]);
      console.log(`Questions for coding exam ${examId}:`);
      console.table(q.rows);

      const s = await pool.query("SELECT * FROM exam_sessions WHERE exam_id = $1", [examId]);
      console.log(`Sessions for coding exam ${examId}:`);
      console.table(s.rows);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

inspect();
