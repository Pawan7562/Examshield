// config/database.js
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
const winston = require('winston');

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL_UNPOOLED) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
}

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured for the production backend.');
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

const createPoolConfig = (connectionString) => {
  const parsedUrl = new URL(connectionString);
  parsedUrl.searchParams.set('sslmode', 'verify-full');
  return { connectionString: parsedUrl.toString(), ssl: { rejectUnauthorized: true } };
};

const pool = new Pool({
  ...(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'CollegeExam',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
      }),
  min: 2, // Pre-warmed persistent connections to eliminate cold TLS handshake latency
  max: Number.parseInt(process.env.PG_POOL_MAX || '30', 10),
  idleTimeoutMillis: 60000, // Keep warm connections alive for 60 seconds
  connectionTimeoutMillis: Number.parseInt(process.env.PG_CONNECTION_TIMEOUT_MS || '10000', 10),
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
});

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database (Timezone: Asia/Kolkata)');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

/**
 * Execute a single query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      logger.info('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    logger.error('Query error', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = () => pool.connect();

/**
 * Execute a transaction
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, transaction, pool };
