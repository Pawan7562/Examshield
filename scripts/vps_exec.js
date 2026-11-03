const { Client } = require('../backend/node_modules/ssh2');

const VPS_HOST = process.env.VPS_HOST || '147.93.19.252';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PASS = process.env.VPS_PASS || 'F&j9-bc,dS#f#A1@';

function execRemote(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let stdout = '';
        let stderr = '';
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data.toString();
        }).stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: VPS_HOST,
      port: 22,
      username: VPS_USER,
      password: VPS_PASS,
      readyTimeout: 20000,
    });
  });
}

module.exports = { execRemote };

if (require.main === module) {
  const cmd = process.argv.slice(2).join(' ') || 'uname -a && free -h && docker ps';
  console.log(`Connecting to ${VPS_USER}@${VPS_HOST}...`);
  console.log(`Executing: ${cmd}\n`);
  execRemote(cmd)
    .then(({ code, stdout, stderr }) => {
      if (stdout) console.log(`--- STDOUT ---\n${stdout}`);
      if (stderr) console.error(`--- STDERR ---\n${stderr}`);
      console.log(`\nExited with code: ${code}`);
      process.exit(code);
    })
    .catch((err) => {
      console.error('SSH Connection Error:', err.message);
      process.exit(1);
    });
}
