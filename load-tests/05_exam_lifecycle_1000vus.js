import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Load students fixture
const students = JSON.parse(open('./test_students.json'));

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const EXAM_ID = __ENV.EXAM_ID || 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const EXAM_KEY = __ENV.EXAM_KEY || '9ZVF3QHP';
const QUESTION_1 = __ENV.QUESTION_ID_1 || '42e91913-1d93-4d3e-843a-4ad13146fc3e';
const QUESTION_2 = __ENV.QUESTION_ID_2 || '869cfd91-13d3-4c5b-89c9-ab5dd077b5cf';
const TARGET_VUS = Number(__ENV.TARGET_VUS) || 1000;

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
    exam_lifecycle_1000vu_sim: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '45s', target: 500 },          // Stage 1: Ramp to 500 VUs
        { duration: '45s', target: TARGET_VUS },   // Stage 2: Ramp to 1,000 VUs
        { duration: '90s', target: TARGET_VUS },   // Stage 3: Sustain peak 1,000 VUs
        { duration: '30s', target: 0 },            // Stage 4: Controlled ramp-down
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    // Strict 2% error abort threshold
    http_req_failed: [{ threshold: 'rate<0.02', abortOnFail: true, delayAbort: '15s' }],
    custom_error_rate: [{ threshold: 'rate<0.02', abortOnFail: true, delayAbort: '15s' }],

    // Latency SLOs under 1,000 Concurrent Students
    http_req_duration: ['p(95)<3000'],
    get_exam_duration_ms: ['p(95)<2500'],
    start_exam_duration_ms: ['p(95)<2000'],
    save_single_answer_duration_ms: ['p(95)<1000'],
    save_bulk_answers_duration_ms: ['p(95)<1500'],
    submit_exam_duration_ms: ['p(95)<3500'],
  },
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const student = students[(vuId - 1) % students.length];

  // Micro-jitter on initial entry to prevent synthetic millisecond-0 threadpool lock
  sleep(Math.random() * 0.5);

  // ── STEP 1: Student Login ──
  const loginRes = http.post(
    `${BASE_URL}/api/auth/student/login`,
    JSON.stringify({ emailOrId: student.emailOrId, password: student.password }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '12s' }
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

  sleep(Math.random() * 2 + 1);

  // ── STEP 2: Load Exam Details & Questions ──
  const getStart = Date.now();
  const getExamRes = http.get(`${BASE_URL}/api/student/exams/${EXAM_ID}`, {
    headers: authHeaders,
    timeout: '12s',
  });
  getExamDuration.add(Date.now() - getStart);

  const getOk = check(getExamRes, { 'get exam details status 200': (r) => r.status === 200 });
  if (!getOk) {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(Math.random() * 2 + 1);

  // ── STEP 3: Start Exam Session ──
  const startExamTime = Date.now();
  const startRes = http.post(
    `${BASE_URL}/api/student/exams/${EXAM_ID}/start`,
    JSON.stringify({ examKey: EXAM_KEY }),
    { headers: authHeaders, timeout: '12s' }
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
    { headers: authHeaders, timeout: '10s' }
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
    { headers: authHeaders, timeout: '10s' }
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
    { headers: authHeaders, timeout: '15s' }
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
