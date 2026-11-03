// load-tests/03_exam_lifecycle_flow.js
// Safe staged end-to-end exam lifecycle:
// 1. Authenticate / Re-use Token
// 2. Fetch Exam Details & Questions (GET /api/student/exams/:id)
// 3. Start Exam Session (POST /api/student/exams/:id/start)
// 4. Save Single Answer (POST /api/student/exams/:id/save-answer)
// 5. Save Bulk Answers (POST /api/student/exams/:id/save-answers-bulk)
// 6. Submit Exam (POST /api/student/exams/:id/submit)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom Metrics for granular diagnostics
const failedRequests = new Counter('custom_failed_requests');
const errorRate = new Rate('custom_error_rate');
const getExamDuration = new Trend('get_exam_duration_ms', true);
const startExamDuration = new Trend('start_exam_duration_ms', true);
const singleSaveDuration = new Trend('save_single_answer_duration_ms', true);
const bulkSaveDuration = new Trend('save_bulk_answers_duration_ms', true);
const submitDuration = new Trend('submit_exam_duration_ms', true);

// Staging student credentials
const students = new SharedArray('test_students', function () {
  try {
    return JSON.parse(open('./test_students.json'));
  } catch (_) {
    return JSON.parse(open('./test_students.example.json'));
  }
});

// Environment configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const EXAM_ID = __ENV.EXAM_ID || 'staging-exam-id';
const EXAM_KEY = __ENV.EXAM_KEY || 'TESTKEY';
const QUESTION_1 = __ENV.QUESTION_ID_1 || 'q-1';
const QUESTION_2 = __ENV.QUESTION_ID_2 || 'q-2';
const TARGET_VUS = __ENV.TARGET_VUS ? parseInt(__ENV.TARGET_VUS, 10) : 10;

export const options = {
  scenarios: {
    exam_lifecycle_sim: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 5 },                          // gentle warm-up
        { duration: '45s', target: TARGET_VUS },                 // scale to target (default 10 VUs)
        { duration: '1m', target: TARGET_VUS },                  // sustained load
        { duration: '15s', target: 0 },                          // graceful cooldown
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],                  // HTTP failure rate < 2%
    custom_error_rate: ['rate<0.02'],                // Custom validation error rate < 2%
    http_req_duration: ['p(95)<2000'],               // Strict p95 overall latency < 2s
    get_exam_duration_ms: ['p(95)<1000'],            // p95 Question load < 1s
    start_exam_duration_ms: ['p(95)<1500'],          // p95 Session start < 1.5s
    save_single_answer_duration_ms: ['p(95)<800'],   // p95 Single answer save < 800ms
    save_bulk_answers_duration_ms: ['p(95)<1200'],   // p95 Bulk save < 1.2s
    submit_exam_duration_ms: ['p(95)<2000'],         // p95 Submission & evaluation < 2s
  },
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const student = students[(vuId - 1) % students.length];

  // ── STEP 1: Student Login (Obtain JWT) ──
  const loginRes = http.post(
    `${BASE_URL}/api/auth/student/login`,
    JSON.stringify({ emailOrId: student.emailOrId, password: student.password }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
  );

  let token = null;
  try {
    const body = JSON.parse(loginRes.body);
    token = body.data?.accessToken || body.data?.token || body.accessToken || body.token;
  } catch (_) {}

  const authOk = check(loginRes, { 'login success': (r) => r.status === 200 && Boolean(token) });
  if (!authOk) {
    failedRequests.add(1);
    errorRate.add(1);
    sleep(2);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  sleep(1);

  // ── STEP 2: Load Exam Details & Questions (GET /api/student/exams/:id) ──
  const getStart = Date.now();
  const getExamRes = http.get(`${BASE_URL}/api/student/exams/${EXAM_ID}`, {
    headers: authHeaders,
    timeout: '10s',
  });
  getExamDuration.add(Date.now() - getStart);

  const getOk = check(getExamRes, { 'get exam details status 200': (r) => r.status === 200 });
  if (!getOk) {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(Math.random() * 2 + 1); // Reading exam instructions

  // ── STEP 3: Start Exam Session (POST /api/student/exams/:id/start) ──
  const startExamTime = Date.now();
  const startRes = http.post(
    `${BASE_URL}/api/student/exams/${EXAM_ID}/start`,
    JSON.stringify({ examKey: EXAM_KEY }),
    { headers: authHeaders, timeout: '10s' }
  );
  startExamDuration.add(Date.now() - startExamTime);

  let sessionId = null;
  try {
    const sBody = JSON.parse(startRes.body);
    sessionId = sBody.data?.session?.id || sBody.session?.id;
  } catch (_) {}

  const startOk = check(startRes, { 'start exam status 200': (r) => r.status === 200 && Boolean(sessionId) });
  if (!startOk) {
    failedRequests.add(1);
    errorRate.add(1);
    sleep(2);
    return;
  }

  sleep(Math.random() * 2 + 1); // Reading first question

  // ── STEP 4: Debounced Single Answer Save (POST /api/student/exams/:id/save-answer) ──
  const singleStart = Date.now();
  const singleRes = http.post(
    `${BASE_URL}/api/student/exams/${EXAM_ID}/save-answer`,
    JSON.stringify({
      sessionId: sessionId,
      questionId: QUESTION_1,
      selectedOption: iter % 2 === 0 ? 'A' : 'B',
    }),
    { headers: authHeaders, timeout: '8s' }
  );
  singleSaveDuration.add(Date.now() - singleStart);

  const singleOk = check(singleRes, { 'single save status 200': (r) => r.status === 200 });
  if (!singleOk) {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(Math.random() * 3 + 2); // Answering next questions

  // ── STEP 5: Periodic Bulk Flush (POST /api/student/exams/:id/save-answers-bulk) ──
  const bulkStart = Date.now();
  const bulkRes = http.post(
    `${BASE_URL}/api/student/exams/${EXAM_ID}/save-answers-bulk`,
    JSON.stringify({
      sessionId: sessionId,
      answers: [
        { questionId: QUESTION_1, selectedOption: iter % 2 === 0 ? 'A' : 'B' },
        { questionId: QUESTION_2, selectedOption: 'C' },
      ],
    }),
    { headers: authHeaders, timeout: '8s' }
  );
  bulkSaveDuration.add(Date.now() - bulkStart);

  const bulkOk = check(bulkRes, { 'bulk save status 200': (r) => r.status === 200 });
  if (!bulkOk) {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(Math.random() * 2 + 1); // Reviewing before submit

  // ── STEP 6: Final Exam Submission (POST /api/student/exams/:id/submit) ──
  const submitStart = Date.now();
  const submitRes = http.post(
    `${BASE_URL}/api/student/exams/${EXAM_ID}/submit`,
    JSON.stringify({
      sessionId: sessionId,
      autoSubmit: false,
      answers: [
        { questionId: QUESTION_1, selectedOption: iter % 2 === 0 ? 'A' : 'B' },
        { questionId: QUESTION_2, selectedOption: 'C' },
      ],
    }),
    { headers: authHeaders, timeout: '12s' }
  );
  submitDuration.add(Date.now() - submitStart);

  const submitOk = check(submitRes, { 'submit exam status 200': (r) => r.status === 200 });
  if (submitOk) {
    errorRate.add(0);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(1);
}
