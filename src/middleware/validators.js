// ============================================================
// VALIDATION MIDDLEWARE
// express-validator lets us declare validation rules as middleware,
// then a second middleware checks if any rule failed
// ============================================================

const { body, validationResult } = require('express-validator');

// Declares the rule: longUrl must be present and look like a real URL
const validateLongUrl = [
  body('longUrl').isURL().withMessage('longUrl must be a valid URL'),
];

// Runs AFTER the rule above — collects any validation errors and
// stops the request here if there are any, instead of reaching the controller
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validateLongUrl, handleValidationErrors };
