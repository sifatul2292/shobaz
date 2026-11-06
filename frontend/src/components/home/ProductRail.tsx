'use client';

import { Children, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface ProductRailProps {
  children: ReactNode;
  /** Accessible name for the scroll region, e.g. the section title. */
  label: string;
  /** `compact`: small items (authors, publishers); `wide`: text cards (reviews). */
  variant?: 'products' | 'compact' | 'wide';
}

/**
 * Native scroll-snap carousel (Shopify-style slider): swipe on touch, arrow
 * buttons on desktop, edge-to-edge peek on phones. No carousel library, so it
 * renders identically on the server and never jumps on hydration.
 */
export default function ProductRail({ children, label, variant = 'products' }: ProductRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className={`rail rail--${variant}`}>
      <div ref={trackRef} className="rail-track stagger" role="region" aria-label={label} tabIndex={0}>
        {Children.map(children, (child, i) => (
          <div className="rail-item" style={{ ['--i' as string]: i }}>
            {child}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="rail-nav rail-nav--prev"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev}
        aria-label="আগের বইগুলো"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button
        type="button"
        className="rail-nav rail-nav--next"
        onClick={() => scrollByPage(1)}
        disabled={!canNext}
        aria-label="পরের বইগুলো"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  );
}
