const { query } = require('./config/database');

async function checkAnswersSchema() {
  const indexes = await query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'answers'
  `);
  console.log('Indexes on answers:', indexes.rows);

  const constraints = await query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'answers'::regclass
  `);
  console.log('Constraints on answers:', constraints.rows);
  process.exit(0);
}
checkAnswersSchema().catch(console.error);
