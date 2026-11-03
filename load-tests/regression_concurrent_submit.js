require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');
const jwt = require('../backend/node_modules/jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EXAM_ID = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const Q1 = '42e91913-1d93-4d3e-843a-4ad13146fc3e';
const Q2 = '869cfd91-13d3-4c5b-89c9-ab5dd077b5cf';

function makeRequest(path, token, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runRegression() {
  console.log('--- CONCURRENT SUBMIT & ANSWER PERSISTENCE REGRESSION TEST ---');
  try {
    // 1. Pick test student 1
    const studentRes = await pool.query(
      "SELECT id, student_id, name, email, college_id FROM students WHERE email LIKE '%@load.test' LIMIT 1"
    );
    if (studentRes.rows.length === 0) {
      throw new Error('Test student test_student_1@load.test not found');
    }
    const student = studentRes.rows[0];

    // Mint token
    const token = jwt.sign({
      id: student.id,
      studentId: student.student_id,
      email: student.email,
      name: student.name,
      college_id: student.college_id,
      role: 'student'
    }, JWT_SECRET, { expiresIn: '1h' });

    // 2. Clear results and reset session for this student
    await pool.query("DELETE FROM results WHERE student_id = $1 AND exam_id = $2", [student.id, EXAM_ID]);
    await pool.query("DELETE FROM answers WHERE student_id = $1 AND exam_id = $2", [student.id, EXAM_ID]);
    await pool.query("DELETE FROM exam_sessions WHERE student_id = $1 AND exam_id = $2", [student.id, EXAM_ID]);

    // Create fresh in_progress session
    const sessRes = await pool.query(
      `INSERT INTO exam_sessions (exam_id, student_id, status, started_at)
       VALUES ($1, $2, 'active', NOW())
       RETURNING id`,
      [EXAM_ID, student.id]
    );
    const sessionId = sessRes.rows[0].id;
    console.log(`✅ Staged fresh session ${sessionId} for ${student.email}`);

    // 3. Fire 10 simultaneous concurrent POST /submit calls
    console.log('⚡ Firing 10 simultaneous concurrent submit requests...');
    const submitPayload = {
      sessionId: sessionId,
      autoSubmit: false,
      answers: [
        { questionId: Q1, selectedOption: 'A' },
        { questionId: Q2, selectedOption: 'B' }
      ]
    };

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(makeRequest(`/api/student/exams/${EXAM_ID}/submit`, token, submitPayload));
    }

    const responses = await Promise.all(promises);
    console.log(`Received ${responses.length} responses. Sample:`, JSON.stringify(responses[0]));

    let all200 = true;
    let allSuccess = true;
    for (const r of responses) {
      if (r.status !== 200) all200 = false;
      if (!r.body || !r.body.success) allSuccess = false;
    }
    console.log(`All 10 requests returned HTTP 200: ${all200}`);
    console.log(`All 10 requests returned success: true: ${allSuccess}`);

    // 4. Verify Database Integrity
    const resultsCountRes = await pool.query(
      "SELECT count(*) FROM results WHERE student_id = $1 AND exam_id = $2",
      [student.id, EXAM_ID]
    );
    const resultsCount = parseInt(resultsCountRes.rows[0].count);
    console.log(`Results records created: ${resultsCount} (Expected: exactly 1)`);

    const sessionFinalRes = await pool.query(
      "SELECT status FROM exam_sessions WHERE id = $1",
      [sessionId]
    );
    console.log(`Final session status: ${sessionFinalRes.rows[0]?.status} (Expected: submitted)`);

    const answersCountRes = await pool.query(
      "SELECT count(*) FROM answers WHERE session_id = $1",
      [sessionId]
    );
    const answersCount = parseInt(answersCountRes.rows[0].count);
    console.log(`Persisted evaluated answers: ${answersCount} (Expected: 2)`);

    if (all200 && allSuccess && resultsCount === 1 && sessionFinalRes.rows[0]?.status === 'submitted' && answersCount === 2) {
      console.log('🎉 REGRESSION TEST PASSED! Concurrency, Idempotency & Answer Persistence verified.');
    } else {
      console.error('❌ REGRESSION TEST FAILED!');
      process.exit(1);
    }

  } catch (err) {
    console.error('Regression error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runRegression();
