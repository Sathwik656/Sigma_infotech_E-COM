'use strict';

const { Router } = require('express');
const { body, query } = require('express-validator');
const productController = require('../controllers/product.controller');
const imageController = require('../controllers/image.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

/* -----------------------------------------------------------------------
   Validation Rules
   ----------------------------------------------------------------------- */

const createProductRules = [
  body('slug')
    .trim()
    .notEmpty().withMessage('slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('slug must be lowercase letters, numbers, and hyphens only'),

  body('name')
    .trim()
    .notEmpty().withMessage('name is required')
    .isLength({ max: 255 }).withMessage('name must be 255 characters or fewer'),

  body('brand')
    .trim()
    .notEmpty().withMessage('brand is required'),

  body('sku')
    .trim()
    .notEmpty().withMessage('sku is required'),

  body('price')
    .isFloat({ min: 0 }).withMessage('price must be a positive number'),

  body('category')
    .isIn(['laptop', 'desktop', 'printer', 'accessory', 'other'])
    .withMessage('category must be one of: laptop, desktop, printer, accessory, other'),

  body('condition')
    .isIn(['excellent', 'good', 'fair'])
    .withMessage('condition must be one of: excellent, good, fair'),

  body('grade')
    .trim()
    .notEmpty().withMessage('grade is required'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('stock must be a non-negative integer'),

  body('specifications')
    .optional()
    .isArray().withMessage('specifications must be an array'),
];

const updateProductRules = [
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('stock must be a non-negative integer'),

  body('category')
    .optional()
    .isIn(['laptop', 'desktop', 'printer', 'accessory', 'other'])
    .withMessage('category must be one of: laptop, desktop, printer, accessory, other'),

  body('condition')
    .optional()
    .isIn(['excellent', 'good', 'fair'])
    .withMessage('condition must be one of: excellent, good, fair'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('status must be one of: active, inactive, draft'),

  body('specifications')
    .optional()
    .isArray().withMessage('specifications must be an array'),
];

/* -----------------------------------------------------------------------
   Public Routes (no authentication required)
   ----------------------------------------------------------------------- */

// GET /api/products
router.get('/', productController.getAll);

// GET /api/products/id/:id  — must come BEFORE /:slug to avoid collision
router.get('/id/:id', authenticate, requireAdmin, productController.getById);

// GET /api/products/:slug
router.get('/:slug', productController.getBySlug);

// GET /api/products/:slug/related
router.get('/:slug/related', productController.getRelated);

/* -----------------------------------------------------------------------
   Admin-Only Routes (authenticate → requireAdmin → controller)
   ----------------------------------------------------------------------- */

// POST /api/products
router.post('/', authenticate, requireAdmin, createProductRules, validate, productController.create);

// PUT /api/products/:id
router.put('/:id', authenticate, requireAdmin, updateProductRules, validate, productController.update);

// DELETE /api/products/:id
router.delete('/:id', authenticate, requireAdmin, productController.remove);

/* -----------------------------------------------------------------------
   Image Management Routes (admin only)
   ----------------------------------------------------------------------- */

// GET /api/products/:id/images
router.get('/:id/images', imageController.list);

// POST /api/products/:id/images — upload single image
router.post('/:id/images', authenticate, requireAdmin, upload.single('image'), imageController.upload);

// PUT /api/products/:id/images/:imageId/primary — set as primary
router.put('/:id/images/:imageId/primary', authenticate, requireAdmin, imageController.setPrimary);

// DELETE /api/products/:id/images/:imageId
router.delete('/:id/images/:imageId', authenticate, requireAdmin, imageController.remove);

module.exports = router;
