const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== 1. DISK USAGE ==="',
    'df -h /',
    'echo "\n=== 2. CERTBOT RENEWAL CONFIGS ==="',
    'cat /etc/letsencrypt/renewal/exam.nexifyforge.in.conf || true',
    'echo "---"',
    'cat /etc/letsencrypt/renewal/orderkare.co.in.conf || true',
    'echo "\n=== 3. DOCKER DAEMON LOG CONFIG (/etc/docker/daemon.json) ==="',
    'cat /etc/docker/daemon.json 2>/dev/null || echo "No daemon.json found"',
    'echo "\n=== 4. CERTBOT DRY-RUN TEST ==="',
    'certbot renew --dry-run || true'
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

