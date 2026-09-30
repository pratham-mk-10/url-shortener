// ============================================================
// AUTH MIDDLEWARE
// Protects routes that require a logged-in user
// Runs BEFORE the route handler, blocks the request if token is invalid
// ============================================================

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Access tokens are sent in the Authorization header, format: "Bearer <token>"
  // WHY the header, not a cookie? Access tokens are short-lived and used per-request;
  // convention is to send them explicitly so frontend controls exactly when they're attached
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // "Bearer abc123token" → split by space → take the token part
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify checks:
    // 1. Was this token signed with OUR secret? (not forged)
    // 2. Has it expired?
    // If either fails, it throws — caught below
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to the request object
    // Now every route handler after this middleware can access req.userId
    req.userId = decoded.userId;

    next(); // pass control to the next middleware/route handler
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = protect;
