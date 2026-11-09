const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeTest = `
    docker exec examshield-backend-1 node -e "
      const bcrypt = require('bcryptjs');
      const { pool } = require('./config/database');
      async function check() {
        const res = await pool.query('SELECT email, password FROM super_admins');
        for (const row of res.rows) {
          const matchDefault = await bcrypt.compare('SuperAdmin@123', row.password);
          const matchAdmin123 = await bcrypt.compare('Admin@123', row.password);
          console.log(row.email, 'SuperAdmin@123 match:', matchDefault, '| Admin@123 match:', matchAdmin123);
        }
        process.exit(0);
      }
      check();
    "
  `;

  conn.exec(nodeTest, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});
