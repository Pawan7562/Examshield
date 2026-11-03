require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 15000,
});

async function diagnose() {
  const studentId = 'c54b191b-517c-47c1-a67b-a467d6da3a01';

  console.log('Using DB:', (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '').substring(0, 50));

  // Get student info
  const s = await pool.query('SELECT id, name, student_id FROM students WHERE id = $1', [studentId]);
  console.log('Student:', s.rows[0]);

  if (!s.rows[0]) { process.exit(0); return; }

  // Get all FKs referencing students
  const fkRes = await pool.query(`
    SELECT
      tc.table_name AS child_table,
      kcu.column_name AS child_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'students'
    ORDER BY rc.delete_rule DESC, tc.table_name
  `);

  console.log('\n--- FKs referencing students ---');
  for (const row of fkRes.rows) {
    try {
      const cnt = await pool.query(
        `SELECT COUNT(*) FROM ${row.child_table} WHERE ${row.child_column} = $1`,
        [studentId]
      );
      console.log(`  [${row.delete_rule}] ${row.child_table}.${row.child_column} = ${cnt.rows[0].count} rows`);
    } catch (e) {
      console.log(`  [${row.delete_rule}] ${row.child_table}.${row.child_column} => error: ${e.message}`);
    }
  }

  // Check what FKs reference the child tables themselves
  const childTables = fkRes.rows.map(r => r.child_table);
  for (const tbl of childTables) {
    const subFks = await pool.query(`
      SELECT tc.table_name AS child_table, kcu.column_name AS child_column, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = '${tbl}'
    `);
    if (subFks.rows.length > 0) {
      console.log(`\n  Sub-FKs referencing ${tbl}:`);
      for (const r of subFks.rows) {
        console.log(`    [${r.delete_rule}] ${r.child_table}.${r.child_column}`);
      }
    }
  }

  process.exit(0);
}

diagnose().catch(err => { 
  console.error('Error:', err.message, err.code);
  process.exit(1); 
});
