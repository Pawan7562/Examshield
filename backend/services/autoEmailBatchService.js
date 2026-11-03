// backend/services/autoEmailBatchService.js
const cron = require('node-cron');
const { pool } = require('../config/database');
const { sendExamNotification, sendStudentCredentials } = require('./emailService');
const bcrypt = require('bcryptjs');

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

/**
 * Dispatches automated exam notifications and credentials batches before exams end,
 * strictly bounded by Brevo's daily limit of 300 emails/day.
 * 
 * Once an exam's scheduled duration has passed or its status is completed/cancelled,
 * all notifications for that exam automatically stop.
 */
const dispatchBatch = async (maxLimit = 300) => {
  console.log(`\n===============================================================`);
  console.log(`⏰ [AutoEmailBatch] Running automated exam email dispatcher (Brevo 300/day)...`);
  console.log(`   Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log(`===============================================================`);

  const apiKey = process.env.BREVO_API_KEY || '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';

  // 1. Verify available Brevo quota / credits for today (300 max/day)
  let availableCredits = maxLimit;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const statsRes = await fetch('https://api.brevo.com/v3/smtp/statistics/reports', {
      headers: { 'api-key': apiKey, 'accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    const statsData = await statsRes.json();
    const todayReport = statsData.reports?.find(r => r.date === todayStr);
    const usedToday = todayReport ? (todayReport.requests || 0) : 0;

    const accRes = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': apiKey, 'accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    const accData = await accRes.json();
    const isFree = accData.plan?.[0]?.type === 'free' || accData.plan?.[0]?.creditsType === 'sendLimit';
    const paidCredits = accData.plan?.[0]?.credits || 0;

    if (!isFree && paidCredits > 0) {
      availableCredits = paidCredits;
    } else {
      availableCredits = Math.max(0, 300 - usedToday);
    }
    console.log(`📊 [AutoEmailBatch] Brevo Usage Today: ${usedToday}/300 | Available Credits: ${availableCredits}`);

    if (availableCredits <= 0) {
      console.log(`⚠️ [AutoEmailBatch] Daily limit (300) reached for ${todayStr}. Skipping automated dispatch until reset.`);
      return { success: false, message: 'Daily Brevo limit of 300 reached', sentCount: 0 };
    }
  } catch (err) {
    console.warn(`[AutoEmailBatch] Could not verify Brevo credits, proceeding with safe limit ${maxLimit}:`, err.message);
  }

  let remainingCredits = Math.min(availableCredits, maxLimit);
  let totalSent = 0;
  let totalFailed = 0;

  // 2. Auto-close / mark any historical assignments for exams that have ended or passed
  try {
    const pastCleanupRes = await pool.query(`
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
    if (pastCleanupRes.rowCount > 0) {
      console.log(`🧹 [AutoEmailBatch] Marked ${pastCleanupRes.rowCount} assignments for past/ended exams as settled to halt future notifications.`);
    }
  } catch (cleanErr) {
    console.warn(`[AutoEmailBatch] Past exam cleanup notice:`, cleanErr.message);
  }

  // 3. Dispatch Pending Exam Notifications for UPCOMING exams (before exam ends)
  if (remainingCredits > 0) {
    const pendingExamNotifsQuery = `
      SELECT ea.id as assignment_id, ea.exam_id, ea.student_id,
             s.name as student_name, s.email as student_email, s.student_id as student_code,
             e.title as exam_title, e.subject, e.date_time as exam_date, e.duration as exam_duration,
             COALESCE(e.exam_key, e.exam_code) as exam_key,
             COALESCE(c.name, 'Your Institution') as college_name
      FROM exam_assignments ea
      JOIN exams e ON ea.exam_id = e.id
      JOIN students s ON ea.student_id = s.id
      LEFT JOIN colleges c ON e.college_id = c.id
      WHERE ea.notification_sent_at IS NULL
        AND s.email IS NOT NULL AND s.email LIKE '%@%'
        AND s.email NOT LIKE '%@load.test'
        AND e.status NOT IN ('completed', 'cancelled', 'ended')
        AND (e.date_time IS NULL OR (e.date_time + (COALESCE(e.duration, 60) * INTERVAL '1 minute')) > NOW())
      ORDER BY e.date_time ASC, ea.assigned_at ASC
      LIMIT $1
    `;

    const examNotifsRes = await pool.query(pendingExamNotifsQuery, [remainingCredits]);
    const examNotifs = examNotifsRes.rows || [];

    if (examNotifs.length > 0) {
      console.log(`📢 [AutoEmailBatch] Found ${examNotifs.length} students awaiting exam notification before exam ends. Dispatching...`);
      const loginUrl = process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login';

      const CHUNK_SIZE = 5;
      for (let i = 0; i < examNotifs.length; i += CHUNK_SIZE) {
        const chunk = examNotifs.slice(i, i + CHUNK_SIZE);
        await Promise.allSettled(chunk.map(async (item) => {
          try {
            const notifRes = await sendExamNotification({
              name: item.student_name,
              email: item.student_email,
              examName: item.exam_title,
              examDate: item.exam_date,
              examDuration: item.exam_duration,
              examKey: item.exam_key,
              subject: item.subject,
              type: 'exam',
              collegeName: item.college_name,
              loginUrl,
              examId: item.exam_id,
              studentId: item.student_id
            });

            // Mark assignment as notification sent
            await pool.query(
              'UPDATE exam_assignments SET notification_sent_at = NOW() WHERE id = $1',
              [item.assignment_id]
            );

            if (notifRes && notifRes.skipped) {
              console.log(`  ℹ️ Skipped past exam notification for ${item.student_email}`);
            } else {
              totalSent++;
              console.log(`  ✅ [${totalSent}] Sent exam notification: ${item.student_email} for "${item.exam_title}"`);
            }
          } catch (itemErr) {
            totalFailed++;
            console.error(`  ❌ Failed notification for ${item.student_email}:`, itemErr.message);
          }
        }));

        await new Promise(r => setTimeout(r, 200));
      }

      remainingCredits = Math.max(0, remainingCredits - examNotifs.length);
    }
  }

  // 4. Dispatch Pending Student Credentials (for students assigned to upcoming exams)
  if (remainingCredits > 0) {
    const pendingStudentsQuery = `
      SELECT DISTINCT ON (s.id) 
        s.id, s.student_id, s.name, s.email, s.roll_no, s.college_id, 
        COALESCE(c.name, 'CGC University') as college_name,
        e.id as exam_id, e.title as exam_title, e.date_time as exam_date, e.duration as exam_duration,
        COALESCE(e.exam_key, e.exam_code) as exam_key, e.subject
      FROM students s
      JOIN exam_assignments ea ON s.id = ea.student_id
      JOIN exams e ON ea.exam_id = e.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE s.credentials_sent_at IS NULL 
        AND s.email IS NOT NULL 
        AND s.email LIKE '%@%'
        AND s.email NOT LIKE '%@load.test'
        AND e.status NOT IN ('completed', 'cancelled', 'ended')
        AND (e.date_time IS NULL OR (e.date_time + (COALESCE(e.duration, 60) * INTERVAL '1 minute')) > NOW())
      ORDER BY s.id ASC
      LIMIT $1
    `;

    const studentsRes = await pool.query(pendingStudentsQuery, [remainingCredits]);
    const pendingStudents = studentsRes.rows || [];

    if (pendingStudents.length > 0) {
      console.log(`🎯 [AutoEmailBatch] Found ${pendingStudents.length} pending student credential accounts for upcoming exams. Dispatching...`);
      const loginUrl = process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login';

      const CHUNK_SIZE = 5;
      for (let i = 0; i < pendingStudents.length; i += CHUNK_SIZE) {
        const chunk = pendingStudents.slice(i, i + CHUNK_SIZE);
        await Promise.allSettled(chunk.map(async (student) => {
          try {
            const tempPassword = generatePassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            await pool.query(
              `UPDATE students 
               SET password = $1, credentials_sent_at = NOW(), updated_at = NOW() 
               WHERE id = $2`,
              [hashedPassword, student.id]
            );

            await sendStudentCredentials({
              name: student.name || 'Candidate',
              email: student.email,
              studentId: student.student_id,
              password: tempPassword,
              collegeName: student.college_name,
              loginUrl,
              examName: student.exam_title,
              examKey: student.exam_key,
              examDate: student.exam_date,
              examDuration: student.exam_duration,
              subject: student.subject,
              isReset: false,
              onlyIfExamUpcoming: true
            });

            totalSent++;
            console.log(`  ✅ [${totalSent}] Sent credentials: ${student.email}`);
          } catch (err) {
            totalFailed++;
            console.error(`  ❌ Failed credentials for ${student.email}:`, err.message);
          }
        }));

        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  console.log(`\n===============================================================`);
  console.log(`🏁 [AutoEmailBatch] Dispatch Complete!`);
  console.log(`   ✅ Total Successfully Sent: ${totalSent} (under 300 Brevo daily limit)`);
  console.log(`   ❌ Total Failed:            ${totalFailed}`);
  console.log(`===============================================================\n`);

  return { success: true, sentCount: totalSent, failCount: totalFailed };
};

/**
 * Starts the automated daily scheduler (Runs at 00:30 UTC = 6:00 AM IST every day)
 */
const startDailyEmailScheduler = () => {
  cron.schedule('30 0 * * *', async () => {
    console.log(`⏰ [Cron Trigger] Daily 6:00 AM IST email batch execution started.`);
    try {
      await dispatchBatch(300);
    } catch (err) {
      console.error(`[Cron Trigger Error]:`, err.message);
    }
  }, {
    timezone: 'UTC'
  });

  console.log(`🤖 [Scheduler Active] Automatic email dispatcher scheduled for daily execution at 6:00 AM IST (00:30 UTC, 300 emails/day max).`);
};

module.exports = {
  dispatchBatch,
  startDailyEmailScheduler
};
