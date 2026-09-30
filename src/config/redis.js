// ============================================================
// REDIS CONNECTION
// One client, shared across the app — used for both caching
// (short code -> long URL) and rate limiting
// ============================================================

const { createClient } = require('redis');

const redisClient = createClient(
  process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
        },
      }
);

// Redis client emits events we should react to — unlike Mongoose,
// connection issues here don't crash the app by default, so we log them
redisClient.on('error', (err) => {
  console.error('✗ Redis error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✓ Redis connected');
});

// Redis v4+ client requires an explicit .connect() call — it doesn't
// auto-connect like older versions did
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('✗ Redis connection failed — cache-aside will fall back to MongoDB:', err.message);
  }
};

module.exports = { redisClient, connectRedis };
