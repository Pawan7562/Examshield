const { pool } = require('../backend/config/database');
const bcrypt = require('../backend/node_modules/bcryptjs');

async function test() {
  const res = await pool.query("SELECT id, name, email, student_id, password FROM students WHERE email LIKE '%@load.test' LIMIT 5");
  console.log('Sample test students:', res.rows.map(r => ({ id: r.id, email: r.email, student_id: r.student_id })));
  
  if (res.rows.length > 0) {
    const student = res.rows[0];
    const match = await bcrypt.compare('TestPassword123!', student.password);
    console.log(`Password match for ${student.email}:`, match);
  }

  // Also check production student sample
  const prodRes = await pool.query("SELECT id, name, email, student_id, password FROM students WHERE email NOT LIKE '%@load.test' LIMIT 3");
  console.log('Sample production students:', prodRes.rows.map(r => ({ id: r.id, name: r.name, email: r.email, student_id: r.student_id })));

  await pool.end();
}

test();
