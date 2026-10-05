const { pool } = require('../config/database');

async function check() {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));

    const examCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'exams'");
    console.log('Exam columns:', examCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    const qCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions'");
    console.log('Question columns:', qCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    const eqCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'exam_questions'");
    console.log('exam_questions columns:', eqCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    const esCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'exam_sessions'");
    console.log('exam_sessions columns:', esCols.rows.map(r => `${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
