'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const orderController = require('../controllers/order.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const createOrderRules = [
  body('addressId')
    .notEmpty().withMessage('addressId is required')
    .isUUID().withMessage('addressId must be a valid UUID'),

  body('shippingCharge')
    .optional()
    .isFloat({ min: 0 }).withMessage('shippingCharge must be a non-negative number'),

  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('taxRate must be between 0 and 100'),
];

/* -------------------------------------------------------
   Routes (all protected — require authentication)
   ------------------------------------------------------- */

// POST /api/orders
router.post('/', authenticate, createOrderRules, validate, orderController.create);

// GET /api/orders
router.get('/', authenticate, orderController.list);

// GET /api/orders/:id
router.get('/:id', authenticate, orderController.getById);

module.exports = router;
