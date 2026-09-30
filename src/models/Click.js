// ============================================================
// CLICK MODEL
// One document per click event — this is our raw analytics data
// ============================================================

const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  // Which URL got clicked — reference, not embed (see Url.js for why)
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    index: true, // we'll constantly query "all clicks for this urlId" — index makes that fast
  },
  // When the click happened — needed for "clicks over time" charts
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Basic device/browser info, parsed from the request's User-Agent header
  device: {
    type: String, // e.g. 'mobile', 'desktop', 'tablet'
  },
  browser: {
    type: String, // e.g. 'Chrome', 'Firefox', 'Safari'
  },
  // Where the click came from (e.g. which site linked to the short URL)
  referrer: {
    type: String,
    default: 'direct',
  },
});

module.exports = mongoose.model('Click', clickSchema);
