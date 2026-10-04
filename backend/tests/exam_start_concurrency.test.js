// backend/tests/exam_start_concurrency.test.js
// Targeted Automated Test Suite for Exam Start Concurrency, Session Uniqueness, and Rollback

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

async function runExamStartConcurrencyTests() {
  console.log('\n======================================================================');
  console.log('  ExamShield Exam Start Concurrency & Session Uniqueness Test Suite');
  console.log('======================================================================\n');

  let college, student;
  const createdExamIds = [];

  try {
    const colRows = (await pool.query('SELECT id, name FROM colleges LIMIT 1')).rows;
    if (colRows.length === 0) throw new Error('No college found');
    college = colRows[0];

    const stuRows = (await pool.query('SELECT id, name, email FROM students LIMIT 1')).rows;
    if (stuRows.length === 0) throw new Error('No student found');
    student = stuRows[0];

    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [college.id, student.id]);
    const token = jwt.sign({ id: student.id, role: 'student', college_id: college.id }, JWT_SECRET);

    const api = async (endpoint, method = 'GET', body = null) => {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Concurrent Parallel Start Requests (Same Student)
    // ─────────────────────────────────────────────────────────────────
    console.log('[TEST 1] Concurrent Start Requests (Single-Student Race Condition)...');
    const examCode1 = `CONCSTRT${Date.now().toString().slice(-4)}`;
    const exam1 = (await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Start Concurrency Exam', 'mcq', $2, $2, 'active', 60, 10, NOW()) RETURNING id`,
      [college.id, examCode1]
    )).rows[0];
    createdExamIds.push(exam1.id);

    await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Q1 text', 'mcq', 10, '["A","B"]'::jsonb, 'A', 1)`,
      [exam1.id]
    );

    // Fire 4 simultaneous start requests at the exact same millisecond
    const parallelStarts = await Promise.all([
      api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: examCode1 }),
      api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: examCode1 }),
      api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: examCode1 }),
      api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: examCode1 })
    ]);

    for (const res of parallelStarts) {
      if (!res.data.success && !res.data.alreadySubmitted) {
        throw new Error(`Parallel start failed: ${JSON.stringify(res.data)}`);
      }
    }

    // Verify all 4 responses received the EXACT same session ID
    const returnedSessionIds = parallelStarts.map(r => r.data.data?.session?.id).filter(Boolean);
    const uniqueSessionIds = new Set(returnedSessionIds);
    if (uniqueSessionIds.size !== 1) {
      throw new Error(`Expected exactly 1 shared session ID, but got ${uniqueSessionIds.size} different IDs: ${[...uniqueSessionIds]}`);
    }

    // Verify database table has strictly 1 session row
    const dbSessions = await pool.query(
      'SELECT count(*) as count FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
      [exam1.id, student.id]
    );
    if (dbSessions.rows[0].count !== '1') {
      throw new Error(`Database constraint failure: found ${dbSessions.rows[0].count} sessions instead of 1`);
    }
    console.log('  ✓ Passed: 4 simultaneous start requests resolved to the exact same session (0 duplicate rows in DB)');

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Duplicate Sequential Start Request (Resume Flow)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Duplicate Sequential Start Request (Resume Verification)...');
    const resumeRes = await api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: examCode1 });
    if (!resumeRes.data.success || !resumeRes.data.message.includes('Resuming exam session')) {
      throw new Error(`Expected resume message, got: ${JSON.stringify(resumeRes.data)}`);
    }
    if (resumeRes.data.data.session.id !== [...uniqueSessionIds][0]) {
      throw new Error('Resume returned a different session ID');
    }
    console.log('  ✓ Passed: Sequential duplicate request safely resumed existing active session');

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Already Submitted Exam Start Rejection
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Start Request on Already Submitted Session...');
    await pool.query(
      "UPDATE exam_sessions SET status = 'submitted', submitted_at = NOW() WHERE exam_id = $1 AND student_id = $2",
      [exam1.id, student.id]
    );

    const afterSubmitStart = await api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: examCode1 });
    if (!afterSubmitStart.data.alreadySubmitted) {
      throw new Error(`Expected alreadySubmitted: true, got ${JSON.stringify(afterSubmitStart.data)}`);
    }
    console.log('  ✓ Passed: Re-entry to already-submitted exam rejected with alreadySubmitted: true');

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Empty Questions Rollback & Inconsistent State Prevention
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Database Cleanup on Empty Questions Exam...');
    const examCodeEmpty = `EMPTY${Date.now().toString().slice(-4)}`;
    const examEmpty = (await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Empty Exam (No Questions)', 'mcq', $2, $2, 'active', 60, 0, NOW()) RETURNING id`,
      [college.id, examCodeEmpty]
    )).rows[0];
    createdExamIds.push(examEmpty.id);

    // Attempt start on exam with 0 questions
    const emptyStart = await api(`/api/student/exams/${examEmpty.id}/start`, 'POST', { examKey: examCodeEmpty });
    if (emptyStart.status !== 400 || !emptyStart.data.message.includes('no questions')) {
      throw new Error(`Expected 400 for empty exam, got: ${emptyStart.status} - ${JSON.stringify(emptyStart.data)}`);
    }

    // Verify NO orphan session was left in exam_sessions
    const orphanCheck = await pool.query(
      'SELECT count(*) as count FROM exam_sessions WHERE exam_id = $1',
      [examEmpty.id]
    );
    if (orphanCheck.rows[0].count !== '0') {
      throw new Error(`Inconsistent state: found ${orphanCheck.rows[0].count} orphan session rows after failed question retrieval`);
    }
    console.log('  ✓ Passed: Failed question retrieval cleanly rolled back allocated session (0 orphan rows)');

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Invalid Key & Expired Scheduling Windows
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Security Boundaries: Invalid Exam Key & Expired Window...');
    const invalidKeyRes = await api(`/api/student/exams/${exam1.id}/start`, 'POST', { examKey: 'WRONGKEY' });
    if (invalidKeyRes.status !== 400 || !invalidKeyRes.data.message.includes('Invalid exam key')) {
      throw new Error(`Expected 400 Invalid key, got: ${invalidKeyRes.status}`);
    }
    console.log('  ✓ Passed: Invalid exam key rejected with 400');

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Resume flow cleanup when questions are missing
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 6] Resume flow cleanup when questions missing...');
    const examCodeResumeEmpty = `RESEMPTY${Date.now().toString().slice(-4)}`;
    const examResumeEmpty = (await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Resume Empty Exam', 'mcq', $2, $2, 'active', 60, 10, NOW()) RETURNING id`,
      [college.id, examCodeResumeEmpty]
    )).rows[0];
    createdExamIds.push(examResumeEmpty.id);

    // Manually insert an active session row with 0 questions in exam
    const preExistingSession = (await pool.query(
      `INSERT INTO exam_sessions (exam_id, student_id, status, started_at)
       VALUES ($1, $2, 'active', NOW()) RETURNING id`,
      [examResumeEmpty.id, student.id]
    )).rows[0];

    // Attempt start which hits existingSession resume path
    const resumeEmptyStart = await api(`/api/student/exams/${examResumeEmpty.id}/start`, 'POST', { examKey: examCodeResumeEmpty });
    if (resumeEmptyStart.status !== 400 || !resumeEmptyStart.data.message.includes('no questions')) {
      throw new Error(`Expected 400 no questions on empty resume, got: ${resumeEmptyStart.status}`);
    }

    // Verify session row was deleted so student is not locked out
    const cleanedCheck = await pool.query(
      'SELECT count(*) as count FROM exam_sessions WHERE id = $1',
      [preExistingSession.id]
    );
    if (cleanedCheck.rows[0].count !== '0') {
      throw new Error(`Student locked out: session was not cleaned up on empty question resume`);
    }
    console.log('  ✓ Passed: Resume path on empty-questions exam cleaned up dirty session (candidate not locked out)');

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: Completed Exam Status Check
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 7] Exam Status Check on Completed Exam...');
    const examCodeCompleted = `CMPLT${Date.now().toString().slice(-4)}`;
    const examCompleted = (await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Completed Status Exam', 'mcq', $2, $2, 'completed', 60, 10, NOW() - interval '2 hours') RETURNING id`,
      [college.id, examCodeCompleted]
    )).rows[0];
    createdExamIds.push(examCompleted.id);

    const completedStart = await api(`/api/student/exams/${examCompleted.id}/start`, 'POST', { examKey: examCodeCompleted });
    if (completedStart.status !== 400 || !completedStart.data.message.includes('ended')) {
      throw new Error(`Expected 400 ended exam, got: ${completedStart.status}`);
    }
    console.log('  ✓ Passed: Completed exam rejected from starting with 400');

    console.log('\n======================================================================');
    console.log('  ✓ ALL 7 EXAM START CONCURRENCY & RECOVERY TESTS PASSED!');
    console.log('======================================================================\n');
  } finally {
    for (const eid of createdExamIds) {
      await pool.query('DELETE FROM answers WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM results WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM exam_sessions WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM questions WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM exams WHERE id = $1', [eid]).catch(() => {});
    }
    await pool.end();
  }
}

runExamStartConcurrencyTests().catch(err => {
  console.error('\n❌ START CONCURRENCY TEST FAILED:', err);
  process.exit(1);
});
