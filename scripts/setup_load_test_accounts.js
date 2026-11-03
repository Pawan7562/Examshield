// scripts/setup_load_test_accounts.js
// Sets a known test password strictly on 10 isolated `@load.test` test accounts
// and exports them directly into load-tests/test_students.json for k6 testing.
// NEVER touches real student accounts or production users!

const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');
const { pool } = require('../backend/config/database');

async function setupLoadTestAccounts() {
  console.log('🔒 Setting up isolated test student accounts for k6 load testing...');

  const TEST_PASSWORD = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  try {
    // 1. Fetch 10 existing load test accounts (strict safety check: domain MUST be @load.test)
    const selectRes = await pool.query(`
      SELECT id, email, student_id, name
      FROM students
      WHERE email LIKE '%@load.test'
      ORDER BY id ASC
      LIMIT 10
    `);

    if (selectRes.rows.length === 0) {
      console.error('❌ No @load.test test student accounts found in database.');
      await pool.end();
      process.exit(1);
    }

    console.log(`✅ Found ${selectRes.rows.length} @load.test test accounts.`);

    const studentIds = selectRes.rows.map(r => r.id);

    // 2. Update their passwords to the known test password
    await pool.query(`
      UPDATE students
      SET password = $1, is_active = true
      WHERE id = ANY($2::uuid[]) AND email LIKE '%@load.test'
    `, [hashedPassword, studentIds]);

    console.log('✅ Passwords successfully updated for isolated test accounts.');

    // 3. Write load-tests/test_students.json fixture for k6
    const fixtureData = selectRes.rows.map(r => ({
      emailOrId: r.email,
      password: TEST_PASSWORD
    }));

    const targetPath = path.join(__dirname, '../load-tests/test_students.json');
    fs.writeFileSync(targetPath, JSON.stringify(fixtureData, null, 2), 'utf8');

    console.log(`✅ Written ${fixtureData.length} test accounts to ${targetPath}`);
    console.log('Ready for Phase 2: Student Authentication load test.');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up test accounts:', err.message);
    await pool.end();
    process.exit(1);
  }
}

setupLoadTestAccounts();
