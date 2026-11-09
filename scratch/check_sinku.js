const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT count(*) FROM answers WHERE student_id = '498e46c6-1276-4e82-a688-69c4b747787f';
    SELECT count(*) FROM results WHERE student_id = '498e46c6-1276-4e82-a688-69c4b747787f';
    SELECT count(*) FROM exam_students WHERE student_id = '498e46c6-1276-4e82-a688-69c4b747787f';
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
