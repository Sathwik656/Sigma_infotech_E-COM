'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import * as addressService from '@/services/addressService';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
};

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    document.title = 'My Addresses | Sigma Infotech';
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/addresses');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await addressService.list();
      setAddresses(data.addresses || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  const validateForm = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.address_line_1.trim()) errs.address_line_1 = 'Address line 1 is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.state.trim()) errs.state = 'State is required';
    if (!formData.postal_code.trim()) errs.postal_code = 'Pincode is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');

      if (editingId) {
        const result = await addressService.update(editingId, formData);
        const updated = result.address || result;
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...updated } : a)));
      } else {
        const result = await addressService.create(formData);
        const newAddr = result.address || result;
        setAddresses((prev) => [...prev, newAddr]);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      setFormErrors({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      address_line_1: addr.address_line_1 || '',
      address_line_2: addr.address_line_2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'India',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await addressService.remove(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      setError('');
      await addressService.setDefault(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set default address');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  if (authLoading) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--signal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--ink-dim)' }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>My Addresses</span>
          </div>
          <h1>My Addresses</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container" style={{ maxWidth: 900 }}>
            {error && (
              <div className="auth-error" style={{ marginBottom: 24 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── ADD BUTTON ─────────────────────────────── */}
            {!showForm && (
              <div style={{ marginBottom: 24 }}>
                <button
                  className="btn btn-copper"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(EMPTY_FORM);
                    setFormErrors({});
                    setShowForm(true);
                  }}
                >
                  + Add New Address
                </button>
              </div>
            )}

            {/* ── FORM ──────────────────────────────────── */}
            {showForm && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                padding: 28,
                marginBottom: 24,
              }}>
                <h2 style={{ fontSize: 20, marginBottom: 20 }}>
                  {editingId ? 'Edit Address' : 'Add New Address'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className={formErrors.full_name ? 'error' : ''}
                      />
                      {formErrors.full_name && (
                        <span className="field-error">{formErrors.full_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: 16 }}>
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field" style={{ marginTop: 16 }}>
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      name="address_line_1"
                      value={formData.address_line_1}
                      onChange={handleChange}
                      className={formErrors.address_line_1 ? 'error' : ''}
                    />
                    {formErrors.address_line_1 && (
                      <span className="field-error">{formErrors.address_line_1}</span>
                    )}
                  </div>

                  <div className="field" style={{ marginTop: 16 }}>
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      name="address_line_2"
                      value={formData.address_line_2}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div className="field">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={formErrors.city ? 'error' : ''}
                      />
                      {formErrors.city && (
                        <span className="field-error">{formErrors.city}</span>
                      )}
                    </div>
                    <div className="field">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={formErrors.state ? 'error' : ''}
                      />
                      {formErrors.state && (
                        <span className="field-error">{formErrors.state}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div className="field">
                      <label>Pincode *</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className={formErrors.postal_code ? 'error' : ''}
                      />
                      {formErrors.postal_code && (
                        <span className="field-error">{formErrors.postal_code}</span>
                      )}
                    </div>
                    <div className="field">
                      <label>Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button
                      type="submit"
                      className={`btn btn-copper${submitting ? ' btn-loading' : ''}`}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={cancelForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── DELETE CONFIRMATION ────────────────────── */}
            {deleteConfirm && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--warn)',
                borderLeft: '3px solid var(--warn)',
                padding: 20,
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>
                  Are you sure you want to delete this address?
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-copper"
                    style={{ background: 'var(--warn)' }}
                    onClick={() => handleDelete(deleteConfirm)}
                  >
                    Yes, Delete
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* ── ADDRESS CARDS ─────────────────────────── */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-dim)' }}>
                <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--signal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="empty-state" style={{
                textAlign: 'center',
                padding: '60px 0',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 56, height: 56, color: 'var(--ink-faint)', margin: '0 auto 20px' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>No addresses saved yet</h3>
                <p style={{ color: 'var(--ink-dim)', marginBottom: 24, fontSize: 14 }}>
                  Add your first address to use during checkout.
                </p>
                <button
                  className="btn btn-copper"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(EMPTY_FORM);
                    setFormErrors({});
                    setShowForm(true);
                  }}
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${addr.is_default ? 'var(--signal)' : 'var(--line)'}`,
                      padding: 24,
                      position: 'relative',
                    }}
                  >
                    {addr.is_default && (
                      <span className="badge" style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'var(--signal)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Default
                      </span>
                    )}

                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 16 }}>
                      {addr.full_name}
                    </div>

                    <div style={{ fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.7, marginBottom: 4 }}>
                      {addr.address_line_1}<br />
                      {addr.address_line_2 && <>{addr.address_line_2}<br /></>}
                      {addr.city}, {addr.state} {addr.postal_code}<br />
                      {addr.country || 'India'}
                    </div>

                    {addr.phone && (
                      <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4, marginBottom: 16 }}>
                        Phone: {addr.phone}
                      </div>
                    )}

                    {!addr.phone && <div style={{ marginBottom: 16 }} />}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(addr)}
                      >
                        Edit
                      </button>
                      {!addr.is_default && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--warn)', borderColor: 'rgba(194,112,61,0.3)' }}
                        onClick={() => setDeleteConfirm(addr.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .grid[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
