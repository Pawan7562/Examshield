const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== DOCKER CONTAINERS STATUS ==="',
    'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    'echo "\n=== SYSTEMD AUTOSCALER STATUS ==="',
    'systemctl is-active examshield-autoscaler.service',
    'echo "\n=== CRONTAB ==="',
    'crontab -l',
    'echo "\n=== DOMAINS STATUS ==="',
    'curl -s -I https://exam.nexifyforge.in/ | head -n 3',
    'curl -s -I https://orderkare.co.in/ | head -n 3'
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

