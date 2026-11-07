const { Client } = require('../backend/node_modules/ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading modified backend files...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const filesToUpload = [
      { local: path.join(__dirname, '../backend/services/autosaveBufferService.js'), remote: '/var/www/Examshield/backend/services/autosaveBufferService.js' },
      { local: path.join(__dirname, '../backend/controllers/examController.js'), remote: '/var/www/Examshield/backend/controllers/examController.js' }
    ];

    let completed = 0;
    filesToUpload.forEach(f => {
      sftp.fastPut(f.local, f.remote, (upErr) => {
        if (upErr) throw upErr;
        console.log(`✅ Uploaded: ${f.remote}`);
        completed++;
        if (completed === filesToUpload.length) {
          console.log('Restarting all 16 backend containers...');
          // Use rolling restart or fast docker restart to avoid downtime
          conn.exec('docker restart $(docker ps -q --filter "name=examshield-backend")', (execErr, stream) => {
            if (execErr) throw execErr;
            stream.pipe(process.stdout);
            stream.stderr.pipe(process.stderr);
            stream.on('close', (code) => {
              console.log(`Backend cluster restart finished with code ${code}`);
              conn.end();
            });
          });
        }
      });
    });
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });

