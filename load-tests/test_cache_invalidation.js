require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');
const { initRedisAdapter, getRedisClient } = require('../backend/config/redis');
const jwt = require('../backend/node_modules/jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EXAM_ID = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const Q1 = '42e91913-1d93-4d3e-843a-4ad13146fc3e';
const Q2 = '869cfd91-13d3-4c5b-89c9-ab5dd077b5cf';

function makeRequest(path, token, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const headers = { 'Authorization': `Bearer ${token}` };
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
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
    if (body) req.write(payload);
    req.end();
  });
}

async function runCacheTest() {
  console.log('=== REDIS CACHE INVALIDATION & RE-GRADING CORRECTNESS TEST ===');
  await initRedisAdapter();
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis client not available');
  }

  try {
    // 1. Get test student
    const studentRes = await pool.query(
      "SELECT id, student_id, name, email, college_id FROM students WHERE email LIKE '%@load.test' LIMIT 1"
    );
    const student = studentRes.rows[0];
    const token = jwt.sign({
      id: student.id,
      studentId: student.student_id,
      email: student.email,
      name: student.name,
      college_id: student.college_id,
      role: 'student'
    }, JWT_SECRET, { expiresIn: '1h' });

    // Step A: Warm the cache via GET /api/student/exams/:id
    console.log('1. Warming cache via student GET exam details...');
    const getRes = await makeRequest(`/api/student/exams/${EXAM_ID}`, token, 'GET');
    console.log(`GET exam response status: ${getRes.status}`);

    const metaKey = `exam:${EXAM_ID}:meta`;
    const sanitKey = `exam:${EXAM_ID}:sanitized_questions`;
    const authKey = `exam:${EXAM_ID}:authoritative_questions`;

    const metaCachedBefore = await redis.exists(metaKey);
    const sanitCachedBefore = await redis.exists(sanitKey);
    console.log(`Cache state before update -> Meta exists: ${Boolean(metaCachedBefore)}, Sanitized exists: ${Boolean(sanitCachedBefore)}`);

    // Step B: Get original marks of Q1
    const origQRes = await pool.query("SELECT marks FROM questions WHERE id = $1", [Q1]);
    const originalMarks = Number(origQRes.rows[0].marks);
    console.log(`Original marks for Q1: ${originalMarks}`);

    // Step C: Update Q1 marks in DB (simulate admin updating question marks from 1 to 5)
    console.log('2. Updating Q1 marks from 1 to 5 in DB...');
    await pool.query("UPDATE questions SET marks = 5 WHERE id = $1", [Q1]);

    // Invalidate caches via Redis (as called by admin updateQuestion/updateExam)
    await redis.del(metaKey);
    await redis.del(sanitKey);
    await redis.del(authKey);

    const metaCachedAfter = await redis.exists(metaKey);
    const sanitCachedAfter = await redis.exists(sanitKey);
    const authCachedAfter = await redis.exists(authKey);
    console.log(`3. Verified cache purged -> Meta exists: ${Boolean(metaCachedAfter)}, Sanitized: ${Boolean(sanitCachedAfter)}, Auth: ${Boolean(authCachedAfter)}`);

    // Step D: Re-fetch exam details and verify updated question marks in sanitized payload
    console.log('4. Re-fetching exam details to trigger fresh cache population...');
    const freshGetRes = await makeRequest(`/api/student/exams/${EXAM_ID}`, token, 'GET');
    const freshQ1 = freshGetRes.body.data.questions.find(q => q.id === Q1);
    console.log(`Freshly cached Q1 marks returned to student: ${freshQ1.marks} (Expected: 5)`);

    // Step E: Create fresh session and submit to test server-side auto-grading using updated authoritative cache
    console.log('5. Testing submission and auto-grading with updated marks...');
    // Clear prior result for this student
    await pool.query("DELETE FROM results WHERE student_id = $1 AND exam_id = $2", [student.id, EXAM_ID]);
    await pool.query("DELETE FROM answers WHERE student_id = $1 AND exam_id = $2", [student.id, EXAM_ID]);
    await pool.query("DELETE FROM exam_sessions WHERE student_id = $1 AND exam_id = $2", [student.id, EXAM_ID]);

    const sessRes = await pool.query(
      `INSERT INTO exam_sessions (exam_id, student_id, status, started_at)
       VALUES ($1, $2, 'active', NOW())
       RETURNING id`,
      [EXAM_ID, student.id]
    );
    const sessionId = sessRes.rows[0].id;

    // Submit correct option for Q1 (which now has 5 marks)
    const submitRes = await makeRequest(`/api/student/exams/${EXAM_ID}/submit`, token, 'POST', {
      sessionId: sessionId,
      autoSubmit: false,
      answers: [
        { questionId: Q1, selectedOption: 'A' },
        { questionId: Q2, selectedOption: 'C' }
      ]
    });

    console.log(`Submit response status: ${submitRes.status}`);
    const awardedScore = Number(submitRes.body.data?.score || 0);
    console.log(`Score awarded on submission: ${awardedScore} (Expected: 5.00)`);

    const authCachedNow = await redis.exists(authKey);
    console.log(`Authoritative questions cached in Redis for grading: ${Boolean(authCachedNow)}`);

    // Step F: Revert Q1 marks back to original (1 mark) and clear cache
    console.log('6. Reverting Q1 marks back to original value (1 mark)...');
    await pool.query("UPDATE questions SET marks = $1 WHERE id = $2", [originalMarks, Q1]);
    await redis.del(metaKey);
    await redis.del(sanitKey);
    await redis.del(authKey);
    console.log('✅ Staging question and cache cleanly restored.');

    if (freshQ1.marks === 5 && awardedScore === 5) {
      console.log('🎉 CACHE INVALIDATION & RE-GRADING TEST PASSED!');
    } else {
      console.error('❌ CACHE TEST FAILED: Score mismatch');
      process.exit(1);
    }

  } catch (err) {
    console.error('Cache test failed:', err);
    process.exit(1);
  } finally {
    await redis.quit();
    await pool.end();
  }
}

runCacheTest();
