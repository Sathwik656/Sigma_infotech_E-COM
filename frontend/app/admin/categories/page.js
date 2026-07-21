'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, deleteCategory } from '@/services/adminService';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data.data || data.categories || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

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
      await createCategory({
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        description: form.description.trim() || undefined,
      });
      setSuccess('Category created.');
      setForm({ name: '', slug: '', description: '' });
      setTimeout(() => setSuccess(''), 3000);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"? Products in this category will lose their category association.`)) return;
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccess('Category deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <h2>Category Management</h2>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="grid grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* ── Add Category Form ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Add New Category</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Laptop, Desktop, Printer" value={form.name} onChange={handleNameChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input type="text" className="form-input" placeholder="auto-generated" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Leave blank to auto-generate from name</span>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Optional description" rows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting || !form.name.trim()}>
              {submitting ? 'Creating…' : '+ Add Category'}
            </button>
          </form>
        </div>

        {/* ── Categories List ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>All Categories ({categories.length})</h3>
          {loading ? (
            <div className="loading-spinner">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0', border: 'none' }}>No categories yet.</div>
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: 500 }}>{cat.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-dim)' }}>{cat.slug}</td>
                      <td style={{ fontSize: 12, color: 'var(--ink-dim)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.description || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={deletingId === cat.id}
                        >
                          {deletingId === cat.id ? '…' : 'Delete'}
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
