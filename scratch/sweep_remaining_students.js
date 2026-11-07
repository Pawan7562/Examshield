/**
 * Sweep Remaining Students to Achieve 100.0% Completion (2,050/2,050)
 */

const https = require('https');
const dns = require('dns');
const axios = require('../backend/node_modules/axios');
const { Client } = require('../backend/node_modules/ssh2');

const BASE_URL = process.env.BASE_URL || 'https://exam.nexifyforge.in';
const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';
const EXAM_KEY = 'BENCH2026';
const TEST_PASSWORD = 'VirtualStudent2026!';

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 200,
  rejectUnauthorized: false,
  lookup: (hostname, options, cb) => {
    if (typeof options === 'function') { cb = options; options = {}; }
    if (hostname === 'exam.nexifyforge.in' || hostname === 'www.exam.nexifyforge.in') {
      if (options && options.all) return cb(null, [{ address: '147.93.19.252', family: 4 }]);
      return cb(null, '147.93.19.252', 4);
    }
    dns.lookup(hostname, options, cb);
  }
});

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  httpsAgent
});

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

async function getRemainingEmails() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      const q = `docker exec examshield_postgres psql -U examshield_admin -d examshield_prod -t -A -c "
        SELECT s.email 
        FROM (
          SELECT student_id FROM exam_students WHERE exam_id = '${EXAM_ID}'
          EXCEPT 
          SELECT student_id FROM results WHERE exam_id = '${EXAM_ID}'
        ) missing
        JOIN students s ON s.id = missing.student_id;
      "`;
      conn.exec(q, (err, stream) => {
        if (err) return reject(err);
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
          conn.end();
          const emails = out.split('\n').map(s => s.trim()).filter(s => s.includes('@virtualexam.test'));
          resolve(emails);
        });
      });
    }).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });
  });
}

async function simulateOne(email) {
  // Login
  const loginRes = await client.post('/api/auth/student/login', {
    email,
    password: TEST_PASSWORD
  });
  const token = loginRes.data.data.accessToken;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Waiting room
  await client.get(`/api/student/exams/${EXAM_ID}`, authHeaders);

  // Start exam
  const startRes = await client.post(`/api/student/exams/${EXAM_ID}/start`, {
    examKey: EXAM_KEY
  }, authHeaders);
  const sessionId = startRes.data.data?.session?.id || startRes.data.session?.id;

  // Violation alert
  await client.post('/api/student/violations', {
    sessionId,
    examId: EXAM_ID,
    type: 'tab_switch',
    description: 'Simulated tab switch during recovery wave'
  }, authHeaders).catch(() => {});

  // Answers & autosave
  const studentAnswers = MCQ_QUESTIONS.slice(0, 9).map((q, idx) => ({
    questionId: q.questionId,
    selectedOption: idx % 5 === 0 ? 'Other Option' : q.correctOption,
    answerText: idx % 5 === 0 ? 'Other Option' : q.correctOption
  }));

  await client.post(`/api/student/exams/${EXAM_ID}/save-answers-bulk`, {
    sessionId,
    answers: studentAnswers
  }, authHeaders);

  // Python code
  await client.post('/api/student/submit-code', {
    questionId: 'a0010001-0000-4000-8000-000000000011',
    examId: EXAM_ID,
    sessionId,
    language: 'python',
    code: PYTHON_SOLUTION
  }, authHeaders).catch(() => {});

  // Final submit
  await client.post(`/api/student/exams/${EXAM_ID}/submit`, {
    sessionId,
    answers: studentAnswers,
    time_spent: 450
  }, authHeaders);

  // Result check
  await client.get(`/api/student/exams/${EXAM_ID}`, authHeaders);
}

async function main() {
  console.log('Fetching remaining students needing completion...');
  const emails = await getRemainingEmails();
  console.log(`Found ${emails.length} remaining students to complete.`);

  let done = 0;
  let failed = 0;
  const CONCURRENCY = 25;

  async function worker(queue) {
    while (queue.length > 0) {
      const email = queue.shift();
      try {
        await simulateOne(email);
        done++;
        if (done % 20 === 0 || done === emails.length) {
          console.log(`[Sweep Progress] ${done}/${emails.length} completed.`);
        }
      } catch (err) {
        failed++;
        console.error(`Failed ${email}:`, err.message);
      }
    }
  }

  const queue = [...emails];
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(queue));
  }

  await Promise.all(workers);
  console.log(`\n🎉 Sweep Complete! Done: ${done}, Failed: ${failed}`);
}

main().catch(console.error);
