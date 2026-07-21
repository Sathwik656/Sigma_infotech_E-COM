'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const inventoryController = require('../controllers/inventory.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const stockAdjustmentRules = [
  body('productId')
    .notEmpty().withMessage('productId is required')
    .isUUID().withMessage('productId must be a valid UUID'),

  body('quantity')
    .isInt({ min: 1 }).withMessage('quantity must be a positive integer'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('notes must be 500 characters or fewer'),
];

/* -------------------------------------------------------
   Admin Routes (all protected + admin required)
   ------------------------------------------------------- */

// GET /api/inventory
router.get('/', authenticate, requireAdmin, inventoryController.getAll);

// GET /api/inventory/:productId
router.get('/:productId', authenticate, requireAdmin, inventoryController.getByProductId);

// POST /api/inventory/add
router.post('/add', authenticate, requireAdmin, stockAdjustmentRules, validate, inventoryController.addStock);

// POST /api/inventory/remove
router.post('/remove', authenticate, requireAdmin, stockAdjustmentRules, validate, inventoryController.removeStock);

// GET /api/inventory/:productId/transactions
router.get('/:productId/transactions', authenticate, requireAdmin, inventoryController.getTransactions);

module.exports = router;
