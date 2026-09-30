// ============================================================
// AUTH ROUTES
// Maps URLs to controller functions — no logic lives here
// ============================================================

const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, me } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, me);

module.exports = router;
