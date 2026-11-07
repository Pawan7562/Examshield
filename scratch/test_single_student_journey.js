const axios = require('../backend/node_modules/axios');

const BASE_URL = 'https://exam.nexifyforge.in';
const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';
const EXAM_KEY = 'BENCH2026';

async function testSingle() {
  console.log('--- Step 1: Student Login ---');
  const loginRes = await axios.post(`${BASE_URL}/api/auth/student/login`, {
    email: 'vstudent_0002@virtualexam.test',
    password: 'VirtualStudent2026!'
  });
  console.log('Login Status:', loginRes.status, loginRes.data.success);
  const token = loginRes.data.data.accessToken;
  const user = loginRes.data.data.user;
  console.log('Logged in as:', user.name, user.email, 'ID:', user.id);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  console.log('\n--- Step 2: Get Profile ---');
  const profileRes = await axios.get(`${BASE_URL}/api/student/profile`, authHeader);
  console.log('Profile Status:', profileRes.status, profileRes.data.success);

  console.log('\n--- Step 3: Get Assigned Exams ---');
  const examsRes = await axios.get(`${BASE_URL}/api/student/exams`, authHeader);
  console.log('Exams Status:', examsRes.status, 'Total exams found:', examsRes.data.data?.exams?.length || examsRes.data.exams?.length || examsRes.data.data?.length);

  console.log('\n--- Step 4: Waiting Room & Instructions ---');
  const examDetailsRes = await axios.get(`${BASE_URL}/api/student/exams/${EXAM_ID}`, authHeader);
  console.log('Exam Details Status:', examDetailsRes.status, examDetailsRes.data.success);
  console.log('Exam Title:', examDetailsRes.data.data?.exam?.title);

  console.log('\n--- Step 5: Start Exam & Hardware Permissions Passed ---');
  const startRes = await axios.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/start`, {
    examKey: EXAM_KEY
  }, authHeader);
  console.log('Start Status:', startRes.status, startRes.data.success);
  const session = startRes.data.data?.session || startRes.data.session;
  const questions = startRes.data.data?.questions || startRes.data.questions;
  console.log('Session ID:', session?.id, 'Total questions loaded:', questions?.length);

  console.log('\n--- Step 6: Telemetry & Tab-switch Violation Reporting ---');
  const violRes = await axios.post(`${BASE_URL}/api/student/violations`, {
    exam_id: EXAM_ID,
    session_id: session.id,
    violation_type: 'tab_switch',
    details: 'Candidate switched tabs (simulated alert)'
  }, authHeader);
  console.log('Violation Report Status:', violRes.status, violRes.data.success);

  console.log('\n--- Step 7: Autosave MCQs in Bulk ---');
  const mcqAnswers = [
    { questionId: 'a0010001-0000-4000-8000-000000000001', selectedOption: 'O(log N)', answerText: 'O(log N)' },
    { questionId: 'a0010001-0000-4000-8000-000000000002', selectedOption: 'Serializable', answerText: 'Serializable' },
    { questionId: 'a0010001-0000-4000-8000-000000000003', selectedOption: '5432', answerText: '5432' },
    { questionId: 'a0010001-0000-4000-8000-000000000004', selectedOption: 'Stack', answerText: 'Stack' },
    { questionId: 'a0010001-0000-4000-8000-000000000005', selectedOption: 'Connection: keep-alive', answerText: 'Connection: keep-alive' }
  ];
  const autosaveRes = await axios.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/save-answers-bulk`, {
    sessionId: session.id,
    answers: mcqAnswers
  }, authHeader);
  console.log('Autosave Status:', autosaveRes.status, autosaveRes.data.success, 'Count:', autosaveRes.data.count);

  console.log('\n--- Step 8: Native Code Execution (Python 3 Run & Submit) ---');
  const pythonCode = 'import sys\nlines = sys.stdin.read().split()\nnums = [int(x) for x in lines]\nprint(sum(nums))';
  const codeRunRes = await axios.post(`${BASE_URL}/api/student/run-code`, {
    language: 'python',
    code: pythonCode,
    input: '10 20 30'
  }, authHeader);
  console.log('Run Code Status:', codeRunRes.status, 'Output:', codeRunRes.data.data?.output?.trim());

  const codeSubmitRes = await axios.post(`${BASE_URL}/api/student/submit-code`, {
    questionId: 'a0010001-0000-4000-8000-000000000011',
    examId: EXAM_ID,
    sessionId: session.id,
    language: 'python',
    code: pythonCode
  }, authHeader);
  console.log('Submit Code Status:', codeSubmitRes.status, 'Passed all test cases:', codeSubmitRes.data.data?.allPassed, 'Score:', codeSubmitRes.data.data?.score);

  console.log('\n--- Step 9: Final Exam Submit ---');
  const submitRes = await axios.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/submit`, {
    sessionId: session.id,
    answers: mcqAnswers,
    time_spent: 300
  }, authHeader);
  console.log('Submit Status:', submitRes.status, submitRes.data.success, 'Score:', submitRes.data.data?.score, 'Total Marks:', submitRes.data.data?.totalMarks);

  console.log('\n--- Step 10: Fetch Exam Details to View Submitted Score ---');
  const examDetailsSubmitted = await axios.get(`${BASE_URL}/api/student/exams/${EXAM_ID}`, authHeader);
  console.log('Exam Details Status:', examDetailsSubmitted.status, 'Total Score Recorded:', examDetailsSubmitted.data.data?.existingSession?.total_score, 'Status:', examDetailsSubmitted.data.data?.existingSession?.result_status);

  console.log('\n🎉 ALL 10 STAGES COMPLETED FLAWLESSLY FOR PILOT CANDIDATE 2!');
}

testSingle().catch(err => {
  console.error('❌ Error:', err.response?.status, err.response?.data || err.message);
});
