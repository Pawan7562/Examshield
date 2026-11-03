require('dotenv').config();
const { Client } = require('pg');

async function testConnection(url, label) {
  console.log(`Testing ${label}...`);
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`Connected to ${label}!`);
    const res = await client.query('SELECT current_database(), current_user, count(*) from students');
    console.log(`${label} query success:`, res.rows[0]);
    await client.end();
  } catch (err) {
    console.error(`${label} failed:`, err.message);
  }
}

async function run() {
  await testConnection(process.env.DATABASE_URL, 'POOLED');
  await testConnection(process.env.DATABASE_URL_UNPOOLED, 'UNPOOLED');
}

run();
