const { Client } = require('../backend/node_modules/ssh2');

const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';

const conn = new Client();
conn.on('ready', () => {
  const query = `
    docker exec examshield_postgres psql -U examshield_admin -d examshield_prod -c "
      SELECT count(*) AS remaining_students FROM (
        SELECT student_id FROM exam_students WHERE exam_id = '${EXAM_ID}'
        EXCEPT 
        SELECT student_id FROM results WHERE exam_id = '${EXAM_ID}'
      ) sub;

      SELECT s.student_id, s.email 
      FROM (
        SELECT student_id FROM exam_students WHERE exam_id = '${EXAM_ID}'
        EXCEPT 
        SELECT student_id FROM results WHERE exam_id = '${EXAM_ID}'
      ) missing
      JOIN students s ON s.id = missing.student_id
      ORDER BY s.student_id ASC
      LIMIT 10;
    "
  `;
  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });
