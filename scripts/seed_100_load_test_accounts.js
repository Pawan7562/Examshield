// scripts/seed_100_load_test_accounts.js
// Safe, idempotent seeding of exactly 90 additional test student accounts (total: 100)
// strictly scoped to `@load.test` domain and assigned exclusively to test exam `a95d25ff-1d0b-4709-ac58-324dbec1371b`.
// ZERO modification or deletion of real/production student records.

const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../backend/config/database');

const TEST_EXAM_ID = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const TEST_PASSWORD = 'TestPassword123!';

async function seedTestAccounts() {
  console.log('====================================================');
  console.log('🔒 ISOLATED LOAD TEST ACCOUNT SEEDING (TARGET: 100)');
  console.log('====================================================\n');

  try {
    // 1. Verify test exam existence and college ID
    const examCheck = await pool.query(
      'SELECT id, college_id, title, exam_code FROM exams WHERE id = $1',
      [TEST_EXAM_ID]
    );

    if (examCheck.rows.length === 0) {
      console.error(`❌ Test exam ${TEST_EXAM_ID} not found!`);
      process.exit(1);
    }

    const testExam = examCheck.rows[0];
    const collegeId = testExam.college_id;
    console.log(`✅ Verified target test exam: "${testExam.title}" (ID: ${testExam.id})`);
    console.log(`   College ID: ${collegeId}`);

    // 2. Fetch current test accounts with `@load.test`
    const existingTestAccounts = await pool.query(`
      SELECT id, email, student_id, name
      FROM students
      WHERE email LIKE '%@load.test'
      ORDER BY id ASC
    `);

    console.log(`ℹ️ Existing @load.test accounts in DB: ${existingTestAccounts.rows.length}`);

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const needed = Math.max(0, 100 - existingTestAccounts.rows.length);

    if (needed > 0) {
      console.log(`🌱 Creating ${needed} additional @load.test test accounts...`);
      for (let i = 1; i <= needed; i++) {
        const studentUuid = uuidv4();
        const testStudentId = `LOAD-STU-${String(existingTestAccounts.rows.length + i).padStart(3, '0')}`;
        const testEmail = `load_student_${String(existingTestAccounts.rows.length + i).padStart(3, '0')}@load.test`;
        const testName = `Load Test Student ${existingTestAccounts.rows.length + i}`;

        const testRollNo = `ROLL-LOAD-${String(existingTestAccounts.rows.length + i).padStart(3, '0')}`;

        await pool.query(`
          INSERT INTO students (id, college_id, name, email, student_id, roll_no, password, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        `, [studentUuid, collegeId, testName, testEmail, testStudentId, testRollNo, hashedPassword]);
      }
      console.log(`✅ Successfully seeded ${needed} new @load.test test accounts.`);
    } else {
      console.log('✅ Exactly 100 or more @load.test accounts already exist.');
    }

    // 3. Query all 100 test accounts
    const all100TestAccounts = await pool.query(`
      SELECT id, email, student_id, name
      FROM students
      WHERE email LIKE '%@load.test'
      ORDER BY id ASC
      LIMIT 100
    `);

    console.log(`✅ Total confirmed @load.test accounts: ${all100TestAccounts.rows.length}`);

    // Ensure all 100 have updated password
    const studentUuids = all100TestAccounts.rows.map(r => r.id);
    await pool.query(`
      UPDATE students
      SET password = $1, is_active = true
      WHERE id = ANY($2::uuid[]) AND email LIKE '%@load.test'
    `, [hashedPassword, studentUuids]);

    // 4. Assign all 100 accounts to the test exam in exam_assignments
    console.log(`📋 Assigning all 100 test accounts to test exam ${TEST_EXAM_ID}...`);
    for (const sId of studentUuids) {
      await pool.query(`
        INSERT INTO exam_assignments (exam_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [TEST_EXAM_ID, sId]);
    }
    console.log('✅ Verified exam assignments for all 100 test accounts.');

    // 5. Clean up any previous sessions/answers for these 100 test students on this test exam
    await pool.query(`
      DELETE FROM answers WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [TEST_EXAM_ID, studentUuids]);
    await pool.query(`
      DELETE FROM results WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [TEST_EXAM_ID, studentUuids]);
    await pool.query(`
      DELETE FROM exam_sessions WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [TEST_EXAM_ID, studentUuids]);
    console.log('✅ Cleaned previous test sessions & answers for all 100 test accounts.');

    // 6. Write load-tests/test_students.json fixture for k6
    const fixtureData = all100TestAccounts.rows.map(r => ({
      emailOrId: r.email,
      password: TEST_PASSWORD
    }));

    const targetPath = path.join(__dirname, '../load-tests/test_students.json');
    fs.writeFileSync(targetPath, JSON.stringify(fixtureData, null, 2), 'utf8');
    console.log(`📁 Updated ${targetPath} with ${fixtureData.length} unique test accounts.`);

    console.log('\n====================================================');
    console.log('🎉 100 TEST ACCOUNTS READY FOR LOAD TESTING');
    console.log('====================================================\n');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during test account setup:', err.message);
    await pool.end();
    process.exit(1);
  }
}

seedTestAccounts();
