// ============================================================
// URL CONTROLLER
// The core of the app: create short URLs, redirect, list, and analyze
// ============================================================

const { nanoid } = require('nanoid');
const { UAParser } = require('ua-parser-js');
const Url = require('../models/Url');
const Click = require('../models/Click');
const { getCachedUrl, setCachedUrl } = require('../utils/cache');
const { getIO } = require('../config/socket');

const SHORT_CODE_LENGTH = 7;

// ============================================================
// CREATE — POST /api/urls (protected)
// ============================================================
const createShortUrl = async (req, res) => {
  try {
    const { longUrl } = req.body;

    let url;
    // Retry loop: nanoid collisions are astronomically rare at length 7,
    // but "unique: true" on the schema means a collision throws a MongoDB
    // duplicate-key error (code 11000) rather than silently overwriting data.
    // We catch that ONE specific error and retry with a fresh code.
    for (let attempt = 0; attempt < 5; attempt++) {
      const shortCode = nanoid(SHORT_CODE_LENGTH);
      try {
        url = await Url.create({ longUrl, shortCode, userId: req.userId });
        break;
      } catch (error) {
        if (error.code === 11000) continue; // duplicate shortCode — try again
        throw error; // any other error is a real problem, don't swallow it
      }
    }

    if (!url) {
      return res.status(500).json({ error: 'Could not generate a unique short code, please retry' });
    }

    // Write-through here (not cache-aside): we already have every field we'd
    // need, so there's no reason to wait for the first redirect to populate it
    await setCachedUrl(url.shortCode, {
      longUrl: url.longUrl,
      urlId: url._id.toString(),
      userId: req.userId,
    });

    res.status(201).json({
      shortCode: url.shortCode,
      shortUrl: `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/${url.shortCode}`,
      longUrl: url.longUrl,
      clickCount: url.clickCount, // keep shape consistent with getUserUrls's response
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create short URL', details: error.message });
  }
};

// ============================================================
// REDIRECT — GET /:shortCode (public, the hottest path in the app)
// ============================================================
const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Cache-aside: try Redis first
    let urlData = await getCachedUrl(shortCode);

    if (!urlData) {
      // Cache miss — fall back to MongoDB
      const url = await Url.findOne({ shortCode });
      if (!url) {
        return res.status(404).json({ error: 'Short URL not found' });
      }
      urlData = {
        longUrl: url.longUrl,
        urlId: url._id.toString(),
        userId: url.userId.toString(),
      };
      await setCachedUrl(shortCode, urlData); // backfill for next time
    }

    // Fire-and-forget: the user doesn't wait for analytics logging.
    // Deliberately NOT awaited — see logClickAsync's own try/catch for why
    // that's safe here (it can never throw back into this function).
    logClickAsync(shortCode, urlData, req);

    res.redirect(302, urlData.longUrl);
  } catch (error) {
    res.status(500).json({ error: 'Redirect failed', details: error.message });
  }
};

// ============================================================
// Helper: logs a click, increments the counter, emits a socket event
// Runs AFTER the redirect response has already been sent — never
// blocks the user. Wrapped in try/catch because nothing calls this
// with `await`, so an uncaught rejection here would become an
// unhandled promise rejection and could crash the process.
// ============================================================
const logClickAsync = async (shortCode, urlData, req) => {
  try {
    const parser = new UAParser(req.headers['user-agent']);
    const device = parser.getDevice().type || 'desktop'; // ua-parser-js leaves type undefined for desktop UAs
    const browser = parser.getBrowser().name || 'unknown';
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'direct';

    const click = await Click.create({
      urlId: urlData.urlId,
      device,
      browser,
      referrer,
    });

    // Atomic increment — avoids the read-then-write race condition
    // discussed when we designed the denormalized clickCount field
    await Url.updateOne({ shortCode }, { $inc: { clickCount: 1 } });

    // Push the event ONLY to the owning user's room
    getIO().to(`user:${urlData.userId}`).emit('urlClicked', {
      shortCode,
      device,
      browser,
      referrer,
      timestamp: click.timestamp,
    });
  } catch (error) {
    console.error('Failed to log click:', error.message);
  }
};

// ============================================================
// LIST — GET /api/urls (protected) — all URLs owned by the logged-in user
// ============================================================
const getUserUrls = async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch URLs', details: error.message });
  }
};

// ============================================================
// ANALYTICS — GET /api/urls/:shortCode/analytics (protected, ownership-checked)
// ============================================================
const getAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    // Ownership check — without this, any logged-in user could view
    // any OTHER user's analytics just by guessing/knowing their shortCode
    if (url.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to view this analytics' });
    }

    // Aggregation pipeline: MongoDB's version of SQL's GROUP BY.
    // Each stage feeds its output into the next stage, like a Unix pipe.
    const deviceBreakdown = await Click.aggregate([
      { $match: { urlId: url._id } },              // like WHERE urlId = ...
      { $group: { _id: '$device', count: { $sum: 1 } } }, // like GROUP BY device
    ]);

    const clicksOverTime = await Click.aggregate([
      { $match: { urlId: url._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, // bucket by day
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // chronological order, for a line chart
    ]);

    res.json({
      shortCode,
      longUrl: url.longUrl,
      totalClicks: url.clickCount,
      deviceBreakdown,
      clicksOverTime,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
};

module.exports = { createShortUrl, redirectUrl, getUserUrls, getAnalytics };
