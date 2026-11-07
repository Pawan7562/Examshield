const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== 1. CRONTAB LIST ==="',
    'crontab -l || true',
    'echo "\n=== 2. SYSTEMD EXAMSHIELD SERVICES ==="',
    'systemctl list-unit-files | grep -i examshield || true',
    'echo "\n=== 3. SYSTEMD ORDERKARE SERVICES ==="',
    'systemctl list-unit-files | grep -i orderkare || true',
    'echo "\n=== 4. ORDERKARE DOCKER COMPOSE ==="',
    'cat /var/www/orderkare/docker-compose.yml',
    'echo "\n=== 5. EXAMSHIELD DOCKER COMPOSE PORTS/VOLUMES ==="',
    'grep -E "ports:|volumes:|container_name:" /var/www/Examshield/docker-compose.prod.yml -A 2'
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

