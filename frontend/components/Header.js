'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close nav when route changes
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Header scroll-shadow (matches original main.js initHeaderScrollState)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image
            src="/images/logo.png"
            alt="Sigma Infotech logo"
            width={38}
            height={38}
            priority
          />
          <span>
            <span className="brand-name">Sigma Infotech</span>
            <span className="brand-tag">Upgrade · Repair · Save</span>
          </span>
        </Link>

        <nav className={`main-nav${navOpen ? ' open' : ''}`} id="main-nav">
          <Link href="/" className={isActive('/') && pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <Link href="/shop" className={isActive('/shop') ? 'active' : ''}>
            Shop
          </Link>
          <Link href="/contact" className={isActive('/contact') ? 'active' : ''}>
            Contact &amp; Repair
          </Link>
        </nav>

        <div className="header-actions">
          <button className="icon-btn" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 7H6" />
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            <span className="cart-count">{cartCount}</span>
          </button>

          <button
            className="nav-toggle"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
