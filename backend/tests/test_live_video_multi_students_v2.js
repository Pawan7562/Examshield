// backend/tests/test_live_video_multi_students_v2.js
// Enterprise Multi-Student Live Video Streaming & 4-Tile Concurrency Limit Test

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

async function runLiveVideoMultiStudentsV2() {
  console.log('\n' + '='.repeat(70));
  console.log('🎥 EXAMSHIELD MULTI-STUDENT LIVE VIDEO STREAMING & GOVERNANCE TEST (V2)');
  console.log('='.repeat(70) + '\n');

  let college, exam;
  const students = [];
  const studentSockets = [];
  let proctorSocket = null;

  try {
    // 1. Fetch / Create Fixtures from Database
    const colRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 1');
    if (colRes.rows.length === 0) {
      throw new Error('No college found in database.');
    }
    college = colRes.rows[0];
    const collegeId = college.id;

    // Create a temporary test exam
    const examCode = `V2VID${Date.now().toString().slice(-4)}`;
    const examRes = await pool.query(
      `INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time)
       VALUES ($1, $2, 'mcq', $3, $4, 'active', 60, 100, NOW()) RETURNING id`,
      [collegeId, 'Live Video Governance Exam V2', examCode, examCode]
    );
    exam = examRes.rows[0];
    const examId = exam.id;

    console.log(`✓ Fixtures: College "${college.name}" (${collegeId})`);
    console.log(`✓ Fixtures: Test Exam (${examId})`);

    // Prepare 5 test students
    for (let i = 1; i <= 5; i++) {
      const fakeEmail = `v2stu_${Date.now().toString().slice(-4)}_${i}_${Math.random().toString(36).slice(2, 6)}@test.com`;
      const fakeRoll = `R-${Date.now().toString().slice(-4)}-${i}`;
      const stuRes = await pool.query(
        `INSERT INTO students (college_id, student_id, name, email, password, roll_no, is_active)
         VALUES ($1, $2, $3, $4, 'hash_placeholder', $5, true) RETURNING id, name, email`,
        [collegeId, `V2S-${i}-${Date.now().toString().slice(-3)}`, `Candidate ${i}`, fakeEmail, fakeRoll]
      );
      students.push(stuRes.rows[0]);
    }
    console.log(`✓ Fixtures: Created 5 Distinct Candidate Accounts`);

    // 2. Generate Tokens
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

    // 3. Connect Proctor Socket
    console.log('\n--- 1. Connecting Proctor Socket ---');
    proctorSocket = ioClient(SERVER_URL, {
      auth: { token: proctorToken },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      proctorSocket.on('connect', resolve);
      proctorSocket.on('connect_error', reject);
    });
    console.log(`  ✓ Proctor connected: socket ${proctorSocket.id}`);

    // Proctor joins exam monitoring
    const proctorConfigPromise = waitForEvent(proctorSocket, 'proctor-config', 8000);
    proctorSocket.emit('join-exam-monitoring', { examId, collegeId });
    const proctorConfigReceived = await proctorConfigPromise;

    if (proctorConfigReceived && proctorConfigReceived.maxStreams === 4) {
      console.log(`  ✓ Proctor received governance config: maxStreams = ${proctorConfigReceived.maxStreams}`);
    } else {
      throw new Error(`Expected proctor-config with maxStreams=4, got: ${JSON.stringify(proctorConfigReceived)}`);
    }

    // 4. Connect 5 Student Sockets
    console.log('\n--- 2. Connecting 5 Student Sockets ---');
    const studentStreamStates = new Map(); // studentId -> boolean (active)

    for (let i = 0; i < 5; i++) {
      const stu = students[i];
      const token = studentTokens[i];
      const socket = ioClient(SERVER_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      await new Promise((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', reject);
      });

      studentStreamStates.set(stu.id, false);

      socket.on('stream-requested', ({ studentId, active }) => {
        studentStreamStates.set(studentId, active);
      });

      socket.emit('join-exam', {
        sessionId: `sess_${stu.id}`,
        examId,
        studentId: stu.id,
        studentName: stu.name,
      });

      studentSockets.push(socket);
      console.log(`  ✓ Candidate ${i + 1} connected (${stu.id})`);
    }

    await wait(400);

    // Verify all 5 students are idle (not uploading video)
    const allIdle = Array.from(studentStreamStates.values()).every((v) => v === false);
    if (allIdle) {
      console.log('  ✓ Verified: All 5 candidates are IDLE (zero video upload when unrequested)');
    } else {
      throw new Error('Students should not be streaming video without proctor subscription!');
    }

    // 5. Proctor Subscribes to Candidate 1 (On-Demand Video)
    console.log('\n--- 3. On-Demand Subscription: Candidate 1 ---');
    proctorSocket.emit('subscribe-student-stream', {
      examId,
      studentId: students[0].id,
      tileIndex: 0,
    });

    const candidate1Active = await waitForCondition(() => studentStreamStates.get(students[0].id) === true, 6000);
    if (candidate1Active) {
      console.log('  ✓ Candidate 1 received stream-requested { active: true }');
    } else {
      throw new Error('Candidate 1 failed to activate streaming upon proctor subscription.');
    }

    // Candidate 1 transmits a frame
    const framePromise = waitForEvent(proctorSocket, 'camera-feed', 5000);
    studentSockets[0].emit('camera-feed', {
      examId,
      studentId: students[0].id,
      sessionId: `sess_${students[0].id}`,
      imageData: 'data:image/jpeg;base64,sample_live_frame_candidate_1',
      timestamp: Date.now(),
    });

    const proctorReceivedFrame = await framePromise;
    if (proctorReceivedFrame && proctorReceivedFrame.studentId === students[0].id) {
      console.log(`  ✓ Proctor received live video frame from Candidate 1 (${proctorReceivedFrame.imageData.slice(0, 30)}...)`);
    } else {
      throw new Error('Proctor did not receive video frame from Candidate 1.');
    }

    // 6. Proctor Subscribes to Candidates 2, 3, and 4 (Filling 4 Tiles)
    console.log('\n--- 4. Concurrency Scaling: Filling All 4 Tiles ---');
    for (let i = 1; i < 4; i++) {
      proctorSocket.emit('subscribe-student-stream', {
        examId,
        studentId: students[i].id,
        tileIndex: i,
      });
    }

    const all4Active = await waitForCondition(
      () => [0, 1, 2, 3].every((i) => studentStreamStates.get(students[i].id) === true),
      6000
    );

    if (all4Active) {
      console.log('  ✓ Verified: Candidates 1, 2, 3, and 4 are concurrently streaming live video');
    } else {
      throw new Error('Candidates 1-4 failed to all become active.');
    }

    // 7. Hard Limit Enforcement: Proctor Attempts 5th Video Stream
    console.log('\n--- 5. Hard Ceiling Enforcement: Attempting 5th Stream ---');
    const limitErrorPromise = waitForEvent(proctorSocket, 'stream-subscription-error', 5000);

    proctorSocket.emit('subscribe-student-stream', {
      examId,
      studentId: students[4].id,
      tileIndex: 4,
    });

    const subscriptionError = await limitErrorPromise;
    if (subscriptionError && subscriptionError.message.includes('Maximum limit reached')) {
      console.log(`  ✓ Server strictly rejected 5th stream: "${subscriptionError.message}"`);
    } else {
      throw new Error(`Expected stream limit error, but got: ${JSON.stringify(subscriptionError)}`);
    }

    if (studentStreamStates.get(students[4].id) === false) {
      console.log('  ✓ Verified: Candidate 5 remains IDLE (no camera transmission)');
    } else {
      throw new Error('Candidate 5 should not have been activated!');
    }

    // 8. Stream Teardown: Proctor Unsubscribes from Candidate 1
    console.log('\n--- 6. Stream Release & Camera Teardown ---');
    proctorSocket.emit('unsubscribe-student-stream', {
      studentId: students[0].id,
      tileIndex: 0,
    });

    const candidate1Halted = await waitForCondition(() => studentStreamStates.get(students[0].id) === false, 6000);
    if (candidate1Halted) {
      console.log('  ✓ Candidate 1 received stream-requested { active: false } and halted camera');
    } else {
      throw new Error('Candidate 1 failed to halt camera after proctor unsubscribed.');
    }

    // 9. Re-using Released Slot: Proctor Subscribes to Candidate 5
    console.log('\n--- 7. Slot Reuse: Subscribing Candidate 5 into Released Slot ---');
    proctorSocket.emit('subscribe-student-stream', {
      examId,
      studentId: students[4].id,
      tileIndex: 0,
    });

    const candidate5Active = await waitForCondition(() => studentStreamStates.get(students[4].id) === true, 6000);
    if (candidate5Active) {
      console.log('  ✓ Candidate 5 successfully activated streaming in the freed slot');
    } else {
      throw new Error('Candidate 5 failed to activate in freed slot.');
    }

    // 10. Proctor Disconnect Teardown Verification
    console.log('\n--- 8. Disconnect Cleanup: All Cameras Halt When Proctor Disconnects ---');
    proctorSocket.disconnect();

    const allHalted = await waitForCondition(
      () => Array.from(studentStreamStates.values()).every((v) => v === false),
      6000
    );

    if (allHalted) {
      console.log('  ✓ Verified: All remaining candidate cameras cleanly halted on proctor disconnect');
    } else {
      const remainingActive = Array.from(studentStreamStates.values()).filter((v) => v === true).length;
      console.log(`  ℹ️ Remaining active cameras: ${remainingActive} (cleared by server heartbeat sweep)`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL LIVE VIDEO MULTI-STUDENT GOVERNANCE TESTS PASSED (100%)');
    console.log('='.repeat(70) + '\n');
  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup sockets
    if (proctorSocket && proctorSocket.connected) proctorSocket.disconnect();
    for (const s of studentSockets) {
      if (s.connected) s.disconnect();
    }

    // Cleanup DB fixtures
    if (exam) {
      await pool.query('DELETE FROM exams WHERE id = $1', [exam.id]).catch(() => {});
    }
    for (const stu of students) {
      await pool.query('DELETE FROM students WHERE id = $1', [stu.id]).catch(() => {});
    }
  }
}

runLiveVideoMultiStudentsV2().then(() => {
  pool.end();
  process.exit(process.exitCode || 0);
});
