// backend/tests/submission_correctness_and_concurrency.test.js
// Comprehensive Correctness, Concurrency, and Authorization Test Suite for Start & Submission

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

async function runTestSuite() {
  console.log('\n======================================================================');
  console.log('  ExamShield Submission Correctness, Concurrency & Security Test Suite');
  console.log('======================================================================\n');

  let college1, college2, student1, student2;
  const createdExamIds = [];
  const createdStudentIds = [];

  try {
    // 1. Fetch test college and student
    const colRows = (await pool.query('SELECT id, name FROM colleges LIMIT 2')).rows;
    if (colRows.length < 2) throw new Error('Need at least 2 colleges');
    college1 = colRows[0];
    college2 = colRows[1];

    const stuRows = (await pool.query('SELECT id, name, email FROM students LIMIT 2')).rows;
    if (stuRows.length < 2) throw new Error('Need at least 2 students');
    student1 = stuRows[0];
    student2 = stuRows[1];

    // Ensure student1 is in college1 and student2 is in college2
    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [college1.id, student1.id]);
    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [college2.id, student2.id]);

    const token1 = jwt.sign({ id: student1.id, role: 'student', college_id: college1.id }, JWT_SECRET);
    const token2 = jwt.sign({ id: student2.id, role: 'student', college_id: college2.id }, JWT_SECRET);

    console.log(`✓ Fixtures: Student 1 (${student1.id}) [College 1], Student 2 (${student2.id}) [College 2]`);

    // Helper for authenticated requests
    const api = async (endpoint, method = 'GET', body = null, token = token1) => {
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
    // TEST 1: Correct & Incorrect MCQ Responses + Unanswered Questions
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 1] MCQ Scoring: Correct, Incorrect, and Unanswered Questions...');
    const examCode1 = `TESTMCQ${Date.now().toString().slice(-4)}`;
    const exam1Res = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'MCQ Test Exam', 'mcq', $2, $2, 'active', 60, 30, NOW()) RETURNING id`,
      [college1.id, examCode1]
    );
    const exam1Id = exam1Res.rows[0].id;
    createdExamIds.push(exam1Id);

    // Q1: 10 marks (Correct Answer: 'A')
    const q1Res = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Q1: What is 2+2?', 'mcq', 10, '["3","4","5"]'::jsonb, '4', 1) RETURNING id`,
      [exam1Id]
    );
    // Q2: 10 marks (Correct Answer: 'Paris')
    const q2Res = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Q2: Capital of France?', 'mcq', 10, '["London","Paris","Berlin"]'::jsonb, 'Paris', 2) RETURNING id`,
      [exam1Id]
    );
    // Q3: 10 marks (Unanswered)
    const q3Res = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Q3: Speed of light?', 'mcq', 10, '["3e8","1e5","2e3"]'::jsonb, '3e8', 3) RETURNING id`,
      [exam1Id]
    );

    const q1Id = q1Res.rows[0].id;
    const q2Id = q2Res.rows[0].id;
    const q3Id = q3Res.rows[0].id;

    // Start exam
    const start1 = await api(`/api/student/exams/${exam1Id}/start`, 'POST', { examKey: examCode1 });
    if (!start1.data.success) throw new Error(`Start failed: ${JSON.stringify(start1.data)}`);
    const session1Id = start1.data.data.session.id;

    // Submit: Q1 correct ('4'), Q2 incorrect ('London'), Q3 unanswered (omitted)
    const submit1 = await api(`/api/student/exams/${exam1Id}/submit`, 'POST', {
      sessionId: session1Id,
      answers: [
        { questionId: q1Id, selectedOption: '4' },
        { questionId: q2Id, selectedOption: 'London' }
      ]
    });

    if (!submit1.data.success) throw new Error(`Submit 1 failed: ${JSON.stringify(submit1.data)}`);
    if (submit1.data.data.score !== 10) throw new Error(`Expected score 10, got ${submit1.data.data.score}`);
    if (submit1.data.data.questionsAttempted !== 2) throw new Error(`Expected 2 attempted, got ${submit1.data.data.questionsAttempted}`);
    if (submit1.data.data.questionsTotal !== 3) throw new Error(`Expected 3 total, got ${submit1.data.data.questionsTotal}`);
    console.log('  ✓ Passed: MCQ scoring accurately awarded 10 marks for 1 correct, 0 for incorrect, and ignored unanswered');

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Coding Question with Test-Case Evaluation
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Coding Exam Scoring with Test Cases...');
    const examCode2 = `TESTCOD${Date.now().toString().slice(-4)}`;
    const exam2Res = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Coding Test Exam', 'coding', $2, $2, 'active', 60, 20, NOW()) RETURNING id`,
      [college1.id, examCode2]
    );
    const exam2Id = exam2Res.rows[0].id;
    createdExamIds.push(exam2Id);

    const testCases = JSON.stringify([
      { input: '2 3', expected_output: '5', is_hidden: false },
      { input: '10 20', expected_output: '30', is_hidden: true }
    ]);

    const qCodeRes = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, test_cases, order_index)
       VALUES ($1, 'Add two numbers from stdin', 'coding', 20, $2, 1) RETURNING id`,
      [exam2Id, testCases]
    );
    const qCodeId = qCodeRes.rows[0].id;

    const start2 = await api(`/api/student/exams/${exam2Id}/start`, 'POST', { examKey: examCode2 });
    const session2Id = start2.data.data.session.id;

    // JavaScript solution reading stdin
    const codeSubmission = `
      const fs = require('fs');
      const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
      const sum = parseInt(input[0]) + parseInt(input[1]);
      console.log(sum);
    `;

    const submit2 = await api(`/api/student/exams/${exam2Id}/submit`, 'POST', {
      sessionId: session2Id,
      answers: [
        { questionId: qCodeId, codeSubmission, selectedLanguage: 'javascript' }
      ]
    });

    if (!submit2.data.success) throw new Error(`Submit 2 failed: ${JSON.stringify(submit2.data)}`);
    if (submit2.data.data.score !== 20) throw new Error(`Expected coding score 20, got ${submit2.data.data.score}`);
    console.log('  ✓ Passed: Coding exam evaluated test cases on server and awarded full 20 marks');

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Subjective and Mixed Exam Behavior
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Subjective & Mixed Exam Status Pending Check...');
    const examCode3 = `TESTSUB${Date.now().toString().slice(-4)}`;
    const exam3Res = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Mixed Exam', 'mixed', $2, $2, 'active', 60, 25, NOW()) RETURNING id`,
      [college1.id, examCode3]
    );
    const exam3Id = exam3Res.rows[0].id;
    createdExamIds.push(exam3Id);

    // Q1 MCQ (5 marks)
    const qMixedMCQ = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'MCQ Part', 'mcq', 5, '["True","False"]'::jsonb, 'True', 1) RETURNING id`,
      [exam3Id]
    );
    // Q2 Subjective (20 marks)
    const qMixedSub = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, order_index)
       VALUES ($1, 'Explain TCP handshake', 'subjective', 20, 2) RETURNING id`,
      [exam3Id]
    );

    const start3 = await api(`/api/student/exams/${exam3Id}/start`, 'POST', { examKey: examCode3 });
    const session3Id = start3.data.data.session.id;

    const submit3 = await api(`/api/student/exams/${exam3Id}/submit`, 'POST', {
      sessionId: session3Id,
      answers: [
        { questionId: qMixedMCQ.rows[0].id, selectedOption: 'True' },
        { questionId: qMixedSub.rows[0].id, answerText: 'SYN, SYN-ACK, ACK establishes connection.' }
      ]
    });

    if (!submit3.data.success) throw new Error(`Submit 3 failed: ${JSON.stringify(submit3.data)}`);
    if (submit3.data.data.status !== 'pending') throw new Error(`Expected pending status for subjective exam, got ${submit3.data.data.status}`);
    console.log('  ✓ Passed: Mixed exam correctly flagged as "pending" for manual teacher evaluation');

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Duplicate & Concurrent Submissions (FOR UPDATE Row-Locking)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Concurrent Submissions Race Condition Guard...');
    const examCode4 = `TESTCONC${Date.now().toString().slice(-4)}`;
    const exam4Res = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, 'Concurrency Test Exam', 'mcq', $2, $2, 'active', 60, 10, NOW()) RETURNING id`,
      [college1.id, examCode4]
    );
    const exam4Id = exam4Res.rows[0].id;
    createdExamIds.push(exam4Id);

    const qConcRes = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Concurrency Q', 'mcq', 10, '["A","B"]'::jsonb, 'A', 1) RETURNING id`,
      [exam4Id]
    );
    const qConcId = qConcRes.rows[0].id;

    const start4 = await api(`/api/student/exams/${exam4Id}/start`, 'POST', { examKey: examCode4 });
    const session4Id = start4.data.data.session.id;

    // Fire 5 simultaneous duplicate submission requests at the exact same millisecond
    const concurrentRequests = Array.from({ length: 5 }, () => 
      api(`/api/student/exams/${exam4Id}/submit`, 'POST', {
        sessionId: session4Id,
        answers: [{ questionId: qConcId, selectedOption: 'A' }]
      })
    );

    const concurrentResults = await Promise.all(concurrentRequests);
    for (const res of concurrentResults) {
      if (!res.data.success) throw new Error(`Concurrent submit failed: ${JSON.stringify(res.data)}`);
      if (res.data.data.score !== 10) throw new Error(`Expected score 10 in concurrent submit, got ${res.data.data.score}`);
    }

    // Verify results table has exactly 1 entry for this student and exam
    const resultsCount = await pool.query(
      'SELECT count(*) as count FROM results WHERE exam_id = $1 AND student_id = $2',
      [exam4Id, student1.id]
    );
    if (resultsCount.rows[0].count !== '1') throw new Error(`Expected exactly 1 result row, got ${resultsCount.rows[0].count}`);
    console.log('  ✓ Passed: 5 concurrent submissions serialized safely with FOR UPDATE lock; exactly 1 sealed result persisted');

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Unauthorized Session ID & Cross-College Request Security
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Tenant Authorization: Cross-Student Session Submissions...');
    // Student 2 tries to submit Student 1's session
    const forgeSubmit = await api(`/api/student/exams/${exam1Id}/submit`, 'POST', {
      sessionId: session1Id,
      answers: [{ questionId: q1Id, selectedOption: '3' }]
    }, token2);

    // Student 2 has no active session for Exam 1, so it must be rejected (404)
    if (forgeSubmit.status !== 404) {
      throw new Error(`Expected 404 for forged session submission, got ${forgeSubmit.status}`);
    }
    console.log('  ✓ Passed: Student 2 attempting to submit Student 1\'s session was rejected with 404');

    // Student 2 tries to save answer on Student 1's session
    const forgeSave = await api(`/api/student/exams/${exam1Id}/save-answer`, 'POST', {
      sessionId: session1Id,
      questionId: q1Id,
      selectedOption: '3'
    }, token2);

    if (forgeSave.status !== 403) {
      throw new Error(`Expected 403 for unauthorized session save, got ${forgeSave.status}`);
    }
    console.log('  ✓ Passed: Cross-student answer tampering rejected with 403 Forbidden');

    console.log('\n======================================================================');
    console.log('  ✓ ALL 5 CORRECTNESS, CONCURRENCY & SECURITY TESTS PASSED!');
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

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
