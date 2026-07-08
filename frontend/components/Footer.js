'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email) return;
    // Backend-ready: replace with fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <Image
                src="/images/logo.png"
                alt="Sigma Infotech logo"
                width={36}
                height={36}
                style={{ width: '36px', height: '36px' }}
              />
              <span className="brand-name">Sigma Infotech</span>
            </div>
            <p>
              Used laptops, desktops &amp; printers — sales, service and upgrades at Pumpwell
              Circle, Mangalore.
            </p>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link href="/shop">Used Laptops</Link></li>
              <li><Link href="/shop">Used Desktops</Link></li>
              <li><Link href="/shop">Printers</Link></li>
              <li><Link href="/shop">Accessories</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/contact">Book a Repair</Link></li>
              <li><Link href="/contact">Sell / Trade-In</Link></li>
              <li><Link href="/contact">Warranty Info</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Newsletter</h4>
            <p style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
              Get notified when fresh stock arrives.
            </p>
            {subscribed ? (
              <p style={{ fontSize: '13px', color: 'var(--signal)', marginTop: '14px' }}>
                Thanks — you&apos;re on the list!
              </p>
            ) : (
              <form className="newsletter-form" onSubmit={handleNewsletter}>
                <input
                  type="email"
                  placeholder="Your email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">Join</button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Sigma Infotech. All rights reserved.</span>
          <span>G9, Vishwas Heights Building, Pumpwell Circle, Mangalore – 575002</span>
        </div>
      </div>
    </footer>
  );
}
