const { Client } = require('../backend/node_modules/ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Uploading docker-compose.prod.yml...');

  conn.sftp((err, sftp) => {
    if (err) throw err;

    const composeLocal = path.resolve(__dirname, '../docker-compose.prod.yml');
    sftp.fastPut(composeLocal, '/var/www/Examshield/docker-compose.prod.yml', (uploadErr) => {
      if (uploadErr) throw uploadErr;
      console.log('✅ Uploaded docker-compose.prod.yml. Bringing up entire cluster...');

      const cmd = [
        'cd /var/www/Examshield',
        'docker compose -f docker-compose.prod.yml up -d',
        'sleep 3',
        'docker exec examshield_load_balancer nginx -t',
        'docker exec examshield_load_balancer nginx -s reload || true',
        'docker ps --filter "name=examshield" --format "table {{.Names}}\t{{.Status}}"',
        'echo "=== Testing curl homepage ==="',
        'curl -s -I https://exam.nexifyforge.in/ | head -n 6'
      ].join(' && ');

      conn.exec(cmd, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.pipe(process.stdout);
        stream.stderr.pipe(process.stderr);
        stream.on('close', () => {
          console.log('\nCluster restarted successfully!');
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});

