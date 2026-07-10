'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

/**
 * GET /api/profile
 *
 * Protected route — demonstrates JWT authentication middleware.
 * Only accessible to logged-in users with a valid Bearer token.
 */
router.get('/', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile data retrieved successfully',
    profile: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      memberSince: req.user.createdAt,
      emailConfirmed: req.user.emailConfirmed,
    },
  });
});

module.exports = router;
