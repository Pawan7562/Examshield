const { Pool } = require('../backend/node_modules/pg');

const NEW_NEON_URL = 'postgresql://neondb_owner:npg_k1oy6KOnUBxW@ep-withered-fog-aoapan2z.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const pool = new Pool({ connectionString: NEW_NEON_URL });
  try {
    console.log('Connecting to AP-Southeast Neon database...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('Extensions uuid-ossp and pgcrypto created successfully!');

    const res = await pool.query('SELECT extname FROM pg_extension;');
    console.log('Installed extensions:', res.rows.map(r => r.extname));
  } catch (err) {
    console.error('Error enabling extensions:', err);
  } finally {
    await pool.end();
  }
}

main();
