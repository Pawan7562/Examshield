// verify_all_exam_types.js
// Tests MCQ, Subjective, and Mixed (MCQ + Subjective + Coding) Exams via real Admin & Student APIs

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'CollegeExam_jwt_secret_key_change_in_production_12345jgvjbuvgc';
const BASE_URL = 'http://localhost:5000';

async function apiRequest(method, endpoint, token, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runAllExamTypeTests() {
  console.log('='.repeat(70));
  console.log('🧪 VERIFYING ALL EXAM TYPES: MCQ, SUBJECTIVE & MIXED (CODING)');
  console.log('='.repeat(70));

  // 1. Fetch test college and student
  const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
  const college = colRes.rows[0];
  const collegeId = college.id;

  const stuRes = await pool.query('SELECT id, name, email FROM students LIMIT 1');
  const student = stuRes.rows[0];
  const studentId = student.id;

  await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [collegeId, studentId]);

  console.log(`Using College: "${college.name}" (${collegeId})`);
  console.log(`Using Student: "${student.name}" (${student.email})`);

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

  // -------------------------------------------------------------
  // TEST 1: PURE MCQ EXAM
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Pure MCQ Examination ---');
  const mcqKey = `MCQ${Math.floor(1000 + Math.random() * 9000)}`;
  const mcqPayload = {
    title: `MCQ Evaluation Test ${mcqKey}`,
    subject: 'Computer Science Fundamentals',
    type: 'mcq',
    duration: 30,
    total_marks: 20,
    passing_marks: 8,
    date_time: new Date().toISOString(),
    instructions: 'Select the best option for each question.',
    exam_key: mcqKey,
    status: 'active',
    is_proctored: false,
    questions: [
      {
        type: 'mcq',
        questionText: 'What is the time complexity of searching in a balanced Binary Search Tree?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
        correctAnswer: 'O(log n)',
        marks: 10,
      },
      {
        type: 'mcq',
        questionText: 'Which protocol is used for secure web browsing?',
        options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
        correctAnswer: 'HTTPS',
        marks: 10,
      },
    ],
  };

  const createMcqRes = await apiRequest('POST', '/api/admin/exams', adminToken, mcqPayload);
  if (!createMcqRes.data?.success && createMcqRes.status !== 201) {
    throw new Error(`Create MCQ exam failed: ${JSON.stringify(createMcqRes.data)}`);
  }
  const mcqExamId = createMcqRes.data.data?.id || createMcqRes.data.exam?.id || createMcqRes.data.id;
  const actualMcqKey = createMcqRes.data.data?.exam_code || createMcqRes.data.data?.exam_key || mcqKey;
  await pool.query('INSERT INTO exam_assignments (exam_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [mcqExamId, studentId]);

  // Start MCQ exam as student
  const startMcq = await apiRequest('POST', `/api/student/exams/${mcqExamId}/start`, studentToken, { examKey: actualMcqKey });
  if (!startMcq.data.success) throw new Error(`Start MCQ exam failed: ${JSON.stringify(startMcq.data)}`);
  const mcqSessionId = startMcq.data.data.session.id;
  const questionsInMcq = startMcq.data.data.questions;
  console.log(`  ✓ MCQ exam started with ${questionsInMcq.length} questions`);

  // Answer Q1 correctly ('O(log n)'), Q2 incorrectly ('HTTP')
  const submitMcq = await apiRequest('POST', `/api/student/exams/${mcqExamId}/submit`, studentToken, {
    sessionId: mcqSessionId,
    answers: [
      { questionId: questionsInMcq[0].id, selectedOption: 'O(log n)' },
      { questionId: questionsInMcq[1].id, selectedOption: 'HTTP' },
    ],
  });

  if (!submitMcq.data.success) throw new Error(`Submit MCQ exam failed: ${JSON.stringify(submitMcq.data)}`);
  const mcqResData = submitMcq.data.data;
  console.log(`  ✓ MCQ Results: Score = ${mcqResData.score} / ${mcqResData.totalMarks} (${mcqResData.percentage}%), Status = ${mcqResData.status}`);
  if (mcqResData.score !== 10) throw new Error(`Expected MCQ score 10, got ${mcqResData.score}`);
  if (mcqResData.status !== 'pass') throw new Error(`Expected pass status (10 >= 8), got ${mcqResData.status}`);

  // -------------------------------------------------------------
  // TEST 2: PURE SUBJECTIVE EXAM
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Pure Subjective Examination ---');
  const subjKey = `SUB${Math.floor(1000 + Math.random() * 9000)}`;
  const subjPayload = {
    title: `Subjective Evaluation Test ${subjKey}`,
    subject: 'Software Engineering',
    type: 'subjective',
    duration: 45,
    total_marks: 30,
    passing_marks: 12,
    date_time: new Date().toISOString(),
    instructions: 'Provide comprehensive descriptive answers.',
    exam_key: subjKey,
    status: 'active',
    is_proctored: false,
    questions: [
      {
        type: 'subjective',
        questionText: 'Explain the principles of Microservices Architecture versus Monolithic Architecture.',
        marks: 15,
      },
      {
        type: 'subjective',
        questionText: 'What is ACID in Database Management Systems? Describe each property in detail.',
        marks: 15,
      },
    ],
  };

  const createSubjRes = await apiRequest('POST', '/api/admin/exams', adminToken, subjPayload);
  if (!createSubjRes.data?.success && createSubjRes.status !== 201) {
    throw new Error(`Create Subjective exam failed: ${JSON.stringify(createSubjRes.data)}`);
  }
  const subjExamId = createSubjRes.data.data?.id || createSubjRes.data.exam?.id || createSubjRes.data.id;
  const actualSubjKey = createSubjRes.data.data?.exam_code || createSubjRes.data.data?.exam_key || subjKey;
  await pool.query('INSERT INTO exam_assignments (exam_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [subjExamId, studentId]);

  const startSubj = await apiRequest('POST', `/api/student/exams/${subjExamId}/start`, studentToken, { examKey: actualSubjKey });
  if (!startSubj.data.success) throw new Error(`Start Subjective exam failed: ${JSON.stringify(startSubj.data)}`);
  const subjSessionId = startSubj.data.data.session.id;
  const questionsInSubj = startSubj.data.data.questions;
  console.log(`  ✓ Subjective exam started with ${questionsInSubj.length} questions`);

  const submitSubj = await apiRequest('POST', `/api/student/exams/${subjExamId}/submit`, studentToken, {
    sessionId: subjSessionId,
    answers: [
      {
        questionId: questionsInSubj[0].id,
        answerText: 'Microservices break down large applications into small, independently deployable services with decoupled persistence.',
      },
      {
        questionId: questionsInSubj[1].id,
        answerText: 'ACID stands for Atomicity, Consistency, Isolation, and Durability, ensuring reliable transactional database processing.',
      },
    ],
  });

  if (!submitSubj.data.success) throw new Error(`Submit Subjective exam failed: ${JSON.stringify(submitSubj.data)}`);
  const subjResData = submitSubj.data.data;
  console.log(`  ✓ Subjective Results: Status = ${subjResData.status}, Attempted = ${subjResData.questionsAttempted}/${subjResData.questionsTotal}, isPending = ${subjResData.result.isPending}`);
  if (subjResData.status !== 'pending' && !subjResData.result.isPending) {
    throw new Error(`Expected subjective exam status 'pending', got ${subjResData.status}`);
  }

  // -------------------------------------------------------------
  // TEST 3: MIXED EXAM (MCQ + SUBJECTIVE + CODING)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Mixed Examination (MCQ + Subjective + Coding) ---');
  const mixKey = `MIX${Math.floor(1000 + Math.random() * 9000)}`;
  const mixPayload = {
    title: `Full Stack Assessment ${mixKey}`,
    subject: 'Full Stack Web Engineering',
    type: 'mixed',
    duration: 60,
    total_marks: 30,
    passing_marks: 12,
    date_time: new Date().toISOString(),
    instructions: 'Contains multiple choice, descriptive design, and practical programming challenges.',
    exam_key: mixKey,
    status: 'active',
    is_proctored: false,
    questions: [
      {
        type: 'mcq',
        questionText: 'Which HTTP status code signifies a resource was successfully created?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved'],
        correctAnswer: '201 Created',
        marks: 5,
      },
      {
        type: 'subjective',
        questionText: 'Explain the difference between SQL and NoSQL database query models.',
        marks: 10,
      },
      {
        type: 'coding',
        title: 'Reverse a Number',
        problemStatement: 'Given a positive integer N via standard input, output its digits reversed.',
        inputFormat: 'An integer N on line 1.',
        outputFormat: 'Reversed integer.',
        marks: 15,
        timeLimit: 2000,
        memoryLimit: 256,
        executionFormat: 'stdin_stdout',
        allowedLanguages: ['python', 'javascript', 'cpp'],
        testCases: [
          { input: '12345', output: '54321', explanation: 'Reversed digits', is_hidden: false },
          { input: '9000', output: '9', explanation: 'Leading zeros stripped', is_hidden: true },
          { input: '7', output: '7', explanation: 'Single digit', is_hidden: true },
        ],
      },
    ],
  };

  const createMixRes = await apiRequest('POST', '/api/admin/exams', adminToken, mixPayload);
  if (!createMixRes.data?.success && createMixRes.status !== 201) {
    throw new Error(`Create Mixed exam failed: ${JSON.stringify(createMixRes.data)}`);
  }
  const mixExamId = createMixRes.data.data?.id || createMixRes.data.exam?.id || createMixRes.data.id;
  const actualMixKey = createMixRes.data.data?.exam_code || createMixRes.data.data?.exam_key || mixKey;
  await pool.query('INSERT INTO exam_assignments (exam_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [mixExamId, studentId]);

  const startMix = await apiRequest('POST', `/api/student/exams/${mixExamId}/start`, studentToken, { examKey: actualMixKey });
  if (!startMix.data.success) throw new Error(`Start Mixed exam failed: ${JSON.stringify(startMix.data)}`);
  const mixSessionId = startMix.data.data.session.id;
  const questionsInMix = startMix.data.data.questions;
  console.log(`  ✓ Mixed exam started with ${questionsInMix.length} questions across all 3 types`);

  // Python solution for Reverse a Number:
  const pythonReverse = `import sys
val = sys.stdin.read().strip()
print(int(str(int(val))[::-1]))
`;

  // Bulk save answers
  const bulkSave = await apiRequest('POST', `/api/student/exams/${mixExamId}/save-answers-bulk`, studentToken, {
    sessionId: mixSessionId,
    answers: [
      { questionId: questionsInMix[0].id, selectedOption: '201 Created' },
      { questionId: questionsInMix[1].id, answerText: 'SQL uses structured schemas with relational tables, while NoSQL uses flexible key-value or document models.' },
      { questionId: questionsInMix[2].id, codeSubmission: pythonReverse, selectedLanguage: 'python' },
    ],
  });

  if (!bulkSave.data.success) throw new Error(`Bulk save failed: ${JSON.stringify(bulkSave.data)}`);
  console.log(`  ✓ Bulk save completed for MCQ, Subjective, and Coding: ${bulkSave.data.count} answers`);

  // Final submit
  const submitMix = await apiRequest('POST', `/api/student/exams/${mixExamId}/submit`, studentToken, {
    sessionId: mixSessionId,
  });

  if (!submitMix.data.success) throw new Error(`Submit Mixed exam failed: ${JSON.stringify(submitMix.data)}`);
  const mixResData = submitMix.data.data;
  console.log(`  ✓ Mixed Exam Results: Total Earned = ${mixResData.score} / ${mixResData.totalMarks} (${mixResData.percentage}%), Attempted = ${mixResData.questionsAttempted}/${mixResData.questionsTotal}, Status = ${mixResData.status}`);

  // MCQ (5) + Coding (15) = 20 earned, Subjective pending review
  if (mixResData.score !== 20) throw new Error(`Expected mixed score 20 (5 MCQ + 15 Coding), got ${mixResData.score}`);
  if (mixResData.questionsAttempted !== 3) throw new Error(`Expected 3 attempted questions, got ${mixResData.questionsAttempted}`);
  if (mixResData.status !== 'pending') throw new Error(`Expected status 'pending' due to subjective question, got ${mixResData.status}`);

  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL EXAM FORMATS (MCQ, SUBJECTIVE, AND MIXED CODING) PASSED 100%');
  console.log('='.repeat(70));
}

runAllExamTypeTests()
  .then(() => pool.end())
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    pool.end();
    process.exit(1);
  });
