const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

async function main() {
  const collegeRes = await pool.query('SELECT id, name, email FROM colleges LIMIT 3;');
  console.log('Colleges:', collegeRes.rows);

  const examRes = await pool.query('SELECT id, title, exam_code, exam_key, college_id, type FROM exams ORDER BY created_at DESC LIMIT 3;');
  console.log('Recent Exams:', examRes.rows);

  await pool.end();
}

main().catch(console.error);
