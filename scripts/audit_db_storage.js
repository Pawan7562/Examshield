const { pool } = require('../backend/config/database');

async function audit() {
  try {
    console.log('=== DATABASE STORAGE & TABLE SIZE AUDIT ===');

    // Total database size
    const dbSize = await pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;");
    console.log('Total Database Size:', dbSize.rows[0].total_size);

    // Table sizes
    const tableSizes = await pool.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size('"' || table_schema || '"."' || table_name || '"')) AS total_size,
        pg_total_relation_size('"' || table_schema || '"."' || table_name || '"') AS raw_size
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY raw_size DESC;
    `);

    console.log('\n--- TABLE SIZES (DESCENDING) ---');
    tableSizes.rows.forEach(r => {
      console.log(`${r.table_name.padEnd(30)} : ${r.total_size}`);
    });

    // Check violations columns
    const vCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'violations'");
    console.log('\nViolations table columns:', vCols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    // Violations stats
    const vStats = await pool.query(`
      SELECT 
        count(*) as total_violations,
        count(CASE WHEN created_at < NOW() - INTERVAL '30 days' THEN 1 END) as older_than_30d,
        count(CASE WHEN created_at < NOW() - INTERVAL '7 days' THEN 1 END) as older_than_7d
      FROM violations;
    `);
    console.log('Violations count stats:', vStats.rows[0]);

    // Violations grouped by type
    const vByType = await pool.query(`
      SELECT type, count(*) as count 
      FROM violations 
      GROUP BY type 
      ORDER BY count DESC;
    `);
    console.log('Violations by type:', vByType.rows);

    // Check violations by exam status (completed, cancelled, etc.)
    const vByExam = await pool.query(`
      SELECT e.status, count(v.id) as count
      FROM violations v
      LEFT JOIN exams e ON v.exam_id = e.id
      GROUP BY e.status;
    `);
    console.log('Violations by exam status:', vByExam.rows);

    // Answers breakdown
    const aCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'answers'");
    console.log('\nAnswers columns:', aCols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    // Answers for completed/past exams vs active
    const aByExam = await pool.query(`
      SELECT e.status, count(a.id) as count
      FROM answers a
      LEFT JOIN exams e ON a.exam_id = e.id
      GROUP BY e.status;
    `);
    console.log('Answers by exam status:', aByExam.rows);

    // Test accounts overhead
    const testData = await pool.query(`
      SELECT 
        (SELECT count(*) FROM students WHERE email LIKE '%@load.test') as test_students,
        (SELECT count(*) FROM answers a JOIN students s ON a.student_id = s.id WHERE s.email LIKE '%@load.test') as test_answers,
        (SELECT count(*) FROM violations v JOIN students s ON v.student_id = s.id WHERE s.email LIKE '%@load.test') as test_violations,
        (SELECT count(*) FROM exam_sessions es JOIN students s ON es.student_id = s.id WHERE s.email LIKE '%@load.test') as test_sessions,
        (SELECT count(*) FROM results r JOIN students s ON r.student_id = s.id WHERE s.email LIKE '%@load.test') as test_results
    `);
    console.log('\nTest Account Data Overhead:', testData.rows[0]);

    // Password requests resolved vs pending
    const pwReqs = await pool.query(`
      SELECT status, count(*) as count
      FROM student_password_requests
      GROUP BY status;
    `);
    console.log('\nStudent password requests by status:', pwReqs.rows);

    // Audit logs
    const auditStats = await pool.query(`
      SELECT count(*) as total_logs, min(created_at) as oldest, max(created_at) as newest
      FROM audit_logs;
    `);
    console.log('\nAudit logs stats:', auditStats.rows[0]);

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await pool.end();
  }
}

audit();
