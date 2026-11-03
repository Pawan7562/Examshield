require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('../backend/node_modules/uuid');

const EXAM_ID = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const TARGET_TOTAL = 500;
const PASSWORD = 'TestPassword123!';

async function seed() {
  console.log(`Starting optimized batch idempotent seed up to ${TARGET_TOTAL} @load.test accounts...`);
  try {
    // 1. Get college_id from the exam
    const examRes = await pool.query("SELECT college_id FROM exams WHERE id = $1", [EXAM_ID]);
    const collegeId = examRes.rows[0]?.college_id;
    if (!collegeId) {
      throw new Error(`Exam ${EXAM_ID} has no college_id`);
    }

    // 2. Load existing test students from fixture
    const fixturePath = path.resolve(__dirname, 'test_students.json');
    let existingList = [];
    if (fs.existsSync(fixturePath)) {
      existingList = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    }
    console.log(`Existing accounts in fixture: ${existingList.length}`);

    // Pre-hash password once
    console.log('Hashing password once...');
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // 3. Check existing @load.test students in DB
    const dbExistingRes = await pool.query(
      "SELECT id, email FROM students WHERE email LIKE '%@load.test'"
    );
    const dbExistingMap = new Map();
    dbExistingRes.rows.forEach(r => dbExistingMap.set(r.email, r.id));
    console.log(`Existing @load.test in DB: ${dbExistingMap.size}`);

    // Verify baseline production count
    const prodResBefore = await pool.query(
      "SELECT count(*) as cnt FROM students WHERE email NOT LIKE '%@load.test'"
    );
    const prodCountBefore = parseInt(prodResBefore.rows[0].cnt, 10);
    console.log(`Production/non-test student count before seeding: ${prodCountBefore}`);

    // 4. Determine accounts to create
    const accountsToInsert = [];
    const fullList = [...existingList];

    for (let i = 1; i <= TARGET_TOTAL; i++) {
      const email = `load_student_${i}@load.test`;
      const rollNo = `ROLL-LOAD-${String(i).padStart(4, '0')}`;
      const studentCode = `STU-LOAD-${String(i).padStart(4, '0')}`;
      const name = `Load Student ${i}`;

      if (!dbExistingMap.has(email)) {
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

      if (!fullList.some(s => s.emailOrId === email)) {
        fullList.push({ emailOrId: email, password: PASSWORD });
      }
    }

    console.log(`Accounts requiring DB insert: ${accountsToInsert.length}`);

    // 5. Batch insert students in chunks of 50
    const chunkSize = 50;
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
      insertRes.rows.forEach(r => dbExistingMap.set(r.email, r.id));
      console.log(`Inserted chunk ${Math.floor(c / chunkSize) + 1}/${Math.ceil(accountsToInsert.length / chunkSize)} (${insertRes.rows.length} rows)`);
    }

    // 6. Ensure all 500 accounts are assigned to the exam
    console.log('Ensuring all 500 assignments exist for staging exam...');
    const allStudentIds = [];
    for (let i = 1; i <= TARGET_TOTAL; i++) {
      const email = `load_student_${i}@load.test`;
      const id = dbExistingMap.get(email);
      if (id) {
        allStudentIds.push(id);
      }
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

      const assignQuery = `
        INSERT INTO exam_assignments (exam_id, student_id, status)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (exam_id, student_id) DO NOTHING
      `;
      await pool.query(assignQuery, values);
    }

    // 7. Verify counts
    const testCountRes = await pool.query(
      "SELECT count(*) as cnt FROM students WHERE email LIKE '%@load.test'"
    );
    const assignCountRes = await pool.query(
      `SELECT count(*) as cnt FROM exam_assignments ea 
       JOIN students s ON ea.student_id = s.id 
       WHERE ea.exam_id = $1 AND s.email LIKE '%@load.test'`,
      [EXAM_ID]
    );
    const prodResAfter = await pool.query(
      "SELECT count(*) as cnt FROM students WHERE email NOT LIKE '%@load.test'"
    );
    const prodCountAfter = parseInt(prodResAfter.rows[0].cnt, 10);

    console.log(`Verification:`);
    console.log(`- Total @load.test students in DB: ${testCountRes.rows[0].cnt} (Expected: ${TARGET_TOTAL})`);
    console.log(`- Total @load.test assignments for staging exam: ${assignCountRes.rows[0].cnt} (Expected: ${TARGET_TOTAL})`);
    console.log(`- Production/non-test student count: ${prodCountAfter} (Before: ${prodCountBefore}, Delta: ${prodCountAfter - prodCountBefore})`);

    if (parseInt(testCountRes.rows[0].cnt, 10) !== TARGET_TOTAL) {
      throw new Error(`Expected ${TARGET_TOTAL} @load.test accounts, found ${testCountRes.rows[0].cnt}`);
    }
    if (parseInt(assignCountRes.rows[0].cnt, 10) !== TARGET_TOTAL) {
      throw new Error(`Expected ${TARGET_TOTAL} assignments, found ${assignCountRes.rows[0].cnt}`);
    }
    if (prodCountAfter !== prodCountBefore) {
      throw new Error(`CRITICAL: Production students modified! Before: ${prodCountBefore}, After: ${prodCountAfter}`);
    }

    // 8. Save updated fixture
    fs.writeFileSync(fixturePath, JSON.stringify(fullList, null, 2), 'utf8');
    console.log(`✅ Fixture updated with ${fullList.length} accounts at ${fixturePath}`);

  } catch (err) {
    console.error('Batch seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
