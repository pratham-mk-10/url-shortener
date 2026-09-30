// ============================================================
// RATE LIMITER MIDDLEWARE
// Prevents abuse of the shorten-URL endpoint (e.g. a bot spamming
// thousands of URL creations per second)
// ============================================================

const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redisClient } = require('../config/redis');

// This library handles the counting logic FOR us using Redis atomic
// operations under the hood (INCR + EXPIRE) — we just configure the rule
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  // rate-limiter-flexible defaults to assuming an ioredis client. We're using
  // the official `redis` package (node-redis) instead, which has a different
  // method API (e.g. camelCase commands, no `defineCommand`) — this flag tells
  // the library to use the node-redis-compatible code path instead of silently
  // calling methods that don't exist on our client.
  useRedisPackage: true,
  keyPrefix: 'rl_shorten', // namespacing again, same idea as the cache keys
  points: 10,     // allow 10 requests...
  duration: 60,   // ...per 60 seconds, per key (per IP, in our case)
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    // Use the client's IP address as the key — each IP gets its own 10-per-60s budget
    // req.ip requires Express's trust proxy setting to be accurate behind a reverse proxy (e.g. Nginx) — fine for now
    await rateLimiter.consume(req.ip);
    next(); // under the limit — let the request through
  } catch (rejResOrError) {
    // consume() throws in TWO different cases, and treating them the same
    // hides real bugs (this bit us during development — see Interview_Prep.md):
    // 1. A genuine Error (Redis down, misconfiguration) — this is NOT a rate limit hit
    // 2. A RateLimiterRes rejection — this IS a real "limit exceeded" signal
    if (rejResOrError instanceof Error) {
      console.error('Rate limiter error (not a real rate-limit hit):', rejResOrError.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }
};

module.exports = rateLimiterMiddleware;
