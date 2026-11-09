const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('curl -s -k https://127.0.0.1/api/health -H "Host: examshield.co.in"', (err, stream) => {
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
