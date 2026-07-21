'use strict';

const inventoryService = require('../services/inventory.service');

/**
 * Inventory Controller
 * Admin endpoints for viewing and adjusting product inventory.
 */

/**
 * GET /api/inventory
 * Returns all inventory records (admin only).
 */
async function getAll(req, res, next) {
  try {
    const inventory = await inventoryService.getAll();

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/inventory/:productId
 * Returns inventory for a single product.
 */
async function getByProductId(req, res, next) {
  try {
    const { productId } = req.params;
    const inventory = await inventoryService.getByProductId(productId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/inventory/add
 * Admin manually adds stock to a product.
 * Body: { productId, quantity, notes }
 */
async function addStock(req, res, next) {
  try {
    const { productId, quantity, notes } = req.body;

    await inventoryService.addStock(productId, quantity, notes);
    const inventory = await inventoryService.getByProductId(productId);

    res.status(200).json({
      success: true,
      message: `Added ${quantity} units to stock.`,
      data: inventory,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/inventory/remove
 * Admin manually removes stock from a product.
 * Body: { productId, quantity, notes }
 */
async function removeStock(req, res, next) {
  try {
    const { productId, quantity, notes } = req.body;

    await inventoryService.removeStock(productId, quantity, notes);
    const inventory = await inventoryService.getByProductId(productId);

    res.status(200).json({
      success: true,
      message: `Removed ${quantity} units from stock.`,
      data: inventory,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/inventory/:productId/transactions
 * Returns transaction history for a product.
 */
async function getTransactions(req, res, next) {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await inventoryService.getTransactions(
      productId,
      Math.min(200, parseInt(limit, 10) || 50)
    );

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getByProductId, addStock, removeStock, getTransactions };
