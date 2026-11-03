const { pool } = require('./config/database');

async function checkQuestionsCols() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'questions'
      ORDER BY ordinal_position;
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkQuestionsCols();
