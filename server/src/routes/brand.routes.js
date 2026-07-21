'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const brandController = require('../controllers/brand.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const createBrandRules = [
  body('slug')
    .trim()
    .notEmpty().withMessage('slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('slug must be lowercase letters, numbers, and hyphens only'),
  body('name')
    .trim()
    .notEmpty().withMessage('name is required')
    .isLength({ max: 100 }).withMessage('name must be 100 characters or fewer'),
  body('logo')
    .optional()
    .trim(),
];

const updateBrandRules = [
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('slug must be lowercase letters, numbers, and hyphens only'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
  body('logo')
    .optional()
    .trim(),
];

/* -------------------------------------------------------
   Public Routes
   ------------------------------------------------------- */

// GET /api/brands
router.get('/', brandController.getAll);

/* -------------------------------------------------------
   Admin Routes
   ------------------------------------------------------- */

// POST /api/brands
router.post('/', authenticate, requireAdmin, createBrandRules, validate, brandController.create);

// PUT /api/brands/:id
router.put('/:id', authenticate, requireAdmin, updateBrandRules, validate, brandController.update);

// DELETE /api/brands/:id
router.delete('/:id', authenticate, requireAdmin, brandController.remove);

module.exports = router;
