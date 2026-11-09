const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT count(*) as students_without_college FROM students WHERE college_id IS NULL;
    SELECT count(*) as students_without_name FROM students WHERE name IS NULL OR trim(name) = '';
    SELECT count(*) as students_without_email FROM students WHERE email IS NULL OR trim(email) = '';
    SELECT count(*) as total_students FROM students;
    SELECT split_part(email, '@', 2) AS domain, count(*) FROM students GROUP BY domain ORDER BY count DESC;
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

