const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT 
      c.id, 
      c.name, 
      c.email, 
      count(DISTINCT e.id) as total_exams,
      count(DISTINCT s.id) as total_students
    FROM colleges c
    LEFT JOIN exams e ON e.college_id = c.id
    LEFT JOIN students s ON s.college_id = c.id
    GROUP BY c.id, c.name, c.email
    ORDER BY total_students DESC, total_exams DESC;
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

