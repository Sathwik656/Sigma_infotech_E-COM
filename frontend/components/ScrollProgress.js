'use client';

import { useEffect } from 'react';

export default function ScrollProgress() {
  useEffect(() => {
    // Create the progress bar element (matches original main.js initScrollProgress)
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = pct + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', update);
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    };
  }, []);

  return null;
}
