const { Client } = require('../backend/node_modules/ssh2');

const EXAM_ID = 'c0012026-2000-4000-8000-000000002026';

const conn = new Client();
conn.on('ready', () => {
  const query = `
    docker exec examshield_postgres psql -U examshield_admin -d examshield_prod -c "
      DELETE FROM violations WHERE exam_id = '${EXAM_ID}';
      DELETE FROM results WHERE exam_id = '${EXAM_ID}';
      DELETE FROM answers WHERE exam_id = '${EXAM_ID}';
      DELETE FROM exam_sessions WHERE exam_id = '${EXAM_ID}';
    "
    docker exec examshield_redis redis-cli FLUSHDB
  `;
  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', (code) => {
      console.log(`Cleanup finished with code: ${code}`);
      conn.end();
    });
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });

