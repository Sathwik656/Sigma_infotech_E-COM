'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getShipments } from '@/services/adminService';

const STATUS_OPTIONS = ['', 'pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered'];

const STATUS_BADGE = {
  pending: 'badge-yellow',
  label_created: 'badge-gray',
  in_transit: 'badge-blue',
  out_for_delivery: 'badge-blue',
  delivered: 'badge-green',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      const data = await getShipments(params);
      setShipments(data.data || data.shipments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="pagination">
        <button className="btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} className={`btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
        ))}
        <button className="btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Shipment Management</h2>
            {total > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>{total} shipments</span>}
          </div>
          <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Loading shipments…</div>
        ) : shipments.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            <h3>No shipments found</h3>
            <p>Shipments are created automatically when payment is confirmed.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Carrier</th>
                    <th>Tracking</th>
                    <th>Status</th>
                    <th>Shipped</th>
                    <th>Delivered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                        {shipment.order?.order_number || shipment.order_id?.slice(0, 8)}
                      </td>
                      <td style={{ fontSize: 13 }}>{shipment.carrier || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-dim)' }}>
                        {shipment.tracking_number || shipment.awb || '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[shipment.shipment_status] || 'badge-gray'}`}>
                          {(shipment.shipment_status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{formatDate(shipment.shipped_at)}</td>
                      <td style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{formatDate(shipment.delivered_at)}</td>
                      <td>
                        <Link href={`/admin/shipments/${shipment.order_id}`} className="btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                          Update
                        </Link>
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
    </div>
  );
}
