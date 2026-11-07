const { Client } = require('../backend/node_modules/ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Opening SFTP...');

  conn.sftp((err, sftp) => {
    if (err) throw err;

    // Create error_pages dir via sftp
    sftp.mkdir('/var/www/Examshield/nginx/error_pages', () => {
      // Ignore if dir already exists
      const files = [
        { local: path.resolve(__dirname, '../nginx/nginx.conf'), remote: '/var/www/Examshield/nginx/nginx.conf' },
        { local: path.resolve(__dirname, '../docker-compose.prod.yml'), remote: '/var/www/Examshield/docker-compose.prod.yml' },
        { local: path.resolve(__dirname, '../backend/server.js'), remote: '/var/www/Examshield/backend/server.js' },
        { local: path.resolve(__dirname, '../nginx/error_pages/50x.html'), remote: '/var/www/Examshield/nginx/error_pages/50x.html' },
        { local: path.resolve(__dirname, '../nginx/error_pages/404.html'), remote: '/var/www/Examshield/nginx/error_pages/404.html' },
        { local: path.resolve(__dirname, '../frontend_build_errors.tar.gz'), remote: '/var/www/Examshield/frontend_build_errors.tar.gz' }
      ];

      function uploadFile(i) {
        if (i >= files.length) {
          console.log('All files transferred successfully. Running commands on VPS...');
          sftp.end();
          applyOnVPS();
          return;
        }
        const item = files[i];
        console.log(`[${i+1}/${files.length}] Uploading ${path.basename(item.local)}...`);
        sftp.fastPut(item.local, item.remote, (uploadErr) => {
          if (uploadErr) {
            console.error(`Failed uploading ${item.local}:`, uploadErr);
            throw uploadErr;
          }
          console.log(`  -> ${path.basename(item.local)} done`);
          uploadFile(i + 1);
        });
      }

      uploadFile(0);
    });
  });

  function applyOnVPS() {
    const cmd = [
      'cd /var/www/Examshield',
      'mkdir -p frontend/build nginx/error_pages',
      // Extract build
      'tar -xzf frontend_build_errors.tar.gz -C frontend/build/',
      // Copy to frontend container
      'docker cp frontend/build/. examshield-frontend-1:/usr/share/nginx/html/',
      // Copy error pages to frontend container
      'docker cp nginx/error_pages/. examshield-frontend-1:/usr/share/nginx/html/error_pages/',
      // Commit frontend image
      'docker commit examshield-frontend-1 examshield-frontend:latest',
      // Recreate load_balancer with new error_pages mount and reload nginx
      'docker compose -f docker-compose.prod.yml up -d load_balancer',
      'docker exec examshield_load_balancer nginx -t',
      'docker exec examshield_load_balancer nginx -s reload',
      'echo "=== Verification ==="',
      'curl -s https://exam.nexifyforge.in/ | grep -o "main\\.[a-z0-9]*\\.js"',
      'echo "=== Testing custom 404 page ==="',
      'curl -s -I https://exam.nexifyforge.in/error_pages/404.html | head -n 5',
      'echo "=== Testing custom 50x page ==="',
      'curl -s -I https://exam.nexifyforge.in/error_pages/50x.html | head -n 5'
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.pipe(process.stdout);
      stream.stderr.pipe(process.stderr);
      stream.on('close', () => {
        console.log('\nAll VPS updates applied and verified successfully!');
        conn.end();
      });
    });
  }
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});
