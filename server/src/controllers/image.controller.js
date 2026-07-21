'use strict';

const imageService = require('../services/image.service');

/**
 * POST /api/products/:id/images
 * Upload a product image.
 */
async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const { id } = req.params;
    const { alt, is_primary } = req.body;

    const image = await imageService.uploadImage(id, req.file, {
      alt: alt || '',
      is_primary: is_primary === 'true' || is_primary === true,
    });

    res.status(201).json({ success: true, data: image });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/products/:id/images/:imageId
 * Delete a product image.
 */
async function remove(req, res, next) {
  try {
    const { imageId } = req.params;
    await imageService.deleteImage(imageId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/products/:id/images/:imageId/primary
 * Set an image as primary.
 */
async function setPrimary(req, res, next) {
  try {
    const { imageId } = req.params;
    await imageService.setPrimaryImage(imageId);
    res.json({ success: true, message: 'Image set as primary' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id/images
 * List all images for a product.
 */
async function list(req, res, next) {
  try {
    const { id } = req.params;
    const images = await imageService.getProductImages(id);
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, remove, setPrimary, list };
