'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const paymentController = require('../controllers/payment.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const createOrderRules = [
  body('orderId')
    .notEmpty().withMessage('orderId is required')
    .isUUID().withMessage('orderId must be a valid UUID'),
];

const verifyRules = [
  body('razorpay_order_id')
    .notEmpty().withMessage('razorpay_order_id is required'),

  body('razorpay_payment_id')
    .notEmpty().withMessage('razorpay_payment_id is required'),

  body('razorpay_signature')
    .notEmpty().withMessage('razorpay_signature is required'),
];

/* -------------------------------------------------------
   Customer Routes (protected)
   ------------------------------------------------------- */

// POST /api/payments/create-order
router.post('/create-order', authenticate, createOrderRules, validate, paymentController.createOrder);

// POST /api/payments/verify
router.post('/verify', authenticate, verifyRules, validate, paymentController.verify);

/* -------------------------------------------------------
   Webhook Route (NO authentication — Razorpay calls this)
   Raw body is parsed separately for signature verification
   ------------------------------------------------------- */

// POST /api/payments/webhook
router.post('/webhook', paymentController.webhook);

/* -------------------------------------------------------
   History / Lookup Routes (authenticated)
   ------------------------------------------------------- */

// GET /api/payments/history — user sees own, admin sees all
router.get('/history', authenticate, paymentController.getHistory);

// GET /api/payments/:id
router.get('/:id', authenticate, paymentController.getPaymentById);

module.exports = router;
