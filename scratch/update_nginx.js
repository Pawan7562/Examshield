const { Client } = require('../backend/node_modules/ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localFile = path.join(__dirname, '../nginx/nginx.conf');
    const remoteFile = '/var/www/Examshield/nginx/nginx.conf';
    sftp.fastPut(localFile, remoteFile, (uploadErr) => {
      if (uploadErr) throw uploadErr;
      console.log('✅ Uploaded nginx.conf');
      // Test and reload nginx inside examshield_load_balancer
      conn.exec('docker exec examshield_load_balancer nginx -t && docker exec examshield_load_balancer nginx -s reload', (execErr, stream) => {
        if (execErr) throw execErr;
        stream.pipe(process.stdout);
        stream.stderr.pipe(process.stderr);
        stream.on('close', (code) => {
          console.log(`Nginx reload finished with code ${code}`);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });

