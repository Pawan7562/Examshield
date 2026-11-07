const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    'echo "=== LOAD BALANCER ERROR LOG ==="',
    'docker logs --tail 20 examshield_load_balancer',
    'echo "=== FRONTEND LOG ==="',
    'docker logs --tail 20 examshield-frontend-1',
    'echo "=== TEST CURL FRONTEND DIRECT ==="',
    'docker exec examshield_load_balancer curl -s -I http://frontend:80 || true',
    'echo "=== TEST CURL BACKEND DIRECT ==="',
    'docker exec examshield_load_balancer curl -s -I http://backend_1:5000/api/health || true'
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

