// ============================================================
// USER MODEL (MongoDB Schema via Mongoose)
// Defines what a "user" document looks like in the database
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // MongoDB creates an index to enforce no duplicate emails
      lowercase: true, // Always store emails in lowercase (avoids "A@x.com" vs "a@x.com" duplicates)
      trim: true, // Removes accidental whitespace
    },
    password: {
      type: String,
      required: true,
      // NOTE: we never store the plain password — see pre-save hook below
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  }
);

// ============================================================
// PRE-SAVE HOOK — runs automatically BEFORE a user document is saved
// WHY? We never want to store a plain-text password in the database.
// If our database ever leaks, plain passwords = every user's account
// on THIS AND OTHER SITES (people reuse passwords) is compromised.
//
// NOTE: Mongoose 9 removed the old `next()` callback style for hooks.
// Pre-hooks are now plain async functions — just return (or throw to
// reject the save). No `next` argument is passed in anymore.
// ============================================================
userSchema.pre('save', async function () {
  // Only hash the password if it's new or being changed
  // (avoids re-hashing an already-hashed password when updating other fields)
  if (!this.isModified('password')) return;

  // bcrypt.hash(password, saltRounds)
  // saltRounds = how many times to run the hashing algorithm (cost factor)
  // Higher = slower to compute = harder to brute-force, but slower for us too
  // 10 is the standard industry default
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ============================================================
// INSTANCE METHOD — a custom function available on every user document
// Used during login to check "does this plain password match the hashed one?"
// ============================================================
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare hashes the candidate password with the SAME salt
  // stored inside this.password, and checks if they match
  // We can never "un-hash" a password — we can only re-hash and compare
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
