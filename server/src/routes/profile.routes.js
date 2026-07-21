'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const userService = require('../services/user.service');

const router = Router();

/**
 * GET /api/profile
 *
 * Returns the authenticated user's full profile from public.users.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const profile = await userService.getByAuthUserId(req.user.authUserId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/profile
 *
 * Updates the authenticated user's profile fields.
 */
const updateProfileRules = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 6, max: 20 }).withMessage('Phone must be between 6 and 20 characters'),
];

router.patch('/', authenticate, updateProfileRules, validate, async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
