const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkTableSizes() {
  const res = await pool.query(`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
      n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
  `);
  console.log('--- PostgreSQL Tables and Sizes ---');
  console.table(res.rows);

  // Check if any column in any table has bytea or text > 50kb
  const textCols = await pool.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (data_type = 'text' OR data_type = 'bytea' OR data_type = 'jsonb' OR data_type = 'character varying')
    ORDER BY table_name;
  `);

  console.log('\n--- Checking for columns containing base64 images or large text blobs (> 10KB) ---');
  for (const col of textCols.rows) {
    try {
      const maxLenRes = await pool.query(`
        SELECT MAX(LENGTH("${col.column_name}"::text)) as max_len,
               COUNT(*) FILTER (WHERE "${col.column_name}"::text LIKE '%data:image%' OR "${col.column_name}"::text LIKE '%base64%') as base64_count
        FROM "${col.table_name}";
      `);
      if (maxLenRes.rows[0].max_len > 5000 || maxLenRes.rows[0].base64_count > 0) {
        console.log(`  🚨 ${col.table_name}.${col.column_name}: max_len = ${maxLenRes.rows[0].max_len}, base64_images = ${maxLenRes.rows[0].base64_count}`);
      }
    } catch (_) {}
  }

  await pool.end();
}

checkTableSizes().catch(console.error);
