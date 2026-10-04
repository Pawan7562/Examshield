// backend/tests/load_test_concurrency.js
// High-concurrency benchmark tool for ExamShield answer saving and telemetry
const http = require('http');
const { pool } = require('../config/database');

async function runBenchmark() {
  console.log('======================================================================');
  console.log('🚀 EXAMSHIELD CONCURRENCY & ANSWER SAVING LOAD TEST');
  console.log('======================================================================\n');

  try {
    // 1. Fetch an existing college, student, and exam
    const collegeRes = await pool.query('SELECT id, name FROM colleges LIMIT 1');
    const studentRes = await pool.query('SELECT id, email FROM students LIMIT 1');
    const examRes = await pool.query('SELECT id, title FROM exams LIMIT 1');

    if (collegeRes.rows.length === 0 || studentRes.rows.length === 0 || examRes.rows.length === 0) {
      console.log('⚠️ Seed data missing to run load test. Skipping simulated database load.');
      process.exit(0);
    }

    const college = collegeRes.rows[0];
    const student = studentRes.rows[0];
    const exam = examRes.rows[0];

    console.log(`Using College: "${college.name}" (${college.id})`);
    console.log(`Using Student: "${student.email}" (${student.id})`);
    console.log(`Using Exam:    "${exam.title}" (${exam.id})\n`);

    // Ensure an active session exists
    const sessionRes = await pool.query(`
      INSERT INTO exam_sessions (exam_id, student_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (exam_id, student_id) DO UPDATE SET status = 'active'
      RETURNING id;
    `, [exam.id, student.id]);
    const sessionId = sessionRes.rows[0].id;

    // Fetch questions for this exam
    let qRes = await pool.query('SELECT id FROM questions WHERE exam_id = $1 LIMIT 5', [exam.id]);
    if (qRes.rows.length === 0) {
      qRes = await pool.query(`
        INSERT INTO questions (exam_id, question_text, type, marks, options, correct_option)
        VALUES ($1, 'Load Test Question', 'mcq', 2, '["A","B","C","D"]'::jsonb, 'A')
        RETURNING id
      `, [exam.id]);
    }
    const questionId = qRes.rows[0].id;

    // Stage 1: 100 Concurrent Answer Saves
    await benchmarkConcurrency(sessionId, questionId, student.id, exam.id, 100);

    // Stage 2: 500 Simulated Answer Saves (Batched / In-Flight)
    await benchmarkConcurrency(sessionId, questionId, student.id, exam.id, 500);

    console.log('\n======================================================================');
    console.log('✓ CONCURRENCY BENCHMARK COMPLETED SUCCESSFULLY');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('Benchmark error:', err);
  } finally {
    await pool.end();
  }
}

async function benchmarkConcurrency(sessionId, questionId, studentId, examId, totalRequests) {
  console.log(`--- Running Benchmark: ${totalRequests} Concurrent Answer Upserts ---`);
  const startTime = Date.now();
  const latencies = [];

  const promises = [];
  for (let i = 0; i < totalRequests; i++) {
    const p = (async () => {
      const reqStart = Date.now();
      await pool.query(`
        INSERT INTO answers (session_id, question_id, student_id, exam_id, selected_option, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (session_id, question_id) 
        DO UPDATE SET selected_option = EXCLUDED.selected_option, updated_at = NOW();
      `, [sessionId, questionId, studentId, examId, (i % 2 === 0 ? 'A' : 'B')]);
      const lat = Date.now() - reqStart;
      latencies.push(lat);
    })();
    promises.push(p);
  }

  await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const rps = Math.round((totalRequests / (totalDuration / 1000)));

  console.log(`  Total Requests:  ${totalRequests}`);
  console.log(`  Total Time:      ${totalDuration}ms`);
  console.log(`  Throughput:      ${rps} ops/sec`);
  console.log(`  p50 Latency:     ${p50}ms`);
  console.log(`  p95 Latency:     ${p95}ms`);
  console.log(`  p99 Latency:     ${p99}ms`);
}

runBenchmark();
