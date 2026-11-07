const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Starting 2,050 Virtual Student Simulation on VPS...');
  const cmd = 'NODE_PATH=/var/www/Examshield/backend/node_modules node /var/www/Examshield/scripts/simulate_2050_students.js';
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', (code) => {
      console.log(`\nSimulation finished with exit code: ${code}`);
      conn.end();
    });
  });
}).connect({ host: '147.93.19.252', port: 22, username: 'root', password: 'a?2n,rVia15/Qqih' });

