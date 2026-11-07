const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = [
    'echo "=== TEST FROM INSIDE examshield_load_balancer TO 147.93.19.252:8080 ==="',
    'docker exec examshield_load_balancer curl -s -I http://147.93.19.252:8080 | head -n 5 || true',
    'echo "=== TEST FROM INSIDE examshield_load_balancer TO 172.18.0.1:8080 (DOCKER GATEWAY) ==="',
    'docker exec examshield_load_balancer curl -s -I http://172.18.0.1:8080 | head -n 5 || true'
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

