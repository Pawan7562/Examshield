const { Client } = require('../backend/node_modules/ssh2');
const path = require('path');

const VPS_HOST = process.env.VPS_HOST || '147.93.19.252';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PASS = process.env.VPS_PASS || 'F&j9-bc,dS#f#A1@';

const backendFiles = [
  {
    local: path.resolve(__dirname, '../backend/controllers/examController.js'),
    remote: '/var/www/Examshield/backend/controllers/examController.js',
    containerPath: '/app/controllers/examController.js'
  },
  {
    local: path.resolve(__dirname, '../backend/utils/timezone.js'),
    remote: '/var/www/Examshield/backend/utils/timezone.js',
    containerPath: '/app/utils/timezone.js'
  }
];

const frontendTarLocal = path.resolve(__dirname, '../frontend_build.tar.gz');
const frontendTarRemote = '/tmp/frontend_build.tar.gz';

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

async function deploy() {
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
        // 1. Upload backend files
        console.log('\n--- UPLOADING BACKEND FILES ---');
        for (const f of backendFiles) {
          console.log(`Uploading ${path.basename(f.local)} -> ${f.remote}...`);
          await uploadFile(sftp, f.local, f.remote);
          console.log(`✅ Uploaded to host: ${path.basename(f.local)}`);
        }

        // 2. Upload frontend build tarball
        console.log('\n--- UPLOADING FRONTEND BUILD TARBALL ---');
        console.log(`Uploading frontend_build.tar.gz -> ${frontendTarRemote}...`);
        await uploadFile(sftp, frontendTarLocal, frontendTarRemote);
        console.log('✅ Uploaded frontend build tarball to VPS /tmp!');

        // 3. Copy backend files into docker containers
        console.log('\n--- COPYING TO BACKEND DOCKER CONTAINERS ---');
        for (const f of backendFiles) {
          await runRemote(conn, `docker cp ${f.remote} examshield-backend-1:${f.containerPath}`);
          await runRemote(conn, `docker cp ${f.remote} examshield-backend_2-1:${f.containerPath}`);
          console.log(`✅ Copied to backend containers: ${path.basename(f.local)}`);
        }

        // 4. Extract frontend build tarball and copy to examshield-frontend-1
        console.log('\n--- EXTRACTING & DEPLOYING FRONTEND BUILD ---');
        await runRemote(conn, 'rm -rf /tmp/build && mkdir -p /tmp/build && tar -xzf /tmp/frontend_build.tar.gz -C /tmp/build');
        await runRemote(conn, 'docker cp /tmp/build/. examshield-frontend-1:/usr/share/nginx/html/');
        console.log('✅ Copied fresh frontend build to examshield-frontend-1:/usr/share/nginx/html/');

        // 5. Restart containers
        console.log('\n--- RESTARTING CONTAINERS ---');
        const restartRes = await runRemote(conn, 'docker restart examshield-backend-1 examshield-backend_2-1 examshield-frontend-1');
        console.log('Restart output:\n', restartRes.out);

        // 6. Verify container status
        console.log('\n--- VERIFYING CONTAINER STATUS ---');
        const psRes = await runRemote(conn, 'docker ps --filter "name=examshield"');
        console.log(psRes.out);

        console.log('🎉 DEPLOYMENT COMPLETE! All frontend and backend rescheduling fixes are LIVE on VPS!');
      } catch (deployErr) {
        console.error('Deployment Error:', deployErr);
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

deploy();
