'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import * as orderService from '@/services/orderService';
import * as paymentService from '@/services/paymentService';
import * as addressService from '@/services/addressService';

const addressSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address_line_1: z.string().min(1, 'Address line 1 is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Pincode is required'),
  country: z.string().default('India'),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { items, total: cartTotal, itemCount, initialized: cartInitialized, clearCart, fetchCart } = useCart();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  useEffect(() => {
    document.title = 'Checkout | Sigma Infotech';
  }, []);

  const shipping = cartTotal > 999 ? 0 : 99;
  const grandTotal = cartTotal + shipping;

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors: formErrors, isSubmitting: formSubmitting },
  } = useForm({ resolver: zodResolver(addressSchema), defaultValues: { country: 'India' } });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (cartInitialized && items.length === 0 && !authLoading && !submitting && !processingPayment && !createdOrderId) {
      router.push('/cart');
    }
  }, [cartInitialized, items.length, authLoading, submitting, processingPayment, createdOrderId, router]);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const data = await addressService.list();
      const addrList = Array.isArray(data) ? data : data.data || data.addresses || [];
      setAddresses(addrList);
      const defaultAddr = addrList.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addrList.length > 0) {
        setSelectedAddressId(addrList[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && step === 1) {
      fetchAddresses();
    }
  }, [isAuthenticated, step, fetchAddresses]);

  const onAddressSubmit = async (formData) => {
    try {
      setError('');
      const result = await addressService.create(formData);
      const newAddr = result.data || result.address || result;
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowAddressForm(false);
      resetForm({ country: 'India' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let orderId = createdOrderId;

      // Only create order if we don't already have one
      if (!orderId) {
        const orderData = await orderService.create({
          addressId: selectedAddressId,
          shippingCharge: shipping,
          taxRate: 0,
        });
        orderId = orderData.data?.id || orderData.order?.id || orderData.id;
        setCreatedOrderId(orderId);
      }

      const amountInPaise = Math.round(grandTotal * 100);
      const paymentOrderData = await paymentService.createOrder({ orderId, amount: amountInPaise });

      await launchRazorpay(paymentOrderData, orderId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const launchRazorpay = (paymentOrder, orderId) => {
    return new Promise((resolve, reject) => {
      setProcessingPayment(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: paymentOrder.data?.key || paymentOrder.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: paymentOrder.data?.amount || paymentOrder.amount,
          currency: paymentOrder.data?.currency || paymentOrder.currency || 'INR',
          name: 'Sigma Infotech',
          description: 'Order Payment',
          order_id: paymentOrder.data?.razorpay_order_id || paymentOrder.razorpay_order_id,
          handler: async function (response) {
            try {
              await paymentService.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              });
              await clearCart();
              router.push(`/orders/${orderId}`);
              resolve(response);
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
              setProcessingPayment(false);
              reject(err);
            }
          },
          prefill: {
            name: user?.full_name || user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#0d1a35',
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
              setSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setProcessingPayment(false);
          setError(response.error?.description || 'Payment failed. Please try again.');
          setSubmitting(false);
        });
        rzp.open();
      };
      script.onerror = () => {
        setProcessingPayment(false);
        setError('Failed to load payment gateway. Please try again.');
        setSubmitting(false);
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) existingScript.remove();
      }
    };
  }, []);

  if (authLoading || !cartInitialized) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--signal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--ink-dim)' }}>Loading checkout...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || (items.length === 0 && !submitting && !processingPayment && !createdOrderId)) {
    return null;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/cart">Cart</Link>
            <span>/</span>
            <span>Checkout</span>
          </div>
          <h1>Checkout</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container">
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

            {/* ── STEP INDICATORS ───────────────────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
              {[
                { num: 1, label: 'Shipping' },
                { num: 2, label: 'Review' },
                { num: 3, label: 'Payment' },
              ].map((s) => (
                <div
                  key={s.num}
                  onClick={() => s.num < step && setStep(s.num)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: step === s.num ? 'var(--navy)' : step > s.num ? 'var(--signal)' : 'var(--surface)',
                    color: step === s.num || step > s.num ? '#fff' : 'var(--ink-dim)',
                    border: '1px solid var(--line)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: s.num < step ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  }}
                >
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: step > s.num ? 'rgba(255,255,255,0.25)' : step === s.num ? 'var(--signal)' : 'var(--surface-2)',
                    color: step === s.num ? 'var(--navy)' : step > s.num ? '#fff' : 'var(--ink-dim)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    {step > s.num ? '✓' : s.num}
                  </span>
                  {s.label}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>
              <div>
                {/* ── STEP 1: SHIPPING ADDRESS ───────────── */}
                {step === 1 && (
                  <div>
                    <h2 style={{ fontSize: 22, marginBottom: 24 }}>Shipping Address</h2>

                    {loadingAddresses ? (
                      <p style={{ color: 'var(--ink-dim)' }}>Loading addresses...</p>
                    ) : addresses.length === 0 && !showAddressForm ? (
                      <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        padding: 40,
                        textAlign: 'center',
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 48, height: 48, color: 'var(--ink-faint)', margin: '0 auto 16px' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <h3 style={{ fontSize: 18, marginBottom: 8 }}>No addresses found</h3>
                        <p style={{ color: 'var(--ink-dim)', marginBottom: 20, fontSize: 14 }}>
                          Please add a shipping address before proceeding.
                        </p>
                        <button
                          className="btn btn-copper"
                          onClick={() => setShowAddressForm(true)}
                        >
                          Add Address
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              style={{
                                background: 'var(--surface)',
                                border: `2px solid ${selectedAddressId === addr.id ? 'var(--signal)' : 'var(--line)'}`,
                                padding: '18px 20px',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s ease',
                                position: 'relative',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                    {addr.full_name}
                                  </div>
                                  <div style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.6 }}>
                                    <div>{addr.address_line_1}</div>
                                    {addr.address_line_2 && <div>{addr.address_line_2}</div>}
                                    <div>{addr.city}, {addr.state} {addr.postal_code}</div>
                                    {addr.phone && <div>Phone: {addr.phone}</div>}
                                  </div>
                                </div>
                                <input
                                  type="radio"
                                  name="address"
                                  checked={selectedAddressId === addr.id}
                                  onChange={() => setSelectedAddressId(addr.id)}
                                  style={{ accentColor: 'var(--signal)', width: 18, height: 18, marginTop: 4 }}
                                />
                              </div>
                              {addr.is_default && (
                                <span style={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 40,
                                  background: 'var(--signal)',
                                  color: '#fff',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}>
                                  Default
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {!showAddressForm && (
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(true)}
                            style={{ fontSize: 14, color: 'var(--blue)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            + Add new address
                          </button>
                        )}
                      </>
                    )}

                    {/* ── INLINE ADDRESS FORM ───────────────── */}
                    {showAddressForm && (
                      <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        padding: 24,
                        marginTop: 16,
                      }}>
                        <h3 style={{ fontSize: 17, marginBottom: 20 }}>
                          {addresses.length > 0 ? 'Add New Address' : 'Add Shipping Address'}
                        </h3>
                        <form onSubmit={handleSubmit(onAddressSubmit)}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="field" style={{ gridColumn: '1 / -1' }}>
                              <label>Full Name *</label>
                              <input
                                type="text"
                                className={formErrors.full_name ? 'error' : ''}
                                {...register('full_name')}
                              />
                              {formErrors.full_name && (
                                <span className="field-error">{formErrors.full_name.message}</span>
                              )}
                            </div>
                          </div>

                          <div className="field" style={{ marginTop: 16 }}>
                            <label>Phone *</label>
                            <input
                              type="text"
                              className={formErrors.phone ? 'error' : ''}
                              {...register('phone')}
                            />
                            {formErrors.phone && (
                              <span className="field-error">{formErrors.phone.message}</span>
                            )}
                          </div>

                          <div className="field" style={{ marginTop: 16 }}>
                            <label>Address Line 1 *</label>
                            <input
                              type="text"
                              className={formErrors.address_line_1 ? 'error' : ''}
                              {...register('address_line_1')}
                            />
                            {formErrors.address_line_1 && (
                              <span className="field-error">{formErrors.address_line_1.message}</span>
                            )}
                          </div>

                          <div className="field" style={{ marginTop: 16 }}>
                            <label>Address Line 2</label>
                            <input type="text" {...register('address_line_2')} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                            <div className="field">
                              <label>City *</label>
                              <input
                                type="text"
                                className={formErrors.city ? 'error' : ''}
                                {...register('city')}
                              />
                              {formErrors.city && (
                                <span className="field-error">{formErrors.city.message}</span>
                              )}
                            </div>
                            <div className="field">
                              <label>State *</label>
                              <input
                                type="text"
                                className={formErrors.state ? 'error' : ''}
                                {...register('state')}
                              />
                              {formErrors.state && (
                                <span className="field-error">{formErrors.state.message}</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                            <div className="field">
                              <label>Pincode *</label>
                              <input
                                type="text"
                                className={formErrors.postal_code ? 'error' : ''}
                                {...register('postal_code')}
                              />
                              {formErrors.postal_code && (
                                <span className="field-error">{formErrors.postal_code.message}</span>
                              )}
                            </div>
                            <div className="field">
                              <label>Country</label>
                              <input type="text" {...register('country')} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button
                              type="submit"
                              className={`btn btn-copper${formSubmitting ? ' btn-loading' : ''}`}
                              disabled={formSubmitting}
                            >
                              {formSubmitting ? 'Saving...' : 'Save Address'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => {
                                setShowAddressForm(false);
                                resetForm({ country: 'India' });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {addresses.length > 0 && (
                      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                        <button
                          className="btn btn-copper"
                          disabled={!selectedAddressId}
                          onClick={() => {
                            if (!selectedAddressId) {
                              setError('Please select a shipping address');
                              return;
                            }
                            setError('');
                            setStep(2);
                          }}
                          style={{ opacity: selectedAddressId ? 1 : 0.5 }}
                        >
                          Continue to Review
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 2: REVIEW ORDER ───────────────── */}
                {step === 2 && (
                  <div>
                    <h2 style={{ fontSize: 22, marginBottom: 24 }}>Review Your Order</h2>

                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 12 }}>
                        Items
                      </h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="spec-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Product</th>
                              <th style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Qty</th>
                              <th style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Unit Price</th>
                              <th style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td style={{ padding: '12px 0', fontWeight: 500, fontSize: 14 }}>{item.name}</td>
                                <td style={{ padding: '12px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{item.quantity}</td>
                                <td style={{ padding: '12px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14 }}>₹{item.price?.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 14 }}>₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {selectedAddress && (
                      <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 12 }}>
                          Shipping To
                        </h3>
                        <div style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          padding: 16,
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {selectedAddress.full_name}
                          </div>
                          <div style={{ color: 'var(--ink-dim)' }}>
                            {selectedAddress.address_line_1}<br />
                            {selectedAddress.address_line_2 && <>{selectedAddress.address_line_2}<br /></>}
                            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}<br />
                            {selectedAddress.country || 'India'}
                          </div>
                          {selectedAddress.phone && (
                            <div style={{ color: 'var(--ink-dim)', marginTop: 4 }}>Phone: {selectedAddress.phone}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                      <button className="btn btn-outline" onClick={() => setStep(1)}>
                        Back
                      </button>
                      <button className="btn btn-copper" onClick={() => setStep(3)}>
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: PAYMENT ───────────────────── */}
                {step === 3 && (
                  <div>
                    <h2 style={{ fontSize: 22, marginBottom: 24 }}>Payment</h2>

                    <div style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      padding: 32,
                      textAlign: 'center',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 48, height: 48, color: 'var(--signal)', margin: '0 auto 16px' }}>
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <h3 style={{ fontSize: 18, marginBottom: 8 }}>Secure Payment</h3>
                      <p style={{ color: 'var(--ink-dim)', marginBottom: 24, fontSize: 14 }}>
                        You will be redirected to Razorpay to complete your payment of{' '}
                        <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div style={{ padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>UPI</div>
                        <div style={{ padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Cards</div>
                        <div style={{ padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Net Banking</div>
                        <div style={{ padding: '6px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Wallets</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                      <button className="btn btn-outline" onClick={() => setStep(2)} disabled={submitting}>
                        Back
                      </button>
                      <button
                        className={`btn btn-copper${submitting ? ' btn-loading' : ''}`}
                        onClick={handlePlaceOrder}
                        disabled={submitting || processingPayment}
                      >
                        {processingPayment
                          ? 'Processing Payment...'
                          : submitting
                            ? 'Placing Order...'
                            : createdOrderId
                              ? `Retry Payment ₹${grandTotal.toLocaleString('en-IN')}`
                              : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── ORDER SUMMARY SIDEBAR ─────────────────── */}
              <aside style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                padding: 28,
                position: 'sticky',
                top: 100,
              }}>
                <h3 style={{ fontSize: 17, marginBottom: 20 }}>Order Summary</h3>

                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 20 }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--line-soft)',
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: 'var(--ink-dim)', flex: 1, paddingRight: 12 }}>
                        {item.name} × {item.quantity}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--ink-dim)' }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: 'var(--ink-dim)' }}>
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? 'var(--signal)' : 'var(--ink)', fontWeight: 600 }}>
                    {shipping === 0 ? 'Free' : `₹${shipping}`}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 16,
                  borderTop: '1px solid var(--line)',
                  fontWeight: 700,
                  fontSize: 17,
                  fontFamily: 'var(--font-display)',
                }}>
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <div style={{
                  marginTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'center',
                  color: 'var(--ink-faint)',
                  fontSize: 12,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Secure checkout powered by Razorpay
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
