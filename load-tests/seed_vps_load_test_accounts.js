/**
 * seed_vps_load_test_accounts.js
 * Scalable, idempotent bulk seeder for 500, 1,000, or 2,000 @load.test accounts.
 *
 * Usage:
 *   node load-tests/seed_vps_load_test_accounts.js --target=2000
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('../backend/node_modules/uuid');

const targetArg = process.argv.find(a => a.startsWith('--target='));
const TARGET_TOTAL = targetArg ? parseInt(targetArg.split('=')[1], 10) : 2000;
const EXAM_ID = process.env.STAGING_EXAM_ID || 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const PASSWORD = 'TestPassword123!';

async function seed() {
  console.log(`\n======================================================`);
  console.log(`🚀 Bulk Seeding ${TARGET_TOTAL} @load.test Accounts`);
  console.log(`Target Exam: ${EXAM_ID}`);
  console.log(`======================================================\n`);

  try {
    // 1. Verify college exists or fetch default
    const examRes = await pool.query("SELECT college_id FROM exams WHERE id = $1", [EXAM_ID]);
    let collegeId = examRes.rows[0]?.college_id;
    if (!collegeId) {
      const colRes = await pool.query("SELECT id FROM colleges LIMIT 1");
      collegeId = colRes.rows[0]?.id;
    }
    if (!collegeId) {
      throw new Error("No college found in database. Create a college record first.");
    }

    // 2. Load existing fixture if present
    const fixturePath = path.resolve(__dirname, `test_students_${TARGET_TOTAL}.json`);
    const defaultFixturePath = path.resolve(__dirname, 'test_students.json');

    console.log('Pre-hashing password once with bcrypt...');
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // 3. Inspect existing @load.test in DB
    const dbExistingRes = await pool.query("SELECT id, email FROM students WHERE email LIKE '%@load.test'");
    const existingMap = new Map();
    dbExistingRes.rows.forEach(r => existingMap.set(r.email, r.id));
    console.log(`Existing @load.test in DB: ${existingMap.size}`);

    // Verify production students baseline
    const prodRes = await pool.query("SELECT count(*) as cnt FROM students WHERE email NOT LIKE '%@load.test'");
    const prodBaseline = parseInt(prodRes.rows[0].cnt, 10);
    console.log(`Baseline non-test student count (must remain untouched): ${prodBaseline}`);

    // 4. Generate account list
    const accountsToInsert = [];
    const fullFixture = [];

    for (let i = 1; i <= TARGET_TOTAL; i++) {
      const email = `load_student_${String(i).padStart(4, '0')}@load.test`;
      const rollNo = `ROLL-LOAD-${String(i).padStart(4, '0')}`;
      const studentCode = `STU-LOAD-${String(i).padStart(4, '0')}`;
      const name = `Load Student ${i}`;

      fullFixture.push({ emailOrId: email, password: PASSWORD });

      if (!existingMap.has(email)) {
        accountsToInsert.push({
          id: uuidv4(),
          student_id: studentCode,
          name,
          email,
          roll_no: rollNo,
          password: hashedPassword,
          college_id: collegeId
        });
      }
    }

    console.log(`Accounts requiring insertion: ${accountsToInsert.length}`);

    // 5. Batch insert students in chunks of 100
    const chunkSize = 100;
    for (let c = 0; c < accountsToInsert.length; c += chunkSize) {
      const chunk = accountsToInsert.slice(c, c + chunkSize);
      const values = [];
      const placeholders = [];
      let paramIdx = 1;

      for (const s of chunk) {
        placeholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 'Computer Science', '2026', $${paramIdx++}, $${paramIdx++}, true, NOW(), NOW())`
        );
        values.push(s.id, s.student_id, s.name, s.email, s.roll_no, s.password, s.college_id);
      }

      const query = `
        INSERT INTO students (
          id, student_id, name, email, roll_no, department, batch, password, college_id, is_active, created_at, updated_at
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (email, college_id)
        DO UPDATE SET roll_no = EXCLUDED.roll_no, updated_at = NOW()
        RETURNING id, email
      `;

      const insertRes = await pool.query(query, values);
      insertRes.rows.forEach(r => existingMap.set(r.email, r.id));
      process.stdout.write(`Inserted chunk ${Math.floor(c / chunkSize) + 1}/${Math.ceil(accountsToInsert.length / chunkSize)}\r`);
    }
    console.log('\n✅ Student insertion complete.');

    // 6. Ensure exam assignments exist for all target students
    console.log(`Assigning ${TARGET_TOTAL} students to staging exam ${EXAM_ID}...`);
    const allStudentIds = [];
    for (let i = 1; i <= TARGET_TOTAL; i++) {
      const email = `load_student_${String(i).padStart(4, '0')}@load.test`;
      const id = existingMap.get(email);
      if (id) allStudentIds.push(id);
    }

    for (let c = 0; c < allStudentIds.length; c += chunkSize) {
      const chunk = allStudentIds.slice(c, c + chunkSize);
      const values = [EXAM_ID];
      const placeholders = [];
      let paramIdx = 2;

      for (const sId of chunk) {
        placeholders.push(`($1, $${paramIdx++}, 'assigned')`);
        values.push(sId);
      }

      await pool.query(
        `INSERT INTO exam_assignments (exam_id, student_id, status)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (exam_id, student_id) DO NOTHING`,
        values
      );
    }

    // 7. Verify counts
    const testCount = await pool.query("SELECT count(*) as cnt FROM students WHERE email LIKE '%@load.test'");
    const assignCount = await pool.query(
      "SELECT count(*) as cnt FROM exam_assignments WHERE exam_id = $1 AND student_id = ANY($2)",
      [EXAM_ID, allStudentIds]
    );
    const prodCheck = await pool.query("SELECT count(*) as cnt FROM students WHERE email NOT LIKE '%@load.test'");
    const prodAfter = parseInt(prodCheck.rows[0].cnt, 10);

    console.log(`\nVerification Results:`);
    console.log(`- Total @load.test in DB: ${testCount.rows[0].cnt}`);
    console.log(`- Verified Staging Assignments: ${assignCount.rows[0].cnt}/${TARGET_TOTAL}`);
    console.log(`- Non-test Student Records: ${prodAfter} (Baseline: ${prodBaseline})`);

    if (prodAfter !== prodBaseline) {
      throw new Error(`CRITICAL: Production data altered! Expected ${prodBaseline}, got ${prodAfter}`);
    }

    // Write fixtures
    fs.writeFileSync(fixturePath, JSON.stringify(fullFixture, null, 2), 'utf8');
    fs.writeFileSync(defaultFixturePath, JSON.stringify(fullFixture, null, 2), 'utf8');
    console.log(`✅ Saved fixture to ${fixturePath} and ${defaultFixturePath}`);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
