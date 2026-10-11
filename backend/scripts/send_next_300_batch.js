require('dotenv').config({ path: './backend/.env' });
const { pool } = require('../config/database');
const { supabase } = require('../config/supabase-clean');
const { sendStudentCredentials } = require('../services/emailService');
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

async function main() {
  const BATCH_LIMIT = 300;
  console.log(`\n===============================================================`);
  console.log(`🚀 NEXIFY EXAMINA — BATCH EMAIL DISPATCHER (MAX: ${BATCH_LIMIT})`);
  console.log(`===============================================================`);

  const apiKey = process.env.BREVO_API_KEY || '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';

  // 1. Check Brevo credits before starting
  try {
    const accRes = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': apiKey, 'accept': 'application/json' }
    });
    const accData = await accRes.json();
    const credits = accData.plan?.[0]?.credits ?? 0;
    console.log(`📊 Brevo Available Credits: ${credits}`);

    if (credits <= 0) {
      console.log(`\n⚠️  NOTICE: You currently have 0 Brevo credits remaining today.`);
      console.log(`⏰ Brevo resets at 00:00 UTC (5:30 AM IST).`);
      console.log(`👉 Please run this script tomorrow morning after 5:30 AM IST, or upgrade to Brevo Starter.`);
      console.log(`===============================================================\n`);
      return;
    }
  } catch (checkErr) {
    console.warn(`Could not verify Brevo credits, proceeding with caution:`, checkErr.message);
  }

  // 2. Read pending students
  const pendingFile = path.resolve(__dirname, '../../students_pending_email.csv');
  if (!fs.existsSync(pendingFile)) {
    console.error(`❌ File not found: ${pendingFile}. Please run identify_email_status.js first.`);
    return;
  }

  const fileContent = fs.readFileSync(pendingFile, 'utf-8');
  const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
  const header = lines[0];
  const dataRows = lines.slice(1);

  if (dataRows.length === 0) {
    console.log(`🎉 No pending students found! All registered students have received their emails.`);
    return;
  }

  console.log(`📋 Total Pending Students in list: ${dataRows.length}`);
  const batchToSend = dataRows.slice(0, BATCH_LIMIT);
  const remainingAfterBatch = dataRows.slice(BATCH_LIMIT);
  console.log(`🎯 Dispatching to next ${batchToSend.length} students...\n`);

  // 3. Resolve active college & latest exam
  const collegeId = '7e0728b7-88b0-4e52-a427-8dd18f259a7a';
  const collegeName = 'CGC University';
  const loginUrl = process.env.STUDENT_LOGIN_URL || 'https://exam.nexifyforge.in/student/login';

  let targetExam = null;
  let effectiveExamKey = null;
  try {
    const examRes = await pool.query(
      `SELECT * FROM exams WHERE college_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [collegeId]
    );
    if (examRes.rows[0]) {
      targetExam = examRes.rows[0];
      effectiveExamKey = targetExam.exam_key || targetExam.exam_code;
    }
  } catch (_) {}

  // 4. Send in parallel chunks of 5
  let sentCount = 0;
  let failCount = 0;
  const newlySentRows = [];

  const PARALLEL_CHUNK = 5;
  for (let i = 0; i < batchToSend.length; i += PARALLEL_CHUNK) {
    const chunk = batchToSend.slice(i, i + PARALLEL_CHUNK);

    await Promise.allSettled(chunk.map(async (row) => {
      // Parse CSV columns
      const parts = row.split(',').map(p => p.replace(/^"|"$/g, '').trim());
      const studentId = parts[0];
      const name = parts[1];
      const email = parts[2];
      const rollNo = parts[3];

      if (!email || !email.includes('@')) {
        failCount++;
        return;
      }

      try {
        const tempPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Update student password in DB
        await pool.query(
          `UPDATE students SET password = $1, updated_at = NOW() WHERE student_id = $2`,
          [hashedPassword, studentId]
        );

        // Dispatch email
        await sendStudentCredentials({
          name: name || 'Candidate',
          email,
          studentId,
          password: tempPassword,
          collegeName,
          loginUrl,
          examName: targetExam?.title || targetExam?.name || 'Scheduled Examination',
          examKey: effectiveExamKey,
          examDate: targetExam?.date_time,
          examDuration: targetExam?.duration,
          subject: targetExam?.subject,
          isReset: false
        });

        sentCount++;
        newlySentRows.push(row);
        console.log(`  ✅ [${sentCount}/${batchToSend.length}] Delivered to: ${email} (${name} - ${studentId})`);
      } catch (err) {
        failCount++;
        console.error(`  ❌ Failed for ${email}: ${err.message}`);
      }
    }));

    // Small 200ms throttle between chunks
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n===============================================================`);
  console.log(`🏁 BATCH COMPLETE:`);
  console.log(`   ✅ Successfully Sent: ${sentCount}`);
  console.log(`   ❌ Failed:           ${failCount}`);
  console.log(`   ⏳ Remaining Pending: ${remainingAfterBatch.length}`);
  console.log(`===============================================================`);

  // 5. Update local and desktop CSV files
  const updatedPendingContent = [header, ...remainingAfterBatch].join('\n');
  fs.writeFileSync(pendingFile, updatedPendingContent);
  fs.writeFileSync('C:\\Users\\Pawan kumar\\OneDrive\\Desktop\\students_pending_email.csv', updatedPendingContent);

  const receivedFile = path.resolve(__dirname, '../../students_received_email.csv');
  if (fs.existsSync(receivedFile) && newlySentRows.length > 0) {
    fs.appendFileSync(receivedFile, '\n' + newlySentRows.join('\n'));
    fs.appendFileSync('C:\\Users\\Pawan kumar\\OneDrive\\Desktop\\students_received_email.csv', '\n' + newlySentRows.join('\n'));
  }

  console.log(`📁 Updated CSV files on your Desktop:`);
  console.log(`   - students_pending_email.csv  (${remainingAfterBatch.length} remaining)`);
  console.log(`   - students_received_email.csv (added ${sentCount} students)`);
  console.log(`===============================================================\n`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
