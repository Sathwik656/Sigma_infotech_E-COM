'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getUsers, getUserById } from '@/services/adminService';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ROLE_BADGE = {
  admin: 'badge-blue',
  customer: 'badge-green',
};

export default function CustomersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const data = await getUsers(params);
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleViewUser = async (userId) => {
    setLoadingDetail(true);
    try {
      const data = await getUserById(userId);
      setSelectedUser(data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Customer Management</h2>
            {total > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>{total} customers</span>}
          </div>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 280 }}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Loading customers...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <h3>No customers found</h3>
            <p>Customers will appear here once they register.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{user.full_name || user.name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{user.email}</td>
                      <td style={{ fontSize: 13 }}>{user.phone || '—'}</td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[user.role] || 'badge-gray'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{formatDate(user.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleViewUser(user.id)}
                          disabled={loadingDetail}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, paddingBottom: 20 }}>
                <button className="btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── USER DETAIL MODAL ──────────────────────── */}
      {selectedUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{ background: 'var(--bg)', border: '1px solid var(--line)', maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto', padding: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20 }}>Customer Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-dim)' }}
              >
                &times;
              </button>
            </div>

            {selectedUser.user && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 12 }}>Account Info</h3>
                <div style={{ background: 'var(--surface)', padding: 16, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: 'var(--ink-dim)' }}>Name</span>
                    <span style={{ fontWeight: 600 }}>{selectedUser.user.full_name || selectedUser.user.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: 'var(--ink-dim)' }}>Email</span>
                    <span style={{ fontWeight: 600 }}>{selectedUser.user.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: 'var(--ink-dim)' }}>Phone</span>
                    <span style={{ fontWeight: 600 }}>{selectedUser.user.phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--ink-dim)' }}>Role</span>
                    <span className={`badge ${ROLE_BADGE[selectedUser.user.role] || 'badge-gray'}`}>{selectedUser.user.role}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.addresses && selectedUser.addresses.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 12 }}>Addresses ({selectedUser.addresses.length})</h3>
                {selectedUser.addresses.map((addr) => (
                  <div key={addr.id} style={{ background: 'var(--surface)', padding: 12, border: '1px solid var(--line)', marginBottom: 8, fontSize: 13, color: 'var(--ink-dim)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{addr.full_name}</div>
                    <div>{addr.address_line_1}</div>
                    {addr.address_line_2 && <div>{addr.address_line_2}</div>}
                    <div>{addr.city}, {addr.state} {addr.postal_code}</div>
                  </div>
                ))}
              </div>
            )}

            {selectedUser.orders && selectedUser.orders.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 12 }}>Recent Orders ({selectedUser.orders.length})</h3>
                <div className="table-responsive">
                  <table className="table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.orders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{order.order_number || order.id?.slice(0, 8)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>₹{(order.grand_total || 0).toLocaleString('en-IN')}</td>
                          <td><span className={`badge ${ROLE_BADGE[order.order_status] || 'badge-gray'}`}>{order.order_status}</span></td>
                          <td style={{ color: 'var(--ink-dim)' }}>{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
