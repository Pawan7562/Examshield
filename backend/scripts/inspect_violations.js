const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function inspectViolations() {
  const count = await pool.query('SELECT COUNT(*) FROM violations;');
  console.log('Total violations rows:', count.rows[0].count);

  const sample = await pool.query('SELECT * FROM violations LIMIT 5;');
  console.log('Sample violations:', sample.rows);

  // Check if any column contains base64 or long data (> 500 chars)
  const longCols = await pool.query(`
    SELECT id, type, LENGTH(description) as desc_len, LENGTH(screenshot_url) as url_len 
    FROM violations 
    ORDER BY desc_len DESC NULLS LAST 
    LIMIT 5;
  `);
  console.log('Longest violation fields:', longCols.rows);

  await pool.end();
}

inspectViolations().catch(console.error);
