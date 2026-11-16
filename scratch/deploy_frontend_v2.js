const { execSync } = require('child_process');
const path = require('path');

const SSH_KEY = 'C:\\Users\\Pawan kumar\\.ssh\\id_rsa';
const VPS = 'root@189.72.150.58';
const BUILD_DIR = path.join(__dirname, '..', 'frontend', 'build');

function ssh(cmd) {
  console.log(`[SSH] ${cmd.substring(0, 100)}...`);
  return execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${VPS} "${cmd}"`, {
    encoding: 'utf8',
    stdio: 'inherit'
  });
}

console.log('=== Deploying frontend to VPS 189.72.150.58 ===');

// Step 1: Create tar of build locally
console.log('\n1. Compressing build...');
execSync(`tar -czf "${path.join(__dirname, 'build.tar.gz')}" -C "${BUILD_DIR}" .`, {
  stdio: 'inherit'
});
console.log('   Build compressed.');

// Step 2: Upload to VPS
console.log('\n2. Uploading to VPS...');
execSync(`scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${path.join(__dirname, 'build.tar.gz')}" ${VPS}:/tmp/build.tar.gz`, {
  stdio: 'inherit'
});
console.log('   Uploaded.');

// Step 3: Extract and deploy
console.log('\n3. Extracting and deploying...');
ssh('mkdir -p /tmp/frontend_build && tar -xzf /tmp/build.tar.gz -C /tmp/frontend_build && docker cp /tmp/frontend_build/. examshield-frontend-1:/usr/share/nginx/html/ && rm -rf /tmp/frontend_build /tmp/build.tar.gz');

// Step 4: Restart containers
console.log('\n4. Restarting frontend + LB...');
ssh('docker restart examshield-frontend-1 examshield_load_balancer');

console.log('\n=== Frontend deployed successfully! ===');
console.log('Visit: https://exam.nexifyforge.in/super-admin/dashboard');

