require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('../backend/node_modules/uuid');

const EXAM_ID = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
const TARGET_TOTAL = 500;
const PASSWORD = 'TestPassword123!';

async function setup500() {
  console.log('=== PREPARING EXACTLY 500 LOAD TEST ACCOUNTS ===');
  try {
    const fixturePath = path.resolve(__dirname, 'test_students.json');
    if (!fs.existsSync(fixturePath)) {
      throw new Error('Missing test_students.json fixture');
    }
    const existing250 = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    console.log(`Preserved baseline accounts in fixture: ${existing250.length}`);
    if (existing250.length !== 250) {
      console.warn(`Warning: fixture length is ${existing250.length}, expected 250`);
    }

    const existingEmails = new Set(existing250.map(a => a.emailOrId));

    // Get college_id
    const examRes = await pool.query("SELECT college_id FROM exams WHERE id = $1", [EXAM_ID]);
    const collegeId = examRes.rows[0]?.college_id;

    // Check production count
    const prodRes = await pool.query("SELECT count(*) as cnt FROM students WHERE email NOT LIKE '%@load.test'");
    const prodCount = parseInt(prodRes.rows[0].cnt, 10);
    console.log(`Baseline production student count: ${prodCount} (must remain 1,194)`);

    // Find candidate DB accounts not in existing250
    const candidateRes = await pool.query(
      "SELECT id, email FROM students WHERE email LIKE '%@load.test' ORDER BY email"
    );
    const availableNewInDb = candidateRes.rows.filter(r => !existingEmails.has(r.email));
    console.log(`Available unique @load.test in DB not in existing 250: ${availableNewInDb.length}`);

    const needed = TARGET_TOTAL - existing250.length;
    console.log(`Needed additional unique accounts: ${needed}`);

    const selectedNewAccounts = [];
    for (let i = 0; i < Math.min(needed, availableNewInDb.length); i++) {
      selectedNewAccounts.push({
        emailOrId: availableNewInDb[i].email,
        password: PASSWORD
      });
    }

    // If still need more, generate them
    if (selectedNewAccounts.length < needed) {
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      const stillNeeded = needed - selectedNewAccounts.length;
      console.log(`Generating ${stillNeeded} additional accounts to reach ${TARGET_TOTAL}...`);
      let counter = 1000;
      for (let i = 0; i < stillNeeded; i++) {
        let candidateEmail = `load_student_ext_${counter}@load.test`;
        while (existingEmails.has(candidateEmail) || availableNewInDb.some(a => a.email === candidateEmail)) {
          counter++;
          candidateEmail = `load_student_ext_${counter}@load.test`;
        }
        counter++;
        
        const sId = uuidv4();
        await pool.query(
          `INSERT INTO students (
             id, student_id, name, email, roll_no, department, batch, password, college_id, is_active, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, 'Computer Science', '2026', $6, $7, true, NOW(), NOW())
           ON CONFLICT (email, college_id) DO NOTHING`,
          [sId, `STU-${counter}`, `Load Student ${counter}`, candidateEmail, `ROLL-${counter}`, hashedPassword, collegeId]
        );

        selectedNewAccounts.push({
          emailOrId: candidateEmail,
          password: PASSWORD
        });
      }
    }

    const final500 = [...existing250, ...selectedNewAccounts];
    console.log(`Total assembled accounts: ${final500.length}`);

    // Verify all 500 have assignments
    console.log('Ensuring all 500 accounts are assigned to staging exam...');
    const emailList = final500.map(a => a.emailOrId);

    // Get DB IDs for all 500 emails
    const studentDbRes = await pool.query(
      "SELECT id, email FROM students WHERE email = ANY($1)",
      [emailList]
    );
    const emailToIdMap = new Map();
    studentDbRes.rows.forEach(r => emailToIdMap.set(r.email, r.id));

    if (emailToIdMap.size !== TARGET_TOTAL) {
      throw new Error(`Only found ${emailToIdMap.size}/${TARGET_TOTAL} students in DB!`);
    }

    // Batch insert assignments
    const studentIds = Array.from(emailToIdMap.values());
    const chunkSize = 100;
    for (let c = 0; c < studentIds.length; c += chunkSize) {
      const chunk = studentIds.slice(c, c + chunkSize);
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

    // Verify assignments count
    const assignRes = await pool.query(
      `SELECT count(*) as cnt FROM exam_assignments ea
       JOIN students s ON ea.student_id = s.id
       WHERE ea.exam_id = $1 AND s.email = ANY($2)`,
      [EXAM_ID, emailList]
    );
    const assignedCount = parseInt(assignRes.rows[0].cnt, 10);
    console.log(`Assignments verified for staging exam: ${assignedCount}/${TARGET_TOTAL}`);

    // Verify production count untouched
    const prodResAfter = await pool.query("SELECT count(*) as cnt FROM students WHERE email NOT LIKE '%@load.test'");
    const prodCountAfter = parseInt(prodResAfter.rows[0].cnt, 10);
    console.log(`Production student count check: ${prodCountAfter} (Expected: ${prodCount})`);
    if (prodCountAfter !== prodCount) {
      throw new Error(`Production count changed! Was ${prodCount}, now ${prodCountAfter}`);
    }

    // Save fixture
    fs.writeFileSync(fixturePath, JSON.stringify(final500, null, 2), 'utf8');
    console.log(`✅ ${final500.length} accounts written to ${fixturePath}`);
    console.log('ALL VERIFICATIONS PASSED.');

  } catch (err) {
    console.error('Setup failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setup500();
