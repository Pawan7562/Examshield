const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("DELETE FROM exam_sessions WHERE exam_id = '6fcc9c13-8bec-43a8-99b9-869f9f616cd9'")
  .then(() => {
    console.log('✅ Exam session table reset for fresh candidate entry.');
    pool.end();
  })
  .catch(console.error);
