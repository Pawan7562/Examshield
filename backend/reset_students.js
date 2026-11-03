const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setPassword() {
  const hash = await bcrypt.hash('Pawan@1234', 10);
  const res = await pool.query('UPDATE students SET password = $1', [hash]);
  console.log(`✅ Set password to 'Pawan@1234' for all ${res.rowCount} student accounts!`);
  await pool.end();
}

setPassword().catch(console.error);
