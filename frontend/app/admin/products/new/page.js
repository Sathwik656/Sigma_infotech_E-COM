'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct, getBrands, getCategories } from '@/services/adminService';

const CONDITIONS = ['excellent', 'good', 'fair'];
const CATEGORIES_ENUM = ['laptop', 'desktop', 'printer', 'accessory', 'other'];
const STATUSES = ['active', 'draft', 'inactive'];

export default function NewProductPage() {
  const router = useRouter();
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [createdId, setCreatedId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    specs_short: '',
    sku: '',
    price: '',
    price_formatted: '',
    price_old: '',
    price_old_formatted: '',
    brand: '',
    brand_id: '',
    category: 'laptop',
    category_id: '',
    condition: 'excellent',
    grade: '',
    grade_class: '',
    stock: '1',
    featured: false,
    status: 'active',
  });

  useEffect(() => {
    async function load() {
      try {
        const [brandsRes, catsRes] = await Promise.all([getBrands(), getCategories()]);
        setBrands(brandsRes.data || brandsRes || []);
        setCategories(catsRes.data || catsRes || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const slugify = (str) => str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Auto-generate slug from name
      if (name === 'name') updated.slug = slugify(value);
      // Auto-format price
      if (name === 'price' && value) updated.price_formatted = `₹${Number(value).toLocaleString('en-IN')}`;
      if (name === 'price_old' && value) updated.price_old_formatted = `₹${Number(value).toLocaleString('en-IN')}`;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      price: Number(form.price),
      price_old: form.price_old ? Number(form.price_old) : undefined,
      stock: Number(form.stock) || 0,
      brand_id: form.brand_id || undefined,
      category_id: form.category_id || undefined,
    };

    try {
      const data = await createProduct(payload);
      const id = data.data?.id || data.id;
      if (id) {
        setCreatedId(id);
      } else {
        router.push('/admin/products');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product.');
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div className="page-header-row">
        <h2>Add New Product</h2>
        <Link href="/admin/products" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* ── Basic Info ─── */}
          <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic Information</h3>

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input type="text" name="slug" className="form-input" value={form.slug} onChange={handleChange} required pattern="[a-z0-9-]+" />
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>URL-safe identifier (auto-generated)</span>
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input type="text" name="sku" className="form-input" value={form.sku} onChange={handleChange} required placeholder="e.g. DELL-LAT-001" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-textarea" rows={3} value={form.description} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Short Specs</label>
            <input type="text" name="specs_short" className="form-input" placeholder="e.g. i5 11th Gen, 8GB RAM, 512GB SSD" value={form.specs_short} onChange={handleChange} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '24px 0' }} />

          {/* ── Pricing ─── */}
          <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pricing</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input type="number" name="price" className="form-input" min="0" step="0.01" value={form.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Price Formatted *</label>
              <input type="text" name="price_formatted" className="form-input" placeholder="₹12,500" value={form.price_formatted} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Original Price (₹)</label>
              <input type="number" name="price_old" className="form-input" min="0" step="0.01" value={form.price_old} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Original Price Formatted</label>
              <input type="text" name="price_old_formatted" className="form-input" placeholder="₹18,000" value={form.price_old_formatted} onChange={handleChange} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '24px 0' }} />

          {/* ── Classification ─── */}
          <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="form-input" value={form.category} onChange={handleChange} required>
                {CATEGORIES_ENUM.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category (FK)</label>
              <select name="category_id" className="form-input" value={form.category_id} onChange={handleChange}>
                <option value="">— Select Category —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input type="text" name="brand" className="form-input" value={form.brand} onChange={handleChange} required placeholder="e.g. Dell" />
            </div>
            <div className="form-group">
              <label className="form-label">Brand (FK)</label>
              <select name="brand_id" className="form-input" value={form.brand_id} onChange={handleChange}>
                <option value="">— Select Brand —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition *</label>
              <select name="condition" className="form-input" value={form.condition} onChange={handleChange} required>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Grade *</label>
              <input type="text" name="grade" className="form-input" placeholder="e.g. A+, A, B" value={form.grade} onChange={handleChange} required />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '24px 0' }} />

          {/* ── Inventory & Status ─── */}
          <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory & Status</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input type="number" name="stock" className="form-input" min="0" value={form.stock} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <label className="form-checkbox" style={{ marginBottom: 24 }}>
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
            <span>Featured Product</span>
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Product'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.push('/admin/products')} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {createdId && (
        <div style={{
          marginTop: 20,
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <div>
            <strong style={{ color: '#059669', fontSize: 14 }}>Product created successfully!</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-dim)' }}>
              Now you can add product images from the edit page.
            </p>
          </div>
          <Link
            href={`/admin/products/${createdId}`}
            className="btn-primary btn-sm"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Add Images →
          </Link>
        </div>
      )}
    </div>
  );
}
