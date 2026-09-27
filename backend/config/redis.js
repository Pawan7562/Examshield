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

    const clientConfig = {
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= 2) {
            return false; // Stop reconnecting after 2 failed attempts
          }
          return 500;
        },
        connectTimeout: 5000,
      }
    };

    pubClient = createClient(clientConfig);
    subClient = pubClient.duplicate();
    redisClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      if (err.message && !err.message.includes('The client is closed')) {
        logger.warn(`Redis Pub Error: ${err.message}`);
      }
    });
    subClient.on('error', (err) => {
      if (err.message && !err.message.includes('The client is closed')) {
        logger.warn(`Redis Sub Error: ${err.message}`);
      }
    });
    redisClient.on('error', (err) => {
      if (err.message && !err.message.includes('The client is closed')) {
        logger.warn(`Redis Client Error: ${err.message}`);
      }
    });

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
    try { await pubClient?.disconnect(); } catch (_) {}
    try { await subClient?.disconnect(); } catch (_) {}
    try { await redisClient?.disconnect(); } catch (_) {}
    pubClient = null;
    subClient = null;
    redisClient = null;
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
