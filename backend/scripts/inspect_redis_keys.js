const { createClient } = require('redis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('Connecting to Redis:', redisUrl);
  const client = createClient({ url: redisUrl });
  try {
    await client.connect();
    const keys = await client.keys('*');
    console.log(`Total Redis keys: ${keys.length}`);
    for (const k of keys) {
      const type = await client.type(k);
      console.log(`  Key: "${k}" (Type: ${type})`);
    }
    await client.disconnect();
  } catch (e) {
    console.log('Redis connection notice:', e.message);
  }
}

checkRedis();
