const { pool } = require('../backend/config/database');

async function inspect() {
  try {
    console.log('=== DETAILED INSPECTION OF POTENTIAL CLEANUP TARGETS ===\n');

    // 1. Violations by exam
    const vExams = await pool.query(`
      SELECT e.id, e.title, e.date_time, e.status, count(v.id) as violation_count,
             min(v.occurred_at) as first_violation, max(v.occurred_at) as last_violation
      FROM violations v
      LEFT JOIN exams e ON v.exam_id = e.id
      GROUP BY e.id, e.title, e.date_time, e.status
      ORDER BY violation_count DESC;
    `);
    console.log('Violations breakdown by exam:');
    vExams.rows.forEach(r => {
      console.log(`- Exam: "${r.title || 'Unknown'}" (${r.id}), Status: ${r.status}, Date: ${r.date_time}, Violations: ${r.violation_count}`);
    });

    // 2. Orphaned violations (violations without matching exam or student)
    const orphanedV = await pool.query(`
      SELECT count(*) as orphaned_violations
      FROM violations v
      WHERE v.exam_id NOT IN (SELECT id FROM exams)
         OR v.student_id NOT IN (SELECT id FROM students);
    `);
    console.log('\nOrphaned violations count:', orphanedV.rows[0].orphaned_violations);

    // 3. Orphaned answers (answers without matching session, exam, or student)
    const orphanedA = await pool.query(`
      SELECT count(*) as orphaned_answers
      FROM answers a
      WHERE a.exam_id NOT IN (SELECT id FROM exams)
         OR a.student_id NOT IN (SELECT id FROM students)
         OR a.session_id NOT IN (SELECT id FROM exam_sessions);
    `);
    console.log('Orphaned answers count:', orphanedA.rows[0].orphaned_answers);

    // 4. Staging / Load-Test records (@load.test)
    const stagingData = await pool.query(`
      SELECT
        (SELECT count(*) FROM students WHERE email LIKE '%@load.test') as staging_students,
        (SELECT count(*) FROM exam_assignments ea JOIN students s ON ea.student_id = s.id WHERE s.email LIKE '%@load.test') as staging_assignments,
        (SELECT count(*) FROM exam_sessions es JOIN students s ON es.student_id = s.id WHERE s.email LIKE '%@load.test') as staging_sessions,
        (SELECT count(*) FROM answers a JOIN students s ON a.student_id = s.id WHERE s.email LIKE '%@load.test') as staging_answers,
        (SELECT count(*) FROM results r JOIN students s ON r.student_id = s.id WHERE s.email LIKE '%@load.test') as staging_results,
        (SELECT count(*) FROM violations v JOIN students s ON v.student_id = s.id WHERE s.email LIKE '%@load.test') as staging_violations
    `);
    console.log('\nStaging/Load-Test generated records:');
    console.log(stagingData.rows[0]);

    // 5. Resolved student password requests older than 14 days
    const oldPasswordReqs = await pool.query(`
      SELECT count(*) as resolved_reqs
      FROM student_password_requests
      WHERE status = 'resolved';
    `);
    console.log('\nResolved password requests:', oldPasswordReqs.rows[0].resolved_reqs);

    // 6. Old audit logs
    const oldAudit = await pool.query(`
      SELECT count(*) as old_logs
      FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '14 days';
    `);
    console.log('Audit logs older than 14 days:', oldAudit.rows[0].old_logs);

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await pool.end();
  }
}

inspect();
