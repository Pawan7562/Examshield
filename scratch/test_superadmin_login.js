const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const curlCmd = `
    curl -s -k -X POST https://127.0.0.1/api/auth/super-admin/login \
      -H "Host: examshield.co.in" \
      -H "Content-Type: application/json" \
      -d '{"email":"pawankumaryadav75628697@gmail.com","password":"Qwerty@9934"}'
  `;

  conn.exec(curlCmd, (err, stream) => {
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
