const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  const res = await pool.query(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    ORDER BY tablename, indexname;
  `);
  console.log('Total existing indexes:', res.rows.length);
  res.rows.forEach(r => console.log(`  ${r.tablename} -> ${r.indexname}`));
  await pool.end();
}

check().catch(console.error);
