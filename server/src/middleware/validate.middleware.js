'use strict';

const { validationResult } = require('express-validator');

/**
 * Validation Middleware Factory
 *
 * Pass this after express-validator `check()` rules to auto-handle errors.
 * Returns a 400 JSON response with a structured errors array if validation fails.
 *
 * Usage:
 *   router.post('/register', [...validationRules], validate, controller.register)
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = { validate };
