const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function inspect() {
  console.log('--- Inspecting Database Columns for Media / Images / Recordings ---');
  const colsRes = await pool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (
        column_name ILIKE '%image%' 
        OR column_name ILIKE '%screenshot%' 
        OR column_name ILIKE '%video%' 
        OR column_name ILIKE '%record%' 
        OR column_name ILIKE '%media%' 
        OR column_name ILIKE '%photo%' 
        OR column_name ILIKE '%snapshot%'
      )
    ORDER BY table_name, column_name;
  `);
  console.log('Columns matching media terms:', colsRes.rows);

  console.log('\n--- Checking rows with media in those tables ---');
  for (const col of colsRes.rows) {
    try {
      const countRes = await pool.query(`
        SELECT COUNT(*) as count 
        FROM "${col.table_name}" 
        WHERE "${col.column_name}" IS NOT NULL 
          AND ("${col.column_name}"::text != '');
      `);
      console.log(`  ${col.table_name}.${col.column_name}: ${countRes.rows[0].count} populated rows`);
    } catch (e) {
      console.log(`  ${col.table_name}.${col.column_name}: Error checking - ${e.message}`);
    }
  }

  // Check all tables in DB to see if any table name is media-related
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('\nAll tables in database:', tablesRes.rows.map(r => r.table_name));

  // Check uploads folder
  const uploadsDir = path.resolve(__dirname, '../uploads');
  console.log('\n--- Checking uploads directory:', uploadsDir, '---');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Uploads folder contents (${files.length} items):`, files.slice(0, 20));
  } else {
    console.log('Uploads folder does not exist.');
  }

  await pool.end();
}

inspect().catch(console.error);
