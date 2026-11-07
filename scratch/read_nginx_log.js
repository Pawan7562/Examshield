const { execRemote } = require('../scripts/vps_exec');
process.env.VPS_PASS = 'a?2n,rVia15/Qqih';

async function run() {
  const res = await execRemote('docker exec examshield_load_balancer tail -n 50 /var/log/nginx/error.log');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
}

run().catch(console.error);

