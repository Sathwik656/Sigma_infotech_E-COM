'use client';

import { useEffect } from 'react';

/**
 * useScrollReveal — attaches IntersectionObserver to matching elements,
 * adding .reveal and .in-view classes (matches initScrollReveal in main.js).
 *
 * Call this hook once inside a client component that wraps a page or section.
 *
 * @param {string[]} [deps=[]] — extra dependency array items (e.g. data arrays)
 */
export function useScrollReveal(deps = []) {
  useEffect(() => {
    const selector = [
      '.section-head', '.category-card', '.product-card',
      '.promo-copy', '.promo-visual', '.value-item', '.tradein',
      '.location-info', '.location-map', '.info-card', '.contact-form',
      '.gallery-main', '.pd-brand', '.pd-title', '.pd-price-row', '.pd-desc',
      '.spec-table', '.filters',
    ].join(', ');

    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('reveal', 'in-view'));
      return;
    }

    els.forEach((el) => {
      el.classList.add('reveal');
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children)
        : [];
      const index = siblings.indexOf(el);
      el.style.transitionDelay = `${Math.max(0, Math.min(index, 5)) * 70}ms`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
