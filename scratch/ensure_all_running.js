const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'cd /var/www/Examshield',
    'docker compose -f docker-compose.prod.yml up -d',
    'docker exec examshield_load_balancer nginx -t',
    'docker exec examshield_load_balancer nginx -s reload',
    'docker ps --format "table {{.Names}}\t{{.Status}}"'
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

