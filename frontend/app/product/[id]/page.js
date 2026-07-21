'use client';

import Link from 'next/link';
import { useState, use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../../../components/ProductCard';
import { getProductBySlug, getRelatedProducts } from '../../../services/productService';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

/* -----------------------------------------------------------------------
   Product icon SVG paths — UI-only constants, not product data.
   These remain on the frontend as they are pure rendering assets.
   ----------------------------------------------------------------------- */
const PRODUCT_ICONS = {
  laptop:  '<rect x="6" y="6" width="78" height="46" rx="2"/><path d="M2 58h86l-6 8H8Z"/>',
  desktop: '<rect x="10" y="4" width="34" height="62" rx="2"/><circle cx="27" cy="14" r="2"/><rect x="50" y="30" width="34" height="24" rx="1"/><path d="M58 62h20"/>',
  printer: '<path d="M20 24V6h50v18"/><rect x="8" y="24" width="74" height="28" rx="2"/><rect x="22" y="52" width="46" height="12"/>',
};

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

/** Loading skeleton for the product detail layout */
function ProductDetailSkeleton() {
  return (
    <div className="container product-detail" style={{ opacity: 0.4 }}>
      <div>
        <div className="gallery-main" />
      </div>
      <div>
        <div style={{ background: 'var(--surface)', borderRadius: 4, height: 16, width: 120, marginBottom: 12 }} />
        <div style={{ background: 'var(--surface)', borderRadius: 4, height: 28, marginBottom: 16 }} />
        <div style={{ background: 'var(--surface)', borderRadius: 4, height: 20, width: 100, marginBottom: 16 }} />
        <div style={{ background: 'var(--surface)', borderRadius: 4, height: 80, marginBottom: 16 }} />
      </div>
    </div>
  );
}

export default function ProductPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.id; // route param is [id] but we use it as slug

  const [product, setProduct]           = useState(null);
  const [relatedProducts, setRelated]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [notFoundError, setNotFound]    = useState(false);

  const { addToCart } = useCart();
  const [qty, setQty]                   = useState(1);
  const [activeThumb, setActiveThumb]   = useState(0);

  useScrollReveal([product]);

  // Fetch product + related on slug change
  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setNotFound(false);

      try {
        const [productRes, relatedRes] = await Promise.all([
          getProductBySlug(slug),
          getRelatedProducts(slug, 3),
        ]);

        if (!cancelled) {
          setProduct(productRes.data);
          setRelated(relatedRes);
        }
      } catch (err) {
        if (!cancelled) {
          // 404 from server → trigger Next.js not-found
          if (err?.response?.status === 404) {
            setNotFound(true);
          }
          // For other errors we leave product as null — show a friendly message
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => { cancelled = true; };
  }, [slug]);

  // Trigger Next.js 404 page for unknown slugs
  if (notFoundError) notFound();

  // Loading state
  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <div className="breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/shop">Shop</Link>
              <span>/</span>
              <span>Loading…</span>
            </div>
            <h1>Loading…</h1>
          </div>
        </div>
        <main>
          <section>
            <ProductDetailSkeleton />
          </section>
        </main>
      </>
    );
  }

  // Error state (fetch failed but not 404)
  if (!product) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <div className="breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/shop">Shop</Link>
            </div>
            <h1>Product Unavailable</h1>
          </div>
        </div>
        <main>
          <section>
            <div className="container">
              <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                Could not load this product. Please try again or{' '}
                <Link href="/shop">browse the shop</Link>.
              </p>
            </div>
          </section>
        </main>
      </>
    );
  }

  // The product name before the dash
  const shortName = product.name.split(' — ')[0];

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
              <div className="gallery-main" style={{ position: 'relative', overflow: 'hidden' }}>
                <span
                  className={`grade-badge tag${product.grade_class ? ' ' + product.grade_class : ''}`}
                  style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}
                >
                  {product.grade}
                </span>
                {(() => {
                  const images = product.images || [];
                  const allImages = product.thumbnail_url
                    ? [{ url: product.thumbnail_url, is_primary: true }, ...images.filter(img => img.url !== product.thumbnail_url)]
                    : images;
                  const hasImages = allImages.length > 0;
                  const currentImage = hasImages && allImages[activeThumb] ? allImages[activeThumb] : null;

                  if (!hasImages) {
                    return <ProductIcon type={product.icon_type} />;
                  }

                  return (
                    <img
                      src={currentImage?.url}
                      alt={currentImage?.alt || product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f9f9f9' }}
                    />
                  );
                })()}
              </div>
              <div className="gallery-thumbs">
                {(() => {
                  const images = product.images || [];
                  const allImages = product.thumbnail_url
                    ? [{ url: product.thumbnail_url, is_primary: true }, ...images.filter(img => img.url !== product.thumbnail_url)]
                    : images;

                  if (allImages.length === 0) {
                    return [0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`thumb-item${activeThumb === i ? ' active' : ''}`}
                        onClick={() => setActiveThumb(i)}
                      />
                    ));
                  }

                  return allImages.map((img, i) => (
                    <div
                      key={img.id || i}
                      className={`thumb-item${activeThumb === i ? ' active' : ''}`}
                      onClick={() => setActiveThumb(i)}
                      style={{ backgroundImage: `url(${img.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* ── PRODUCT INFO ───────────────────────────────── */}
            <div>
              <span className="pd-brand">{typeof product.brand === 'object' ? product.brand?.name : product.brand}</span>
              <h2 className="pd-title">{product.name}</h2>

              <div className="pd-price-row">
                <span className="pd-price">{product.price_formatted || (product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : '')}</span>
                {product.price_old_formatted && (
                  <span className="pd-price-old">{product.price_old_formatted}</span>
                )}
                <span
                  className={`grade-badge tag${product.grade_class ? ' ' + product.grade_class : ''}`}
                >
                  {product.grade}
                </span>
              </div>

              <p className="pd-desc">{product.description}</p>

              {Array.isArray(product.specifications) && product.specifications.length > 0 && (
                <table className="spec-table">
                  <tbody>
                    {product.specifications.map(([label, value]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

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
                    onClick={() => setQty((q) => Math.min(product.stock ?? 9, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pd-actions">
                <button
                  className="btn btn-copper"
                  onClick={() => addToCart({
                    id: product.id,
                    name: shortName,
                    brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
                    price: product.price,
                    price_formatted: product.price_formatted || (product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : ''),
                    icon_type: product.icon_type
                  }, qty)}
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
        {relatedProducts.length > 0 && (
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">You may also like</span>
                  <h2>Similar {typeof product.category === 'object' ? product.category?.name : product.category}s</h2>
                </div>
                <Link href="/shop" className="view-all">
                  View all&nbsp;→
                </Link>
              </div>
              <div className="product-grid">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.slug}
                    id={p.slug}
                    productId={p.id}
                    brand={p.brand}
                    name={p.name}
                    specs={p.specs_short}
                    price={p.price_formatted || (p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '')}
                    rawPrice={p.price}
                    grade={p.grade}
                    gradeClass={p.grade_class}
                    iconType={p.icon_type}
                    imageUrl={p.thumbnail_url || (Array.isArray(p.images) && p.images.length > 0 ? p.images.find(img => img.is_primary)?.url || p.images[0]?.url : null)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
