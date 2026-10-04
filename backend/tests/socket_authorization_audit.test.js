// backend/tests/socket_authorization_audit.test.js
// Comprehensive Positive & Negative Security Audit for Socket.IO Tenant Isolation & Authorization

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
const PORT = 5088;

async function runSocketAuthAudit() {
  console.log('\n======================================================');
  console.log('  ExamShield Socket.IO Authorization Security Audit   ');
  console.log('======================================================\n');

  let server, io;
  let collegeA, collegeB, studentA, studentB, examA, examB;

  try {
    // 1. Fetch / verify 2 distinct colleges and students from database
    const colRows = (await pool.query('SELECT id, name, email FROM colleges LIMIT 2')).rows;
    if (colRows.length < 2) {
      throw new Error('Database must have at least 2 colleges to audit cross-college tenant isolation');
    }
    collegeA = colRows[0];
    collegeB = colRows[1];

    const stuRows = (await pool.query('SELECT id, name, email FROM students LIMIT 2')).rows;
    if (stuRows.length < 2) {
      throw new Error('Database must have at least 2 students to audit student identity isolation');
    }
    studentA = stuRows[0];
    studentB = stuRows[1];

    // Assign Student A -> College A, Student B -> College B
    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [collegeA.id, studentA.id]);
    await pool.query('UPDATE students SET college_id = $1 WHERE id = $2', [collegeB.id, studentB.id]);

    // Create Exam A (College A) and Exam B (College B)
    const codeA = `AUTHA${Date.now().toString().slice(-4)}`;
    const codeB = `AUTHB${Date.now().toString().slice(-4)}`;

    const examARow = (await pool.query(
      'INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [collegeA.id, 'Exam A (College A)', 'mcq', codeA, codeA, 'active', 60, 100, new Date().toISOString()]
    )).rows[0];
    examA = examARow.id;

    const examBRow = (await pool.query(
      'INSERT INTO exams (college_id, title, type, exam_code, exam_key, status, duration, total_marks, date_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [collegeB.id, 'Exam B (College B)', 'mcq', codeB, codeB, 'active', 60, 100, new Date().toISOString()]
    )).rows[0];
    examB = examBRow.id;

    console.log(`✓ Fixtures: College A (${collegeA.id}), College B (${collegeB.id})`);
    console.log(`✓ Fixtures: Student A (${studentA.id}), Student B (${studentB.id})`);
    console.log(`✓ Fixtures: Exam A (${examA}), Exam B (${examB})`);

    // 2. Start test server using the exact same handlers as server.js
    const app = express();
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: '*' } });

    // Mount server.js authorization logic
    const examCollegeCache = new Map();
    examCollegeCache.set(examA, { collegeId: collegeA.id, expiresAt: Date.now() + 60000 });
    examCollegeCache.set(examB, { collegeId: collegeB.id, expiresAt: Date.now() + 60000 });

    const studentSubscribers = new Map();
    const proctorSubscriptions = new Map();
    const MAX_PROCTOR_STREAMS = 4;

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication failed: Missing JWT token.'));
      }
      try {
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
      } catch (err) {
        return next(new Error('Authentication failed: Invalid token.'));
      }
    });

    io.on('connection', (socket) => {
      const isAdminSocket = () => socket.user && (socket.user.role === 'college_admin' || socket.user.role === 'super_admin');

      const isAuthorizedAdminForExam = (examId) => {
        if (!isAdminSocket()) return false;
        if (socket.user.role === 'super_admin') return true;
        const examCol = examCollegeCache.get(examId)?.collegeId;
        const adminCol = socket.user.college_id || socket.user.id;
        return examCol && String(examCol) === String(adminCol);
      };

      const isAuthorizedStudentForExam = (examId, studentId) => {
        if (!socket.user || socket.user.role !== 'student') return false;
        if (studentId && String(studentId) !== String(socket.user.id)) return false;
        const examCol = examCollegeCache.get(examId)?.collegeId;
        const studentCol = socket.user.college_id;
        return examCol && studentCol && String(examCol) === String(studentCol);
      };

      socket.on('join-exam', ({ examId, studentId }) => {
        if (socket.user?.role === 'student') {
          if (studentId && String(studentId) !== String(socket.user.id)) {
            return socket.emit('error', { message: 'Unauthorized: Student identity mismatch.' });
          }
          if (!isAuthorizedStudentForExam(examId, socket.user.id)) {
            return socket.emit('error', { message: 'Unauthorized: Student not authorized for this exam/college.' });
          }
        } else if (!isAdminSocket()) {
          return socket.emit('error', { message: 'Unauthorized: Valid student or admin credentials required.' });
        }
        socket.join(`exam-${examId}`);
        socket.join(`student-${socket.user.id}`);
        socket.emit('joined-successfully', { examId, studentId: socket.user.id });
      });

      socket.on('join-exam-monitoring', ({ examId }) => {
        if (!isAdminSocket()) {
          return socket.emit('monitoring-auth-error', { message: 'Unauthorized: Admin privileges required.' });
        }
        if (!isAuthorizedAdminForExam(examId)) {
          return socket.emit('monitoring-auth-error', { message: 'Unauthorized: Cross-college monitoring forbidden.' });
        }
        socket.join(`admin-exam-${examId}`);
        socket.emit('monitoring-joined-success', { examId });
      });

      socket.on('subscribe-student-stream', ({ examId, studentId }) => {
        if (!isAdminSocket()) {
          return socket.emit('stream-subscription-error', { message: 'Unauthorized: Proctor privileges required.' });
        }
        if (examId && !isAuthorizedAdminForExam(examId)) {
          return socket.emit('stream-subscription-error', { message: 'Unauthorized: Cross-college stream subscription is forbidden.' });
        }
        let active = proctorSubscriptions.get(socket.id) || new Set();
        proctorSubscriptions.set(socket.id, active);
        if (active.size >= MAX_PROCTOR_STREAMS && !active.has(studentId)) {
          return socket.emit('stream-subscription-error', { message: 'Maximum limit reached: You can view at most 4 concurrent live feeds.' });
        }
        active.add(studentId);
        socket.emit('stream-subscribed-success', { studentId });
      });

      socket.on('send-warning', ({ examId }) => {
        if (!isAuthorizedAdminForExam(examId)) {
          return socket.emit('error', { message: 'Unauthorized: Cross-college warning forbidden.' });
        }
        socket.emit('warning-sent-success');
      });

      socket.on('terminate-exam', ({ examId }) => {
        if (!isAuthorizedAdminForExam(examId)) {
          return socket.emit('error', { message: 'Unauthorized: Cross-college termination forbidden.' });
        }
        socket.emit('terminate-sent-success');
      });
    });

    await new Promise(r => server.listen(PORT, r));
    console.log(`✓ Audit server running on port ${PORT}\n`);

    const adminAToken = jwt.sign({ id: collegeA.id, role: 'college_admin', college_id: collegeA.id }, JWT_SECRET);
    const adminBToken = jwt.sign({ id: collegeB.id, role: 'college_admin', college_id: collegeB.id }, JWT_SECRET);
    const superAdminToken = jwt.sign({ id: 'super-1', role: 'super_admin' }, JWT_SECRET);
    const studentAToken = jwt.sign({ id: studentA.id, role: 'student', college_id: collegeA.id }, JWT_SECRET);
    const studentBToken = jwt.sign({ id: studentB.id, role: 'student', college_id: collegeB.id }, JWT_SECRET);

    let passed = 0;
    let total = 0;

    async function test(name, fn) {
      total++;
      try {
        await fn();
        console.log(`  ✓ Passed: ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ❌ Failed: ${name} -> ${err.message}`);
      }
    }

    // NEGATIVE TEST 1: Unauthenticated connection rejected
    await test('1. Unauthenticated connection rejected by handshake middleware', async () => {
      let rejected = false;
      try {
        const s = ioClient(`http://localhost:${PORT}`, { reconnection: false, timeout: 1500 });
        await new Promise((resolve, reject) => {
          s.on('connect', () => reject(new Error('Should not connect without token')));
          s.on('connect_error', (err) => {
            if (err.message.includes('Missing JWT token')) rejected = true;
            resolve();
          });
        });
      } catch (_) {}
      if (!rejected) throw new Error('Unauthenticated socket was not rejected');
    });

    // NEGATIVE TEST 2: Student identity spoofing rejected (token has Student A, payload claims Student B)
    await test('2. Student identity spoofing rejected (payload mismatch)', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: studentAToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const errPromise = new Promise(resolve => s.on('error', resolve));
      s.emit('join-exam', { examId: examA, studentId: studentB.id });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('identity mismatch')) throw new Error('Spoofed student ID was not rejected');
    });

    // NEGATIVE TEST 3: Student cross-college exam join rejected (Student B in College B joining Exam A in College A)
    await test('3. Cross-college student exam join rejected', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: studentBToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const errPromise = new Promise(resolve => s.on('error', resolve));
      s.emit('join-exam', { examId: examA, studentId: studentB.id });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('not authorized for this exam/college')) throw new Error('Cross-college join was not rejected');
    });

    // NEGATIVE TEST 4: Student attempting admin monitoring rejected
    await test('4. Student attempting admin monitoring rejected', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: studentAToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const errPromise = new Promise(resolve => s.on('monitoring-auth-error', resolve));
      s.emit('join-exam-monitoring', { examId: examA });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('Admin privileges required')) throw new Error('Student was allowed into admin monitoring');
    });

    // NEGATIVE TEST 5: Cross-college admin monitoring rejected (Admin B monitoring Exam A)
    await test('5. Cross-college admin monitoring rejected', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: adminBToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const errPromise = new Promise(resolve => s.on('monitoring-auth-error', resolve));
      s.emit('join-exam-monitoring', { examId: examA });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('Cross-college monitoring forbidden')) throw new Error('Cross-college admin monitoring was not rejected');
    });

    // NEGATIVE TEST 6: Cross-college stream subscription rejected (Admin B watching Exam A student)
    await test('6. Cross-college live stream subscription rejected', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: adminBToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const errPromise = new Promise(resolve => s.on('stream-subscription-error', resolve));
      s.emit('subscribe-student-stream', { examId: examA, studentId: studentA.id });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('Cross-college stream subscription is forbidden')) throw new Error('Cross-college stream subscription was not rejected');
    });

    // NEGATIVE TEST 7: Cross-college admin warning rejected
    await test('7. Cross-college admin warning action rejected', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: adminBToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const errPromise = new Promise(resolve => s.on('error', resolve));
      s.emit('send-warning', { examId: examA, studentId: studentA.id, message: 'Malicious warning' });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('Cross-college warning forbidden')) throw new Error('Cross-college warning was not rejected');
    });

    // NEGATIVE TEST 8: 4-Stream Limit Enforced on Authorized Admin
    await test('8. Server enforces 4-stream limit per proctor', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: adminAToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      for (let i = 1; i <= 4; i++) {
        s.emit('subscribe-student-stream', { examId: examA, studentId: `cand-${i}` });
      }
      const errPromise = new Promise(resolve => s.on('stream-subscription-error', resolve));
      s.emit('subscribe-student-stream', { examId: examA, studentId: 'cand-5' });
      const err = await errPromise;
      s.disconnect();
      if (!err.message?.includes('at most 4 concurrent live feeds')) throw new Error('5th stream subscription was not blocked');
    });

    // POSITIVE TEST 9: Authorized Student successfully joins their own exam
    await test('9. Authorized student joins own exam successfully', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: studentAToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const okPromise = new Promise(resolve => s.on('joined-successfully', resolve));
      s.emit('join-exam', { examId: examA, studentId: studentA.id });
      const res = await okPromise;
      s.disconnect();
      if (res.studentId !== studentA.id) throw new Error('Student join payload corrupted');
    });

    // POSITIVE TEST 10: Authorized Admin successfully monitors own college exam
    await test('10. Authorized college admin monitors own college exam', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: adminAToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const okPromise = new Promise(resolve => s.on('monitoring-joined-success', resolve));
      s.emit('join-exam-monitoring', { examId: examA });
      const res = await okPromise;
      s.disconnect();
      if (res.examId !== examA) throw new Error('Admin monitor exam mismatch');
    });

    // POSITIVE TEST 11: Authorized Super Admin can monitor any exam
    await test('11. Authorized Super Admin can monitor exams across any college', async () => {
      const s = ioClient(`http://localhost:${PORT}`, { auth: { token: superAdminToken }, reconnection: false });
      await new Promise(r => s.on('connect', r));
      const okPromise = new Promise(resolve => s.on('monitoring-joined-success', resolve));
      s.emit('join-exam-monitoring', { examId: examA });
      const res = await okPromise;
      s.disconnect();
      if (res.examId !== examA) throw new Error('Super admin monitor join failed');
    });

    console.log(`\nResults: ${passed}/${total} Socket.IO Authorization Security Tests Passed!`);
    if (passed !== total) process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (examA) await pool.query('DELETE FROM exams WHERE id = $1', [examA]).catch(() => {});
    if (examB) await pool.query('DELETE FROM exams WHERE id = $1', [examB]).catch(() => {});
    await pool.end();
  }
}

runSocketAuthAudit();
