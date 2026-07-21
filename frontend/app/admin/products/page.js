'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProducts, deleteProduct } from '@/services/adminService';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({ page, limit: 20, search: search || undefined });
      setProducts(data.data || data.products || []);
      setPagination({
        page: data.pagination?.page || page,
        totalPages: data.pagination?.totalPages || data.pagination?.total_pages || 1,
        total: data.pagination?.total || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      fetchProducts(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeleting(null);
    }
  };

  const goToPage = (page) => {
    fetchProducts(page);
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={i === pagination.page ? 'active' : ''}
          onClick={() => goToPage(i)}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="pagination">
        <button onClick={() => goToPage(pagination.page - 1)} disabled={loading || pagination.page <= 1}>
          ‹
        </button>
        {pages}
        <button onClick={() => goToPage(pagination.page + 1)} disabled={loading || pagination.page >= pagination.totalPages}>
          ›
        </button>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <h2>Products</h2>
          {pagination.total > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} total
            </span>
          )}
        </div>
        <Link href="/admin/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Product
        </Link>
      </div>

      {/* ── Search ──────────────────────────────────── */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 400 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search products by name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary btn-sm">Search</button>
          {(search || searchInput) && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => { setSearchInput(''); setSearch(''); }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* ── Error ───────────────────────────────────── */}
      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────── */}
      {loading ? (
        <div className="loading-spinner">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
          <h3>No products found</h3>
          <p>{search ? 'Try a different search term.' : 'Get started by adding your first product.'}</p>
          {!search && (
            <Link href="/admin/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
              Add Product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id || product._id}>
                    <td style={{ width: 48 }}>
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--line)' }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, background: 'var(--line)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 20, height: 20, color: 'var(--ink-faint)' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                      ₹{Number(product.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          fontSize: 13,
                          color: (product.quantity ?? product.stock ?? 0) < 5 ? '#dc2626' : '#059669',
                        }}
                      >
                        {product.quantity ?? product.stock ?? 0}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
                      {product.brand_name || (typeof product.brand === 'object' ? product.brand?.name : product.brand) || '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
                      {product.category_name || (typeof product.category === 'object' ? product.category?.name : product.category) || '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        product.status === 'active' ? 'badge-green' :
                        product.status === 'draft' ? 'badge-yellow' :
                        'badge-gray'
                      }`}>
                        {product.status || 'active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/admin/products/${product.id || product._id}`}
                        className="btn-secondary btn-sm"
                        style={{ textDecoration: 'none', marginRight: 8 }}
                      >
                        Edit
                      </Link>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(product.id || product._id, product.name)}
                        disabled={deleting === (product.id || product._id)}
                      >
                        {deleting === (product.id || product._id) ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
}
