// backend/tests/verify_submission_integrity.js
// Verification of Answer Persistence, Atomic Submission, and Score Calculation Integrity

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';

async function apiRequest(method, endpoint, token, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runIntegrityTest() {
  console.log('\n======================================================');
  console.log('  ExamShield Submission & Score Integrity Verification  ');
  console.log('======================================================\n');

  let examId = null;
  let sessionId = null;

  try {
    // 1. Fetch valid test college & student from database
    const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
    if (!colRes.rows.length) throw new Error('No college found in database');
    const college = colRes.rows[0];
    const collegeId = college.id;

    const stuRes = await pool.query('SELECT id, name, email FROM students LIMIT 1');
    if (!stuRes.rows.length) throw new Error('No student found in database');
    const student = stuRes.rows[0];
    const studentId = student.id;

    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [collegeId, studentId]);

    const adminToken = jwt.sign(
      { id: collegeId, email: college.email, role: 'college_admin', college_id: collegeId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const studentToken = jwt.sign(
      { id: studentId, email: student.email, role: 'student', college_id: collegeId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log(`✓ Using College: "${college.name}" (${collegeId})`);
    console.log(`✓ Using Student: "${student.name}" (${studentId})`);

    // 2. Create Multi-Type Exam with Explicit Marks via Admin API
    const examKey = `INT${Math.floor(1000 + Math.random() * 9000)}`;
    const examPayload = {
      title: `Integrity Verification Exam ${examKey}`,
      subject: 'Computer Science',
      type: 'mixed',
      duration: 45,
      total_marks: 30,
      passing_marks: 12,
      date_time: new Date().toISOString(),
      instructions: 'Integrity test instructions',
      exam_key: examKey,
      status: 'active',
      is_proctored: false,
      questions: [
        {
          type: 'mcq',
          questionText: 'What is the time complexity of binary search?',
          options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
          correctAnswer: 'O(log n)',
          marks: 5,
        },
        {
          type: 'mcq',
          questionText: 'Which data structure uses LIFO order?',
          options: ['Stack', 'Queue', 'Array', 'Heap'],
          correctAnswer: 'Stack',
          marks: 5,
        },
        {
          type: 'coding',
          questionText: 'Write a program to sum two integers from stdin.',
          marks: 20,
          testCases: [
            { input: '2 3', output: '5', is_hidden: false },
            { input: '10 20', output: '30', is_hidden: true }
          ],
          allowedLanguages: ['python', 'javascript']
        }
      ]
    };

    const createRes = await apiRequest('POST', '/api/admin/exams', adminToken, examPayload);
    if (!createRes.data.success) {
      throw new Error(`Failed to create exam: ${JSON.stringify(createRes.data)}`);
    }
    const examObj = createRes.data.data || createRes.data;
    examId = examObj.id;
    const finalExamKey = examObj.exam_code || examObj.exam_key || examKey;
    console.log(`✓ Exam Created via Admin API: ID ${examId} (Code: ${finalExamKey})`);

    // 3. Start Student Session
    const startRes = await apiRequest('POST', `/api/student/exams/${examId}/start`, studentToken, { examKey: finalExamKey });
    if (!startRes.data.success) {
      throw new Error(`Failed to start exam: ${JSON.stringify(startRes.data)}`);
    }
    const startData = startRes.data.data || startRes.data;
    sessionId = startData.session?.id;
    const questions = startData.questions || [];
    if (!sessionId || questions.length !== 3) {
      throw new Error(`Invalid start response: session=${sessionId}, questions=${questions.length}`);
    }
    console.log(`✓ Student Session Started: ${sessionId}`);

    // Map questions
    const q1 = questions.find(q => q.type === 'mcq' && q.question_text?.includes('binary search'));
    const q2 = questions.find(q => q.type === 'mcq' && q.question_text?.includes('LIFO'));
    const q3 = questions.find(q => q.type === 'coding');

    if (!q1 || !q2 || !q3) {
      throw new Error('Could not identify all 3 questions in start payload');
    }

    // 4. Candidate Answers Definition:
    // Q1: 'O(log n)' -> Correct (+5)
    // Q2: 'Queue' -> Incorrect (+0)
    // Q3: Python sum program -> Correct (2/2 testcases passed = +20)
    // Total Expected Score = 5 + 0 + 20 = 25 marks (out of 30) = 83.33% (Pass)
    const expectedAnswers = [
      {
        questionId: q1.id,
        selectedOption: 'O(log n)',
        expectedMarks: 5,
        expectedCorrect: true
      },
      {
        questionId: q2.id,
        selectedOption: 'Queue',
        expectedMarks: 0,
        expectedCorrect: false
      },
      {
        questionId: q3.id,
        codeSubmission: 'import sys\nline = sys.stdin.read().split()\nif line:\n    print(int(line[0]) + int(line[1]))',
        selectedLanguage: 'python',
        expectedMarks: 20,
        expectedCorrect: true
      }
    ];

    // 5. Test 1,200ms debounced save on Q1
    const saveQ1 = await apiRequest('POST', `/api/student/exams/${examId}/save-answer`, studentToken, {
      sessionId,
      questionId: q1.id,
      selectedOption: 'O(log n)'
    });
    if (!saveQ1.data.success) throw new Error(`saveAnswer failed: ${JSON.stringify(saveQ1.data)}`);
    console.log('✓ Debounced single save (/save-answer) verified for Q1');

    // 6. Test Jittered Bulk Flush on Q1 + Q2
    const bulkSave = await apiRequest('POST', `/api/student/exams/${examId}/save-answers-bulk`, studentToken, {
      sessionId,
      answers: [
        { questionId: q1.id, selectedOption: 'O(log n)' },
        { questionId: q2.id, selectedOption: 'Queue' }
      ]
    });
    if (!bulkSave.data.success || bulkSave.data.count !== 2) {
      throw new Error(`saveAnswersBulk failed: ${JSON.stringify(bulkSave.data)}`);
    }
    console.log('✓ Jittered bulk flush (/save-answers-bulk) verified for Q1 & Q2');

    // 7. Final Submit with all 3 answers embedded in payload
    const submitPayload = {
      sessionId,
      autoSubmit: false,
      violationCount: 0,
      tabSwitchCount: 0,
      answers: expectedAnswers.map(a => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        codeSubmission: a.codeSubmission,
        selectedLanguage: a.selectedLanguage
      }))
    };

    const submitRes = await apiRequest('POST', `/api/student/exams/${examId}/submit`, studentToken, submitPayload);
    if (!submitRes.data.success) {
      throw new Error(`submitExam failed: ${JSON.stringify(submitRes.data)}`);
    }
    console.log('✓ Exam submitted successfully via HTTP API');

    // 8. DATABASE INTEGRITY AUDITS:
    // A. Verify answers table row count and exact columns
    const { rows: savedAnswers } = await pool.query(
      'SELECT question_id, selected_option, code_submission, selected_language, marks_obtained, is_correct FROM answers WHERE session_id = $1 ORDER BY question_id',
      [sessionId]
    );

    if (savedAnswers.length !== 3) {
      throw new Error(`Expected exactly 3 saved answers in DB, found ${savedAnswers.length}`);
    }
    console.log(`✓ Database contains exactly 3 persisted answer records for session ${sessionId}`);

    for (const expected of expectedAnswers) {
      const actual = savedAnswers.find(r => String(r.question_id) === String(expected.questionId));
      if (!actual) throw new Error(`Missing answer row in DB for question ${expected.questionId}`);

      if (expected.selectedOption) {
        if (actual.selected_option !== expected.selectedOption) {
          throw new Error(`Mismatch in selected_option for Q${expected.questionId}: expected "${expected.selectedOption}", got "${actual.selected_option}"`);
        }
      }
      if (expected.codeSubmission) {
        if (!actual.code_submission || !actual.code_submission.includes('sys.stdin.read')) {
          throw new Error(`Mismatch in code_submission for Q${expected.questionId}`);
        }
      }
      if (Number(actual.marks_obtained) !== expected.expectedMarks) {
        throw new Error(`Score calculation mismatch for Q${expected.questionId}: expected ${expected.expectedMarks}, got ${actual.marks_obtained}`);
      }
      if (actual.is_correct !== expected.expectedCorrect) {
        throw new Error(`Correctness flag mismatch for Q${expected.questionId}: expected ${expected.expectedCorrect}, got ${actual.is_correct}`);
      }
      console.log(`  → Question ${expected.questionId} (${actual.selected_option || 'code'}) audited: Marks = ${actual.marks_obtained}/${expected.expectedMarks}, Correct = ${actual.is_correct}`);
    }

    // B. Check exam_sessions status
    const { rows: sessionRows } = await pool.query(
      'SELECT status, submitted_at FROM exam_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionRows[0].status !== 'submitted') {
      throw new Error(`Session status is "${sessionRows[0].status}", expected "submitted"`);
    }
    if (!sessionRows[0].submitted_at) {
      throw new Error('Session submitted_at timestamp was not recorded');
    }
    console.log(`✓ Session status sealed as "submitted" at ${sessionRows[0].submitted_at}`);

    // C. Check results table score and percentage
    const { rows: resultRows } = await pool.query(
      'SELECT marks_obtained, total_marks, percentage, status FROM results WHERE exam_id = $1 AND student_id = $2',
      [examId, studentId]
    );
    if (resultRows.length === 0) throw new Error('No result record created in results table');

    const resRecord = resultRows[0];
    const expectedScore = 25; // 5 (Q1) + 0 (Q2) + 20 (Q3)
    const expectedTotal = 30;
    const expectedPct = Math.round((25 / 30) * 10000) / 100; // 83.33%

    if (Number(resRecord.marks_obtained) !== expectedScore) {
      throw new Error(`Result marks_obtained mismatch: expected ${expectedScore}, got ${resRecord.marks_obtained}`);
    }
    if (Number(resRecord.total_marks) !== expectedTotal) {
      throw new Error(`Result total_marks mismatch: expected ${expectedTotal}, got ${resRecord.total_marks}`);
    }
    if (Math.abs(Number(resRecord.percentage) - expectedPct) > 0.1) {
      throw new Error(`Result percentage mismatch: expected ~${expectedPct}%, got ${resRecord.percentage}%`);
    }
    if (resRecord.status !== 'pass') {
      throw new Error(`Result status mismatch: expected "pass", got ${resRecord.status}`);
    }
    console.log(`✓ Results table audited: Score = ${resRecord.marks_obtained}/${resRecord.total_marks} (${resRecord.percentage}%), Status = ${resRecord.status}`);

    // D. Duplicate Submission Idempotency Check
    const resubmitRes = await apiRequest('POST', `/api/student/exams/${examId}/submit`, studentToken, submitPayload);
    if (!resubmitRes.data.success || !resubmitRes.data.message?.includes('already been submitted')) {
      throw new Error(`Duplicate submission did not return idempotent sealed result: ${JSON.stringify(resubmitRes.data)}`);
    }
    console.log('✓ Duplicate submission idempotency verified: Server returned existing sealed result.');

    console.log('\n======================================================');
    console.log('  ✓ ALL SUBMISSION & SCORE INTEGRITY CHECKS PASSED!   ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ INTEGRITY TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    if (examId) {
      await pool.query('DELETE FROM answers WHERE exam_id = $1', [examId]).catch(() => {});
      await pool.query('DELETE FROM results WHERE exam_id = $1', [examId]).catch(() => {});
      await pool.query('DELETE FROM exam_sessions WHERE exam_id = $1', [examId]).catch(() => {});
      await pool.query('DELETE FROM questions WHERE exam_id = $1', [examId]).catch(() => {});
      await pool.query('DELETE FROM exams WHERE id = $1', [examId]).catch(() => {});
    }
    await pool.end();
  }
}

runIntegrityTest();
