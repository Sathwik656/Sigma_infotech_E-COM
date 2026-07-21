'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrands, createBrand, deleteBrand } from '@/services/adminService';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', slug: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrands();
      setBrands(data.data || data.brands || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load brands.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const slugify = (str) => str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createBrand({ name: form.name.trim(), slug: form.slug || slugify(form.name) });
      setSuccess('Brand created.');
      setForm({ name: '', slug: '' });
      setTimeout(() => setSuccess(''), 3000);
      fetchBrands();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create brand.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete brand "${name}"? Products using this brand will lose their brand association.`)) return;
    setDeletingId(id);
    try {
      await deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      setSuccess('Brand deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete brand.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <h2>Brand Management</h2>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="grid grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* ── Add Brand Form ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Add New Brand</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Dell, HP, Lenovo" value={form.name} onChange={handleNameChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input type="text" className="form-input" placeholder="auto-generated" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Leave blank to auto-generate from name</span>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting || !form.name.trim()}>
              {submitting ? 'Creating…' : '+ Add Brand'}
            </button>
          </form>
        </div>

        {/* ── Brands List ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>All Brands ({brands.length})</h3>
          {loading ? (
            <div className="loading-spinner">Loading…</div>
          ) : brands.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0', border: 'none' }}>No brands yet.</div>
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id}>
                      <td style={{ fontWeight: 500 }}>{brand.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-dim)' }}>{brand.slug}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleDelete(brand.id, brand.name)}
                          disabled={deletingId === brand.id}
                        >
                          {deletingId === brand.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
