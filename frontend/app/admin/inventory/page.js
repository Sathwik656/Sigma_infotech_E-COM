'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getInventory, addStock, removeStock } from '@/services/adminService';

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge-red">Out of Stock</span>;
  if (stock < 5) return <span className="badge badge-yellow">Low Stock</span>;
  return <span className="badge badge-green">In Stock</span>;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'add'|'remove', item }
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInventory();
      setInventory(data.data || data.inventory || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openModal = (type, item) => {
    setModal({ type, item });
    setQuantity('');
    setNotes('');
  };

  const closeModal = () => { setModal(null); setQuantity(''); setNotes(''); };

  const handleStockAction = async () => {
    if (!quantity || Number(quantity) < 1) return;
    setSubmitting(true);
    try {
      const fn = modal.type === 'add' ? addStock : removeStock;
      await fn({ productId: modal.item.product_id, quantity: Number(quantity), notes: notes || undefined });
      setSuccessMsg(`Stock ${modal.type === 'add' ? 'added' : 'removed'} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      closeModal();
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock.');
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* ── Header ─────────────────────────────────── */}
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <h2>Inventory Management</h2>
        <button className="btn-secondary" onClick={fetchInventory} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          {successMsg}
        </div>
      )}

      {/* ── Summary Cards ────────────────────────── */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total SKUs', value: inventory.length, color: 'var(--blue)' },
          { label: 'Low Stock (< 5)', value: inventory.filter((i) => i.available_stock > 0 && i.available_stock < 5).length, color: 'var(--warn)' },
          { label: 'Out of Stock', value: inventory.filter((i) => i.available_stock === 0).length, color: '#dc2626' },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Table ───────────────────────────────── */}
      {loading ? (
        <div className="loading-spinner">Loading inventory…</div>
      ) : inventory.length === 0 ? (
        <div className="empty-state">
          <h3>No inventory records</h3>
          <p>Inventory records are created automatically when products are created.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Available</th>
                  <th style={{ textAlign: 'right' }}>Reserved</th>
                  <th style={{ textAlign: 'right' }}>Sold</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id || item.product_id}>
                    <td style={{ fontWeight: 500 }}>{item.product?.name || 'Unknown Product'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-dim)' }}>{item.product?.sku || '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.available_stock < 5 ? '#dc2626' : '#059669' }}>
                      {item.available_stock}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--ink-dim)' }}>{item.reserved_stock}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--ink-dim)' }}>{item.sold_stock}</td>
                    <td><StockBadge stock={item.available_stock} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn-sm btn-primary" onClick={() => openModal('add', item)}>+ Add</button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => openModal('remove', item)}
                          disabled={item.available_stock === 0}
                        >
                          − Remove
                        </button>
                        <Link href={`/admin/inventory/${item.product_id}`} className="btn-sm btn-secondary" style={{ textDecoration: 'none' }}>
                          History
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Stock Adjustment Modal ──────────────── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, margin: 0 }}>
            <h3 style={{ marginBottom: 4 }}>
              {modal.type === 'add' ? 'Add Stock' : 'Remove Stock'}
            </h3>
            <p style={{ color: 'var(--ink-dim)', fontSize: 13, marginBottom: 20 }}>
              {modal.item.product?.name} — Current available: <strong>{modal.item.available_stock}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max={modal.type === 'remove' ? modal.item.available_stock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional reason or reference"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                className={modal.type === 'add' ? 'btn-primary' : 'btn-danger'}
                onClick={handleStockAction}
                disabled={submitting || !quantity || Number(quantity) < 1}
              >
                {submitting ? 'Updating…' : modal.type === 'add' ? 'Add Stock' : 'Remove Stock'}
              </button>
              <button className="btn-secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
