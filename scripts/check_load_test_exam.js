const { pool } = require('../backend/config/database');

async function checkLoadTestExam() {
  try {
    const examRes = await pool.query(
      "SELECT id, title, exam_code, status FROM exams WHERE id = 'a95d25ff-1d0b-4709-ac58-324dbec1371b' OR exam_code = 'LOADTEST' OR title ILIKE '%load%' LIMIT 5"
    );
    console.log(`Exams found: ${examRes.rows.length}`);
    console.log(JSON.stringify(examRes.rows, null, 2));

    if (examRes.rows.length > 0) {
      const qRes = await pool.query(
        "SELECT id, question_text, type FROM questions WHERE exam_id = $1 LIMIT 5",
        [examRes.rows[0].id]
      );
      console.log(`Questions found for exam: ${qRes.rows.length}`);
      console.log(JSON.stringify(qRes.rows, null, 2));
    }

    await pool.end();
  } catch (err) {
    console.error('Error checking exam:', err.message);
    await pool.end();
  }
}

checkLoadTestExam();
