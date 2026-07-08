'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ContactPage() {
  useScrollReveal();

  // Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    reason: 'Repair Booking',
    device: 'Laptop',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Backend-ready: swap this comment for a fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) })
    setSubmitted(true);
    setForm({ name: '', phone: '', email: '', reason: 'Repair Booking', device: 'Laptop', message: '' });
  };

  return (
    <>
      <main style={{ flex: '1 0 auto' }}>
        <section style={{ paddingTop: '40px' }}>
          <div className="container contact-layout">

            {/* ── CONTACT FORM ───────────────────────────────── */}
            <div>
              <span className="eyebrow">Send us a message</span>
              <h2 style={{ marginTop: '10px', marginBottom: '22px' }}>
                Repair booking &amp; enquiries
              </h2>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="reason">Reason for Contact</label>
                    <select id="reason" value={form.reason} onChange={handleChange}>
                      <option>Repair Booking</option>
                      <option>Buying a Used Device</option>
                      <option>Sell / Trade-In</option>
                      <option>General Enquiry</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="device">Device Type</label>
                    <select id="device" value={form.device} onChange={handleChange}>
                      <option>Laptop</option>
                      <option>Desktop</option>
                      <option>Printer</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    placeholder="Tell us about the issue or what you're looking for..."
                    required
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-signal-bg btn-block">
                  Send Message
                </button>

                {submitted && (
                  <p className="form-status show" style={{ color: 'var(--signal)' }}>
                    Thanks — your message has been noted. We&apos;ll get back to you shortly.
                  </p>
                )}
              </form>
            </div>

            {/* ── SIDE INFO & MAP ────────────────────────────── */}
            <div>
              <div className="info-card">
                <h3>Visit the Store</h3>
                <div className="info-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.4" />
                  </svg>
                  <span>
                    G9, Ground Floor, Vishwas Heights Building, Pumpwell Circle, Mangalore – 575002
                  </span>
                </div>
                <div className="info-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.2a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2Z" />
                  </svg>
                  <span>Call the store for pricing, stock checks or to book a slot</span>
                </div>
                <div className="info-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M3 9h18M8 2v4M16 2v4" />
                  </svg>
                  <span>Open all days — hours posted at store entrance</span>
                </div>
              </div>

              <div
                className="location-map"
                style={{
                  border: '1px solid var(--line)',
                  clipPath:
                    'polygon(0 0, calc(100% - var(--cut)) 0, 100% var(--cut), 100% 100%, 0 100%)',
                  minHeight: '300px',
                }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d243.09938408613016!2d74.86454932576028!3d12.869727654707757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba35b8c5790749b%3A0xd37d456d09139830!2sSigma%20Infotech!5e0!3m2!1sen!2sin!4v1783344884187!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Sigma Infotech location map"
                />
              </div>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
