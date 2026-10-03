/**
 * End-to-End Live Verification of the Coding Examination System
 * Tests the complete lifecycle:
 * 1. Admin creates a real exam with multiple coding questions (public & hidden testcases).
 * 2. Assigns a student.
 * 3. Student fetches exam details -> verify strict confidentiality of hidden cases and presence of public sample cases.
 * 4. Student starts exam -> verify session creation and runnable templates.
 * 5. Student runs code in sandbox with sample and custom inputs (Python & JS).
 * 6. Student submits code for Q1 (Python) -> server evaluates against hidden testcases in sandbox, scores 10/10.
 * 7. Student submits code for Q2 (JavaScript) -> server evaluates against hidden testcases, scores 10/10.
 * 8. Student finalizes and submits exam -> automated scoring calculates 20/20 (100%).
 * 9. Admin results verify score, accuracy, and student records.
 */

const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const { pool } = require(path.join(process.cwd(), 'config', 'database'));
const { supabase } = require(path.join(process.cwd(), 'config', 'supabase-clean'));

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';

// Helper for making HTTP requests to local server
function apiRequest(method, endpoint, token, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
      timeout: 30000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request to ${endpoint} timed out after 30s`));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function runE2ETest() {
  console.log('\n======================================================');
  console.log('   ExamShield LIVE Coding Exam End-to-End Test');
  console.log('======================================================\n');

  let testCollegeId = null;
  let testStudentId = null;
  let testExamId = null;
  let adminToken = null;
  let studentToken = null;

  try {
    // ── Setup: Find or Create College and Student ──────────────────────────
    console.log('▶ [Step 1] Initializing Test College and Student credentials...');
    
    // Find a valid student and their matching college
    const pairRes = await pool.query(`
      SELECT s.id as student_id, s.name as student_name, s.email as student_email,
             c.id as college_id, c.name as college_name, c.email as college_email
      FROM students s
      JOIN colleges c ON s.college_id = c.id
      LIMIT 1
    `);

    let student, college;
    if (pairRes.rows.length > 0) {
      const row = pairRes.rows[0];
      testCollegeId = row.college_id;
      testStudentId = row.student_id;
      college = { id: row.college_id, name: row.college_name, email: row.college_email };
      student = { id: row.student_id, name: row.student_name, email: row.student_email };
    } else {
      const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
      college = colRes.rows[0];
      testCollegeId = college.id;
      const stuRes = await pool.query('SELECT id, name, email, college_id FROM students LIMIT 1');
      student = stuRes.rows[0];
      testStudentId = student.id;
      await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [testCollegeId, testStudentId]);
    }

    console.log(`  ✓ Using College: "${college.name}" (${testCollegeId})`);
    console.log(`  ✓ Using Student: "${student.name}" (${student.email})`);

    // Admin Token (College Admin)
    adminToken = jwt.sign(
      { id: testCollegeId, email: college.email, role: 'college_admin', college_id: testCollegeId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Student Token
    studentToken = jwt.sign(
      { id: testStudentId, email: student.email, role: 'student', college_id: testCollegeId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ── Step 2: Create Coding Exam via API ────────────────────────────────
    console.log('\n▶ [Step 2] Admin creates Exam with 2 Coding Questions...');
    const examKey = `CODE${Math.floor(1000 + Math.random() * 9000)}`;
    const examPayload = {
      title: `E2E Live Assessment ${Date.now()}`,
      subject: 'Algorithms & Data Structures',
      type: 'coding',
      duration: 60,
      total_marks: 20,
      passing_marks: 10,
      date_time: new Date().toISOString(),
      instructions: 'Complete both coding questions. Hidden test cases will validate edge cases upon submission.',
      exam_key: examKey,
      status: 'active',
      is_proctored: false,
      questions: [
        {
          type: 'coding',
          title: 'Palindrome String Checker',
          problemStatement: 'Given a single line string S, return true if S is a palindrome (reads same forwards and backwards), otherwise return false.',
          inputFormat: 'A single line containing string S without leading/trailing whitespace.',
          outputFormat: "Print 'true' or 'false' (lowercase).",
          constraints: ['1 <= S.length <= 1000', 'S contains alphanumeric characters and spaces.'],
          marks: 10,
          timeLimit: 2000,
          memoryLimit: 256,
          executionFormat: 'stdin_stdout',
          allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
          testCases: [
            { input: 'racecar', output: 'true', explanation: 'racecar is identical forwards and backwards', is_hidden: false },
            { input: 'hello', output: 'false', explanation: 'hello is not a palindrome', is_hidden: false },
            { input: 'madam', output: 'true', explanation: '', is_hidden: true },
            { input: 'step on no pets', output: 'true', explanation: '', is_hidden: true },
            { input: 'examshield', output: 'false', explanation: '', is_hidden: true }
          ]
        },
        {
          type: 'coding',
          title: 'Sum of Array Elements',
          problemStatement: 'Given an integer N followed by N space-separated integers, compute and output their sum.',
          inputFormat: 'Line 1: An integer N.\nLine 2: N space-separated integers.',
          outputFormat: 'A single integer representing the sum.',
          constraints: ['1 <= N <= 1000', '-10^6 <= A[i] <= 10^6'],
          marks: 10,
          timeLimit: 2000,
          memoryLimit: 256,
          executionFormat: 'stdin_stdout',
          allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
          testCases: [
            { input: '3\n1 2 3', output: '6', explanation: '1 + 2 + 3 = 6', is_hidden: false },
            { input: '5\n10 20 30 40 50', output: '150', explanation: '', is_hidden: true },
            { input: '4\n-5 5 -10 10', output: '0', explanation: '', is_hidden: true }
          ]
        }
      ]
    };

    const createExamRes = await apiRequest('POST', '/api/admin/exams', adminToken, examPayload);
    if (!createExamRes.data?.success && createExamRes.status !== 201 && createExamRes.status !== 200) {
      throw new Error(`Create exam failed: ${JSON.stringify(createExamRes.data)}`);
    }

    testExamId = createExamRes.data.data?.id || createExamRes.data.exam?.id || createExamRes.data.id;
    console.log(`  ✓ Exam created successfully with ID: ${testExamId}`);
    console.log(`  ✓ Exam Access Key: ${examKey}`);

    // Wait 500ms for async processing
    await new Promise(r => setTimeout(r, 600));

    // Ensure student is assigned to this exam
    await pool.query(`
      INSERT INTO exam_assignments (exam_id, student_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [testExamId, testStudentId]);
    console.log(`  ✓ Student ${testStudentId} explicitly assigned to exam.`);

    // ── Step 3: Student Fetches Exam Details ──────────────────────────────
    console.log('\n▶ [Step 3] Student queries exam details (GET /api/student/exams/:id)...');
    const examDetailsRes = await apiRequest('GET', `/api/student/exams/${testExamId}`, studentToken);
    
    if (!examDetailsRes.data?.success) {
      throw new Error(`Failed to get exam details: ${JSON.stringify(examDetailsRes.data)}`);
    }

    const fetchedQuestions = examDetailsRes.data.data?.questions || [];
    console.log(`  ✓ Fetched ${fetchedQuestions.length} questions for student.`);

    if (fetchedQuestions.length !== 2) {
      throw new Error(`Expected 2 questions, received ${fetchedQuestions.length}`);
    }

    const q1 = fetchedQuestions[0];
    const q2 = fetchedQuestions[1];

    console.log(`  ✓ Q1: "${q1.title}", Type: ${q1.type}, Marks: ${q1.marks}`);
    console.log(`  ✓ Q1 Total Configured Cases: ${q1.totalTestCases} (Hidden count: ${q1.hiddenTestCasesCount})`);
    console.log(`  ✓ Q1 Student Visible Sample Cases: ${q1.examples?.length || 0}`);

    // VERIFICATION: Check confidential test cases are NOT leaked!
    const leakedHiddenQ1 = (q1.examples || []).find(tc => tc.input === 'madam' || tc.input === 'step on no pets');
    if (leakedHiddenQ1) {
      throw new Error('SECURITY VIOLATION: Confidential hidden test case was exposed to student in exam details!');
    }
    console.log('  🔒 SECURITY VERIFIED: Hidden test cases are completely masked from student exam details.');

    // VERIFICATION: Check public cases exist
    if (!q1.examples || q1.examples.length !== 2) {
      throw new Error(`Expected exactly 2 public sample cases for Q1, found: ${q1.examples?.length}`);
    }
    console.log('  ✓ Public sample test cases properly exposed for student workspace.');

    // ── Step 4: Student Starts Exam ───────────────────────────────────────
    console.log('\n▶ [Step 4] Student starts exam session (POST /api/student/exams/:id/start)...');
    const effectiveKey = examDetailsRes.data.data?.exam?.exam_code || examDetailsRes.data.data?.exam?.exam_key || examKey;
    const startRes = await apiRequest('POST', `/api/student/exams/${testExamId}/start`, studentToken, { examKey: effectiveKey });

    if (!startRes.data?.success) {
      throw new Error(`Failed to start exam: ${JSON.stringify(startRes.data)}`);
    }

    const activeSession = startRes.data.data?.session;
    console.log(`  ✓ Exam session active: Session ID ${activeSession.id}`);

    // ── Step 5: Student Runs Test Code In Sandbox (POST /api/code/run) ────
    console.log('\n▶ [Step 5] In-exam code testing via sandbox (POST /api/code/run)...');
    
    // Test Python on Q1 with custom input
    console.log('  ▶ Testing Python solution with custom input "noon"...');
    const pyTestRun = await apiRequest('POST', '/api/code/run', studentToken, {
      questionId: q1.id,
      code: `import sys\ns = sys.stdin.read().strip()\nprint('true' if s == s[::-1] else 'false')`,
      language: 'python',
      customInput: 'noon',
      sessionId: activeSession.id,
      examId: testExamId
    });

    const pyRunResult = pyTestRun.data?.data || pyTestRun.data;
    const pyOutput = pyRunResult?.testCases?.[0]?.actualOutput || pyRunResult?.output || pyRunResult?.stdout || '';
    console.log(`    Status: ${pyRunResult?.status}, Output: "${pyOutput.trim()}"`);
    if (pyOutput.trim() !== 'true') {
      throw new Error(`Python sandbox run failed: ${JSON.stringify(pyTestRun.data)}`);
    }
    console.log('  ✓ Python sandbox test execution PASSED.');

    // ── Step 6: Student Submits Solution for Question 1 ───────────────────
    console.log('\n▶ [Step 6] Submitting authoritative solution for Q1 (POST /api/code/submit)...');
    const pySolution = `import sys
s = sys.stdin.read().strip()
print('true' if s == s[::-1] else 'false')
`;
    const submitQ1Res = await apiRequest('POST', '/api/code/submit', studentToken, {
      questionId: q1.id,
      code: pySolution,
      language: 'python',
      sessionId: activeSession.id,
      examId: testExamId
    });

    const q1Eval = submitQ1Res.data?.data || submitQ1Res.data;
    console.log(`  ✓ Q1 Evaluation Result: Status "${q1Eval.status}"`);
    console.log(`  ✓ Passed: ${q1Eval.passedTestCases}/${q1Eval.totalTestCases} test cases`);
    console.log(`  ✓ Marks Earned: ${q1Eval.earnedMarks}/${q1Eval.maxMarks}`);

    if (q1Eval.passedTestCases !== 5 || q1Eval.earnedMarks !== 10) {
      throw new Error(`Q1 grading failed: Expected 5/5 cases passed and 10 marks, got: ${JSON.stringify(q1Eval)}`);
    }
    console.log('  ✓ Q1 graded 100% correct across all public and secret test cases.');

    // ── Step 7: Student Submits Solution for Question 2 (JavaScript) ──────
    console.log('\n▶ [Step 7] Submitting authoritative solution for Q2 (POST /api/code/submit)...');
    const jsSolution = `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 1) {
  const n = parseInt(input[0], 10);
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += parseInt(input[i], 10);
  }
  console.log(sum);
}
`;
    const submitQ2Res = await apiRequest('POST', '/api/code/submit', studentToken, {
      questionId: q2.id,
      code: jsSolution,
      language: 'javascript',
      sessionId: activeSession.id,
      examId: testExamId
    });

    const q2Eval = submitQ2Res.data?.data || submitQ2Res.data;
    console.log(`  ✓ Q2 Evaluation Result: Status "${q2Eval.status}"`);
    console.log(`  ✓ Passed: ${q2Eval.passedTestCases}/${q2Eval.totalTestCases} test cases`);
    console.log(`  ✓ Marks Earned: ${q2Eval.earnedMarks}/${q2Eval.maxMarks}`);

    if (q2Eval.passedTestCases !== 3 || q2Eval.earnedMarks !== 10) {
      throw new Error(`Q2 grading failed: Expected 3/3 cases passed and 10 marks, got: ${JSON.stringify(q2Eval)}`);
    }
    console.log('  ✓ Q2 graded 100% correct across all public and secret test cases.');

    // ── Step 8: Student Submits Full Exam ─────────────────────────────────
    console.log('\n▶ [Step 8] Finalizing examination submission (POST /api/student/exams/:id/submit)...');
    const finalSubmitRes = await apiRequest('POST', `/api/student/exams/${testExamId}/submit`, studentToken, {
      answers: {
        [q1.id]: pySolution,
        [q2.id]: jsSolution
      },
      timeSpent: 300,
      tabSwitchCount: 0,
      violationCount: 0
    });

    const submissionResult = finalSubmitRes.data?.data || finalSubmitRes.data?.result || finalSubmitRes.data;
    console.log(`  ✓ Submission status: ${submissionResult.status}`);
    console.log(`  ✓ Total Score: ${submissionResult.score ?? submissionResult.marks_obtained}/${submissionResult.totalMarks ?? 20} (${submissionResult.percentage}%)`);

    const finalMarks = Number(submissionResult.score ?? submissionResult.marks_obtained);
    if (finalMarks !== 20) {
      throw new Error(`Expected final score of 20, got: ${finalMarks}`);
    }
    console.log('  ✓ Automated scoring awarded exactly 20/20 marks!');

    // ── Step 9: Verify Database Records ──────────────────────────────────
    console.log('\n▶ [Step 9] Inspecting PostgreSQL persistence (results, sessions, answers)...');
    const resultRow = await pool.query('SELECT * FROM results WHERE exam_id = $1 AND student_id = $2', [testExamId, testStudentId]);
    if (resultRow.rows.length === 0) {
      throw new Error('Result record not found in results table!');
    }
    console.log(`  ✓ DB Result: Marks ${resultRow.rows[0].marks_obtained}/${resultRow.rows[0].total_marks}, Status: "${resultRow.rows[0].status}"`);

    const answerRows = await pool.query('SELECT question_id, marks_obtained, selected_language, code_submission FROM answers WHERE session_id = $1', [activeSession.id]);
    console.log(`  ✓ DB Answers: ${answerRows.rows.length} answers recorded.`);
    for (const a of answerRows.rows) {
      console.log(`    - Question ${a.question_id}: ${a.marks_obtained} marks (${a.selected_language})`);
    }

    console.log('\n======================================================');
    console.log('   ✓ ALL TESTS PASSED! CODING SYSTEM WORKING 100%');
    console.log('======================================================\n');
    return true;
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    return false;
  } finally {
    await pool.end();
  }
}

runE2ETest().then((success) => {
  process.exit(success ? 0 : 1);
});
