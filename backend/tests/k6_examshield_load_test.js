// backend/tests/k6_examshield_load_test.js
// Enterprise Staged Load Testing Script for ExamShield using k6
// Supports staged validation: 100 -> 500 -> 1,000 -> 5,000 -> 10,000 -> 25,000 -> 50,000 VUs
//
// Usage:
//   k6 run --env TARGET_STAGE=100 backend/tests/k6_examshield_load_test.js
//   k6 run --env TARGET_STAGE=1000 --env BASE_URL=https://staging.examshield.com backend/tests/k6_examshield_load_test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const successfulSubmissions = new Counter('successful_submissions');
const failedRequests = new Counter('failed_requests');
const errorRate = new Rate('error_rate');
const saveAnswerDuration = new Trend('save_answer_duration_ms', true);
const bulkSaveDuration = new Trend('bulk_save_duration_ms', true);
const submitDuration = new Trend('submit_exam_duration_ms', true);

// Configurable Stage Targets via Environment Variable
const targetStage = __ENV.TARGET_STAGE ? parseInt(__ENV.TARGET_STAGE, 10) : 100;
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const EXAM_ID = __ENV.EXAM_ID || 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const EXAM_KEY = __ENV.EXAM_KEY || 'LOADTEST';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Staged Ramp-up Profiles
export const options = {
  scenarios: {
    exam_candidates: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.min(targetStage, 50) },
        { duration: '1m', target: targetStage },
        { duration: '2m', target: targetStage },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% errors
    http_req_duration: ['p(95)<2500', 'p(99)<5000'], // p95 < 2.5s, p99 < 5s
    error_rate: ['rate<0.01'],
    save_answer_duration_ms: ['p(95)<1500'],
    bulk_save_duration_ms: ['p(95)<2000'],
    submit_exam_duration_ms: ['p(95)<3000'],
  },
};

export default function () {
  const vuId = __VU;
  const iteration = __ITER;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
  };

  // ── Step 1: Health / Readiness Check ──
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'Health status 200': (r) => r.status === 200 });

  // ── Step 2: Start Examination Session ──
  const startPayload = JSON.stringify({ examKey: EXAM_KEY });
  const startRes = http.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/start`, startPayload, { headers });
  
  let sessionId = null;
  if (startRes.status === 200) {
    try {
      const data = JSON.parse(startRes.body);
      sessionId = data.data?.session?.id || data.session?.id || `vu-${vuId}-sess`;
    } catch (_) {
      sessionId = `vu-${vuId}-sess`;
    }
  } else {
    sessionId = `vu-${vuId}-sess`;
  }

  sleep(Math.random() * 2 + 1); // 1-3s think time after entry

  // ── Step 3: Debounced Answer Save (Single Question) ──
  const singleStart = Date.now();
  const singlePayload = JSON.stringify({
    sessionId,
    questionId: 'q-sample-1',
    selectedOption: iteration % 2 === 0 ? 'A' : 'B',
  });
  const singleRes = http.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/save-answer`, singlePayload, { headers });
  saveAnswerDuration.add(Date.now() - singleStart);

  const isSingleOk = check(singleRes, { 'Single save status 200': (r) => r.status === 200 });
  if (!isSingleOk) {
    failedRequests.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(Math.random() * 3 + 2); // 2-5s working time

  // ── Step 4: Periodic Jittered Bulk Flush (Multiple Questions) ──
  const bulkStart = Date.now();
  const bulkPayload = JSON.stringify({
    sessionId,
    answers: [
      { questionId: 'q-sample-1', selectedOption: iteration % 2 === 0 ? 'A' : 'B' },
      { questionId: 'q-sample-2', selectedOption: 'C' },
    ],
  });
  const bulkRes = http.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/save-answers-bulk`, bulkPayload, { headers });
  bulkSaveDuration.add(Date.now() - bulkStart);

  const isBulkOk = check(bulkRes, { 'Bulk save status 200': (r) => r.status === 200 });
  if (!isBulkOk) {
    failedRequests.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(Math.random() * 2 + 1);

  // ── Step 5: Final Submission ──
  const submitStart = Date.now();
  const submitPayload = JSON.stringify({
    sessionId,
    autoSubmit: false,
    answers: [
      { questionId: 'q-sample-1', selectedOption: iteration % 2 === 0 ? 'A' : 'B' },
      { questionId: 'q-sample-2', selectedOption: 'C' },
    ],
  });
  const submitRes = http.post(`${BASE_URL}/api/student/exams/${EXAM_ID}/submit`, submitPayload, { headers });
  submitDuration.add(Date.now() - submitStart);

  const isSubmitOk = check(submitRes, { 'Submit status 200': (r) => r.status === 200 });
  if (isSubmitOk) {
    successfulSubmissions.add(1);
    errorRate.add(0);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(1);
}
