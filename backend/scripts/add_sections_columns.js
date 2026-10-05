const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('Running section migrations...');
    await pool.query(`
      ALTER TABLE exams ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;
    `);
    console.log('Added sections column to exams table');

    await pool.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_id varchar(100);
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_name varchar(255);
    `);
    console.log('Added section_id and section_name to questions table');

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
