const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  const r = await pool.query(`
    SELECT id, title, exam_code, exam_key, date_time, duration, status, is_proctored 
    FROM exams 
    WHERE id = 'e83afcf9-b8ec-47f9-b4b4-62ce89fcff52';
  `);
  console.log('Exam details:', r.rows[0]);

  const questions = await pool.query(`
    SELECT id, question_text, type, marks, order_index 
    FROM questions 
    WHERE exam_id = 'e83afcf9-b8ec-47f9-b4b4-62ce89fcff52' 
    ORDER BY order_index;
  `);
  console.log('Questions count:', questions.rows.length);
  console.log('Questions:', questions.rows);

  await pool.end();
}

check().catch(console.error);
