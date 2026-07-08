'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import ProductCard from '../../components/ProductCard';
import { SHOP_PRODUCTS } from '../../lib/products';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ShopPage() {
  // Filter state
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [maxPrice, setMaxPrice] = useState(45000);
  const [sortBy, setSortBy] = useState('relevance');

  useScrollReveal([categories, conditions, maxPrice, sortBy]);

  // Toggle a value in a multi-select filter array
  const toggle = (setter, value) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Filtered + sorted products (matches initShopFilters logic from main.js)
  const visibleProducts = useMemo(() => {
    let result = SHOP_PRODUCTS.filter((p) => {
      const catMatch = categories.length === 0 || categories.includes(p.category);
      const condMatch = conditions.length === 0 || conditions.includes(p.condition);
      const priceMatch = p.priceNum <= maxPrice;
      return catMatch && condMatch && priceMatch;
    });

    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.priceNum - b.priceNum);
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.priceNum - a.priceNum);

    return result;
  }, [categories, conditions, maxPrice, sortBy]);

  const priceLabel = `Up to ₹${maxPrice.toLocaleString('en-IN')}`;
  const resultLabel = `${visibleProducts.length} item${visibleProducts.length === 1 ? '' : 's'} found`;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Shop</span>
          </div>
          <h1>Used Laptops, Desktops &amp; Printers</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container">
            <div className="shop-layout">

              {/* ── SIDEBAR FILTERS ─────────────────────────── */}
              <aside className="filters">
                <div className="filter-group">
                  <h4>Category</h4>
                  {[
                    { value: 'laptop', label: 'Laptops' },
                    { value: 'desktop', label: 'Desktops' },
                    { value: 'printer', label: 'Printers' },
                  ].map(({ value, label }) => (
                    <label key={value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={categories.includes(value)}
                        onChange={() => toggle(setCategories, value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="filter-group">
                  <h4>Condition Grade</h4>
                  {[
                    { value: 'excellent', label: 'Excellent' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                  ].map(({ value, label }) => (
                    <label key={value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={conditions.includes(value)}
                        onChange={() => toggle(setConditions, value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="filter-group">
                  <h4>Max Budget</h4>
                  <input
                    type="range"
                    className="price-range"
                    min={8000}
                    max={45000}
                    step={1000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                  />
                  <div className="range-values">
                    <span>₹8,000</span>
                    <span>{priceLabel}</span>
                  </div>
                </div>
              </aside>

              {/* ── PRODUCT GRID AREA ───────────────────────── */}
              <div>
                <div className="shop-toolbar">
                  <span className="result-count">{resultLabel}</span>
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>

                <div className="product-grid">
                  {visibleProducts.map((p) => (
                    <ProductCard key={p.id} {...p} />
                  ))}
                </div>

                {visibleProducts.length === 0 && (
                  <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '24px' }}>
                    No products match the current filters.
                  </p>
                )}
              </div>

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
