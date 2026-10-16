require('dotenv').config({ path: './backend/.env' });
const { pool } = require('../config/database');
const fs = require('fs');

async function run() {
  try {
    const apiKey = process.env.BREVO_API_KEY || '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';
    
    // Fetch delivered and sent events from Brevo
    const allSentEmails = new Set();
    const eventTypes = ['delivered', 'requests', 'opened', 'clicks'];

    for (const evType of eventTypes) {
      let offset = 0;
      const limit = 100;
      while (offset < 3000) {
        const url = `https://api.brevo.com/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&event=${evType}&sort=desc`;
        const res = await fetch(url, {
          headers: { 'api-key': apiKey, 'accept': 'application/json' }
        });
        const data = await res.json();
        if (!data.events || data.events.length === 0) break;
        for (const ev of data.events) {
          if (ev.email) {
            allSentEmails.add(ev.email.toLowerCase().trim());
          }
        }
        if (data.events.length < limit) break;
        offset += limit;
      }
    }

    console.log(`\n🔍 Total unique student emails tracked in Brevo: ${allSentEmails.size}`);

    // Fetch all students for CGC University
    const studentsRes = await pool.query(`
      SELECT student_id, name, email, roll_no, created_at, credentials_sent_at 
      FROM students 
      WHERE college_id = '7e0728b7-88b0-4e52-a427-8dd18f259a7a'
      ORDER BY created_at ASC
    `);

    const totalStudents = studentsRes.rows;
    const received = [];
    const notReceived = [];

    for (const s of totalStudents) {
      const cleanEmail = (s.email || '').toLowerCase().trim();
      if (allSentEmails.has(cleanEmail) || s.credentials_sent_at) {
        received.push(s);
      } else {
        notReceived.push(s);
      }
    }

    console.log(`\n==================================================`);
    console.log(`📊 EMAIL DELIVERY REPORT FOR CGC UNIVERSITY:`);
    console.log(`==================================================`);
    console.log(`Total Students Registered in Database: ${totalStudents.length}`);
    console.log(`✅ Received Email (Dispatched):        ${received.length}`);
    console.log(`⏳ Not Received Yet (Pending Quota):   ${notReceived.length}`);
    console.log(`==================================================\n`);

    // Output sample of received
    if (received.length > 0) {
      console.log('Sample of students who RECEIVED email:');
      console.table(received.slice(0, 5).map(s => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        roll_no: s.roll_no
      })));
    }

    // Output sample of pending
    if (notReceived.length > 0) {
      console.log('Sample of students who have NOT received email yet (Pending next batch):');
      console.table(notReceived.slice(0, 5).map(s => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        roll_no: s.roll_no
      })));
    }

    // Write CSV files to root
    const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
    const toCsv = (rows) => [
      'Student ID,Name,Email,Roll No,Registration Date',
      ...rows.map(r => `${escapeCsv(r.student_id)},${escapeCsv(r.name)},${escapeCsv(r.email)},${escapeCsv(r.roll_no)},${escapeCsv(r.created_at)}`)
    ].join('\n');

    fs.writeFileSync('students_received_email.csv', toCsv(received));
    fs.writeFileSync('students_pending_email.csv', toCsv(notReceived));

    console.log('\n📄 Generated CSV reports:');
    console.log('  1. students_received_email.csv');
    console.log('  2. students_pending_email.csv\n');

  } catch (err) {
    console.error('Error in identify_email_status:', err.message);
  } finally {
    await pool.end();
  }
}

run();
