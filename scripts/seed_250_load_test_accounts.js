// scripts/seed_250_load_test_accounts.js
// Safe, idempotent seeding of exactly 150 additional test accounts (total: 250)
// strictly scoped to `@load.test` domain and assigned exclusively to staging exam `a95d25ff-1d0b-4709-ac58-324dbec1371b`.
// ZERO modification or deletion of real student records.

const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../backend/config/database');

const TEST_EXAM_ID = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const TEST_PASSWORD = 'TestPassword123!';
const TARGET_TOTAL = 250;

async function seed250TestAccounts() {
  console.log('====================================================');
  console.log(`🔒 ISOLATED LOAD TEST ACCOUNT SEEDING (TARGET: ${TARGET_TOTAL})`);
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
    console.log(`✅ Target test exam confirmed: "${testExam.title}" (ID: ${testExam.id})`);

    // 2. Fetch current test accounts with `@load.test`
    const existingTestAccounts = await pool.query(`
      SELECT id, email, student_id, name
      FROM students
      WHERE email LIKE '%@load.test'
      ORDER BY id ASC
    `);

    console.log(`ℹ️ Existing @load.test accounts in DB: ${existingTestAccounts.rows.length}`);

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const needed = Math.max(0, TARGET_TOTAL - existingTestAccounts.rows.length);

    if (needed > 0) {
      console.log(`🌱 Creating ${needed} additional @load.test accounts...`);
      for (let i = 1; i <= needed; i++) {
        const studentUuid = uuidv4();
        const num = existingTestAccounts.rows.length + i;
        const testStudentId = `LOAD-STU-${String(num).padStart(3, '0')}`;
        const testEmail = `load_student_${String(num).padStart(3, '0')}@load.test`;
        const testName = `Load Test Student ${num}`;
        const testRollNo = `ROLL-LOAD-${String(num).padStart(3, '0')}`;

        await pool.query(`
          INSERT INTO students (id, college_id, name, email, student_id, roll_no, password, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        `, [studentUuid, collegeId, testName, testEmail, testStudentId, testRollNo, hashedPassword]);
      }
      console.log(`✅ Successfully seeded ${needed} new @load.test accounts.`);
    } else {
      console.log(`✅ Exactly ${TARGET_TOTAL} or more @load.test accounts already exist.`);
    }

    // 3. Query all 250 test accounts
    const allTestAccounts = await pool.query(`
      SELECT id, email, student_id, name
      FROM students
      WHERE email LIKE '%@load.test'
      ORDER BY id ASC
      LIMIT $1
    `, [TARGET_TOTAL]);

    console.log(`✅ Total confirmed @load.test accounts: ${allTestAccounts.rows.length}`);

    const studentUuids = allTestAccounts.rows.map(r => r.id);

    // 4. Batch assign all 250 test students to the test exam in exam_assignments
    console.log(`📋 Assigning all ${allTestAccounts.rows.length} test accounts to test exam ${TEST_EXAM_ID}...`);
    for (const sId of studentUuids) {
      await pool.query(`
        INSERT INTO exam_assignments (exam_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [TEST_EXAM_ID, sId]);
    }
    console.log(`✅ Verified exam assignments for all ${allTestAccounts.rows.length} test accounts.`);

    // 5. Clean up any previous test sessions/answers for these 250 test students
    await pool.query(`
      DELETE FROM answers WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [TEST_EXAM_ID, studentUuids]);
    await pool.query(`
      DELETE FROM results WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [TEST_EXAM_ID, studentUuids]);
    await pool.query(`
      DELETE FROM exam_sessions WHERE exam_id = $1 AND student_id = ANY($2::uuid[])
    `, [TEST_EXAM_ID, studentUuids]);
    console.log(`✅ Cleaned previous test sessions & answers for all ${allTestAccounts.rows.length} test accounts.`);

    // 6. Write load-tests/test_students.json fixture for k6
    const fixtureData = allTestAccounts.rows.map(r => ({
      emailOrId: r.email,
      password: TEST_PASSWORD
    }));

    const targetPath = path.join(__dirname, '../load-tests/test_students.json');
    fs.writeFileSync(targetPath, JSON.stringify(fixtureData, null, 2), 'utf8');
    console.log(`📁 Updated ${targetPath} with ${fixtureData.length} unique test accounts.`);

    console.log('\n====================================================');
    console.log(`🎉 ${TARGET_TOTAL} TEST ACCOUNTS READY FOR LOAD TESTING`);
    console.log('====================================================\n');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during 250 test account setup:', err.message);
    await pool.end();
    process.exit(1);
  }
}

seed250TestAccounts();
