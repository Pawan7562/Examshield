const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function setup() {
  const hash = await bcrypt.hash('SuperAdmin@123', 12);

  // Update existing superadmin@examshield.com
  await pool.query('UPDATE super_admins SET password = $1 WHERE email = $2', [hash, 'superadmin@examshield.com']);
  console.log('Updated superadmin@examshield.com');

  // Insert or update admin@CollegeExam.com
  const res = await pool.query('SELECT id FROM super_admins WHERE email = $1', ['admin@CollegeExam.com']);
  if (res.rows.length === 0) {
    await pool.query('INSERT INTO super_admins (name, email, password, is_active) VALUES ($1, $2, $3, true)', ['Super Admin', 'admin@CollegeExam.com', hash]);
    console.log('Inserted admin@CollegeExam.com');
  } else {
    await pool.query('UPDATE super_admins SET password = $1 WHERE email = $2', [hash, 'admin@CollegeExam.com']);
    console.log('Updated admin@CollegeExam.com');
  }

  const list = await pool.query('SELECT id, name, email, is_active FROM super_admins');
  console.log('Current super_admins:', list.rows);
  process.exit(0);
}

setup().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
