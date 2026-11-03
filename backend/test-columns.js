const { pool } = require('./config/database');

async function checkColumns() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('exam_sessions', 'exams', 'results', 'answers')
      ORDER BY table_name, ordinal_position;
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkColumns();
