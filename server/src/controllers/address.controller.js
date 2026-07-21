'use strict';

const addressService = require('../services/address.service');

/**
 * Address Controller
 * Handles HTTP request/response for user address operations.
 * All operations enforce user ownership via req.user.id.
 */

/**
 * GET /api/addresses
 * Returns all addresses for the authenticated user.
 */
async function list(req, res, next) {
  try {
    const addresses = await addressService.getByUserId(req.user.id);

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/addresses
 * Creates a new address for the authenticated user.
 */
async function create(req, res, next) {
  try {
    const address = await addressService.create(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Address created successfully.',
      data: address,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/addresses/:id
 * Updates an existing address (ownership enforced in service).
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const address = await addressService.update(id, req.user.id, req.body);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      data: address,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/addresses/:id
 * Deletes an address (ownership enforced in service).
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await addressService.remove(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/addresses/:id/default
 * Sets an address as the default for the authenticated user.
 */
async function setDefault(req, res, next) {
  try {
    const { id } = req.params;
    const address = await addressService.setDefault(id, req.user.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Default address updated.',
      data: address,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, setDefault };
