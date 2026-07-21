'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getInventoryByProductId, getInventoryTransactions, addStock, removeStock } from '@/services/adminService';

const TX_TYPE_BADGE = {
  stock_added: 'badge-green',
  stock_removed: 'badge-red',
  reserved: 'badge-yellow',
  unreserved: 'badge-blue',
  sold: 'badge-purple',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function InventoryDetailPage() {
  const { productId } = useParams();
  const [inventory, setInventory] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInventoryByProductId(productId);
      setInventory(data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const data = await getInventoryTransactions(productId);
      setTransactions(data.data || data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
  }, [fetchInventory, fetchTransactions]);

  const handleStockAction = async () => {
    if (!quantity || Number(quantity) < 1) return;
    setSubmitting(true);
    try {
      const fn = modal === 'add' ? addStock : removeStock;
      await fn({ productId, quantity: Number(quantity), notes: notes || undefined });
      setSuccessMsg(`Stock ${modal === 'add' ? 'added' : 'removed'} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setModal(null); setQuantity(''); setNotes('');
      fetchInventory();
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock.');
      setModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner">Loading…</div></div>;

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <Link href="/admin/inventory" style={{ color: 'var(--ink-dim)', fontSize: 13, textDecoration: 'none' }}>← Back to Inventory</Link>
          <h2 style={{ marginTop: 4 }}>Inventory Detail</h2>
        </div>
        {inventory && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={() => { setModal('add'); setQuantity(''); setNotes(''); }}>+ Add Stock</button>
            <button className="btn-danger" onClick={() => { setModal('remove'); setQuantity(''); setNotes(''); }} disabled={inventory.available_stock === 0}>
              − Remove Stock
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

      {inventory ? (
        <>
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            {[
              { label: 'Available Stock', value: inventory.available_stock, color: inventory.available_stock < 5 ? '#dc2626' : '#059669' },
              { label: 'Reserved Stock', value: inventory.reserved_stock, color: 'var(--warn)' },
              { label: 'Sold', value: inventory.sold_stock, color: 'var(--navy)' },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 4 }}>Transaction History</h3>
            {txLoading ? (
              <div className="loading-spinner">Loading transactions…</div>
            ) : transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0', border: 'none' }}>No transactions yet.</div>
            ) : (
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th>Reference</th>
                      <th>Notes</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td><span className={`badge ${TX_TYPE_BADGE[tx.type] || 'badge-gray'}`}>{tx.type.replace(/_/g, ' ')}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tx.quantity}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{tx.reference_type || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-dim)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state"><h3>Inventory record not found</h3></div>
      )}

      {/* ── Modal ─────────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, margin: 0 }}>
            <h3 style={{ marginBottom: 16 }}>{modal === 'add' ? 'Add Stock' : 'Remove Stock'}</h3>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input type="number" className="form-input" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input type="text" className="form-input" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className={modal === 'add' ? 'btn-primary' : 'btn-danger'} onClick={handleStockAction} disabled={submitting || !quantity || Number(quantity) < 1}>
                {submitting ? 'Updating…' : modal === 'add' ? 'Add Stock' : 'Remove Stock'}
              </button>
              <button className="btn-secondary" onClick={() => setModal(null)} disabled={submitting}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
