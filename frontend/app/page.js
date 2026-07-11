'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { getFeaturedProducts } from '../services/productService';
import { useScrollReveal } from '../hooks/useScrollReveal';

/** Homepage category cards — static UI metadata, not product data */
const CATEGORIES = [
  {
    title: 'Used Laptops',
    description: 'Business & student picks',
    href: '/shop',
    linkLabel: 'Browse →',
    icon: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M2 20h20"/>',
  },
  {
    title: 'Used Desktops',
    description: 'Tower & all-in-one',
    href: '/shop',
    linkLabel: 'Browse →',
    icon: '<rect x="4" y="3" width="16" height="12" rx="1"/><path d="M9 19h6M12 15v4"/>',
  },
  {
    title: 'Printers',
    description: 'Inkjet & laser',
    href: '/shop',
    linkLabel: 'Browse →',
    icon: '<path d="M6 9V3h12v6M6 18h12v3H6z"/><rect x="4" y="9" width="16" height="7" rx="1"/>',
  },
  {
    title: 'Repair & Service',
    description: 'Diagnostics, fixes, upgrades',
    href: '/contact',
    linkLabel: 'Book now →',
    icon: '<path d="M14 3l-8 9h6l-2 9 9-11h-6l1-7Z"/>',
  },
  {
    title: 'Accessories',
    description: 'Chargers, bags, mice',
    href: '/shop',
    linkLabel: 'Browse →',
    icon: '<rect x="3" y="14" width="18" height="4" rx="1"/><path d="M6 14v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M9 8h1M14 8h1"/>',
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useScrollReveal([featuredProducts]);

  useEffect(() => {
    let cancelled = false;

    async function fetchFeatured() {
      try {
        const products = await getFeaturedProducts();
        if (!cancelled) setFeaturedProducts(products);
      } catch {
        // Silently fall back to empty state — homepage should not crash
        if (!cancelled) setFeaturedProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFeatured();
    return () => { cancelled = true; };
  }, []);

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content-card">
            <span className="eyebrow">Mangalore&apos;s used-tech workshop</span>
            <h1>
              <span>Upgrade.</span>
              <span className="w-copper">Repair.</span>
              <span className="w-teal">Save.</span>
            </h1>
            <p className="hero-sub">
              Certified used laptops, desktops and printers — sold, serviced and upgraded under one
              roof. Every device is graded, tested and ready to work from day one.
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="btn btn-signal-bg">
                Browse Used Laptops
              </Link>
              <Link href="/contact" className="btn btn-white-outline">
                Book a Repair
              </Link>
            </div>
            <div className="hero-address">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.4" />
              </svg>
              <span>
                G9, Ground Floor, Vishwas Heights Building, Pumpwell Circle, Mangalore&nbsp;–&nbsp;575002
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Browse categories</span>
              <h2>Find the right device</h2>
            </div>
            <Link href="/shop" className="view-all">
              View all&nbsp;→
            </Link>
          </div>

          <div className="category-row">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.title} {...cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Featured this week</span>
              <h2>Ready-to-go laptops</h2>
            </div>
            <Link href="/shop" className="view-all">
              View all&nbsp;→
            </Link>
          </div>

          <div className="product-grid">
            {loading ? (
              /* Loading skeleton — same grid layout */
              [1, 2, 3].map((i) => (
                <div key={i} className="product-card" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                  <div className="product-thumb" />
                  <div className="product-body">
                    <span className="product-brand" style={{ background: 'var(--surface)', borderRadius: 4, width: 80, display: 'inline-block' }}>&nbsp;</span>
                    <div className="product-name" style={{ background: 'var(--surface)', borderRadius: 4, height: 20, marginTop: 6 }} />
                    <div className="product-specs" style={{ background: 'var(--surface)', borderRadius: 4, height: 14, marginTop: 8 }} />
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((p) => (
                <ProductCard
                  key={p.slug}
                  id={p.slug}
                  brand={p.brand}
                  name={p.name}
                  specs={p.specs_short}
                  price={p.price_formatted}
                  rawPrice={p.price}
                  grade={p.grade}
                  gradeClass={p.grade_class}
                  iconType={p.icon_type}
                />
              ))
            ) : (
              <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                No featured products at the moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── SERVICE PROMO ────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="promo">
            <div className="promo-copy">
              <span className="eyebrow">On-site repair &amp; service</span>
              <h2>Bring your device back to full speed</h2>
              <p>
                Screen swaps, keyboard and battery replacement, SSD/RAM upgrades, OS reinstalls and
                printer servicing — done in-house at Pumpwell Circle.
              </p>
              <div>
                <Link href="/contact" className="btn btn-teal">
                  Book a Repair Slot
                </Link>
              </div>
            </div>
            <div className="promo-visual">
              <div className="value-item" style={{ background: 'var(--surface)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M14 3l-8 9h6l-2 9 9-11h-6l1-7Z" />
                </svg>
                <h4>Fast Diagnostics</h4>
                <p>Clear estimate before any work begins</p>
              </div>
              <div className="value-item" style={{ background: 'var(--surface)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <h4>Genuine Parts</h4>
                <p>Sourced and fitted by our technicians</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRADE-IN ─────────────────────────────────────────────── */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="tradein">
            <div>
              <h3>Have an old laptop or desktop lying around?</h3>
              <p>
                Sell it to us or trade it in towards an upgrade — bring the device in for a free
                evaluation.
              </p>
            </div>
            <Link href="/contact" className="btn btn-copper">
              Sell / Trade-In
            </Link>
          </div>
        </div>
      </section>

      {/* ── LOCATION ─────────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Visit the store</span>
              <h2>Find us at Pumpwell Circle</h2>
            </div>
          </div>
          <div className="location-wrap">
            <div className="location-info">
              <div className="addr-line">
                <div className="icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.4" />
                  </svg>
                </div>
                <span>
                  G9, Ground Floor, Vishwas Heights Building,
                  <br />
                  Pumpwell Circle, Mangalore – 575002
                </span>
              </div>
              <div className="addr-line">
                <div className="icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.2a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2Z" />
                  </svg>
                </div>
                <span>Call the store for pricing, stock checks or to book a repair slot</span>
              </div>
              <a
                href="https://www.google.com/maps/place/Sigma+Infotech/@12.8693502,74.8643227,20z/data=!4m6!3m5!1s0x3ba35b8c5790749b:0xd37d456d09139830!8m2!3d12.8696402!4d74.8643814!16s%2Fg%2F11w8s6hg97"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ alignSelf: 'flex-start' }}
              >
                Get Directions &amp; Contact Details
              </a>
            </div>
            <div className="location-map">
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
  );
}
