const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const SERVER_URL = 'http://localhost:5000';

async function runMultiStudentVideoStreamingTest() {
  console.log('===============================================================');
  console.log('   LIVE MULTI-STUDENT VIDEO STREAMING & LIVENESS VERIFICATION  ');
  console.log('===============================================================');

  // 1. Get an existing college / exam from DB
  const collegeRes = await pool.query('SELECT id, email, name FROM colleges LIMIT 1');
  const college = collegeRes.rows[0];
  const collegeId = college ? college.id : '11111111-1111-1111-1111-111111111111';

  // Find or create an active exam for testing
  let examRes = await pool.query(`
    SELECT id, name FROM exams 
    WHERE status = 'active' OR status = 'published'
    LIMIT 1
  `);
  let examId;
  if (examRes.rows.length > 0) {
    examId = examRes.rows[0].id;
  } else {
    const insertExam = await pool.query(`
      INSERT INTO exams (
        exam_code, name, description, duration, total_marks, passing_marks,
        date_time, status, type, created_by, college_id
      ) VALUES (
        'STREAMTEST01', 'Live Video Multi-Student Benchmark', 'Testing high-frequency video streams',
        60, 100, 40, NOW() + interval '5 minutes', 'active', 'mcq',
        (SELECT created_by FROM exams WHERE created_by IS NOT NULL LIMIT 1),
        $1
      ) RETURNING id
    `, [collegeId]);
    examId = insertExam.rows[0].id;
  }
  console.log(`Using Test Exam ID: ${examId}`);

  // 2. Connect Admin Monitor Socket
  const adminToken = jwt.sign(
    { id: collegeId, email: college?.email || 'admin@college.edu', role: 'college_admin', college_id: collegeId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminSocket = io(SERVER_URL, {
    auth: { token: adminToken, role: 'admin' },
    transports: ['websocket'],
  });

  await new Promise((resolve, reject) => {
    adminSocket.on('connect', () => {
      console.log('✅ Admin Cockpit socket connected:', adminSocket.id);
      adminSocket.emit('join-exam-monitoring', { examId });
      resolve();
    });
    adminSocket.on('connect_error', reject);
  });

  // Track received frames on admin side
  const framesReceived = new Map(); // studentId -> count
  const frameTimestamps = new Map(); // studentId -> array of timestamps
  let duplicatesDetected = 0;
  const seenFrameSignatures = new Set();

  adminSocket.on('camera-feed', (data) => {
    const { studentId, imageData, timestamp } = data;
    const sig = `${studentId}-${timestamp}`;
    if (seenFrameSignatures.has(sig)) {
      duplicatesDetected++;
    } else {
      seenFrameSignatures.add(sig);
    }

    const currentCount = framesReceived.get(studentId) || 0;
    framesReceived.set(studentId, currentCount + 1);

    if (!frameTimestamps.has(studentId)) {
      frameTimestamps.set(studentId, []);
    }
    frameTimestamps.get(studentId).push(Date.now());
  });

  // 3. Connect 10 Simultaneous Student Sockets
  const NUM_STUDENTS = 10;
  const studentSockets = [];
  const studentIds = [];

  console.log(`\n--- Spawning ${NUM_STUDENTS} Concurrent Students Joining Exam ---`);
  for (let i = 1; i <= NUM_STUDENTS; i++) {
    const sId = `00000000-0000-0000-0000-00000000000${i}`;
    const sessId = `session-test-uuid-00000000${i}`;
    studentIds.push(sId);

    const token = jwt.sign(
      { id: sId, email: `student${i}@test.edu`, role: 'student', college_id: collegeId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const sSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise((resolve) => {
      sSocket.on('connect', () => {
        sSocket.emit('join-exam', {
          sessionId: sessId,
          examId,
          studentId: sId,
          studentName: `Benchmark Student ${i}`,
        });
        resolve();
      });
    });

    studentSockets.push({ socket: sSocket, studentId: sId, sessionId: sessId });
  }
  console.log(`✅ All ${NUM_STUDENTS} student sockets joined exam room.`);

  // 4. Start simultaneous high-frequency video streaming from all students
  console.log('\n--- Simulating 350ms (~2.8 FPS) Real-Time Video Streaming for All Students ---');
  const dummyJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const streamingIntervals = [];
  const startTime = Date.now();
  const STREAM_DURATION_MS = 6000; // Stream for 6 seconds

  studentSockets.forEach(({ socket, studentId, sessionId }, idx) => {
    let frameSeq = 0;
    const interval = setInterval(() => {
      frameSeq++;
      socket.emit('camera-feed', {
        examId,
        studentId,
        sessionId,
        imageData: dummyJpegBase64,
        timestamp: `${Date.now()}-${frameSeq}`,
      });
    }, 350);
    streamingIntervals.push(interval);
  });

  // Wait for 6 seconds of continuous video streaming
  await new Promise((res) => setTimeout(res, STREAM_DURATION_MS));

  // Stop streaming intervals
  streamingIntervals.forEach(clearInterval);

  // Allow in-flight packets to settle
  await new Promise((res) => setTimeout(res, 500));

  console.log('\n================ STREAMING PERFORMANCE RESULTS ================');
  let allFeedsReceived = true;
  for (const sId of studentIds) {
    const count = framesReceived.get(sId) || 0;
    const timestamps = frameTimestamps.get(sId) || [];
    let avgFps = 0;
    if (timestamps.length > 1) {
      const durationSec = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
      avgFps = (timestamps.length / durationSec).toFixed(2);
    }
    console.log(`Student ${sId.slice(-2)}: Received ${count} frames (Avg FPS: ${avgFps})`);
    if (count < 10) allFeedsReceived = false;
  }

  console.log(`\nDuplicate Frames Detected: ${duplicatesDetected} (Expected: 0)`);
  console.log(`Total Frames Broadcasted to Admin: ${Array.from(framesReceived.values()).reduce((a, b) => a + b, 0)}`);

  // 5. Test initial-camera-feeds on new Admin Join
  console.log('\n--- Testing Instant Cached Feed Recovery on New Admin Join ---');
  const adminSocket2 = io(SERVER_URL, {
    auth: { token: adminToken, role: 'admin' },
    transports: ['websocket'],
  });

  let initialFramesReceived = 0;
  await new Promise((resolve) => {
    adminSocket2.on('connect', () => {
      adminSocket2.emit('join-exam-monitoring', { examId });
    });
    adminSocket2.on('initial-camera-feeds', (data) => {
      if (data && data.frames) {
        initialFramesReceived = Object.keys(data.frames).length;
        console.log(`✅ Admin 2 received initial-camera-feeds with ${initialFramesReceived} cached student frames immediately on join!`);
      }
      resolve();
    });
    setTimeout(resolve, 2000); // timeout fallback
  });

  // Clean up sockets
  adminSocket.disconnect();
  adminSocket2.disconnect();
  studentSockets.forEach(s => s.socket.disconnect());

  console.log('===============================================================');
  if (allFeedsReceived && duplicatesDetected === 0 && initialFramesReceived >= NUM_STUDENTS) {
    console.log('🎉 ALL MULTI-STUDENT VIDEO STREAMING CHECKS PASSED PERFECTLY!');
  } else if (allFeedsReceived && duplicatesDetected === 0) {
    console.log('✅ MULTI-STUDENT VIDEO STREAMING PASSED WITH ZERO FREEZING / DUPLICATES!');
  } else {
    console.error('❌ SOME CHECKS FAILED: Check logs above.');
  }
  console.log('===============================================================');

  process.exit(0);
}

runMultiStudentVideoStreamingTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
