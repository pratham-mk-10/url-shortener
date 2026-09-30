// ============================================================
// AUTH CONTROLLER
// Contains the actual logic for register, login, and refresh
// (Routes just point to these functions — keeps routes file clean)
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');

// ============================================================
// REGISTER — create a new user account
// ============================================================
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user — password gets hashed automatically by the pre-save hook
    const user = await User.create({ email, password });

    // Immediately log them in after registering
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Send refresh token as an httpOnly cookie
    // httpOnly = JavaScript in the browser CANNOT read this cookie (protects against XSS attacks stealing it)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only send over HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // cross-site cookies in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Access token goes in the response body — frontend stores it in memory (not localStorage)
    res.status(201).json({
      accessToken,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// ============================================================
// LOGIN — authenticate existing user
// ============================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Deliberately vague error — don't reveal whether email exists or not
      // (prevents attackers from enumerating valid emails)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare plain password against stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// ============================================================
// REFRESH — exchange a valid refresh token for a new access token
// This is what runs silently in the background when the access token expires,
// so the user never has to log in again (until the refresh token itself expires)
// ============================================================
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Verify the refresh token's signature and expiry
    // jwt.verify THROWS if the token is invalid/expired — caught below
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Issue a brand new access token
    const newAccessToken = generateAccessToken(decoded.userId);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

// ============================================================
// ME — return the currently logged-in user's own profile
// Used by the frontend on page load/refresh: it has a valid access token
// but no memory of WHO that belongs to (React state resets on refresh)
// ============================================================
const me = async (req, res) => {
  // req.userId was attached by the `protect` middleware after verifying the JWT
  const user = await User.findById(req.userId).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: { id: user._id, email: user.email } });
};

// ============================================================
// LOGOUT — clear the refresh token cookie
// ============================================================
const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, refresh, logout, me };
