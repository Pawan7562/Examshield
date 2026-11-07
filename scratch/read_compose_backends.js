const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('sed -n "55,100p" /var/www/Examshield/docker-compose.prod.yml', (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stderr);
    stream.pipe(process.stdout);
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});

