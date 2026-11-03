const { pool } = require('./config/database');

async function checkResult() {
  try {
    const res = await pool.query("SELECT * FROM results WHERE exam_id = 'fd27936c-3291-4557-a4c4-43e4efb81ea4'");
    console.log('Results:');
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkResult();
