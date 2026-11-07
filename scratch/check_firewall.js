const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECK UFW / FAIL2BAN ==="',
    'ufw status || true',
    'fail2ban-client status || true',
    'echo "=== CHECK LOAD BALANCER RECENT LOGS ==="',
    'docker logs --tail 30 examshield_load_balancer'
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

