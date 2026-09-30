// ============================================================
// URL ROUTES
// Note the middleware stacking on POST / — this is "middleware chaining":
// each function runs in order, and only continues to the next if it calls next()
// 1. protect              -> must be logged in
// 2. rateLimiterMiddleware -> must not have exceeded 10 req/60s
// 3. validateLongUrl + handleValidationErrors -> body must contain a real URL
// 4. createShortUrl       -> the actual logic, only reached if all above pass
// ============================================================

const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const rateLimiterMiddleware = require('../middleware/rateLimiter');
const { validateLongUrl, handleValidationErrors } = require('../middleware/validators');
const { createShortUrl, getUserUrls, getAnalytics } = require('../controllers/urlController');

router.post('/', protect, rateLimiterMiddleware, validateLongUrl, handleValidationErrors, createShortUrl);
router.get('/', protect, getUserUrls);
router.get('/:shortCode/analytics', protect, getAnalytics);

module.exports = router;
