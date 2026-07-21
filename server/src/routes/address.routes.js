'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const addressController = require('../controllers/address.controller');

const router = Router();

/* -------------------------------------------------------
   Validation Rules
   ------------------------------------------------------- */

const createAddressRules = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),

  body('address_line_1')
    .trim()
    .notEmpty().withMessage('Address line 1 is required'),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('state')
    .trim()
    .notEmpty().withMessage('State is required'),

  body('country')
    .optional()
    .trim()
    .default('India'),

  body('postal_code')
    .trim()
    .notEmpty().withMessage('Postal code is required'),

  body('landmark')
    .optional()
    .trim(),

  body('is_default')
    .optional()
    .isBoolean().withMessage('is_default must be a boolean'),
];

const updateAddressRules = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),

  body('phone')
    .optional()
    .trim(),

  body('address_line_1')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Address line 1 cannot be empty'),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('City cannot be empty'),

  body('state')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('State cannot be empty'),

  body('postal_code')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Postal code cannot be empty'),

  body('landmark')
    .optional()
    .trim(),

  body('is_default')
    .optional()
    .isBoolean().withMessage('is_default must be a boolean'),
];

/* -------------------------------------------------------
   Routes (all protected — require authentication)
   ------------------------------------------------------- */

// GET /api/addresses
router.get('/', authenticate, addressController.list);

// POST /api/addresses
router.post('/', authenticate, createAddressRules, validate, addressController.create);

// PATCH /api/addresses/:id
router.patch('/:id', authenticate, updateAddressRules, validate, addressController.update);

// DELETE /api/addresses/:id
router.delete('/:id', authenticate, addressController.remove);

// PATCH /api/addresses/:id/default
router.patch('/:id/default', authenticate, addressController.setDefault);

module.exports = router;
