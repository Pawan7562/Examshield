const { Client } = require('../backend/node_modules/ssh2');
const fs = require('fs');
const path = require('path');

const VPS_HOST = process.env.VPS_HOST || '147.93.19.252';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PASS = process.env.VPS_PASS || 'F&j9-bc,dS#f#A1@';

const filesToSync = [
  {
    local: path.resolve(__dirname, '../backend/utils/timezone.js'),
    remote: '/var/www/Examshield/backend/utils/timezone.js',
    containerPath: '/app/utils/timezone.js'
  },
  {
    local: path.resolve(__dirname, '../backend/services/emailService.js'),
    remote: '/var/www/Examshield/backend/services/emailService.js',
    containerPath: '/app/services/emailService.js'
  },
  {
    local: path.resolve(__dirname, '../backend/services/autoEmailBatchService.js'),
    remote: '/var/www/Examshield/backend/services/autoEmailBatchService.js',
    containerPath: '/app/services/autoEmailBatchService.js'
  },
  {
    local: path.resolve(__dirname, '../backend/controllers/examController.js'),
    remote: '/var/www/Examshield/backend/controllers/examController.js',
    containerPath: '/app/controllers/examController.js'
  },
  {
    local: path.resolve(__dirname, '../backend/controllers/studentController.js'),
    remote: '/var/www/Examshield/backend/controllers/studentController.js',
    containerPath: '/app/controllers/studentController.js'
  },
  {
    local: path.resolve(__dirname, '../backend/config/redis.js'),
    remote: '/var/www/Examshield/backend/config/redis.js',
    containerPath: '/app/config/redis.js'
  }
];

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function runRemote(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', (code) => resolve({ code, out }))
        .on('data', d => { out += d.toString(); })
        .stderr.on('data', d => { out += d.toString(); });
    });
  });
}

async function sync() {
  console.log(`Connecting via SFTP to ${VPS_USER}@${VPS_HOST}...`);
  const conn = new Client();

  conn.on('ready', () => {
    console.log('Connected! Opening SFTP...');
    conn.sftp(async (err, sftp) => {
      if (err) {
        console.error('SFTP Error:', err);
        conn.end();
        process.exit(1);
      }

      try {
        for (const f of filesToSync) {
          console.log(`Uploading ${path.basename(f.local)} -> ${f.remote}...`);
          await uploadFile(sftp, f.local, f.remote);
          console.log(`✅ Uploaded to host: ${path.basename(f.local)}`);
        }

        console.log('\nCopying files into Docker backend containers...');
        for (const f of filesToSync) {
          if (f.containerPath) {
            await runRemote(conn, `docker cp ${f.remote} examshield-backend-1:${f.containerPath}`);
            await runRemote(conn, `docker cp ${f.remote} examshield-backend_2-1:${f.containerPath}`);
            console.log(`✅ Copied to containers: ${path.basename(f.local)}`);
          }
        }

        console.log('\nReloading backend containers on VPS...');
        const reloadRes = await runRemote(conn, 'docker restart examshield-backend-1 examshield-backend_2-1');
        console.log('Container restart result:\n', reloadRes.out);

        console.log('Checking container status...');
        const psRes = await runRemote(conn, 'docker ps --filter "name=examshield-backend"');
        console.log(psRes.out);

        console.log('🎉 ALL FILES SYNCED AND BACKEND CONTAINERS RELOADED CLEANLY ON VPS!');
      } catch (uploadErr) {
        console.error('Upload Error:', uploadErr);
      } finally {
        conn.end();
      }
    });
  }).on('error', err => {
    console.error('SSH Connection Failed:', err.message);
  }).connect({
    host: VPS_HOST,
    port: 22,
    username: VPS_USER,
    password: VPS_PASS,
  });
}

sync();
