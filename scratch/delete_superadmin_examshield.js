const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    DELETE FROM super_admins WHERE email = 'superadmin@examshield.com';
    SELECT id, name, email, is_active, created_at FROM super_admins;
  `;
  conn.exec(`docker exec -i examshield_postgres psql -U examshield_admin -d examshield_prod -c "${sql}"`, (err, stream) => {
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
