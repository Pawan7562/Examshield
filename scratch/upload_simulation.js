const { Client } = require('../backend/node_modules/ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localFile = path.join(__dirname, 'simulate_2050_students.js');
    const remoteFile = '/var/www/Examshield/scripts/simulate_2050_students.js';
    sftp.fastPut(localFile, remoteFile, (uploadErr) => {
      if (uploadErr) throw uploadErr;
      console.log('✅ Uploaded simulate_2050_students.js to VPS');
      conn.end();
    });
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });

