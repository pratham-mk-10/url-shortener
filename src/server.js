// ============================================================
// WHAT IS THIS FILE?
// This is the entry point. It creates an Express server that:
// 1. Listens for HTTP requests from the browser/clients
// 2. Processes them (route them to the right handler)
// 3. Sends back responses
// ============================================================

// Step 1: Import libraries
// "require" = "bring in this code from another file/package"
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Load environment variables from .env

const http = require('http');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initializeSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const { redirectUrl } = require('./controllers/urlController');

// Step 2: Create an Express app
// Think of "app" as the server itself. It's an object that handles all requests
const app = express();

// Trust first proxy (Render load balancer) to ensure correct req.ip and secure HTTPS cookie evaluation
app.set('trust proxy', 1);

// Connect to MongoDB and Redis
connectDB();
connectRedis();

// ============================================================
// WHY WRAP app IN http.createServer()?
// app.listen() normally does this for us invisibly. We do it explicitly here
// because Socket.io needs to attach itself to the actual HTTP server (to
// intercept the WebSocket upgrade handshake) — it can't attach to the Express
// app object directly, since that's just a request-handling function.
// ============================================================
const httpServer = http.createServer(app);
initializeSocket(httpServer);

// ============================================================
// MIDDLEWARE — What is this?
// Middleware = code that runs on EVERY request, before it reaches its final handler
// Think of it like a security checkpoint at an airport:
// - Baggage scanner (middleware) checks every bag
// - THEN you go to your gate (the actual route handler)
//
// Order matters! Middleware runs top-to-bottom.
// ============================================================

// Middleware 1: CORS (Cross-Origin Resource Sharing)
// WHY? React runs on localhost:3000, Express on localhost:5000
// Browsers block requests between different ports by default
// CORS tells the browser: "Hey, it's ok for localhost:3000 to talk to localhost:5000"
app.use(cors({
  origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies/auth tokens to be sent
}));

// Middleware 2: JSON parser
// WHY? When React sends data to the server, it sends it as JSON
// This middleware automatically converts that JSON into a JavaScript object
// Example: {"longUrl": "https://example.com"} → JavaScript object we can use
app.use(express.json());

// Middleware 3: URL-encoded parser
// WHY? Sometimes data comes in a different format (form submissions)
// This handles that format
app.use(express.urlencoded({ extended: true }));

// Middleware 4: Cookie parser
// WHY? Our refresh token is sent as an httpOnly cookie. Express doesn't parse
// cookies by default — this middleware reads the Cookie header and populates req.cookies
app.use(cookieParser());

// ============================================================
// ROUTES — How do we handle requests?
// A route = "when someone visits this path, do this"
// ============================================================

// Example: Basic health check route
// When someone visits http://localhost:5000/health, they get back {status: 'ok'}
// This is useful to check if the server is running
app.get('/health', (req, res) => {
  // req = the REQUEST from the client (contains what they asked for)
  // res = the RESPONSE we send back
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mount auth routes — every route in authRoutes.js is now prefixed with /api/auth
// e.g. router.post('/login', ...) becomes accessible at POST /api/auth/login
app.use('/api/auth', authRoutes);

// Mount URL management routes (create, list, analytics) under /api/urls
app.use('/api/urls', urlRoutes);

// The actual redirect route — a bare short code with NO /api prefix, since
// that's the whole point of a "short" URL. Placed AFTER the specific routes
// above (so it doesn't swallow requests meant for them) and BEFORE the 404
// handler below (so it still gets a chance to match).
app.get('/:shortCode', redirectUrl);

// ============================================================
// ERROR HANDLING MIDDLEWARE
// If a request doesn't match any route, we need to tell the client
// This middleware catches requests that don't match anything above
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// ============================================================
// START THE SERVER
// ============================================================

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Note: httpServer.listen(), NOT app.listen() — app is now just middleware
// attached to httpServer, which is what actually accepts connections
httpServer.listen(PORT, HOST, () => {
  console.log(`✓ Server running on http://${HOST}:${PORT}`);
  console.log(`✓ CORS enabled for ${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Export the app (we'll need this for Socket.io and testing later)
module.exports = app;
