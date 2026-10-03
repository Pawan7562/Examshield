// services/examLifecycleService.js
// Enterprise Exam Lifecycle & Auto-Close Service (IST Anchored)
const { pool } = require('../config/database');

/**
 * Automatically transitions all examinations whose scheduled duration has passed
 * from 'published' / 'active' to 'completed'.
 * Also auto-submits any active exam sessions that remained open past the scheduled end time.
 */
async function autoCloseExpiredExams() {
  try {
    // 1. Identify all expired exams that are still marked published or active
    const findExpiredQuery = `
      SELECT id, title, name, status, date_time, duration,
             (date_time + (COALESCE(duration, 60) * INTERVAL '1 minute')) AS scheduled_end
      FROM exams
      WHERE status IN ('published', 'active')
        AND date_time IS NOT NULL
        AND (date_time + (COALESCE(duration, 60) * INTERVAL '1 minute')) <= NOW()
    `;

    const expiredRes = await pool.query(findExpiredQuery);
    const expiredExams = expiredRes.rows || [];
    let closedCount = 0;

    if (expiredExams.length > 0) {
      const expiredExamIds = expiredExams.map(e => e.id);
      const updateExamsQuery = `
        UPDATE exams
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = ANY($1::uuid[])
        RETURNING id, title, status
      `;
      const updateExamsRes = await pool.query(updateExamsQuery, [expiredExamIds]);
      closedCount = updateExamsRes.rowCount || 0;
    }

    // 2. Auto-submit ANY active student sessions belonging to completed/expired exams
    const updateHangingSessionsQuery = `
      UPDATE exam_sessions es
      SET status = 'submitted',
          is_auto_submitted = true,
          auto_submit_reason = 'scheduled_time_expired',
          submitted_at = COALESCE(es.submitted_at, NOW())
      FROM exams e
      WHERE es.exam_id = e.id
        AND es.status = 'active'
        AND (
          e.status = 'completed'
          OR (e.date_time IS NOT NULL AND (e.date_time + (COALESCE(e.duration, 60) * INTERVAL '1 minute')) <= NOW())
        )
      RETURNING es.id, es.exam_id, es.student_id
    `;
    const updateSessionsRes = await pool.query(updateHangingSessionsQuery);
    const closedSessionsCount = updateSessionsRes.rowCount || 0;

    if (closedCount > 0 || closedSessionsCount > 0) {
      console.log(`[ExamLifecycle] Auto-closed ${closedCount} expired exams and auto-submitted ${closedSessionsCount} hanging sessions.`);
    }

    return {
      closedExamsCount: closedCount,
      autoSubmittedSessionsCount: closedSessionsCount
    };
  } catch (error) {
    console.error('[ExamLifecycle] Error during autoCloseExpiredExams:', error.message);
    return { error: error.message };
  }
}

/**
 * Checks if a specific exam has passed its scheduled end time.
 * If expired and currently marked active/published, updates it to completed immediately.
 */
async function checkAndCloseSpecificExam(examId) {
  try {
    if (!examId) return false;

    const query = `
      SELECT id, status, date_time, duration,
             ((date_time + (COALESCE(duration, 60) * INTERVAL '1 minute')) <= NOW()) AS is_expired
      FROM exams
      WHERE id = $1
    `;
    const res = await pool.query(query, [examId]);
    if (res.rows.length === 0) return false;

    const row = res.rows[0];
    if (row.is_expired && (row.status === 'published' || row.status === 'active')) {
      await pool.query(
        "UPDATE exams SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [examId]
      );
      await pool.query(
        `UPDATE exam_sessions
         SET status = 'submitted',
             is_auto_submitted = true,
             auto_submit_reason = 'scheduled_time_expired',
             submitted_at = COALESCE(submitted_at, NOW())
         WHERE exam_id = $1 AND status = 'active'`,
        [examId]
      );
      return true;
    }
    return row.is_expired || row.status === 'completed';
  } catch (err) {
    console.error('[ExamLifecycle] Error in checkAndCloseSpecificExam:', err.message);
    return false;
  }
}

module.exports = {
  autoCloseExpiredExams,
  checkAndCloseSpecificExam
};
