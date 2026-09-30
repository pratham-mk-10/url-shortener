// ============================================================
// SOCKET.IO SETUP
// Handles real-time, authenticated connections from dashboard clients
// ============================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Module-level variable — holds the single io instance for the whole app
// so other files (like the click controller, built next stage) can emit events
let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      // Socket.io does its OWN CORS check, separate from Express's cors middleware —
      // the WebSocket handshake is a different kind of request than a normal HTTP call
      origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ============================================================
  // MIDDLEWARE (yes, Socket.io has middleware too!)
  // Runs BEFORE a connection is accepted — this is where we authenticate
  // ============================================================
  io.use((socket, next) => {
    // Client sends their access token when connecting (we'll wire this up
    // on the frontend later): io(url, { auth: { token: accessToken } })
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId; // attach userId to this socket for later use
      next(); // allow the connection
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ============================================================
  // CONNECTION HANDLER — runs once per client that successfully connects
  // ============================================================
  io.on('connection', (socket) => {
    console.log(`✓ Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Put this socket into a "room" named after the user's ID
    // Rooms are how Socket.io groups connections so we can target messages
    // e.g. io.to('user:123').emit(...) reaches ONLY sockets in that room
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`✗ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Lets other files (e.g. the click controller) access the io instance
// to emit events, without needing to pass it around as a function argument everywhere
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized — call initializeSocket first');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
