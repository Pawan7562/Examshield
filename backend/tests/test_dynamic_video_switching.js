// backend/tests/test_dynamic_video_switching.js
// Enterprise Dynamic Video Switching & Strict 4-Screen Quota Verification Test

require('dotenv').config();
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:5000';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForCondition(checkFn, timeoutMs = 6000, intervalMs = 100) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (checkFn()) return true;
    await wait(intervalMs);
  }
  return false;
}

function waitForEvent(socket, eventName, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${eventName}" after ${timeoutMs}ms`));
    }, timeoutMs);
    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runDynamicVideoSwitchingTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🎥 EXAMSHIELD DYNAMIC VIDEO SWITCHING & 4-SCREEN QUOTA TEST');
  console.log('='.repeat(70) + '\n');

  let college, exam;
  const students = [];
  const studentSockets = [];
  let proctorSocket = null;

  try {
    const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
    if (colRes.rows.length === 0) throw new Error('No college found.');
    college = colRes.rows[0];
    const collegeId = college.id;

    const examCode = `DYN${Date.now().toString().slice(-4)}`;
    const examRes = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, $2, 'mcq', $3, $4, 'active', 60, 100, NOW()) RETURNING id`,
      [collegeId, 'Dynamic Video Switch Exam', examCode, examCode]
    );
    exam = examRes.rows[0];
    const examId = exam.id;

    for (let i = 1; i <= 6; i++) {
      const fakeEmail = `dyn_${Date.now().toString().slice(-4)}_${i}@test.com`;
      const stuRes = await pool.query(
        `INSERT INTO students (college_id, student_id, name, email, password, roll_no, is_active)
         VALUES ($1, $2, $3, $4, 'placeholder', $5, true) RETURNING id, name, email`,
        [collegeId, `DS-${i}-${Date.now().toString().slice(-3)}`, `Candidate ${i}`, fakeEmail, `R-DS-${i}`]
      );
      students.push(stuRes.rows[0]);
    }
    console.log(`✓ Fixtures ready: 1 Exam (${examId}) and 6 Test Candidates`);

    const proctorToken = jwt.sign(
      { id: collegeId, email: college.email, role: 'college_admin', college_id: collegeId },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const studentTokens = students.map((stu) =>
      jwt.sign(
        { id: stu.id, email: stu.email, role: 'student', college_id: collegeId },
        JWT_SECRET,
        { expiresIn: '2h' }
      )
    );

    proctorSocket = ioClient(SERVER_URL, {
      auth: { token: proctorToken },
      transports: ['websocket'],
    });
    await waitForEvent(proctorSocket, 'connect');
    console.log('✓ Proctor connected');

    proctorSocket.emit('join-exam-monitoring', { examId });

    for (let i = 0; i < students.length; i++) {
      const s = ioClient(SERVER_URL, {
        auth: { token: studentTokens[i] },
        transports: ['websocket'],
      });
      await waitForEvent(s, 'connect');
      s.emit('join-exam', {
        examId,
        studentId: students[i].id,
        sessionId: `sess_${students[i].id}`,
        studentName: students[i].name,
      });
      studentSockets.push(s);
    }
    await wait(500);
    console.log('✓ All 6 candidates connected and joined in IDLE mode');

    // Subscribe Candidates 1, 2, 3, 4 into Screens 0, 1, 2, 3
    console.log('\n--- Populating Screens 1-4 ---');
    for (let idx = 0; idx < 4; idx++) {
      const stu = students[idx];
      const stuSock = studentSockets[idx];
      let streamActive = false;
      stuSock.on('stream-requested', ({ active }) => {
        streamActive = active;
      });

      proctorSocket.emit('subscribe-student-stream', {
        examId,
        studentId: stu.id,
        tileIndex: idx,
      });

      const ok = await waitForCondition(() => streamActive, 4000);
      if (!ok) throw new Error(`Candidate ${idx + 1} did not activate stream`);
      console.log(`  ✓ Candidate ${idx + 1} actively streaming on Screen ${idx + 1}`);
    }

    // Now DYNAMIC SWITCH: Replace Candidate 2 in Screen 2 with Candidate 5!
    console.log('\n--- Dynamic Switching: Replacing Candidate 2 with Candidate 5 in Screen 2 ---');
    let cand2Halted = false;
    studentSockets[1].on('stream-requested', ({ active }) => {
      if (!active) cand2Halted = true;
    });

    let cand5Started = false;
    studentSockets[4].on('stream-requested', ({ active }) => {
      if (active) cand5Started = true;
    });

    // 1. Unsubscribe Candidate 2
    proctorSocket.emit('unsubscribe-student-stream', {
      studentId: students[1].id,
      tileIndex: 1,
    });

    // 2. Subscribe Candidate 5 into Screen 2
    proctorSocket.emit('subscribe-student-stream', {
      examId,
      studentId: students[4].id,
      tileIndex: 1,
    });

    const switchOk = await waitForCondition(() => cand2Halted && cand5Started, 4000);
    if (!switchOk) {
      throw new Error(`Dynamic switch failed: cand2Halted=${cand2Halted}, cand5Started=${cand5Started}`);
    }
    console.log('  ✓ Candidate 2 halted video camera upload (active: false)');
    console.log('  ✓ Candidate 5 began live video transmission in Screen 2 (active: true)');

    // Verify 4-stream limit is maintained (attempting to add 5th should fail)
    console.log('\n--- Verifying Hard 4-Screen Limit ---');
    let subError = null;
    proctorSocket.once('stream-subscription-error', (err) => {
      subError = err;
    });

    proctorSocket.emit('subscribe-student-stream', {
      examId,
      studentId: students[5].id,
      tileIndex: 4,
    });

    const errOk = await waitForCondition(() => subError !== null, 3000);
    if (!errOk) throw new Error('Expected 5th stream to be blocked');
    console.log(`  ✓ Hard 4-screen limit enforced: "${subError.message}"`);

    console.log('\n======================================================================');
    console.log('🎉 DYNAMIC VIDEO SWITCHING & 4-SCREEN QUOTA TESTS PASSED (100%)');
    console.log('======================================================================\n');
  } finally {
    if (proctorSocket) proctorSocket.disconnect();
    studentSockets.forEach((s) => s.disconnect());
    if (exam) {
      await pool.query('DELETE FROM exams WHERE id = $1', [exam.id]).catch(() => {});
    }
    if (students.length > 0) {
      const ids = students.map((s) => s.id);
      await pool.query('DELETE FROM students WHERE id = ANY($1::uuid[])', [ids]).catch(() => {});
    }
    await pool.end();
  }
}

runDynamicVideoSwitchingTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
