const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    docker exec examshield_postgres psql -U examshield_admin -d examshield_prod -c "
      SELECT * FROM super_admins;
      SELECT id, title, exam_code, status, college_id, created_at FROM exams ORDER BY created_at DESC;
      SELECT id, name, email, student_id, roll_no FROM students WHERE email LIKE '%demo%' OR name ILIKE '%demo%';
    "
  `;
  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });
