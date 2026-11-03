const { query } = require('./config/database');

async function testSubmission() {
  const resultId = '542fda48-c3af-4aa2-a356-1b32f3bdbfa5';
  const collegeId = '69ec2a7e-f3ed-4087-88fd-beee7dfa2c4f';

  const resultRes = await query(
    `SELECT r.*, 
            s.name as student_name, s.email, s.student_id as student_code, s.roll_no, s.department, s.batch,
            COALESCE(e.title, e.name, 'Examination') as exam_title, e.type as exam_type, e.subject as exam_subject,
            COALESCE(NULLIF(r.total_marks, 0), e.total_marks, 100) as exam_total_marks,
            e.passing_marks as exam_passing_marks, e.duration as exam_duration,
            e.date_time as exam_date,
            es.started_at as session_started_at, es.submitted_at as session_submitted_at,
            es.violation_count as session_violation_count, es.is_auto_submitted, es.auto_submit_reason,
            es.ip_address as session_ip, es.browser_info as session_browser
     FROM results r
     JOIN exams e ON r.exam_id = e.id
     JOIN students s ON r.student_id = s.id
     LEFT JOIN exam_sessions es ON r.session_id = es.id
     WHERE r.id = $1 AND e.college_id = $2`,
    [resultId, collegeId]
  );
  console.log('Result query matched:', resultRes.rows.length);
  if (resultRes.rows.length === 0) {
    console.log('Did not match! Checking without college_id:');
    const noCollege = await query('SELECT r.id, e.college_id FROM results r JOIN exams e ON r.exam_id = e.id WHERE r.id = $1', [resultId]);
    console.log('Result actual college_id:', noCollege.rows);
  } else {
    const row = resultRes.rows[0];
    const questionsRes = await query(
      `SELECT 
         q.id as question_id,
         q.question_text,
         q.type as question_type,
         q.options,
         q.correct_answer,
         q.marks as question_marks,
         a.id as answer_id,
         a.selected_option,
         a.answer_text,
         a.code_submission,
         a.marks_obtained as answer_marks_obtained,
         a.is_correct as answer_is_correct
       FROM questions q
       LEFT JOIN answers a ON q.id = a.question_id AND a.student_id = $1 AND a.exam_id = $2
       WHERE q.exam_id = $2`,
      [row.student_id, row.exam_id]
    );
    console.log('Questions found:', questionsRes.rows.length);
    console.log('Sample question with answer:', questionsRes.rows[0]);
  }
  process.exit(0);
}
testSubmission().catch(console.error);
