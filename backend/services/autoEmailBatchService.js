// backend/services/autoEmailBatchService.js
const cron = require('node-cron');
const { pool } = require('../config/database');
const { sendStudentCredentials } = require('./emailService');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

/**
 * Dispatches a batch of up to `maxLimit` pending credentials emails
 */
const dispatchBatch = async (maxLimit = 300) => {
  console.log(`\n===============================================================`);
  console.log(`⏰ [AutoEmailBatch] Running automated credentials email dispatcher...`);
  console.log(`   Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log(`===============================================================`);

  const apiKey = process.env.BREVO_API_KEY || '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';

  // 1. Verify available Brevo quota / credits
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
      console.log(`⚠️ [AutoEmailBatch] Daily limit (300) reached for ${todayStr}. Skipping dispatch until reset.`);
      return { success: false, message: 'Daily limit reached', sentCount: 0 };
    }
  } catch (err) {
    console.warn(`[AutoEmailBatch] Could not verify Brevo credits, proceeding with limit ${maxLimit}:`, err.message);
  }

  const limitToFetch = Math.min(availableCredits, maxLimit);

  // 2. Fetch pending students from database
  const query = `
    SELECT s.id, s.student_id, s.name, s.email, s.roll_no, s.college_id, COALESCE(c.name, 'CGC University') as college_name
    FROM students s
    LEFT JOIN colleges c ON s.college_id = c.id
    WHERE s.credentials_sent_at IS NULL 
      AND s.email IS NOT NULL 
      AND s.email LIKE '%@%'
    ORDER BY s.created_at ASC
    LIMIT $1
  `;

  const studentsRes = await pool.query(query, [limitToFetch]);
  const pendingStudents = studentsRes.rows;

  if (pendingStudents.length === 0) {
    console.log(`🎉 [AutoEmailBatch] No pending students found! All registered students have received their emails.`);
    return { success: true, message: 'All students have received emails', sentCount: 0 };
  }

  console.log(`🎯 [AutoEmailBatch] Found ${pendingStudents.length} pending students. Dispatching now...`);

  const loginUrl = process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login';
  let sentCount = 0;
  let failCount = 0;

  // Process in parallel chunks of 5
  const CHUNK_SIZE = 5;
  for (let i = 0; i < pendingStudents.length; i += CHUNK_SIZE) {
    const chunk = pendingStudents.slice(i, i + CHUNK_SIZE);

    await Promise.allSettled(chunk.map(async (student) => {
      try {
        const tempPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Update database before sending
        await pool.query(
          `UPDATE students 
           SET password = $1, credentials_sent_at = NOW(), updated_at = NOW() 
           WHERE id = $2`,
          [hashedPassword, student.id]
        );

        // Send email
        await sendStudentCredentials({
          name: student.name || 'Candidate',
          email: student.email,
          studentId: student.student_id,
          password: tempPassword,
          collegeName: student.college_name,
          loginUrl,
          isReset: false
        });

        sentCount++;
        console.log(`  ✅ [${sentCount}/${pendingStudents.length}] Sent: ${student.email} (${student.name} - ${student.student_id})`);
      } catch (err) {
        failCount++;
        console.error(`  ❌ Failed for ${student.email}: ${err.message}`);
      }
    }));

    // Polite pause between chunks
    await new Promise(r => setTimeout(r, 200));
  }

  // 3. Update CSV files if on Windows/desktop
  try {
    const desktopPending = 'C:\\Users\\Pawan kumar\\OneDrive\\Desktop\\students_pending_email.csv';
    const desktopReceived = 'C:\\Users\\Pawan kumar\\OneDrive\\Desktop\\students_received_email.csv';
    
    // Check remaining pending in DB
    const remainRes = await pool.query(`SELECT COUNT(*) FROM students WHERE credentials_sent_at IS NULL`);
    const remainingCount = remainRes.rows[0]?.count || 0;

    console.log(`\n===============================================================`);
    console.log(`🏁 [AutoEmailBatch] Batch Complete!`);
    console.log(`   ✅ Successfully Sent: ${sentCount}`);
    console.log(`   ❌ Failed:           ${failCount}`);
    console.log(`   ⏳ Remaining Pending in Database: ${remainingCount}`);
    console.log(`===============================================================\n`);
  } catch (_) {}

  return { success: true, sentCount, failCount };
};

/**
 * Starts the automated daily scheduler (Runs at 00:30 UTC = 6:00 AM IST every day)
 */
const startDailyEmailScheduler = () => {
  // Cron syntax: minute (30), hour (0), day (*), month (*), weekday (*)
  // 00:30 UTC is exactly 06:00 AM IST
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

  console.log(`🤖 [Scheduler Active] Automatic email dispatcher scheduled for daily execution at 6:00 AM IST (00:30 UTC).`);
};

module.exports = {
  dispatchBatch,
  startDailyEmailScheduler
};
