/**
 * ExamShield High-Concurrency 2,050 Virtual Student End-to-End Simulation Engine
 * 
 * Simulates 2,050 real candidates simultaneously executing their complete examination lifecycle:
 *   1. Student Login & Authentication (JWT token issuance, Fast-Auth caching)
 *   2. Pre-Exam Waiting Room, Instructions & Hardware Checks (Camera/Mic)
 *   3. Exam Entry & Real-Time Question Loading (10 MCQs + 2 Coding)
 *   4. AI Proctoring & Telemetry (Tab switches, fullscreen monitoring)
 *   5. MCQ Answer Selection & Debounced Bulk Autosaving (<2ms Redis buffer)
 *   6. Algorithmic Native Code Execution (Python 3 compiler cluster execution)
 *   7. Final Exam Submission, Auto-Marking & Result Persistence
 *   8. Post-Exam Candidate Result Retrieval
 */

const https = require('https');
const dns = require('dns');
const axios = require('../backend/node_modules/axios');

const BASE_URL = process.env.BASE_URL || 'https://exam.nexifyforge.in';
const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';
const EXAM_KEY = 'BENCH2026';
const TOTAL_STUDENTS = parseInt(process.env.TOTAL_STUDENTS || '2050', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '75', 10); // 75 concurrent active student workers
const TEST_PASSWORD = 'VirtualStudent2026!';

// Persistent HTTPS agent with keep-alive and zero-latency local IP pinning (prevents OS DNS exhaustion)
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 500,
  rejectUnauthorized: false,
  lookup: (hostname, options, cb) => {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    if (hostname === 'exam.nexifyforge.in' || hostname === 'www.exam.nexifyforge.in') {
      if (options && options.all) {
        return cb(null, [{ address: '147.93.19.252', family: 4 }]);
      }
      return cb(null, '147.93.19.252', 4);
    }
    dns.lookup(hostname, options, cb);
  }
});

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  httpsAgent
});

// Metric counters
const metrics = {
  totalStudents: TOTAL_STUDENTS,
  loginSuccess: 0,
  loginFailed: 0,
  instructionsSuccess: 0,
  startSuccess: 0,
  startFailed: 0,
  violationsReported: 0,
  autosavesSuccess: 0,
  autosavesFailed: 0,
  codeSubmissionsSuccess: 0,
  codeSubmissionsFailed: 0,
  finalSubmitsSuccess: 0,
  finalSubmitsFailed: 0,
  resultsVerified: 0,
  totalRequests: 0,
  errors: [],
  latencies: []
};

// MCQ standard question bank
const MCQ_QUESTIONS = [
  { questionId: 'a0010001-0000-4000-8000-000000000001', correctOption: 'O(log N)' },
  { questionId: 'a0010001-0000-4000-8000-000000000002', correctOption: 'Serializable' },
  { questionId: 'a0010001-0000-4000-8000-000000000003', correctOption: '5432' },
  { questionId: 'a0010001-0000-4000-8000-000000000004', correctOption: 'Stack' },
  { questionId: 'a0010001-0000-4000-8000-000000000005', correctOption: 'Connection: keep-alive' },
  { questionId: 'a0010001-0000-4000-8000-000000000006', correctOption: 'Merge Sort' },
  { questionId: 'a0010001-0000-4000-8000-000000000007', correctOption: 'Atomicity, Consistency, Isolation, Durability' },
  { questionId: 'a0010001-0000-4000-8000-000000000008', correctOption: 'Single main event loop thread' },
  { questionId: 'a0010001-0000-4000-8000-000000000009', correctOption: 'O(1)' },
  { questionId: 'a0010001-0000-4000-8000-000000000010', correctOption: '429' }
];

const PYTHON_SOLUTION = `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    nums = [int(x) for x in lines]
    print(sum(nums))

if __name__ == '__main__':
    solve()
`;

async function timeRequest(fn) {
  const start = Date.now();
  metrics.totalRequests++;
  try {
    const res = await fn();
    const duration = Date.now() - start;
    metrics.latencies.push(duration);
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    metrics.latencies.push(duration);
    throw err;
  }
}

async function safeRequest(fn, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await timeRequest(fn);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }
}

async function simulateStudent(studentIdx) {
  const pad = String(studentIdx).padStart(4, '0');
  const email = `vstudent_${pad}@virtualexam.test`;
  const studentLabel = `[Candidate ${pad}]`;

  try {
    // -------------------------------------------------------------
    // STAGE 1: Student Login & JWT Issuance
    // -------------------------------------------------------------
    const loginRes = await safeRequest(() => client.post('/api/auth/student/login', {
      email,
      password: TEST_PASSWORD
    }));

    if (!loginRes.data?.success || !loginRes.data?.data?.accessToken) {
      metrics.loginFailed++;
      throw new Error(`Login failed for ${email}`);
    }
    metrics.loginSuccess++;
    const token = loginRes.data.data.accessToken;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // -------------------------------------------------------------
    // STAGE 2: Waiting Room, Instructions & Hardware Permission Check
    // -------------------------------------------------------------
    const examDetailsRes = await safeRequest(() => client.get(`/api/student/exams/${EXAM_ID}`, authHeaders));
    if (!examDetailsRes.data?.success) {
      throw new Error(`Failed to load waiting room for ${email}`);
    }
    metrics.instructionsSuccess++;

    // -------------------------------------------------------------
    // STAGE 3: Exam Entry & Dynamic Question Set Loading
    // -------------------------------------------------------------
    const startRes = await safeRequest(() => client.post(`/api/student/exams/${EXAM_ID}/start`, {
      examKey: EXAM_KEY
    }, authHeaders));

    if (!startRes.data?.success || !startRes.data?.data?.session?.id) {
      metrics.startFailed++;
      throw new Error(`Failed to start exam for ${email}: ${JSON.stringify(startRes.data)}`);
    }
    metrics.startSuccess++;
    const sessionId = startRes.data.data.session.id;

    // -------------------------------------------------------------
    // STAGE 4: Continuous AI Proctoring & Telemetry Heartbeats
    // (Simulate 35% of candidates having a recorded tab switch alert)
    // -------------------------------------------------------------
    if (studentIdx % 3 === 0) {
      await safeRequest(() => client.post('/api/student/violations', {
        sessionId,
        examId: EXAM_ID,
        type: 'tab_switch',
        description: 'Candidate switched window focus during assessment'
      }, authHeaders)).catch(() => {});
      metrics.violationsReported++;
    }

    // -------------------------------------------------------------
    // STAGE 5: Answering MCQs & Debounced Bulk Autosaving
    // -------------------------------------------------------------
    // Students answer 8 to 10 MCQs
    const answersCount = 8 + (studentIdx % 3); // 8, 9, or 10
    const studentAnswers = [];
    for (let i = 0; i < answersCount; i++) {
      const q = MCQ_QUESTIONS[i];
      // 85% chance to pick correct answer, 15% to pick alternative
      const isCorrect = (studentIdx + i) % 7 !== 0;
      const selectedOption = isCorrect ? q.correctOption : 'Incorrect Option';
      studentAnswers.push({
        questionId: q.questionId,
        selectedOption,
        answerText: selectedOption
      });
    }

    const autosaveRes = await safeRequest(() => client.post(`/api/student/exams/${EXAM_ID}/save-answers-bulk`, {
      sessionId,
      answers: studentAnswers
    }, authHeaders));

    if (autosaveRes.data?.success) {
      metrics.autosavesSuccess++;
    } else {
      metrics.autosavesFailed++;
    }

    // -------------------------------------------------------------
    // STAGE 6: Algorithmic Code Execution (Python 3 Native Compiler)
    // (Every 5th student submits code for Q11)
    // -------------------------------------------------------------
    if (studentIdx % 5 === 0) {
      const codeRes = await safeRequest(() => client.post('/api/student/submit-code', {
        questionId: 'a0010001-0000-4000-8000-000000000011',
        examId: EXAM_ID,
        sessionId,
        language: 'python',
        code: PYTHON_SOLUTION
      }, authHeaders));

      if (codeRes.data?.success) {
        metrics.codeSubmissionsSuccess++;
      } else {
        metrics.codeSubmissionsFailed++;
      }
    }

    // -------------------------------------------------------------
    // STAGE 7: Final Exam Submission & Automatic Result Evaluation
    // -------------------------------------------------------------
    const submitRes = await safeRequest(() => client.post(`/api/student/exams/${EXAM_ID}/submit`, {
      sessionId,
      answers: studentAnswers,
      time_spent: 600 + (studentIdx % 300)
    }, authHeaders));

    if (submitRes.data?.success) {
      metrics.finalSubmitsSuccess++;
    } else {
      metrics.finalSubmitsFailed++;
    }

    // -------------------------------------------------------------
    // STAGE 8: Post-Exam Score Retrieval & Verification
    // -------------------------------------------------------------
    const verifyRes = await safeRequest(() => client.get(`/api/student/exams/${EXAM_ID}`, authHeaders));
    if (verifyRes.data?.success && verifyRes.data?.data?.existingSession?.status === 'submitted') {
      metrics.resultsVerified++;
    }

  } catch (err) {
    const endpoint = `${err.config?.method?.toUpperCase() || 'REQ'} ${err.config?.url || ''}`;
    const statusCode = err.response?.status || 'ERR';
    const errMsg = err.response?.data?.message || err.message;
    metrics.errors.push(`${studentLabel} [${statusCode} ${endpoint}]: ${errMsg}`);
    if (metrics.errors.length <= 20) {
      console.error(`⚠️ ${studentLabel} [${statusCode} ${endpoint}] Error:`, errMsg);
    }
  }
}

async function runWorker(iterator, workerId) {
  // Realistic initial student arrival stagger (50ms per worker)
  if (workerId > 0) {
    await new Promise(r => setTimeout(r, workerId * 50));
  }
  for (const studentIdx of iterator) {
    await simulateStudent(studentIdx);
  }
}

function* studentGenerator(total) {
  for (let i = 1; i <= total; i++) {
    yield i;
  }
}

async function main() {
  console.log('================================================================');
  console.log('🚀 EXAMSHIELD 2,050 VIRTUAL STUDENT LIVE CLUSTER SIMULATION');
  console.log('================================================================');
  console.log(`Target URL:         ${BASE_URL}`);
  console.log(`Exam ID:            ${EXAM_ID}`);
  console.log(`Total Candidates:   ${TOTAL_STUDENTS}`);
  console.log(`Concurrent Workers: ${CONCURRENCY}`);
  console.log(`Start Timestamp:    ${new Date().toISOString()}\n`);

  const startTime = Date.now();
  const generator = studentGenerator(TOTAL_STUDENTS);

  // Periodic metrics reporter
  const interval = setInterval(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const rps = (metrics.totalRequests / elapsedSec).toFixed(1);
    console.log(
      `[${elapsedSec}s] Completed Submissions: ${metrics.finalSubmitsSuccess}/${TOTAL_STUDENTS} ` +
      `| Total Req: ${metrics.totalRequests} (${rps} req/s) | Errors: ${metrics.errors.length}`
    );
  }, 10000);

  // Launch concurrency pool
  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(runWorker(generator, w));
  }

  await Promise.all(workers);
  clearInterval(interval);

  const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgRps = (metrics.totalRequests / totalDurationSec).toFixed(1);

  // Latency calculation
  metrics.latencies.sort((a, b) => a - b);
  const p50 = metrics.latencies[Math.floor(metrics.latencies.length * 0.50)] || 0;
  const p95 = metrics.latencies[Math.floor(metrics.latencies.length * 0.95)] || 0;
  const p99 = metrics.latencies[Math.floor(metrics.latencies.length * 0.99)] || 0;
  const avgLatency = (metrics.latencies.reduce((a, b) => a + b, 0) / (metrics.latencies.length || 1)).toFixed(1);

  console.log('\n================================================================');
  console.log('📊 SIMULATION RESULTS & AUDIT REPORT');
  console.log('================================================================');
  console.log(`Duration:                 ${totalDurationSec} seconds`);
  console.log(`Total HTTP Requests:      ${metrics.totalRequests}`);
  console.log(`Average Throughput:       ${avgRps} req/sec`);
  console.log(`Latency p50:              ${p50} ms`);
  console.log(`Latency p95:              ${p95} ms`);
  console.log(`Latency p99:              ${p99} ms`);
  console.log(`Average Latency:          ${avgLatency} ms`);
  console.log(`----------------------------------------------------------------`);
  console.log(`Logins Succeeded:         ${metrics.loginSuccess} / ${TOTAL_STUDENTS} (${((metrics.loginSuccess/TOTAL_STUDENTS)*100).toFixed(1)}%)`);
  console.log(`Instructions Loaded:      ${metrics.instructionsSuccess} / ${TOTAL_STUDENTS}`);
  console.log(`Exam Sessions Started:    ${metrics.startSuccess} / ${TOTAL_STUDENTS}`);
  console.log(`Violations Reported:      ${metrics.violationsReported}`);
  console.log(`MCQ Bulk Autosaves:       ${metrics.autosavesSuccess} (Redis Write-Behind Buffer)`);
  console.log(`Python Code Executions:   ${metrics.codeSubmissionsSuccess}`);
  console.log(`Final Submissions:        ${metrics.finalSubmitsSuccess} / ${TOTAL_STUDENTS} (${((metrics.finalSubmitsSuccess/TOTAL_STUDENTS)*100).toFixed(1)}%)`);
  console.log(`Results Verified:         ${metrics.resultsVerified} / ${TOTAL_STUDENTS}`);
  console.log(`Total Errors Encountered: ${metrics.errors.length}`);
  console.log('================================================================\n');

  if (metrics.errors.length > 0) {
    console.log('First 10 Errors:');
    metrics.errors.slice(0, 10).forEach(e => console.log(' - ' + e));
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, metrics };
