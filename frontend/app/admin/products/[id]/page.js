'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProductById, updateProduct, getBrands, getCategories, getProductImages, uploadProductImage, deleteProductImage, setPrimaryImage } from '@/services/adminService';

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useState(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    specs_short: '',
    price: '',
    price_formatted: '',
    price_old: '',
    price_old_formatted: '',
    sku: '',
    stock: '',
    brand: '',
    brand_id: '',
    category: 'laptop',
    category_id: '',
    condition: 'excellent',
    grade: '',
    grade_class: '',
    status: 'active',
    featured: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [productRes, brandsRes, categoriesRes] = await Promise.all([
          getProductById(id),
          getBrands(),
          getCategories(),
        ]);
        if (cancelled) return;

        const p = productRes.data || productRes;
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          specs_short: p.specs_short || '',
          price: p.price ?? '',
          price_formatted: p.price_formatted || '',
          price_old: p.price_old ?? '',
          price_old_formatted: p.price_old_formatted || '',
          sku: p.sku || '',
          stock: p.stock ?? '',
          brand: typeof p.brand === 'string' ? p.brand : p.brand?.name || '',
          brand_id: p.brand_id || '',
          category: typeof p.category === 'object' ? (p.category?.slug || p.category?.name || 'laptop') : (p.category || 'laptop'),
          category_id: p.category_id || '',
          condition: p.condition || 'excellent',
          grade: p.grade || '',
          grade_class: p.grade_class || '',
          status: p.status || 'active',
          featured: p.featured || false,
        });

        setBrands(brandsRes.data || brandsRes.brands || brandsRes || []);
        setCategories(categoriesRes.data || categoriesRes.categories || categoriesRes || []);

        // Fetch product images
        try {
          const imagesRes = await getProductImages(id);
          setImages(imagesRes.data || imagesRes || []);
        } catch (_e) {
          // Images might not exist yet
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess('');

    const priceNum = form.price !== '' ? Number(form.price) : undefined;
    const stockNum = form.stock !== '' ? Number(form.stock) : undefined;

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      specs_short: form.specs_short,
      ...(priceNum !== undefined && !isNaN(priceNum) && { price: priceNum }),
      price_formatted: form.price_formatted,
      ...(form.price_old !== '' && { price_old: Number(form.price_old) }),
      price_old_formatted: form.price_old_formatted,
      sku: form.sku,
      ...(stockNum !== undefined && !isNaN(stockNum) && { stock: stockNum }),
      brand: form.brand,
      brand_id: form.brand_id || undefined,
      category: form.category,
      category_id: form.category_id || undefined,
      condition: form.condition,
      grade: form.grade,
      grade_class: form.grade_class,
      status: form.status,
      featured: form.featured,
    };

    try {
      await updateProduct(id, payload);
      setSuccess('Product updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors && fieldErrors.length > 0) {
        setError(fieldErrors.map((e) => `${e.field}: ${e.message}`).join('; '));
      } else {
        setError(err.response?.data?.message || 'Failed to update product.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading product…</div>;
  }

  if (error && !form.name) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
        <Link href="/admin/products" className="btn-secondary" style={{ textDecoration: 'none' }}>
          Back to Products
        </Link>
      </div>
    );
  }

  const brandList = Array.isArray(brands) ? brands : [];
  const categoryList = Array.isArray(categories) ? categories : [];

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError('');
    setUploading(true);

    try {
      for (const file of files) {
        await uploadProductImage(id, file, { alt: form.name });
      }
      // Refresh images list
      const imagesRes = await getProductImages(id);
      setImages(imagesRes.data || imagesRes || []);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;
    try {
      await deleteProductImage(id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete image.');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await setPrimaryImage(id, imageId);
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set primary.');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      {/* ── Header ──────────────────────────────────── */}
      <div className="page-header-row">
        <h2>Edit Product</h2>
        <Link href="/admin/products" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          ← Back to Products
        </Link>
      </div>

      {/* ── Messages ────────────────────────────────── */}
      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          {success}
        </div>
      )}

      {/* ── Form ────────────────────────────────────── */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input
                type="text"
                name="slug"
                className="form-input"
                value={form.slug}
                onChange={handleChange}
                required
                pattern="[a-z0-9-]+"
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input
                type="text"
                name="sku"
                className="form-input"
                value={form.sku}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Specs</label>
            <input
              type="text"
              name="specs_short"
              className="form-input"
              value={form.specs_short}
              onChange={handleChange}
              placeholder="e.g. i5 11th Gen, 8GB RAM, 512GB SSD"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price Formatted</label>
              <input
                type="text"
                name="price_formatted"
                className="form-input"
                value={form.price_formatted}
                onChange={handleChange}
                placeholder="₹12,500"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Original Price (₹)</label>
              <input
                type="number"
                name="price_old"
                className="form-input"
                value={form.price_old}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Original Price Formatted</label>
              <input
                type="text"
                name="price_old_formatted"
                className="form-input"
                value={form.price_old_formatted}
                onChange={handleChange}
                placeholder="₹18,000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-input"
                value={form.category}
                onChange={handleChange}
              >
                {['laptop', 'desktop', 'printer', 'accessory', 'other'].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category (FK)</label>
              <select
                name="category_id"
                className="form-input"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">— Select Category —</option>
                {categoryList.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand Name</label>
              <input
                type="text"
                name="brand"
                className="form-input"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g. Dell"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Brand (FK)</label>
              <select
                name="brand_id"
                className="form-input"
                value={form.brand_id}
                onChange={handleChange}
              >
                <option value="">— Select Brand —</option>
                {brandList.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition *</label>
              <select
                name="condition"
                className="form-input"
                value={form.condition}
                onChange={handleChange}
              >
                {['excellent', 'good', 'fair'].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input
                type="text"
                name="grade"
                className="form-input"
                value={form.grade}
                onChange={handleChange}
                placeholder="e.g. A+, A, B"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                name="stock"
                className="form-input"
                value={form.stock}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-input"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-checkbox" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                <span>Featured Product</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.push('/admin/products')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* ── Product Images ────────────────────────────────── */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Images</h3>

        {uploadError && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {uploadError}
          </div>
        )}

        {/* Upload button */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: uploading ? 'var(--line)' : 'var(--navy)',
              color: '#fff',
              borderRadius: 4,
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? 'Uploading…' : 'Upload Images'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--ink-faint)' }}>
            JPEG, PNG, WebP, GIF · Max 5MB each
          </span>
        </div>

        {/* Images grid */}
        {images.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', fontSize: 13, fontStyle: 'italic' }}>
            No images uploaded yet. Upload images to display them on the product page.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {images.map((img) => (
              <div
                key={img.id}
                style={{
                  border: img.is_primary ? '2px solid var(--navy)' : '1px solid var(--line)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '100%', background: '#f5f5f5' }}>
                  <img
                    src={img.url}
                    alt={img.alt || 'Product image'}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {img.is_primary && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      background: 'var(--navy)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                    }}>
                      Primary
                    </span>
                  )}
                </div>
                <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                  {!img.is_primary && (
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => handleSetPrimary(img.id)}
                      style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDeleteImage(img.id)}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
