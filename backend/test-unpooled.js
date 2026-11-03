require('dotenv').config();
const { Client } = require('pg');

async function testUnpooled() {
  console.log('Testing UNPOOLED connection...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected to UNPOOLED!');
    const res = await client.query('SELECT count(*) from students');
    console.log('Total students:', res.rows[0].count);
    const recent = await client.query('SELECT student_id, name, email, roll_no, college_id FROM students ORDER BY created_at DESC LIMIT 5');
    console.log('Recent students:', recent.rows);
    await client.end();
  } catch (err) {
    console.error('UNPOOLED failed:', err.message);
  }
}

testUnpooled();
