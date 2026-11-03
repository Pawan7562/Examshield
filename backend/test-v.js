const { pool } = require('./config/database');

async function checkViolations() {
  try {
    const v = await pool.query("SELECT * FROM violations WHERE session_id = '3bb096b9-c655-449b-8277-4804216167b7' ORDER BY created_at DESC");
    console.log('Violations for session:');
    console.table(v.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkViolations();
