require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const { sendExamNotification, sendExamReminder, sendStudentCredentials } = require('../services/emailService');
const { dispatchBatch } = require('../services/autoEmailBatchService');

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 Testing Past/Expired Exam Notification Guards');
  console.log('===============================================================\n');

  // Test 1: sendExamNotification with past date
  console.log('[Test 1] sendExamNotification with past exam date...');
  const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // Yesterday
  const notifResult = await sendExamNotification({
    name: 'Test Student',
    email: 'test_student_guard@load.test',
    examName: 'Past Examination 101',
    examDate: pastDate,
    examDuration: 60,
    examKey: 'PAST-KEY-999',
    subject: 'History',
    collegeName: 'Test College'
  });

  assert.strictEqual(notifResult.success, false, 'Expected success to be false for past exam');
  assert.strictEqual(notifResult.skipped, true, 'Expected skipped to be true');
  console.log('✅ Test 1 Passed: Exam notification was cleanly aborted for past exam date.\n');

  // Test 2: sendExamReminder with past date
  console.log('[Test 2] sendExamReminder with past exam date...');
  const reminderResult = await sendExamReminder({
    name: 'Test Student',
    email: 'test_student_guard@load.test',
    examName: 'Past Examination 101',
    examDate: pastDate,
    examDuration: 60,
    examKey: 'PAST-KEY-999',
    collegeName: 'Test College'
  });

  assert.strictEqual(reminderResult.success, false, 'Expected success to be false for past exam reminder');
  assert.strictEqual(reminderResult.skipped, true, 'Expected skipped to be true');
  console.log('✅ Test 2 Passed: Exam reminder was cleanly aborted for past exam date.\n');

  // Test 3: sendStudentCredentials with onlyIfExamUpcoming = true and past exam
  console.log('[Test 3] sendStudentCredentials with onlyIfExamUpcoming and past exam date...');
  const credsResult = await sendStudentCredentials({
    name: 'Test Student',
    email: 'test_student_guard@load.test',
    studentId: 'STU-GUARD-01',
    password: 'TempPassword123!',
    collegeName: 'Test College',
    examName: 'Past Examination 101',
    examKey: 'PAST-KEY-999',
    examDate: pastDate,
    examDuration: 60,
    onlyIfExamUpcoming: true
  });

  assert.strictEqual(credsResult.success, false, 'Expected credentials send to be skipped');
  assert.strictEqual(credsResult.skipped, true, 'Expected skipped to be true');
  console.log('✅ Test 3 Passed: Credentials email was aborted when onlyIfExamUpcoming is set and exam has passed.\n');

  // Test 4: sendExamNotification with a completed exam from DB
  console.log('[Test 4] sendExamNotification with completed exam ID...');
  const completedExamId = 'ba5c395f-1192-49a7-80ca-0712af52868f'; // Known completed exam in DB
  const dbNotifResult = await sendExamNotification({
    name: 'Test Student',
    email: 'test_student_guard@load.test',
    examName: 'Completed Assessment',
    examKey: 'ANY-KEY',
    examId: completedExamId,
    collegeName: 'Test College'
  });

  assert.strictEqual(dbNotifResult.success, false, 'Expected DB completed exam notification to be skipped');
  assert.strictEqual(dbNotifResult.skipped, true, 'Expected skipped to be true');
  console.log('✅ Test 4 Passed: Completed exam ID in DB was recognized and aborted.\n');

  // Test 5: dispatchBatch skips past/completed exams
  console.log('[Test 5] dispatchBatch automated scheduler check...');
  const batchRes = await dispatchBatch(10);
  console.log('Batch dispatch result:', batchRes);
  assert.strictEqual(batchRes.sentCount, 0, 'Expected 0 emails sent when no upcoming exams exist');
  console.log('✅ Test 5 Passed: Automated batch scheduler sent 0 emails because all existing exams have passed.\n');

  console.log('🎉 ALL 5 PAST-EXAM NOTIFICATION GUARD TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
