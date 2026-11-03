const { execRemote } = require('./vps_exec');

const NEON_UNPOOLED = 'postgresql://neondb_owner:npg_k1oy6KOnUBxW@ep-withered-fog-aoapan2z.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function testDump() {
  console.log('Testing pg_dump on VPS from Neon...');
  const cmd = `docker run --rm postgres:16-alpine pg_dump '${NEON_UNPOOLED}' --schema-only | head -n 30`;
  const res = await execRemote(cmd);
  console.log('Code:', res.code);
  console.log('Output:\n', res.stdout);
  if (res.stderr) console.error('Stderr:\n', res.stderr);
}

testDump();
