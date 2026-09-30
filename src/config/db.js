// ============================================================
// MONGODB CONNECTION
// This file handles connecting our Express app to MongoDB
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() returns a Promise, so we await it
    // If MongoDB isn't running or the URI is wrong, this throws an error
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    // Exit the process — no point running a server that can't reach its database
    process.exit(1);
  }
};

module.exports = connectDB;
