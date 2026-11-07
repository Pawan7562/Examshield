const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'mkdir -p /var/backups/examshield /var/log/examshield',
    'docker exec examshield_postgres pg_dump -U examshield_admin examshield_prod | gzip -9 > /var/backups/examshield/test_backup.sql.gz',
    'ls -lh /var/backups/examshield/test_backup.sql.gz',
    'gzip -t /var/backups/examshield/test_backup.sql.gz && echo "GZIP integrity verified OK"'
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
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

