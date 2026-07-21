'use strict';

const categoryService = require('../services/category.service');

/**
 * Category Controller
 * Admin-only CRUD for product categories.
 */

async function getAll(req, res, next) {
  try {
    const categories = await categoryService.getAll();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const category = await categoryService.getById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A category with this slug already exists.',
      });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await categoryService.update(req.params.id, req.body);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A category with this slug already exists.',
      });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoryService.remove(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
