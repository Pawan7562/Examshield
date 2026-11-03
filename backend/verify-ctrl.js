const { pool } = require('./config/database');

async function check() {
  const r = await pool.query("SELECT id, name, college_id FROM students WHERE id = 'c54b191b-517c-47c1-a67b-a467d6da3a01'");
  console.log('Student:', JSON.stringify(r.rows));
  
  // Also verify nodemon loaded the latest deleteStudent code
  const ctrl = require('./controllers/studentController');
  const fnSrc = ctrl.deleteStudent.toString();
  const hasLetClient = fnSrc.includes('let client');
  const hasAnswersFirst = fnSrc.indexOf('answers') < fnSrc.indexOf('exam_sessions');
  console.log('Code checks:');
  console.log('  uses "let client":', hasLetClient);
  console.log('  answers before exam_sessions:', hasAnswersFirst);
  console.log('  first 200 chars of deleteStudent:', fnSrc.substring(0, 200));
  
  process.exit(0);
}

check().catch(e => { console.error(e.message); process.exit(1); });
