const { pool } = require('../backend/config/database');
const bcrypt = require('../backend/node_modules/bcryptjs');

async function test() {
  try {
    const res = await pool.query('SELECT id, name, email, password FROM colleges');
    console.log('Total colleges:', res.rows.length);
    for (const row of res.rows) {
      console.log('College:', row.name, '| Email:', row.email);
      for (const pass of ['password123', 'Pawan@1234', 'Test@123', 'admin123', 'Admin@123', 'Pawan@123', '123456']) {
        const matches = await bcrypt.compare(pass, row.password);
        if (matches) {
          console.log(`  ==> PASSWORD MATCH for ${row.email}: "${pass}"`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

test();
