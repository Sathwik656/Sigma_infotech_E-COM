'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const adminController = require('../controllers/admin.controller');

const router = Router();

// All routes require authentication + admin
router.use(authenticate, requireAdmin);

/* -------------------------------------------------------
   Validation
   ------------------------------------------------------- */
const updateUserRoleRules = [
  body('role')
    .isIn(['admin', 'customer'])
    .withMessage('role must be one of: admin, customer'),
];

const updateOrderStatusRules = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),

  body('payment_status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),

  body('shipment_status')
    .optional()
    .isIn(['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered'])
    .withMessage('Invalid shipment status'),
];

/* -------------------------------------------------------
   Dashboard
   ------------------------------------------------------- */

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', adminController.getDashboardStats);

/* -------------------------------------------------------
   User / Customer Management
   ------------------------------------------------------- */

// GET /api/admin/users
router.get('/users', adminController.getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', adminController.getUserById);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', updateUserRoleRules, validate, adminController.updateUserRole);

// Alias: PUT /api/admin/users/:id/status (backward compat with existing adminService.js)
router.put('/users/:id/status', updateUserRoleRules, validate, adminController.updateUserRole);

/* -------------------------------------------------------
   Order Management (Admin)
   ------------------------------------------------------- */

// GET /api/admin/orders
router.get('/orders', adminController.getAllOrders);

// GET /api/admin/orders/:id
router.get('/orders/:id', adminController.getAdminOrderById);

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', updateOrderStatusRules, validate, adminController.updateOrderStatus);

module.exports = router;
