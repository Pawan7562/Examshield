require('dotenv').config();
const { pool } = require('./config/database');

async function check() {
  try {
    const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_class t ON c.conrelid = t.oid 
      WHERE t.relname = 'students'
    `);
    console.log('Constraints:', res.rows);

    const students = await pool.query(`
      SELECT id, student_id, name, email, roll_no, college_id, created_at 
      FROM students 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('Recent students in DB:', students.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
