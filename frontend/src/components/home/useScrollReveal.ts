'use client';

import { useEffect } from 'react';

/**
 * Shopify-style "reveal sections on scroll".
 *
 * Content is server-rendered fully visible. After mount, only elements that
 * are still below the fold are put into a hidden "pending" state; they slide
 * up when they enter the viewport. Anything already on screen is never
 * hidden, so there is no flash, and without JS everything simply shows.
 */
export function useScrollReveal(enabled = true, deps: unknown[] = []) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const fold = window.innerHeight * 0.95;
    const pending = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
      (el) => !el.classList.contains('reveal-in') && el.getBoundingClientRect().top > fold,
    );
    if (pending.length === 0) return;
    pending.forEach((el) => el.classList.add('reveal-pending'));

    const show = (el: HTMLElement) => {
      if (!el.classList.contains('reveal-pending')) return;
      el.classList.remove('reveal-pending');
      el.classList.add('reveal-in');
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    pending.forEach((el) => io.observe(el));

    // Safety net: if the observer is throttled (background tab, embedded
    // preview), reveal on scroll position as well so nothing stays hidden.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      timer = null;
      const limit = window.innerHeight * 0.98;
      pending.forEach((el) => {
        if (el.classList.contains('reveal-pending') && el.getBoundingClientRect().top < limit) show(el);
      });
    };
    const onScroll = () => {
      if (!timer) timer = setTimeout(check, 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
}
