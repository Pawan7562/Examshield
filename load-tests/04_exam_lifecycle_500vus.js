import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Load students fixture (will contain 500 accounts when seeded)
const students = JSON.parse(open('./test_students.json'));

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const EXAM_ID = __ENV.EXAM_ID || 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const EXAM_KEY = __ENV.EXAM_KEY || '9ZVF3QHP';
const QUESTION_1 = __ENV.QUESTION_ID_1 || '42e91913-1d93-4d3e-843a-4ad13146fc3e';
const QUESTION_2 = __ENV.QUESTION_ID_2 || '869cfd91-13d3-4c5b-89c9-ab5dd077b5cf';
const TARGET_VUS = Number(__ENV.TARGET_VUS) || 500;

// Custom Metrics
export const errorRate = new Rate('custom_error_rate');
export const failedRequests = new Counter('custom_failed_requests');
export const getExamDuration = new Trend('get_exam_duration_ms', true);
export const startExamDuration = new Trend('start_exam_duration_ms', true);
export const singleSaveDuration = new Trend('save_single_answer_duration_ms', true);
export const bulkSaveDuration = new Trend('save_bulk_answers_duration_ms', true);
export const submitDuration = new Trend('submit_exam_duration_ms', true);

export const options = {
  scenarios: {
    exam_lifecycle_500vu_sim: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.round(TARGET_VUS * 0.5) }, // Ramp to 250 VUs (warmup)
        { duration: '30s', target: TARGET_VUS },                   // Ramp to 500 VUs
        { duration: '60s', target: TARGET_VUS },                   // Sustain peak 500 VUs
        { duration: '20s', target: 0 },                            // Graceful cooldown
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    // HARD ABORT CONDITIONS: Terminate test immediately if error rates exceed 2%
    http_req_failed: [{ threshold: 'rate<0.02', abortOnFail: true, delayAbort: '10s' }],
    custom_error_rate: [{ threshold: 'rate<0.02', abortOnFail: true, delayAbort: '10s' }],

    // Latency SLOs under 500 Concurrent Students
    http_req_duration: ['p(95)<3000'],               // Overall p95 < 3s
    get_exam_duration_ms: ['p(95)<2500'],            // p95 Question load < 2.5s
    start_exam_duration_ms: ['p(95)<2000'],          // p95 Session start < 2s
    save_single_answer_duration_ms: ['p(95)<1000'],   // p95 Single answer save < 1s
    save_bulk_answers_duration_ms: ['p(95)<1500'],   // p95 Bulk save < 1.5s
    submit_exam_duration_ms: ['p(95)<3500'],         // p95 Submission & evaluation < 3.5s
  },
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const student = students[(vuId - 1) % students.length];

  // ── STEP 1: Student Login ──
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

  sleep(Math.random() * 2 + 1);

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

  sleep(Math.random() * 2 + 1);

  // ── STEP 4: Debounced Single Answer Save ──
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

  sleep(Math.random() * 3 + 2);

  // ── STEP 5: Periodic Bulk Answer Save ──
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

  sleep(Math.random() * 2 + 1);

  // ── STEP 6: Final Exam Submission with Auto-Grading ──
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
