const { pool } = require('../backend/config/database');

async function verify() {
  try {
    const totalStudents = await pool.query("SELECT count(id) FROM students WHERE email LIKE '%@load.test'");
    const sessions = await pool.query("SELECT es.status, count(es.id) FROM exam_sessions es JOIN students s ON es.student_id = s.id WHERE s.email LIKE '%@load.test' GROUP BY es.status");
    const results = await pool.query("SELECT r.status, count(r.id) FROM results r JOIN students s ON r.student_id = s.id WHERE s.email LIKE '%@load.test' GROUP BY r.status");
    const answers = await pool.query("SELECT count(a.id) FROM answers a JOIN students s ON a.student_id = s.id WHERE s.email LIKE '%@load.test'");
    const grades = await pool.query("SELECT min(r.marks_obtained) as min_score, max(r.marks_obtained) as max_score, round(avg(r.marks_obtained)::numeric, 2) as avg_score, count(r.id) as graded_count FROM results r JOIN students s ON r.student_id = s.id WHERE s.email LIKE '%@load.test'");
    const dupes = await pool.query("SELECT r.student_id, r.exam_id, count(r.id) FROM results r JOIN students s ON r.student_id = s.id WHERE s.email LIKE '%@load.test' GROUP BY r.student_id, r.exam_id HAVING count(r.id) > 1");
    const activePgConnections = await pool.query("SELECT count(*) as active_connections FROM pg_stat_activity");

    console.log('--- INTEGRITY_METRICS_START ---');
    console.log(JSON.stringify({
      totalLoadTestStudents: parseInt(totalStudents.rows[0].count),
      sessionsStatus: sessions.rows,
      resultsStatus: results.rows,
      totalPersistedAnswers: parseInt(answers.rows[0].count),
      gradeStats: grades.rows[0],
      duplicateSubmissions: dupes.rows.length,
      totalPgConnections: parseInt(activePgConnections.rows[0].active_connections)
    }, null, 2));
    console.log('--- INTEGRITY_METRICS_END ---');
  } catch (err) {
    console.error('Integrity check error:', err);
  } finally {
    await pool.end();
  }
}

verify();
