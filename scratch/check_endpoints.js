const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== EXAMSHIELD FRONTEND ==="',
    'curl -s -I https://exam.nexifyforge.in/',
    'echo "=== EXAMSHIELD API HEALTH ==="',
    'curl -s https://exam.nexifyforge.in/api/health',
    'echo ""',
    'echo "=== ORDERKARE HOMEPAGE ==="',
    'curl -s -I https://orderkare.co.in/ | head -n 5'
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

