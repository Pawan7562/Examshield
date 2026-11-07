const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    docker exec examshield_postgres psql -U examshield_admin -d examshield_prod -c "
      SELECT column_name FROM information_schema.columns WHERE table_name = 'results';
      SELECT * FROM results WHERE exam_id = 'c0012026-2000-4000-8000-000000002026';
      SELECT id, student_id, status, started_at, submitted_at, violation_count FROM exam_sessions WHERE exam_id = 'c0012026-2000-4000-8000-000000002026';
      SELECT count(*) FROM answers WHERE exam_id = 'c0012026-2000-4000-8000-000000002026';
      SELECT count(*) FROM violations WHERE exam_id = 'c0012026-2000-4000-8000-000000002026';
    "
  `;
  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });
