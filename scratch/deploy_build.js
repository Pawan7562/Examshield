const { execSync } = require('child_process');
const path = require('path');

const SSH_KEY = 'C:\\Users\\Pawan kumar\\.ssh\\id_rsa';
const VPS = 'root@189.72.150.58';
const BUILD_DIR = path.join(__dirname, '..', 'frontend', 'build');
const TAR_FILE = path.join(__dirname, '..', 'frontend', 'build.tar.gz');

console.log('1. Compressing build...');
execSync(`tar -czf "${TAR_FILE}" -C "${BUILD_DIR}" .`, { stdio: 'inherit' });

console.log('2. Uploading to VPS...');
execSync(`scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${TAR_FILE}" ${VPS}:/tmp/build.tar.gz`, { stdio: 'inherit' });

console.log('3. Extracting and deploying to container...');
const remoteCmd = [
  'mkdir -p /var/www/examshield/frontend/build',
  'tar -xzf /tmp/build.tar.gz -C /var/www/examshield/frontend/build/',
  'docker cp /var/www/examshield/frontend/build/. examshield-frontend-1:/usr/share/nginx/html/',
  'rm -f /tmp/build.tar.gz',
  'docker restart examshield-frontend-1'
].join(' && ');

execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${VPS} "${remoteCmd}"`, { stdio: 'inherit' });
console.log('4. Successfully deployed to VPS!');

