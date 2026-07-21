'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const categoryController = require('../controllers/category.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const createCategoryRules = [
  body('slug')
    .trim()
    .notEmpty().withMessage('slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('slug must be lowercase letters, numbers, and hyphens only'),
  body('name')
    .trim()
    .notEmpty().withMessage('name is required')
    .isLength({ max: 100 }).withMessage('name must be 100 characters or fewer'),
  body('description')
    .optional()
    .trim(),
  body('icon')
    .optional()
    .trim(),
  body('href')
    .optional()
    .trim(),
];

const updateCategoryRules = [
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('slug must be lowercase letters, numbers, and hyphens only'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('icon')
    .optional()
    .trim(),
  body('href')
    .optional()
    .trim(),
];

/* -------------------------------------------------------
   Public Routes
   ------------------------------------------------------- */

// GET /api/categories
router.get('/', categoryController.getAll);

/* -------------------------------------------------------
   Admin Routes
   ------------------------------------------------------- */

// POST /api/categories
router.post('/', authenticate, requireAdmin, createCategoryRules, validate, categoryController.create);

// PUT /api/categories/:id
router.put('/:id', authenticate, requireAdmin, updateCategoryRules, validate, categoryController.update);

// DELETE /api/categories/:id
router.delete('/:id', authenticate, requireAdmin, categoryController.remove);

module.exports = router;
