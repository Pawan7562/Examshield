require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');

async function check() {
  const res = await pool.query("SELECT email FROM students WHERE email LIKE '%@load.test' ORDER BY email");
  console.log('Total @load.test students in DB:', res.rows.length);
  const emails = res.rows.map(r => r.email);
  console.log('Sample head:', emails.slice(0, 10));
  console.log('Sample tail:', emails.slice(-10));

  // Check what index numbers exist
  const numbers = [];
  const otherEmails = [];
  for (const e of emails) {
    const m = e.match(/^load_student_(\d+)@load\.test$/);
    if (m) {
      numbers.push(parseInt(m[1], 10));
    } else {
      otherEmails.push(e);
    }
  }
  numbers.sort((a, b) => a - b);
  console.log('Total numbered:', numbers.length, 'Min:', numbers[0], 'Max:', numbers[numbers.length - 1]);
  console.log('Other emails:', otherEmails);

  await pool.end();
}

check();
