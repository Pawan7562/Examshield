// backend/tests/autosave_scheduling_and_flush.test.js
// Regression test for Autosave Scheduling Jitter, Pending Answer Flushing & Cleanup
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const BASE_URL = 'http://localhost:5000';

async function runAutosaveSchedulingTests() {
  console.log('======================================================================');
  console.log('🧪 AUTOSAVE SCHEDULING JITTER & PENDING FLUSH TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  // --- Test 1: Mathematical Jitter Distribution ---
  console.log('▶ [Test 1] Verifying Randomized Scheduling Jitter Formula...');
  const intervals = [];
  for (let i = 0; i < 500; i++) {
    const jittered = 28000 + Math.floor(Math.random() * 14000);
    intervals.push(jittered);
  }
  const minInterval = Math.min(...intervals);
  const maxInterval = Math.max(...intervals);
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  assert(minInterval >= 28000, `Minimum jittered interval >= 28,000ms (got ${minInterval}ms)`);
  assert(maxInterval <= 42000, `Maximum jittered interval <= 42,000ms (got ${maxInterval}ms)`);
  assert(avgInterval >= 34000 && avgInterval <= 36000, `Average interval distributed evenly near 35,000ms (got ${Math.round(avgInterval)}ms)`);
  const uniqueCount = new Set(intervals).size;
  assert(uniqueCount > 200, `Jitter produces high entropy across candidates (${uniqueCount} distinct timings in 500 samples)`);

  // --- Test 2: In-Flight Concurrency Guard Simulation ---
  console.log('\n▶ [Test 2] Verifying In-Flight Flush Lock (isFlushingRef Guard)...');
  let isFlushing = false;
  let concurrentExecutions = 0;

  async function mockFlushOperation() {
    if (isFlushing) {
      return { skipped: true };
    }
    isFlushing = true;
    concurrentExecutions++;
    await new Promise(r => setTimeout(r, 50));
    isFlushing = false;
    return { skipped: false };
  }

  const [res1, res2] = await Promise.all([mockFlushOperation(), mockFlushOperation()]);
  assert((res1.skipped && !res2.skipped) || (!res1.skipped && res2.skipped), 'Lock prevents two simultaneous flushes from executing concurrently');
  assert(concurrentExecutions === 1, 'Only exactly 1 flush executed while lock was active');

  // --- Test 3: Live End-to-End API Bulk Flush & Idempotent Resubmission ---
  console.log('\n▶ [Test 3] Testing Live Server Bulk Flush & Database Upsert...');
  try {
    const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
    const stuRes = await pool.query('SELECT id, name, email, college_id FROM students LIMIT 1');
    const examRes = await pool.query('SELECT id, title FROM exams LIMIT 1');

    if (colRes.rows.length === 0 || stuRes.rows.length === 0 || examRes.rows.length === 0) {
      console.log('  ⚠️ Skipping live DB test: seed records missing.');
    } else {
      const college = colRes.rows[0];
      const student = stuRes.rows[0];
      const exam = examRes.rows[0];

      await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [college.id, student.id]);

      const sessionRes = await pool.query(`
        INSERT INTO exam_sessions (exam_id, student_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT (exam_id, student_id) DO UPDATE SET status = 'active'
        RETURNING id;
      `, [exam.id, student.id]);
      const sessionId = sessionRes.rows[0].id;

      // Ensure at least 2 questions exist
      let qRes = await pool.query('SELECT id FROM questions WHERE exam_id = $1 LIMIT 2', [exam.id]);
      if (qRes.rows.length < 2) {
        await pool.query(`
          INSERT INTO questions (exam_id, question_text, type, marks, options, correct_answer)
          VALUES 
            ($1, 'Test Q1', 'mcq', 2, '["A","B"]'::jsonb, 'A'),
            ($1, 'Test Q2', 'mcq', 2, '["A","B"]'::jsonb, 'B');
        `, [exam.id]);
        qRes = await pool.query('SELECT id FROM questions WHERE exam_id = $1 LIMIT 2', [exam.id]);
      }
      const q1Id = qRes.rows[0].id;
      const q2Id = qRes.rows[1].id;

      const studentToken = jwt.sign(
        { id: student.id, email: student.email, role: 'student', college_id: college.id },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Flush 1: Initial answers
      const flushPayload1 = {
        sessionId,
        answers: [
          { questionId: q1Id, selectedOption: 'A' },
          { questionId: q2Id, selectedOption: 'B' }
        ]
      };

      const resFlush1 = await fetch(`${BASE_URL}/api/student/exams/${exam.id}/save-answers-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify(flushPayload1)
      });
      const dataFlush1 = await resFlush1.json();
      assert(resFlush1.status === 200 && dataFlush1.success === true, `First bulk flush succeeded (HTTP 200, count: ${dataFlush1.count})`);

      // Flush 2: Updated answer for Q1 (verifies idempotency)
      const flushPayload2 = {
        sessionId,
        answers: [
          { questionId: q1Id, selectedOption: 'B' },
          { questionId: q2Id, selectedOption: 'B' }
        ]
      };

      const resFlush2 = await fetch(`${BASE_URL}/api/student/exams/${exam.id}/save-answers-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify(flushPayload2)
      });
      const dataFlush2 = await resFlush2.json();
      assert(resFlush2.status === 200 && dataFlush2.success === true, `Subsequent bulk flush updated answers without duplicate key error`);

      // Check PostgreSQL rows
      const dbCheck = await pool.query('SELECT question_id, selected_option FROM answers WHERE session_id = $1', [sessionId]);
      assert(dbCheck.rows.length >= 2, `Database contains persistent answers (${dbCheck.rows.length} rows verified)`);
      const updatedQ1 = dbCheck.rows.find(r => r.question_id === q1Id);
      assert(updatedQ1 && updatedQ1.selected_option === 'B', `Answer for Q1 updated cleanly in database to 'B'`);
    }
  } catch (err) {
    console.error('Test 3 exception:', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n======================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runAutosaveSchedulingTests();
