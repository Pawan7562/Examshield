const { pool } = require('../backend/config/database');

async function findTestStudents() {
  try {
    const res = await pool.query(
      "SELECT id, email, student_id, name FROM students WHERE email ILIKE '%test%' OR name ILIKE '%test%' OR email ILIKE '%staging%' LIMIT 10"
    );
    console.log(`Found ${res.rows.length} test student(s):`);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error('Error finding test students:', err.message);
    await pool.end();
  }
}

findTestStudents();
