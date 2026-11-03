require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');

async function run() {
  const res = await pool.query(`
    UPDATE exam_assignments ea
    SET notification_sent_at = NOW()
    FROM exams e
    WHERE ea.exam_id = e.id
      AND ea.notification_sent_at IS NULL
      AND (
        e.status IN ('completed', 'cancelled', 'ended')
        OR (e.date_time IS NOT NULL AND (e.date_time + (COALESCE(e.duration, 60) * INTERVAL '1 minute')) <= NOW())
      )
  `);
  console.log('✅ Backfilled notification_sent_at for past/completed exams:', res.rowCount);

  // Check remaining assignments that are eligible for notification
  const remaining = await pool.query(`
    SELECT count(*) as count
    FROM exam_assignments ea
    JOIN exams e ON ea.exam_id = e.id
    JOIN students s ON ea.student_id = s.id
    WHERE ea.notification_sent_at IS NULL
      AND e.status NOT IN ('completed', 'cancelled', 'ended')
      AND (e.date_time IS NULL OR (e.date_time + (COALESCE(e.duration, 60) * INTERVAL '1 minute')) > NOW())
      AND s.email NOT LIKE '%@load.test'
  `);
  console.log('Assignments currently eligible for upcoming notifications:', remaining.rows[0].count);

  await pool.end();
}

run();
