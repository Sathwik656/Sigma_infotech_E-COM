'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const cartController = require('../controllers/cart.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const addItemRules = [
  body('productId')
    .notEmpty().withMessage('productId is required')
    .isUUID().withMessage('productId must be a valid UUID'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('quantity must be between 1 and 99'),
];

const updateQuantityRules = [
  body('quantity')
    .isInt({ min: 1, max: 99 }).withMessage('quantity must be between 1 and 99'),
];

/* -------------------------------------------------------
   Routes (all protected — require authentication)
   ------------------------------------------------------- */

// GET /api/cart
router.get('/', authenticate, cartController.getCart);

// POST /api/cart/items
router.post('/items', authenticate, addItemRules, validate, cartController.addItem);

// PATCH /api/cart/items/:itemId
router.patch('/items/:itemId', authenticate, updateQuantityRules, validate, cartController.updateItemQuantity);

// DELETE /api/cart/items/:itemId
router.delete('/items/:itemId', authenticate, cartController.removeItem);

// DELETE /api/cart
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;
