// config/redis.js - Redis & Socket.IO Clustering Adapter for 50k - 100k Users
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

let pubClient = null;
let subClient = null;
let redisClient = null;
let isRedisConnected = false;

/**
 * Initialize Redis adapter on Socket.IO for horizontal load balancing
 */
const initRedisAdapter = async (io) => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('ℹ️ REDIS_URL not configured. Running Socket.IO in standalone in-memory mode.');
    return false;
  }

  try {
    const { createClient } = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');

    pubClient = createClient({ url: redisUrl });
    subClient = pubClient.duplicate();
    redisClient = pubClient.duplicate();

    pubClient.on('error', (err) => logger.warn(`Redis Pub Error: ${err.message}`));
    subClient.on('error', (err) => logger.warn(`Redis Sub Error: ${err.message}`));
    redisClient.on('error', (err) => logger.warn(`Redis Client Error: ${err.message}`));

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
      redisClient.connect()
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    isRedisConnected = true;
    logger.info('✅ Connected to Redis: Socket.IO multi-instance clustering & load balancing active!');
    return true;
  } catch (error) {
    logger.warn(`⚠️ Failed to connect to Redis (${error.message}). Falling back to in-memory mode.`);
    isRedisConnected = false;
    return false;
  }
};

/**
 * Get standard Redis key-value client for caching
 */
const getRedisClient = () => {
  return isRedisConnected ? redisClient : null;
};

module.exports = { initRedisAdapter, getRedisClient, isRedisConnected: () => isRedisConnected };
