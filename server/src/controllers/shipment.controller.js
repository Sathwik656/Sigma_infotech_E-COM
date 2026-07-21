'use strict';

const shipmentService = require('../services/shipment.service');

/**
 * Shipment Controller
 * Admin endpoints for managing shipment records.
 */

/**
 * GET /api/shipments
 * Returns all shipments (admin only, paginated).
 */
async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const { shipments, total } = await shipmentService.getAll({
      page: parsedPage,
      limit: parsedLimit,
      status,
    });

    res.status(200).json({
      success: true,
      data: shipments,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shipments/:orderId
 * Returns shipment for a specific order.
 */
async function getByOrderId(req, res, next) {
  try {
    const { orderId } = req.params;
    const shipment = await shipmentService.getByOrderId(orderId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/shipments/:orderId
 * Updates shipment details (admin only).
 */
async function update(req, res, next) {
  try {
    const { orderId } = req.params;
    const shipment = await shipmentService.update(orderId, req.body);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shipment updated successfully.',
      data: shipment,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getByOrderId, update };
