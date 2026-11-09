const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT '=== SUPER ADMINS ===' AS title;
    SELECT * FROM super_admins;

    SELECT '=== COLLEGE ADMINS (COLLEGES) ===' AS title;
    SELECT * FROM colleges;

    SELECT '=== ANY SUSPICIOUS / DEMO STUDENTS ===' AS title;
    SELECT id, name, email, student_id, roll_no, college_id FROM students 
    WHERE email ILIKE '%demo%' 
       OR email ILIKE '%test%' 
       OR name ILIKE '%demo%' 
       OR name ILIKE '%test%'
    LIMIT 30;
  `;

  conn.exec(`docker exec -i examshield_postgres psql -U examshield_admin -d examshield_prod -c "${sql}"`, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});

