const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== CHECKING SCRIPTS CONNECTING TO 5432 ==="',
    'grep -rn "5432" /var/www/Examshield/scripts /var/www/orderkare/scripts 2>/dev/null || true',
    'echo "\n=== CHECKING HOST LISTENING PORTS ==="',
    'ss -tulpn | grep -E "5432|6379|8080|80|443"'
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

