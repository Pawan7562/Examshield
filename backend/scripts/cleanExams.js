// cleanExams.js - Safely wipe all conducted exams, sessions, questions, answers, and results
const { pool } = require('../config/database');

async function cleanExams() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting transaction to clean all exam data...');
    await client.query('BEGIN');

    // 1. Delete answers
    const ansRes = await client.query('DELETE FROM answers');
    console.log(`✅ Deleted answers: ${ansRes.rowCount}`);

    // 2. Delete violations
    const violRes = await client.query('DELETE FROM violations');
    console.log(`✅ Deleted violations: ${violRes.rowCount}`);

    // 3. Delete results
    const resRes = await client.query('DELETE FROM results');
    console.log(`✅ Deleted results: ${resRes.rowCount}`);

    // 4. Delete exam_sessions
    const sessRes = await client.query('DELETE FROM exam_sessions');
    console.log(`✅ Deleted exam_sessions: ${sessRes.rowCount}`);

    // 5. Delete student_question_sets
    const sqsRes = await client.query('DELETE FROM student_question_sets');
    console.log(`✅ Deleted student_question_sets: ${sqsRes.rowCount}`);

    // 6. Delete exam_questions
    const eqRes = await client.query('DELETE FROM exam_questions');
    console.log(`✅ Deleted exam_questions: ${eqRes.rowCount}`);

    // 7. Delete questions
    const qRes = await client.query('DELETE FROM questions');
    console.log(`✅ Deleted questions: ${qRes.rowCount}`);

    // 8. Delete exam_assignments
    const eaRes = await client.query('DELETE FROM exam_assignments');
    console.log(`✅ Deleted exam_assignments: ${eaRes.rowCount}`);

    // 9. Delete exam_students
    const esRes = await client.query('DELETE FROM exam_students');
    console.log(`✅ Deleted exam_students: ${esRes.rowCount}`);

    // 10. Delete notifications related to exams/results
    const notifRes = await client.query("DELETE FROM notifications WHERE type IN ('exam', 'result')");
    console.log(`✅ Deleted exam-related notifications: ${notifRes.rowCount}`);

    // 11. Delete exams
    const examsRes = await client.query('DELETE FROM exams');
    console.log(`✅ Deleted exams: ${examsRes.rowCount}`);

    // 12. Delete audit_logs related to exams
    const auditRes = await client.query("DELETE FROM audit_logs WHERE resource_type = 'exam' OR action ILIKE '%exam%'");
    console.log(`✅ Deleted exam audit_logs: ${auditRes.rowCount}`);

    await client.query('COMMIT');
    console.log('🎉 ALL EXAM DATA CLEANED SUCCESSFULLY! Dashboard reset to fresh state.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup, transaction rolled back:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanExams();
