// config/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running database migrations...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schema migrations completed successfully');

    // Seed super admin
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123', 12);
    
    await client.query(`
      INSERT INTO super_admins (name, email, password)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, ['Super Admin', process.env.SUPER_ADMIN_EMAIL || 'admin@examshield.com', hashedPassword]);
    
    console.log('✅ Super admin seeded');
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
