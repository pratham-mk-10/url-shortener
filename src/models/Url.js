// ============================================================
// URL MODEL
// Stores the mapping: short code → long URL, plus ownership info
// ============================================================

const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    longUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true, // no two URLs can share the same short code
      index: true,  // explicit index — see explanation below
    },
    // Reference to the User who created this short URL
    // mongoose.Schema.Types.ObjectId = MongoDB's unique ID type
    // ref: 'User' tells Mongoose "this ID points to a document in the User collection"
    // This is what lets us later do .populate('userId') to fetch the actual user data
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalized click count — see explanation below
    clickCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Url', urlSchema);
