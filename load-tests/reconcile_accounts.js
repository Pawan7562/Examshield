require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');

async function audit() {
  const examId = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
  try {
    const totalStudents = await pool.query("SELECT count(id) FROM students WHERE email LIKE '%@load.test'");
    const distinctStudentsWithSessions = await pool.query("SELECT count(DISTINCT student_id) FROM exam_sessions WHERE exam_id = $1", [examId]);
    const distinctStudentsWithResults = await pool.query("SELECT count(DISTINCT student_id) FROM results WHERE exam_id = $1", [examId]);
    
    // Students with multiple sessions
    const multiSessions = await pool.query(`
      SELECT s.email, es.student_id, count(es.id) as session_count
      FROM exam_sessions es
      JOIN students s ON es.student_id = s.id
      WHERE es.exam_id = $1
      GROUP BY s.email, es.student_id
      HAVING count(es.id) > 1
    `, [examId]);

    // Check multiple results per student
    const multiResults = await pool.query(`
      SELECT s.email, r.student_id, count(r.id) as result_count
      FROM results r
      JOIN students s ON r.student_id = s.id
      WHERE r.exam_id = $1
      GROUP BY s.email, r.student_id
      HAVING count(r.id) > 1
    `, [examId]);

    // Answers per student breakdown
    const answersBreakdown = await pool.query(`
      SELECT s.email, count(a.id) as answer_count
      FROM answers a
      JOIN students s ON a.student_id = s.id
      WHERE a.exam_id = $1
      GROUP BY s.email
      HAVING count(a.id) != 2
      ORDER BY count(a.id) DESC
    `, [examId]);

    // Check non-load.test data in this exam
    const nonLoadInExam = await pool.query(`
      SELECT s.email, es.id as session_id, es.status, es.started_at, count(a.id) as answer_count
      FROM exam_sessions es
      JOIN students s ON es.student_id = s.id
      LEFT JOIN answers a ON a.session_id = es.id
      WHERE es.exam_id = $1 AND s.email NOT LIKE '%@load.test'
      GROUP BY s.email, es.id, es.status, es.started_at
    `, [examId]);

    // Check non-load.test data changes in total db
    const nonLoadStudents = await pool.query("SELECT count(id) FROM students WHERE email NOT LIKE '%@load.test'");
    const nonLoadResults = await pool.query("SELECT count(r.id) FROM results r JOIN students s ON r.student_id = s.id WHERE s.email NOT LIKE '%@load.test'");

    // Grade validation for all load test students
    const gradeValidation = await pool.query(`
      SELECT 
        count(r.id) as total_results,
        min(r.marks_obtained) as min_score,
        max(r.marks_obtained) as max_score,
        round(avg(r.marks_obtained)::numeric, 2) as avg_score,
        count(CASE WHEN r.status = 'pass' THEN 1 END) as pass_count,
        count(CASE WHEN r.status = 'fail' THEN 1 END) as fail_count,
        count(CASE WHEN r.marks_obtained IS NULL THEN 1 END) as null_scores,
        count(CASE WHEN r.percentage IS NULL THEN 1 END) as null_percentages
      FROM results r
      JOIN students s ON r.student_id = s.id
      WHERE r.exam_id = $1 AND s.email LIKE '%@load.test'
    `, [examId]);

    // Total sessions and results
    const totalSessions = await pool.query("SELECT count(id) FROM exam_sessions WHERE exam_id = $1", [examId]);
    const totalResults = await pool.query("SELECT count(id) FROM results WHERE exam_id = $1", [examId]);
    const totalAnswers = await pool.query("SELECT count(id) FROM answers WHERE exam_id = $1", [examId]);

    // Question count in exam
    const qCount = await pool.query("SELECT id, type, marks FROM questions WHERE exam_id = $1", [examId]);

    console.log(JSON.stringify({
      totalLoadTestStudents: parseInt(totalStudents.rows[0].count),
      totalExamSessions: parseInt(totalSessions.rows[0].count),
      distinctStudentsWithSessions: parseInt(distinctStudentsWithSessions.rows[0].count),
      totalExamResults: parseInt(totalResults.rows[0].count),
      distinctStudentsWithResults: parseInt(distinctStudentsWithResults.rows[0].count),
      totalAnswersInExam: parseInt(totalAnswers.rows[0].count),
      questionsInExam: qCount.rows,
      studentsWithMultipleSessions: multiSessions.rows,
      studentsWithMultipleResults: multiResults.rows,
      studentsWithAbnormalAnswerCounts: answersBreakdown.rows,
      gradeValidation: gradeValidation.rows[0],
      nonLoadInExam: nonLoadInExam.rows,
      nonLoadStudentsCount: parseInt(nonLoadStudents.rows[0].count),
      nonLoadResultsCount: parseInt(nonLoadResults.rows[0].count)
    }, null, 2));

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await pool.end();
  }
}

audit();
