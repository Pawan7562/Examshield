// backend/tests/two_replica_socket_test.js
// Multi-Instance Dual-Replica Socket.IO Cluster Integration Test
// Uses production Socket.IO authentication and event handlers (no isolated re-implementations)

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { attachSocketHandlers } = require('../socket/examSocketHandlers');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const REDIS_URL = process.env.REDIS_URL;

async function runTwoReplicaTest() {
  console.log('\n======================================================');
  console.log('  ExamShield Dual-Replica Socket.IO Cluster Verification');
  console.log('======================================================\n');

  if (!REDIS_URL) {
    console.log('ℹ️  REDIS_URL environment variable is not defined.');
    console.log('   Multi-replica cross-node messaging relies on the Socket.IO Redis Adapter.');
    console.log('   [STAGING REQUIREMENT]:');
    console.log('   Cross-replica cluster functionality CANNOT be verified without an active Redis instance.');
    console.log('   To execute this test across two live cluster nodes:');
    console.log('     1. Start a Redis instance (e.g. docker run -p 6379:6379 redis:alpine)');
    console.log('     2. Run: REDIS_URL=redis://localhost:6379 node backend/tests/two_replica_socket_test.js');
    console.log('\n   [Production Handler Integration]:');
    console.log('   - The harness mounts the exact production attachSocketHandlers() logic.');
    console.log('   - Reuses production JWT authentication, multi-tenant authorization, and 4-stream limits.');
    console.log('   - Avoids starting long-running background cron or email notification services.');
    console.log('\n======================================================');
    console.log('  [PRE-STAGING NOTICE]: Skipping live Redis cluster test (No REDIS_URL)');
    console.log('======================================================\n');
    return;
  }

  const { createClient } = require('redis');
  const { createAdapter } = require('@socket.io/redis-adapter');

  let server1, server2, io1, io2;
  const PORT_1 = 5051;
  const PORT_2 = 5052;

  try {
    // 1. Setup Replica 1
    const app1 = express();
    server1 = http.createServer(app1);
    io1 = new Server(server1, { cors: { origin: '*' } });
    const pub1 = createClient({ url: REDIS_URL });
    const sub1 = pub1.duplicate();
    await Promise.all([pub1.connect(), sub1.connect()]);
    io1.adapter(createAdapter(pub1, sub1));

    // 2. Setup Replica 2
    const app2 = express();
    server2 = http.createServer(app2);
    io2 = new Server(server2, { cors: { origin: '*' } });
    const pub2 = createClient({ url: REDIS_URL });
    const sub2 = pub2.duplicate();
    await Promise.all([pub2.connect(), sub2.connect()]);
    io2.adapter(createAdapter(pub2, sub2));

    // Attach exact production authorization & handlers to both replicas
    const testLogger = {
      info: () => {},
      warn: (msg) => console.warn('Replica Warn:', msg),
      error: (msg) => console.error('Replica Error:', msg),
    };
    attachSocketHandlers(io1, { logger: testLogger });
    attachSocketHandlers(io2, { logger: testLogger });

    await new Promise(r => server1.listen(PORT_1, r));
    await new Promise(r => server2.listen(PORT_2, r));
    console.log(`✓ Replica 1 listening on port ${PORT_1} (Connected to Redis)`);
    console.log(`✓ Replica 2 listening on port ${PORT_2} (Connected to Redis)`);

    // 3. Connect Proctor to Replica 1 (as super_admin so cross-college bypass works for test)
    const adminToken = jwt.sign({ id: 'adm-super-1', role: 'super_admin' }, JWT_SECRET);
    const proctorSocket = ioClient(`http://localhost:${PORT_1}`, {
      auth: { token: adminToken },
      transports: ['websocket']
    });

    // 4. Connect Student to Replica 2
    const studentToken = jwt.sign({ id: 'stu-replica-1', role: 'student' }, JWT_SECRET);
    const studentSocket = ioClient(`http://localhost:${PORT_2}`, {
      auth: { token: studentToken },
      transports: ['websocket']
    });

    await new Promise(r => proctorSocket.on('connect', r));
    await new Promise(r => studentSocket.on('connect', r));
    console.log('✓ Proctor connected to Replica 1, Student connected to Replica 2');

    // 5. Test Cross-Node Event: Proctor joins monitoring room on Replica 1; Student joins exam on Replica 2
    const testExamId = 'exam-cross-test';
    proctorSocket.emit('monitor-exam', { examId: testExamId });

    const studentJoinedPromise = new Promise(resolve => {
      proctorSocket.on('student-joined', resolve);
    });

    studentSocket.emit('join-exam', { examId: testExamId, studentId: 'stu-replica-1', studentName: 'Test Student' });
    const joinedEvent = await studentJoinedPromise;
    if (joinedEvent.studentId !== 'stu-replica-1') throw new Error('Cross-replica student-joined event failed');
    console.log('✓ Cross-replica join event successfully relayed from Replica 2 to Replica 1');

    // 6. Test Stream Request: Proctor on Replica 1 requests stream for Student on Replica 2
    const streamRequestedPromise = new Promise(resolve => {
      studentSocket.on('stream-requested', resolve);
    });

    proctorSocket.emit('subscribe-student-stream', { studentId: 'stu-replica-1' });
    const streamReq = await streamRequestedPromise;
    if (!streamReq.active) throw new Error('Cross-replica stream-requested event was not active');
    console.log('✓ Cross-replica stream request successfully signaled from Replica 1 to Replica 2');

    // 7. Test Video Frame Broadcast: Student on Replica 2 streams frame; Proctor on Replica 1 receives
    const framePromise = new Promise(resolve => {
      proctorSocket.on('camera-feed', resolve);
    });
    studentSocket.emit('camera-feed', { examId: testExamId, studentId: 'stu-replica-1', imageData: 'data:image/jpeg;base64,TESTFRAME' });
    const frame = await framePromise;
    if (!frame.imageData || !frame.imageData.includes('TESTFRAME')) throw new Error('Cross-replica camera frame delivery failed');
    console.log('✓ Cross-replica camera frame successfully transmitted across nodes');

    // 8. Test 4-Stream Limit on Replica 1
    for (let i = 2; i <= 5; i++) {
      proctorSocket.emit('subscribe-student-stream', { studentId: `stu-replica-${i}` });
    }
    const limitError = await new Promise(resolve => {
      proctorSocket.on('stream-subscription-error', resolve);
    });
    if (!limitError.message.includes('Maximum limit reached')) throw new Error('4-Stream limit not enforced');
    console.log('✓ Server-side 4-stream limit per proctor successfully enforced');

    // 9. Cleanup & Disconnect Test
    const streamHaltPromise = new Promise(resolve => {
      studentSocket.on('stream-requested', resolve);
    });
    proctorSocket.disconnect();
    const haltEvent = await streamHaltPromise;
    if (haltEvent.active !== false) throw new Error('Proctor disconnect did not halt student video stream');
    console.log('✓ Proctor disconnect cleanly signaled student camera halt across replicas');

    studentSocket.disconnect();
    console.log('\n======================================================');
    console.log('  ✓ ALL TWO-REPLICA CLUSTER TESTS PASSED!             ');
    console.log('======================================================\n');
  } finally {
    if (server1) server1.close();
    if (server2) server2.close();
  }
}

if (require.main === module) {
  runTwoReplicaTest().catch(console.error);
}

module.exports = { runTwoReplicaTest };
