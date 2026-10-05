const { pool } = require('../config/database');

async function main() {
  try {
    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'questions'");
    console.log('Columns:', colsRes.rows.map(r => r.column_name));
    const res = await pool.query("SELECT * FROM questions WHERE question_text ILIKE '%largest element%' OR code_template ILIKE '%findMax%'");
    console.log(`Found ${res.rows.length} questions:`);
    for (const q of res.rows) {
      console.log('ID:', q.id);
      console.log('Question Text:', q.question_text);
      console.log('Options:', JSON.stringify(q.options, null, 2));
      console.log('Test Cases:', JSON.stringify(q.test_cases, null, 2));
      console.log('Code Template:', q.code_template);
    }
  } catch (err) {
    console.error('Error querying questions:', err);
  } finally {
    await pool.end();
  }
}

main();
