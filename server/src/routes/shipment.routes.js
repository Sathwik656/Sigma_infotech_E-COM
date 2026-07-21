'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const shipmentController = require('../controllers/shipment.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const updateShipmentRules = [
  body('carrier')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('carrier must be 100 characters or fewer'),

  body('tracking_number')
    .optional()
    .trim(),

  body('awb')
    .optional()
    .trim(),

  body('shipment_status')
    .optional()
    .isIn(['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered'])
    .withMessage('shipment_status must be one of: pending, label_created, in_transit, out_for_delivery, delivered'),

  body('shipped_at')
    .optional()
    .isISO8601().withMessage('shipped_at must be a valid ISO 8601 date'),

  body('delivered_at')
    .optional()
    .isISO8601().withMessage('delivered_at must be a valid ISO 8601 date'),

  body('label_url')
    .optional()
    .trim()
    .isURL().withMessage('label_url must be a valid URL'),
];

/* -------------------------------------------------------
   Admin Routes (all protected + admin required)
   ------------------------------------------------------- */

// GET /api/shipments
router.get('/', authenticate, requireAdmin, shipmentController.getAll);

// GET /api/shipments/:orderId
router.get('/:orderId', authenticate, requireAdmin, shipmentController.getByOrderId);

// PATCH /api/shipments/:orderId
router.patch('/:orderId', authenticate, requireAdmin, updateShipmentRules, validate, shipmentController.update);

module.exports = router;
