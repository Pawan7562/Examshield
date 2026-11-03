require('dotenv').config();
const { Pool } = require('pg');

console.log('--- Testing Neon DB Connection ---');
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not set in environment or .env file!');
  process.exit(1);
}

const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
console.log('Connecting to:', maskedUrl);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('✅ CONNECTED SUCCESSFULLY to Neon PostgreSQL!');
    
    const info = await client.query('SELECT version(), current_database(), current_user, now() AT TIME ZONE \'Asia/Kolkata\' as ist_time;');
    console.log('\n--- Server Info ---');
    console.log('Database Name :', info.rows[0].current_database);
    console.log('Database User :', info.rows[0].current_user);
    console.log('PostgreSQL Ver:', info.rows[0].version.split(',')[0]);
    console.log('Current Time  :', info.rows[0].ist_time);

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n--- Existing Tables in Public Schema (${tables.rows.length}) ---`);
    if (tables.rows.length === 0) {
      console.log('No tables found in public schema yet.');
    } else {
      tables.rows.forEach(r => console.log('  • ' + r.table_name));
    }

    client.release();
    await pool.end();
    console.log('\n✅ All checks passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED TO CONNECT TO NEON:');
    console.error(error.message);
    if (error.code) console.error('Error Code:', error.code);
    await pool.end();
    process.exit(1);
  }
}

run();
