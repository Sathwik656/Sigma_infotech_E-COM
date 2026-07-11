'use client';

import Link from 'next/link';
import { useCart } from '../context/CartContext';

/** Reusable SVG laptop icon for product thumbnails */
function LaptopIcon() {
  return (
    <svg
      width="90"
      height="70"
      viewBox="0 0 90 70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      style={{ color: 'var(--ink-faint)' }}
    >
      <rect x="6" y="6" width="78" height="46" rx="2" />
      <path d="M2 58h86l-6 8H8Z" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg
      width="80"
      height="70"
      viewBox="0 0 80 70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      style={{ color: 'var(--ink-faint)' }}
    >
      <rect x="8" y="4" width="30" height="62" rx="2" />
      <circle cx="23" cy="14" r="2" />
      <rect x="44" y="30" width="30" height="20" rx="1" />
      <path d="M50 58h18" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg
      width="80"
      height="60"
      viewBox="0 0 80 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      style={{ color: 'var(--ink-faint)' }}
    >
      <path d="M18 22V6h44v16" />
      <rect x="8" y="22" width="64" height="24" rx="2" />
      <rect x="20" y="46" width="40" height="10" />
    </svg>
  );
}

const ICON_MAP = {
  laptop: LaptopIcon,
  desktop: DesktopIcon,
  printer: PrinterIcon,
};

/**
 * ProductCard — used on Home, Shop, and Product pages.
 *
 * Props:
 *   id          {string}  — product slug for the detail link
 *   brand       {string}  — e.g. "Dell · Latitude"
 *   name        {string}  — e.g. "Dell Latitude 7490"
 *   specs       {string}  — e.g. "i5-8350U · 8GB RAM · 256GB SSD · 14""
 *   price       {string}  — e.g. "₹19,999"
 *   grade       {string}  — "Excellent" | "Good" | "Fair"
 *   gradeClass  {string}  — "" | "grade-good" | "grade-fair"
 *   iconType    {string}  — "laptop" | "desktop" | "printer"  (default: "laptop")
 */
export default function ProductCard({
  id,
  brand,
  name,
  specs,
  price,
  grade,
  gradeClass = '',
  iconType = 'laptop',
  rawPrice,
}) {
  const { addToCart } = useCart();
  const Icon = ICON_MAP[iconType] || LaptopIcon;

  return (
    <div className="product-card">
      <div className="product-thumb">
        <span className={`grade-badge tag${gradeClass ? ' ' + gradeClass : ''}`}>{grade}</span>
        <Icon />
      </div>
      <div className="product-body">
        <span className="product-brand">{brand}</span>
        <h3 className="product-name">{name}</h3>
        <p className="product-specs">{specs}</p>
        <div className="product-footer">
          <span className="price-tag tag">
            <span className="price">{price}</span>
          </span>
          <div className="product-actions">
            <Link
              href={`/product/${id}`}
              className="btn btn-outline btn-sm"
            >
              View
            </Link>
            <button
              className="icon-cart-btn"
              aria-label={`Add ${name} to cart`}
              onClick={() => addToCart({
                id,
                name,
                brand,
                price: rawPrice,
                price_formatted: price,
                icon_type: iconType
              })}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 7H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
