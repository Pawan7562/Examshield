const { pool } = require('../config/database');

async function main() {
  try {
    for (const t of ['answers', 'results', 'exam_sessions']) {
      const res = await pool.query(
        `SELECT conname, pg_get_constraintdef(c.oid) as def 
         FROM pg_constraint c 
         JOIN pg_class cl ON c.conrelid = cl.oid 
         WHERE cl.relname = $1;`,
        [t]
      );
      console.log(`Constraints on ${t}:`);
      console.table(res.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
