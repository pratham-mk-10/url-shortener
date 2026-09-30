// ============================================================
// TOKEN GENERATION UTILITY
// Creates the access token (short-lived) and refresh token (long-lived)
// ============================================================

const jwt = require('jsonwebtoken');

// ACCESS TOKEN: sent with every API request, proves "I'm logged in"
// Short expiry (15 min) — if stolen, attacker only has a small window
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, // payload — data embedded in the token (kept minimal on purpose)
    process.env.JWT_SECRET, // secret key used to sign — if this leaks, anyone can forge tokens
    { expiresIn: '15m' }
  );
};

// REFRESH TOKEN: only used to get a new access token when it expires
// Longer expiry (7 days) — stored more carefully (httpOnly cookie, not localStorage)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET, // DIFFERENT secret than access token
    { expiresIn: '7d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
