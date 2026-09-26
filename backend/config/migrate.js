// config/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL_UNPOOLED) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
}

const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!migrationUrl) throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is required to run migrations.');

const parsedMigrationUrl = new URL(migrationUrl);
parsedMigrationUrl.searchParams.set('sslmode', 'verify-full');
const pool = new Pool({
  connectionString: parsedMigrationUrl.toString(),
  ssl: { rejectUnauthorized: true },
  max: 1,
  connectionTimeoutMillis: Number.parseInt(process.env.PG_CONNECTION_TIMEOUT_MS || '15000', 10),
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running PostgreSQL schema migration...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(schemaSQL);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    console.log('Schema migration completed successfully.');

    if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 12);
      await client.query(`
        INSERT INTO super_admins (name, email, password)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
      `, ['Super Admin', process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase(), hashedPassword]);
      console.log('Configured super admin seed verified.');
    } else {
      console.log('Super admin seed skipped; configure both SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to seed one.');
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
