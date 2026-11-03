const { pool } = require('../backend/config/database');

async function testReadWrite() {
  console.log('=== VERIFYING READ & WRITE OPERATIONS ON NEW NEON DATABASE ===\n');
  try {
    // 1. Connection check
    const connCheck = await pool.query('SELECT current_database(), inet_server_addr(), version();');
    console.log('Connected Database:', connCheck.rows[0].current_database);
    console.log('PostgreSQL Version:', connCheck.rows[0].version.split(' on ')[0]);

    // 2. Read verification
    const studentCount = await pool.query("SELECT count(*) FROM students WHERE email NOT LIKE '%@load.test'");
    const examCount = await pool.query("SELECT count(*) FROM exams");
    const questionCount = await pool.query("SELECT count(*) FROM questions");
    const resultCount = await pool.query("SELECT count(*) FROM results");
    const answerCount = await pool.query("SELECT count(*) FROM answers");

    console.log('\n--- DATA INVENTORY VERIFICATION ---');
    console.log('✅ Real Students in DB:', studentCount.rows[0].count);
    console.log('✅ Exams in DB:', examCount.rows[0].count);
    console.log('✅ Exam Questions in DB:', questionCount.rows[0].count);
    console.log('✅ Student Submissions/Results in DB:', resultCount.rows[0].count);
    console.log('✅ Answer Sheets in DB:', answerCount.rows[0].count);

    // 3. Write verification (INSERT -> SELECT -> UPDATE -> DELETE)
    console.log('\n--- ACTIVE WRITE TEST ---');
    const testAction = 'VERIFICATION_READ_WRITE_TEST_' + Date.now();
    
    // INSERT
    const insertRes = await pool.query(`
      INSERT INTO audit_logs (action, actor_type, details)
      VALUES ($1, 'system', $2)
      RETURNING id, action, created_at;
    `, [testAction, JSON.stringify({ verified: true, timestamp: new Date().toISOString() })]);

    const recordId = insertRes.rows[0].id;
    console.log('✅ INSERT Succeeded. Created record ID:', recordId);

    // READ (SELECT)
    const selectRes = await pool.query('SELECT id, action, details FROM audit_logs WHERE id = $1', [recordId]);
    console.log('✅ READ Succeeded. Fetched action:', selectRes.rows[0].action);

    // UPDATE
    const updateRes = await pool.query(`
      UPDATE audit_logs 
      SET details = $1 
      WHERE id = $2 
      RETURNING details;
    `, [JSON.stringify({ verified: true, updated: true }), recordId]);
    console.log('✅ UPDATE Succeeded. Updated details:', updateRes.rows[0].details);

    // DELETE (cleanup)
    const deleteRes = await pool.query('DELETE FROM audit_logs WHERE id = $1 RETURNING id;', [recordId]);
    console.log('✅ DELETE Succeeded. Cleaned test probe ID:', deleteRes.rows[0].id);

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED: NEW NEON DB IS 100% OPERATIONAL!');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Read/Write verification failed:', err);
  } finally {
    await pool.end();
  }
}

testReadWrite();
