const { query } = require('./config/database');

async function check() {
  const resResults = await query(`
    SELECT r.id, r.student_id, r.exam_id, r.marks_obtained, r.status, r.grade,
           s.name as student_name, e.college_id, e.title as exam_title
    FROM results r
    JOIN students s ON r.student_id = s.id
    JOIN exams e ON r.exam_id = e.id
    ORDER BY r.created_at DESC
    LIMIT 5
  `);
  console.log('Results:', resResults.rows);

  for (const r of resResults.rows) {
    const answers = await query(
      'SELECT id, question_id, selected_option, answer_text, code_submission, marks_obtained, is_correct FROM answers WHERE student_id = $1 AND exam_id = $2',
      [r.student_id, r.exam_id]
    );
    console.log(`Answers for result ${r.id} (${r.student_name}):`, answers.rows.length);
    console.log('Sample answer:', answers.rows[0]);
    
    const questions = await query(
      'SELECT id, question_text, type, options, correct_answer, marks FROM questions WHERE exam_id = $1',
      [r.exam_id]
    );
    console.log(`Questions for exam ${r.exam_id}:`, questions.rows.length);
    console.log('Sample question:', questions.rows[0]);
  }
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
