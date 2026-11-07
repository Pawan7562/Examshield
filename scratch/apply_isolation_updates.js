const { Client } = require('../backend/node_modules/ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP connected. Uploading files...');

    const composeLocal = path.resolve(__dirname, '../docker-compose.prod.yml');
    const nginxLocal = path.resolve(__dirname, '../nginx/nginx.conf');

    sftp.fastPut(composeLocal, '/var/www/Examshield/docker-compose.prod.yml', (err1) => {
      if (err1) throw err1;
      console.log('✅ Uploaded docker-compose.prod.yml');

      sftp.fastPut(nginxLocal, '/var/www/Examshield/nginx/nginx.conf', (err2) => {
        if (err2) throw err2;
        console.log('✅ Uploaded nginx/nginx.conf');

        const cmd = [
          'cd /var/www/Examshield',
          'docker exec examshield_load_balancer nginx -t',
          'docker exec examshield_load_balancer nginx -s reload',
          'docker compose -f docker-compose.prod.yml up -d --no-recreate',
          'echo "Testing both domains..."',
          'curl -s -I --resolve exam.nexifyforge.in:443:127.0.0.1 https://exam.nexifyforge.in/ | head -n 5',
          'curl -s -I --resolve orderkare.co.in:443:127.0.0.1 https://orderkare.co.in/ | head -n 5'
        ].join(' && ');

        conn.exec(cmd, (err3, stream) => {
          if (err3) throw err3;
          stream.pipe(process.stdout);
          stream.stderr.pipe(process.stderr);
          stream.on('close', () => conn.end());
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

