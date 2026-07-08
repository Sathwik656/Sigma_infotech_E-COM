'use client';

import Link from 'next/link';
import { useState } from 'react';
import { notFound } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../../../components/ProductCard';
import { PRODUCTS, PRODUCT_ICONS, RELATED_PRODUCTS } from '../../../lib/products';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

/** Render the appropriate SVG icon for the product type */
function ProductIcon({ type, ...svgProps }) {
  const paths = PRODUCT_ICONS[type] || PRODUCT_ICONS.laptop;
  return (
    <svg
      width="180"
      height="140"
      viewBox="0 0 90 70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      style={{ color: 'var(--ink-faint)' }}
      dangerouslySetInnerHTML={{ __html: paths }}
      {...svgProps}
    />
  );
}

export default function ProductPage({ params }) {
  const id = params.id;
  const product = PRODUCTS[id];

  // Show 404 for unknown product IDs
  if (!product) notFound();

  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);

  useScrollReveal();

  // The product name before the dash
  const shortName = product.title.split(' — ')[0];

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/shop">Shop</Link>
            <span>/</span>
            <span>{shortName}</span>
          </div>
          <h1>{shortName}</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container product-detail">

            {/* ── GALLERY ────────────────────────────────────── */}
            <div>
              <div className="gallery-main">
                <span
                  className={`grade-badge tag${product.gradeClass ? ' ' + product.gradeClass : ''}`}
                >
                  {product.grade}
                </span>
                <ProductIcon type={product.icon} />
              </div>
              <div className="gallery-thumbs">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`thumb-item${activeThumb === i ? ' active' : ''}`}
                    onClick={() => setActiveThumb(i)}
                  />
                ))}
              </div>
            </div>

            {/* ── PRODUCT INFO ───────────────────────────────── */}
            <div>
              <span className="pd-brand">{product.brand}</span>
              <h2 className="pd-title">{product.title}</h2>

              <div className="pd-price-row">
                <span className="pd-price">{product.price}</span>
                <span className="pd-price-old">{product.priceOld}</span>
                <span
                  className={`grade-badge tag${product.gradeClass ? ' ' + product.gradeClass : ''}`}
                >
                  {product.grade}
                </span>
              </div>

              <p className="pd-desc">{product.desc}</p>

              <table className="spec-table">
                <tbody>
                  {product.specs.map(([label, value]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Quantity control */}
              <div className="qty-row">
                <span style={{ fontSize: '13.5px', color: 'var(--ink-dim)' }}>Quantity</span>
                <div className="qty-control">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(9, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pd-actions">
                <button
                  className="btn btn-copper"
                  onClick={() => addToCart(shortName)}
                >
                  Add to Cart
                </button>
                <Link href="/contact" className="btn btn-outline">
                  Ask About This Unit
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pd-meta">
                <div className="pd-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span>Tested &amp; certified in-house</span>
                </div>
                <div className="pd-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.4" />
                  </svg>
                  <span>Available for pickup at Pumpwell Circle</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── RELATED PRODUCTS ─────────────────────────────── */}
        <section style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">You may also like</span>
                <h2>Similar laptops</h2>
              </div>
              <Link href="/shop" className="view-all">
                View all&nbsp;→
              </Link>
            </div>
            <div className="product-grid">
              {RELATED_PRODUCTS.filter((p) => p.id !== id).slice(0, 3).map((p) => (
                <ProductCard key={p.id} {...p} iconType="laptop" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
