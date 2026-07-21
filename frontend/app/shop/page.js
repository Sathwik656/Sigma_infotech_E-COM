'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';
import { getProducts } from '../../services/productService';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function ShopPage() {
  // Product data from API
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filter state (client-side — preserves instant UX with no re-fetch on filter change)
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [maxPrice, setMaxPrice] = useState(45000);
  const [sortBy, setSortBy] = useState('relevance');

  useScrollReveal([allProducts, categories, conditions, maxPrice, sortBy]);

  // Fetch all active products once on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        setFetchError(null);
        const result = await getProducts({ limit: 100 });
        if (!cancelled) setAllProducts(result.data ?? []);
      } catch (err) {
        if (!cancelled) setFetchError('Failed to load products. Please try refreshing the page.');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // Toggle a value in a multi-select filter array
  const toggle = (setter, value) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Filtered + sorted products (client-side for instant UX)
  const visibleProducts = useMemo(() => {
    let result = allProducts.filter((p) => {
      const catMatch   = categories.length === 0 || categories.includes(p.category);
      const condMatch  = conditions.length === 0 || conditions.includes(p.condition);
      const priceMatch = (p.price ?? 0) <= maxPrice;
      return catMatch && condMatch && priceMatch;
    });

    if (sortBy === 'price-asc')  result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sortBy === 'newest') result = [...result].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return result;
  }, [allProducts, categories, conditions, maxPrice, sortBy]);

  const priceLabel  = `Up to ₹${maxPrice.toLocaleString('en-IN')}`;
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
                    { value: 'laptop',  label: 'Laptops'  },
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
                    { value: 'good',      label: 'Good'      },
                    { value: 'fair',      label: 'Fair'      },
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
                    min={3000}
                    max={45000}
                    step={1000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                  />
                  <div className="range-values">
                    <span>₹3,000</span>
                    <span>{priceLabel}</span>
                  </div>
                </div>
              </aside>

              {/* ── PRODUCT GRID AREA ───────────────────────── */}
              <div>
                <div className="shop-toolbar">
                  <span className="result-count">
                    {loadingProducts ? 'Loading…' : resultLabel}
                  </span>
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Error state */}
                {fetchError && (
                  <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '24px' }}>
                    {fetchError}
                  </p>
                )}

                {/* Loading skeleton */}
                {loadingProducts && !fetchError && (
                  <div className="product-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="product-card" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                        <div className="product-thumb" />
                        <div className="product-body">
                          <span className="product-brand" style={{ background: 'var(--surface)', borderRadius: 4, width: 80, display: 'inline-block' }}>&nbsp;</span>
                          <div className="product-name" style={{ background: 'var(--surface)', borderRadius: 4, height: 20, marginTop: 6 }} />
                          <div className="product-specs" style={{ background: 'var(--surface)', borderRadius: 4, height: 14, marginTop: 8 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Product grid */}
                {!loadingProducts && !fetchError && (
                  <div className="product-grid">
                    {visibleProducts.map((p) => (
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
                )}

                {/* Empty state */}
                {!loadingProducts && !fetchError && visibleProducts.length === 0 && (
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
