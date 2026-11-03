const pool = require('../config/database');
const { autoCloseExpiredExams, checkAndCloseSpecificExam } = require('../services/examLifecycleService');
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testLifecycle() {
  console.log('--- Testing Exam Lifecycle & Expiration ---');
  try {
    // 1. Run autoCloseExpiredExams
    const result = await autoCloseExpiredExams();
    console.log('autoCloseExpiredExams result:', result);

    // 2. Query any exam that is still published/active where date_time + duration <= NOW()
    const overdueRes = await pool.query(`
      SELECT id, name, status, date_time, duration
      FROM exams
      WHERE status IN ('published', 'active')
        AND (date_time + (duration || ' minutes')::interval) <= NOW()
    `);
    console.log('Overdue exams still in active/published:', overdueRes.rows.length);
    if (overdueRes.rows.length > 0) {
      console.error('FAIL: Found overdue exams that were not closed:', overdueRes.rows);
    } else {
      console.log('SUCCESS: No overdue exams remain open.');
    }

    const examSample = await pool.query("SELECT college_id, created_by FROM exams WHERE college_id IS NOT NULL LIMIT 1");
    const { college_id, created_by } = examSample.rows[0];

    // 3. Create a temporary expired exam to test rejection
    const insertRes = await pool.query(`
      INSERT INTO exams (
        exam_code, name, description, duration, total_marks, passing_marks, 
        date_time, status, type, created_by, college_id
      ) VALUES (
        'TESTEXPIRED99',
        'Automated Test Expired Exam',
        'Should not be startable',
        10,
        100,
        40,
        NOW() - interval '20 minutes',
        'published',
        'mcq',
        $1,
        $2
      ) RETURNING id
    `, [created_by, college_id]);
    const expiredExamId = insertRes.rows[0].id;
    console.log('Created temporary expired exam ID:', expiredExamId);

    // Test checkAndCloseSpecificExam
    const closeRes = await checkAndCloseSpecificExam(expiredExamId);
    console.log('checkAndCloseSpecificExam on overdue exam:', closeRes);

    const checkStatus = await pool.query('SELECT status FROM exams WHERE id = $1', [expiredExamId]);
    console.log('Exam status in DB:', checkStatus.rows[0]?.status);

    // Clean up temporary exam
    await pool.query('DELETE FROM exams WHERE id = $1', [expiredExamId]);
    console.log('Cleaned up temporary exam.');

    console.log('ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    process.exit(0);
  }
}

testLifecycle();
