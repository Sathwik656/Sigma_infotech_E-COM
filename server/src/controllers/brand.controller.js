'use strict';

const brandService = require('../services/brand.service');

/**
 * Brand Controller
 * Admin-only CRUD for product brands.
 */

async function getAll(req, res, next) {
  try {
    const brands = await brandService.getAll();

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const brand = await brandService.getById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const brand = await brandService.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully.',
      data: brand,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A brand with this slug already exists.',
      });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const brand = await brandService.update(req.params.id, req.body);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully.',
      data: brand,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A brand with this slug already exists.',
      });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await brandService.remove(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
