// backend/tests/load_test_candidate_workflow.js
// Parameterized Multi-Candidate Authenticated Exam Workflow Load Benchmark
// Supports CANDIDATES=100, 500, 1000

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000';
const NUM_CANDIDATES = parseInt(process.env.CANDIDATES || process.argv[2] || '100', 10);

async function runCandidateLoadBenchmark() {
  console.log('\n======================================================================');
  console.log(`🚀 EXAMSHIELD MULTI-CANDIDATE WORKFLOW LOAD BENCHMARK (${NUM_CANDIDATES} CANDIDATES)`);
  console.log('======================================================================\n');

  let collegeId, examId;
  const createdStudentIds = [];
  const createdExamIds = [];

  try {
    // 1. Fetch / Create Test College
    const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
    if (!colRes.rows.length) throw new Error('No college found in database');
    collegeId = colRes.rows[0].id;

    // 2. Create Shared Load Test Exam
    const examCode = `LOAD${Date.now().toString().slice(-4)}`;
    const examRes = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, $2, 'mcq', $3, $4, 'active', 60, 20, NOW()) RETURNING id`,
      [collegeId, `Benchmark Exam (${NUM_CANDIDATES} Users)`, examCode, examCode]
    );
    examId = examRes.rows[0].id;
    createdExamIds.push(examId);

    // Create 2 Test Questions
    const q1Res = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Benchmark Q1 Time Complexity', 'mcq', 10, '["O(1)","O(n)","O(log n)"]'::jsonb, 'O(1)', 1) RETURNING id`,
      [examId]
    );
    const q2Res = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer, order_index)
       VALUES ($1, 'Benchmark Q2 Memory Complexity', 'mcq', 10, '["O(1)","O(n)","O(n^2)"]'::jsonb, 'O(n)', 2) RETURNING id`,
      [examId]
    );
    const q1Id = q1Res.rows[0].id;
    const q2Id = q2Res.rows[0].id;

    console.log(`✓ Fixtures created: Exam ${examId}, Questions: [${q1Id}, ${q2Id}]`);
    console.log(`✓ Simulating ${NUM_CANDIDATES} concurrent authenticated student lifecycles...\n`);

    const allLatencies = [];
    const startLatencies = [];
    const saveAnswerLatencies = [];
    const bulkSaveLatencies = [];
    const submitLatencies = [];
    const poolStatsSamples = [];

    let successfulWorkflows = 0;
    let failedRequests = 0;
    const initialMemory = process.memoryUsage();
    const benchmarkStart = Date.now();

    // Helper for timing HTTP calls with per-endpoint categorization
    const timedFetch = async (url, options, category) => {
      const start = Date.now();
      try {
        const res = await fetch(url, options);
        const lat = Date.now() - start;
        allLatencies.push(lat);
        if (category === 'start') startLatencies.push(lat);
        else if (category === 'save-answer') saveAnswerLatencies.push(lat);
        else if (category === 'save-bulk') bulkSaveLatencies.push(lat);
        else if (category === 'submit') submitLatencies.push(lat);

        poolStatsSamples.push({
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        });

        if (!res.ok) failedRequests++;
        return res;
      } catch (err) {
        const lat = Date.now() - start;
        allLatencies.push(lat);
        failedRequests++;
        throw err;
      }
    };

    // Staggered execution in concurrency batches of 25 to simulate staggered entry
    const BATCH_SIZE = Math.min(25, NUM_CANDIDATES);
    const candidateIndices = Array.from({ length: NUM_CANDIDATES }, (_, i) => i + 1);

    for (let i = 0; i < candidateIndices.length; i += BATCH_SIZE) {
      const batch = candidateIndices.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (idx) => {
        try {
          const fakeStudentId = `stuload-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
          
          // Fast student fixture insertion
          const stuRes = await pool.query(
            `INSERT INTO students (college_id, student_id, name, email, password, roll_no, is_active)
             VALUES ($1, $2, $3, $4, 'hash_placeholder', $5, true) RETURNING id`,
            [collegeId, `L-${idx}-${Date.now().toString().slice(-4)}`, `Candidate ${idx}`, `${fakeStudentId}@load.test`, `ROLL-${idx}`]
          );
          const studentDbId = stuRes.rows[0].id;
          createdStudentIds.push(studentDbId);

          const studentToken = jwt.sign(
            { id: studentDbId, role: 'student', college_id: collegeId },
            JWT_SECRET,
            { expiresIn: '2h' }
          );

          // Step 1: Start Exam Session
          const startRes = await timedFetch(`${BASE_URL}/api/student/exams/${examId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
            body: JSON.stringify({ examKey: examCode })
          }, 'start');
          const startData = await startRes.json();
          const sessionId = startData.data?.session?.id || startData.session?.id;
          if (!sessionId) throw new Error(`Start failed: ${JSON.stringify(startData)}`);

          // Step 2: Debounced Single Answer Save
          await timedFetch(`${BASE_URL}/api/student/exams/${examId}/save-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
            body: JSON.stringify({ sessionId, questionId: q1Id, selectedOption: 'O(1)' })
          }, 'save-answer');

          // Step 3: Jittered Bulk Flush
          await timedFetch(`${BASE_URL}/api/student/exams/${examId}/save-answers-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
            body: JSON.stringify({
              sessionId,
              answers: [
                { questionId: q1Id, selectedOption: 'O(1)' },
                { questionId: q2Id, selectedOption: 'O(n)' }
              ]
            })
          }, 'save-bulk');

          // Step 4: Final Submission
          const submitRes = await timedFetch(`${BASE_URL}/api/student/exams/${examId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
            body: JSON.stringify({
              sessionId,
              autoSubmit: false,
              answers: [
                { questionId: q1Id, selectedOption: 'O(1)' },
                { questionId: q2Id, selectedOption: 'O(n)' }
              ]
            })
          }, 'submit');
          const submitData = await submitRes.json();
          if (submitData.success) {
            successfulWorkflows++;
          } else {
            console.error(`Candidate ${idx} submit failed:`, submitData.message);
          }
        } catch (err) {
          console.error(`Candidate ${idx} error:`, err.message);
        }
      }));
    }

    const durationSec = (Date.now() - benchmarkStart) / 1000;
    const finalMemory = process.memoryUsage();

    const calcPercentiles = (arr) => {
      if (!arr || arr.length === 0) return { p50: 0, p95: 0, p99: 0 };
      const sorted = [...arr].sort((a, b) => a - b);
      return {
        p50: sorted[Math.floor(sorted.length * 0.50)] || 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
      };
    };

    const overallPct = calcPercentiles(allLatencies);
    const startPct = calcPercentiles(startLatencies);
    const saveAnswerPct = calcPercentiles(saveAnswerLatencies);
    const bulkSavePct = calcPercentiles(bulkSaveLatencies);
    const submitPct = calcPercentiles(submitLatencies);

    const totalRequests = allLatencies.length;
    const throughput = (totalRequests / durationSec).toFixed(1);
    const errorRate = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : '0.00';

    const maxWaitingInPool = poolStatsSamples.reduce((max, s) => Math.max(max, s.waiting || 0), 0);
    const maxActiveClients = poolStatsSamples.reduce((max, s) => Math.max(max, (s.total || 0) - (s.idle || 0)), 0);

    // Database Persistence Audit: check that all completed workflows persisted both answers in DB
    const { rows: persistedCount } = await pool.query(
      'SELECT count(*) as count FROM answers WHERE exam_id = $1',
      [examId]
    );
    const expectedPersistedAnswers = successfulWorkflows * 2;

    console.log('──────────────────────────────────────────────────────────────────────');
    console.log('📊 OVERALL WORKFLOW METRICS:');
    console.log(`   Simulated Candidates:    ${NUM_CANDIDATES}`);
    console.log(`   Completed Workflows:     ${successfulWorkflows} / ${NUM_CANDIDATES} (${((successfulWorkflows / NUM_CANDIDATES) * 100).toFixed(1)}%)`);
    console.log(`   Total HTTP Requests:     ${totalRequests}`);
    console.log(`   Total Duration:          ${durationSec.toFixed(2)}s`);
    console.log(`   Throughput:              ${throughput} req/sec`);
    console.log(`   Error Rate:              ${errorRate}% (${failedRequests} failed calls)`);
    console.log(`   Process RSS Memory:      ${(finalMemory.rss / 1024 / 1024).toFixed(1)} MB (Δ ${((finalMemory.rss - initialMemory.rss) / 1024 / 1024).toFixed(1)} MB)`);
    console.log(`   Process Heap Used:       ${(finalMemory.heapUsed / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   DB Pool Max Active:      ${maxActiveClients} / ${pool.options.max} clients`);
    console.log(`   DB Pool Max Waiting:     ${maxWaitingInPool} requests in queue`);
    console.log(`   DB Persisted Answers:    ${persistedCount[0].count} / ${expectedPersistedAnswers} (${persistedCount[0].count === String(expectedPersistedAnswers) ? '100% Persisted' : 'Discrepancy'})`);
    console.log('──────────────────────────────────────────────────────────────────────');
    console.log('⏱️ LATENCY BREAKDOWN BY ENDPOINT (p50 / p95 / p99):');
    console.log(`   1. Start Exam (/start):           p50: ${startPct.p50} ms | p95: ${startPct.p95} ms | p99: ${startPct.p99} ms (Total: ${startLatencies.length})`);
    console.log(`   2. Single Save (/save-answer):    p50: ${saveAnswerPct.p50} ms | p95: ${saveAnswerPct.p95} ms | p99: ${saveAnswerPct.p99} ms (Total: ${saveAnswerLatencies.length})`);
    console.log(`   3. Bulk Flush (/save-answers-bulk):p50: ${bulkSavePct.p50} ms | p95: ${bulkSavePct.p95} ms | p99: ${bulkSavePct.p99} ms (Total: ${bulkSaveLatencies.length})`);
    console.log(`   4. Final Submit (/submit):        p50: ${submitPct.p50} ms | p95: ${submitPct.p95} ms | p99: ${submitPct.p99} ms (Total: ${submitLatencies.length})`);
    console.log(`   → OVERALL HTTP REQUESTS:          p50: ${overallPct.p50} ms | p95: ${overallPct.p95} ms | p99: ${overallPct.p99} ms`);
    console.log('──────────────────────────────────────────────────────────────────────\n');

  } catch (err) {
    console.error('Benchmark Error:', err);
  } finally {
    // Cleanup benchmark records safely
    for (const eid of createdExamIds) {
      await pool.query('DELETE FROM answers WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM results WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM exam_sessions WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM questions WHERE exam_id = $1', [eid]).catch(() => {});
      await pool.query('DELETE FROM exams WHERE id = $1', [eid]).catch(() => {});
    }
    for (const sid of createdStudentIds) {
      await pool.query('DELETE FROM students WHERE id = $1', [sid]).catch(() => {});
    }
    await pool.end();
  }
}

runCandidateLoadBenchmark();
