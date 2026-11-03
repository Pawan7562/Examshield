require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { pool } = require('../backend/config/database');

async function run() {
  const eaCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'exam_assignments' ORDER BY ordinal_position"
  );
  console.log('exam_assignments columns:', eaCols.rows);

  const sCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position"
  );
  console.log('students columns:', sCols.rows.map(r => r.column_name));

  await pool.end();
}

run();
