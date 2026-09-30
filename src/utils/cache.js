// ============================================================
// CACHE UTILITY — wraps Redis get/set for short code lookups
//
// We cache a small JSON object, not just the raw longUrl string.
// WHY: on a redirect, we also need the Url document's Mongo _id (to log
// a Click referencing it) and the owner's userId (to know which Socket.io
// room to emit to). Caching only the longUrl would force a second Mongo
// lookup on every cache hit just to fetch those two extra fields — that
// defeats half the point of caching the hot path.
// ============================================================

const { redisClient } = require('../config/redis');

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Returns { longUrl, urlId, userId } or null on a cache miss
const getCachedUrl = async (shortCode) => {
  const raw = await redisClient.get(`url:${shortCode}`);
  return raw ? JSON.parse(raw) : null;
};

// urlData = { longUrl, urlId, userId }
const setCachedUrl = async (shortCode, urlData) => {
  await redisClient.set(`url:${shortCode}`, JSON.stringify(urlData), {
    EX: CACHE_TTL_SECONDS,
  });
};

const deleteCachedUrl = async (shortCode) => {
  await redisClient.del(`url:${shortCode}`);
};

module.exports = { getCachedUrl, setCachedUrl, deleteCachedUrl };
