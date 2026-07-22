'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

/* -------------------------------------------------------
   Routes
   ------------------------------------------------------- */

// POST /api/auth/register
router.post('/register', registerRules, validate, authController.register);

// POST /api/auth/login
router.post('/login', loginRules, validate, authController.login);

// POST /api/auth/logout  (no auth required — best-effort invalidation)
router.post('/logout', authController.logout);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/oauth  (OAuth callback — no validation rules, token verified server-side)
router.post('/oauth', authController.oauthLogin);

module.exports = router;
