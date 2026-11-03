// load-tests/01_health_check.js
// Safe baseline ping and system readiness verification test
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('health_error_rate');
const healthDuration = new Trend('health_duration_ms', true);

export const options = {
  scenarios: {
    health_baseline: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 10 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],                  // Less than 2% HTTP failures
    http_req_duration: ['p(95)<300', 'p(99)<800'],   // p95 under 300ms, p99 under 800ms
    health_error_rate: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/health`, {
    headers: { 'Accept': 'application/json' },
    timeout: '5s',
  });
  healthDuration.add(Date.now() - start);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'body has status healthy': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'healthy' || body.status === 'ok' || body.success === true;
      } catch (_) {
        return false;
      }
    },
  });

  errorRate.add(!passed);
  sleep(1);
}
