const { Client } = require('../backend/node_modules/ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection established. Uploading backup & restore scripts...');

  conn.sftp((err, sftp) => {
    if (err) throw err;

    const files = [
      { local: path.resolve(__dirname, '../scripts/backup_database.sh'), remote: '/var/www/Examshield/scripts/backup_database.sh' },
      { local: path.resolve(__dirname, '../scripts/restore_database.sh'), remote: '/var/www/Examshield/scripts/restore_database.sh' },
      { local: path.resolve(__dirname, '../backend/scripts/backup_manager.js'), remote: '/var/www/Examshield/backend/scripts/backup_manager.js' },
      { local: path.resolve(__dirname, '../backend/package.json'), remote: '/var/www/Examshield/backend/package.json' }
    ];

    function uploadFile(i) {
      if (i >= files.length) {
        console.log('Scripts uploaded. Making executable and testing...');
        sftp.end();
        runSetupAndTests();
        return;
      }
      const item = files[i];
      console.log(`Uploading ${path.basename(item.local)}...`);
      sftp.fastPut(item.local, item.remote, (uploadErr) => {
        if (uploadErr) throw uploadErr;
        uploadFile(i + 1);
      });
    }

    uploadFile(0);
  });

  function runSetupAndTests() {
    const cmd = [
      'cd /var/www/Examshield',
      // Ensure permissions
      'chmod +x scripts/backup_database.sh scripts/restore_database.sh',
      'mkdir -p /var/backups/examshield /var/log/examshield',
      'chmod 700 /var/backups/examshield',
      // Configure root crontab cleanly without duplicating entries
      '(crontab -l 2>/dev/null | grep -v "backup_database.sh" ; echo "0 2,14 * * * /var/www/Examshield/scripts/backup_database.sh >> /var/log/examshield/cron.log 2>&1") | crontab -',
      'echo "=== ACTIVE CRONTAB ==="',
      'crontab -l',
      'echo "\n=== RUNNING LIVE BACKUP TEST ==="',
      '/var/www/Examshield/scripts/backup_database.sh',
      'echo "\n=== BACKUP DIRECTORY CONTENTS ==="',
      'ls -lh /var/backups/examshield/',
      'echo "\n=== RUNNING RESTORE SCRIPT --list ==="',
      '/var/www/Examshield/scripts/restore_database.sh --list'
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.pipe(process.stdout);
      stream.stderr.pipe(process.stderr);
      stream.on('close', () => {
        console.log('\nBackup system setup and test completed successfully!');
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

