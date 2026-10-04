// backend/tests/load_test_api_workflow.js
// End-to-End Authenticated HTTP API Workflow Load Test
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const BASE_URL = 'http://localhost:5000';

async function runApiLoadTest() {
  console.log('======================================================================');
  console.log('🌐 EXAMSHIELD END-TO-END AUTHENTICATED API WORKFLOW LOAD TEST');
  console.log('======================================================================\n');

  try {
    // 1. Fetch test college, student, and exam
    const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
    const stuRes = await pool.query('SELECT id, name, email, college_id FROM students LIMIT 1');
    const examRes = await pool.query('SELECT id, title FROM exams LIMIT 1');

    if (colRes.rows.length === 0 || stuRes.rows.length === 0 || examRes.rows.length === 0) {
      console.log('⚠️ Test fixtures missing in database. Skipping.');
      process.exit(0);
    }

    const college = colRes.rows[0];
    const student = stuRes.rows[0];
    const exam = examRes.rows[0];

    // Ensure student belongs to college
    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [college.id, student.id]);

    // Ensure an active session exists
    const sessionRes = await pool.query(`
      INSERT INTO exam_sessions (exam_id, student_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (exam_id, student_id) DO UPDATE SET status = 'active'
      RETURNING id;
    `, [exam.id, student.id]);
    const sessionId = sessionRes.rows[0].id;

    // Fetch questions
    let qRes = await pool.query('SELECT id FROM questions WHERE exam_id = $1 LIMIT 5', [exam.id]);
    if (qRes.rows.length === 0) {
      qRes = await pool.query(`
        INSERT INTO questions (exam_id, question_text, type, marks, options, correct_option)
        VALUES ($1, 'API Load Test Question', 'mcq', 2, '["A","B","C","D"]'::jsonb, 'A')
        RETURNING id
      `, [exam.id]);
    }
    const questionId = qRes.rows[0].id;

    const studentToken = jwt.sign(
      { id: student.id, email: student.email, role: 'student', college_id: college.id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log(`Target URL:     ${BASE_URL}/api/student/exams/${exam.id}/save-answer`);
    console.log(`Student ID:     ${student.id}`);
    console.log(`Session ID:     ${sessionId}`);
    console.log(`Question ID:    ${questionId}\n`);

    // Test 1: 50 Concurrent HTTP Individual Answer Saves
    await benchmarkApiEndpoint(exam.id, sessionId, questionId, studentToken, 50, false);

    // Test 2: 100 Concurrent HTTP Bulk Answer Saves
    await benchmarkApiEndpoint(exam.id, sessionId, questionId, studentToken, 100, true);

    console.log('\n======================================================================');
    console.log('✓ AUTHENTICATED API WORKFLOW LOAD TEST COMPLETED SUCCESSFULLY');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('API Load Test error:', err);
  } finally {
    await pool.end();
  }
}

async function benchmarkApiEndpoint(examId, sessionId, questionId, token, totalRequests, isBulk) {
  const mode = isBulk ? 'Bulk Save (/save-answers-bulk)' : 'Single Save (/save-answer)';
  console.log(`--- Running HTTP Test: ${totalRequests} Concurrent Authenticated ${mode} ---`);
  const endpoint = isBulk ? `/api/student/exams/${examId}/save-answers-bulk` : `/api/student/exams/${examId}/save-answer`;

  const startTime = Date.now();
  const latencies = [];
  let successCount = 0;
  let failCount = 0;

  const promises = [];
  for (let i = 0; i < totalRequests; i++) {
    const p = (async () => {
      const payload = isBulk ? {
        sessionId,
        answers: [
          { questionId, selectedOption: (i % 2 === 0 ? 'A' : 'B') }
        ]
      } : {
        sessionId,
        questionId,
        selectedOption: (i % 2 === 0 ? 'A' : 'B')
      };

      const reqStart = Date.now();
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const lat = Date.now() - reqStart;
        latencies.push(lat);

        if (res.status === 200) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    })();
    promises.push(p);
  }

  await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = Math.round((totalRequests / (totalDuration / 1000)));
  const errRate = ((failCount / totalRequests) * 100).toFixed(2);

  console.log(`  Total Requests:  ${totalRequests}`);
  console.log(`  Successful:      ${successCount} (200 OK)`);
  console.log(`  Failed:          ${failCount}`);
  console.log(`  Error Rate:      ${errRate}%`);
  console.log(`  Total Time:      ${totalDuration}ms`);
  console.log(`  Throughput:      ${rps} req/sec`);
  console.log(`  p50 Latency:     ${p50}ms`);
  console.log(`  p95 Latency:     ${p95}ms`);
  console.log(`  p99 Latency:     ${p99}ms`);
}

runApiLoadTest();
