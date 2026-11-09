const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT id, title FROM exams WHERE created_by = 'c3da5b41-a183-4a96-a7dc-59726093decf';
    SELECT id, name, email FROM students WHERE college_id = 'c3da5b41-a183-4a96-a7dc-59726093decf';
    SELECT id, name, email FROM super_admins WHERE email ILIKE '%admin@collegeexam.com%';
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

