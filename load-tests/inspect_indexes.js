const { pool } = require('../backend/config/database');

async function check() {
  try {
    const indexes = await pool.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'answers'
      ORDER BY tablename, indexname;
    `);
    console.log('--- ANSWERS INDEXES ---');
    console.log(JSON.stringify(indexes.rows, null, 2));

    // Also check EXPLAIN on typical submit & get queries
    const sampleExamId = 'a95d25ff-1d0b-4709-ac58-324dbec1371b';
    const sampleStudent = await pool.query("SELECT id FROM students WHERE email LIKE '%@load.test' LIMIT 1");
    const studentId = sampleStudent.rows[0].id;

    console.log('--- EXPLAIN getExamDetails student_assignments check ---');
    const expAssign = await pool.query(`EXPLAIN ANALYZE SELECT * FROM exam_assignments WHERE exam_id = $1 AND student_id = $2`, [sampleExamId, studentId]);
    console.log(expAssign.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('--- EXPLAIN getExamDetails exam_sessions check ---');
    const expSess = await pool.query(`EXPLAIN ANALYZE SELECT * FROM exam_sessions WHERE exam_id = $1 AND student_id = $2 ORDER BY started_at DESC LIMIT 1`, [sampleExamId, studentId]);
    console.log(expSess.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('--- EXPLAIN submit questions fetch ---');
    const expQ = await pool.query(`EXPLAIN ANALYZE SELECT * FROM questions WHERE exam_id = $1`, [sampleExamId]);
    console.log(expQ.rows.map(r => r['QUERY PLAN']).join('\n'));

    console.log('--- EXPLAIN submit answers fetch ---');
    const expAns = await pool.query(`EXPLAIN ANALYZE SELECT * FROM answers WHERE session_id = '5cbae856-bcab-4e88-b8c5-c4e1288eb49b'`, []);
    console.log(expAns.rows.map(r => r['QUERY PLAN']).join('\n'));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
