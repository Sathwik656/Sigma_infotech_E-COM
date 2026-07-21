'use strict';

const stream = require('stream');
const cloudinary = require('../config/cloudinary');
const { supabaseAdmin } = require('../config/supabase');

const FOLDER = 'sigma-products';

/**
 * Upload a product image to Cloudinary and save metadata in product_images.
 */
async function uploadImage(productId, file, { alt = '', is_primary = false, sort_order = 0 } = {}) {
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new stream.Readable({
      read() {
        this.push(file.buffer);
        this.push(null);
      },
    });
    readable.pipe(uploadStream);
  });

  const imageUrl = result.secure_url;
  const imagePublicId = result.public_id;

  // If marking as primary, unset other primaries first
  if (is_primary) {
    await supabaseAdmin
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .eq('is_primary', true);
  }

  // Determine sort_order: if not specified, append at end
  if (sort_order === 0 && !is_primary) {
    const { data: existing } = await supabaseAdmin
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1);

    sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
  }

  const { data: image, error } = await supabaseAdmin
    .from('product_images')
    .insert([{
      product_id: productId,
      url: imageUrl,
      alt: alt || '',
      sort_order,
      is_primary,
    }])
    .select()
    .single();

  if (error) throw error;

  // Update products.thumbnail_url if this is primary
  if (is_primary) {
    await supabaseAdmin
      .from('products')
      .update({ thumbnail_url: imageUrl })
      .eq('id', productId);
  }

  // If this is the first image, auto-set as primary
  const { count } = await supabaseAdmin
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (count === 1) {
    await supabaseAdmin
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', image.id);

    await supabaseAdmin
      .from('products')
      .update({ thumbnail_url: imageUrl })
      .eq('id', productId);

    image.is_primary = true;
  }

  return image;
}

/**
 * Delete a product image from Cloudinary and product_images table.
 */
async function deleteImage(imageId) {
  // Get the image record first
  const { data: image, error: fetchError } = await supabaseAdmin
    .from('product_images')
    .select('id, product_id, public_id, is_primary, url')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) throw new Error('Image not found');

  // Delete from Cloudinary — extract public_id from URL
  // URL format: https://res.cloudinary.com/{cloud}/image/upload/v123/folder/public_id.ext
  if (image.url) {
    try {
      const urlParts = image.url.split('/');
      const uploadIdx = urlParts.indexOf('upload');
      if (uploadIdx !== -1) {
        // Everything after 'upload' and version (v123) is the path
        const pathWithVersion = urlParts.slice(uploadIdx + 1).join('/');
        // Remove version prefix (v1234567890/)
        const publicIdWithExt = pathWithVersion.replace(/^v\d+\//, '');
        // Remove file extension
        const publicId = publicIdWithExt.replace(/\.[^.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (_err) {
      // Continue even if Cloudinary delete fails
    }
  }

  // Delete from database
  const { error } = await supabaseAdmin
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;

  // If deleted image was primary, promote next image
  if (image.is_primary) {
    const { data: nextImage } = await supabaseAdmin
      .from('product_images')
      .select('id, url')
      .eq('product_id', image.product_id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();

    if (nextImage) {
      await supabaseAdmin
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', nextImage.id);

      await supabaseAdmin
        .from('products')
        .update({ thumbnail_url: nextImage.url })
        .eq('id', image.product_id);
    } else {
      // No images left
      await supabaseAdmin
        .from('products')
        .update({ thumbnail_url: null })
        .eq('id', image.product_id);
    }
  }

  return { success: true };
}

/**
 * Set an image as primary for a product.
 */
async function setPrimaryImage(imageId) {
  const { data: image, error: fetchError } = await supabaseAdmin
    .from('product_images')
    .select('id, product_id, url')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) throw new Error('Image not found');

  // Unset all primaries for this product
  await supabaseAdmin
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', image.product_id);

  // Set this one as primary
  await supabaseAdmin
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  // Update product thumbnail
  await supabaseAdmin
    .from('products')
    .update({ thumbnail_url: image.url })
    .eq('id', image.product_id);

  return { success: true };
}

/**
 * Get all images for a product.
 */
async function getProductImages(productId) {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('id, url, alt, sort_order, is_primary, created_at')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

module.exports = { uploadImage, deleteImage, setPrimaryImage, getProductImages };
