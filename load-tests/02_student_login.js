// load-tests/02_student_login.js
// Safe authentication load test measuring password hashing / bcrypt & JWT issuance
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const loginErrorRate = new Rate('login_error_rate');
const loginDuration = new Trend('login_duration_ms', true);

// Load test accounts safely from JSON fixture if available
const students = new SharedArray('test_students', function () {
  try {
    return JSON.parse(open('./test_students.json'));
  } catch (_) {
    return JSON.parse(open('./test_students.example.json'));
  }
});

const TARGET_VUS = __ENV.TARGET_VUS ? parseInt(__ENV.TARGET_VUS, 10) : 10;

export const options = {
  scenarios: {
    student_logins: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: TARGET_VUS },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],          // Max 2% failure allowance
    http_req_duration: ['p(95)<2000', 'p(99)<3000'], // p95 < 2s strict stop limit
    login_error_rate: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Round-robin student assignment across VUs
  const student = students[(__VU - 1) % students.length];

  const payload = JSON.stringify({
    emailOrId: student.emailOrId,
    password: student.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: '10s',
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/auth/student/login`, payload, params);
  loginDuration.add(Date.now() - start);

  const passed = check(res, {
    'login status is 200': (r) => r.status === 200,
    'jwt token returned': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.data?.accessToken || body.data?.token || body.accessToken || body.token);
      } catch (_) {
        return false;
      }
    },
  });

  loginErrorRate.add(!passed);
  sleep(Math.random() * 2 + 1); // 1-3s human delay between retries
}
