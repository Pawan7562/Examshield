const { pool } = require('./config/database');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE exams
      ADD COLUMN IF NOT EXISTS monitoring_config jsonb DEFAULT '{"face_detection": true, "voice_detection": true, "tab_switch": true, "fullscreen": true}'::jsonb;
    `);
    console.log('Successfully ensured monitoring_config column exists on exams table!');

    const check = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'exams' AND column_name = 'monitoring_config';
    `);
    console.table(check.rows);
  } catch (e) {
    console.error('Migration error:', e);
  } finally {
    await pool.end();
  }
}

migrate();
