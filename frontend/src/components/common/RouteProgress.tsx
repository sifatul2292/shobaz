'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin top-of-page progress bar for client-side navigations.
 * Starts on internal link clicks and completes when the route (path or query)
 * changes, giving instant feedback while server components load.
 * Purely visual — it never intercepts or alters navigation.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKey = `${pathname}?${searchParams?.toString() ?? ''}`;
  const firstRender = useRef(true);

  const clearTimers = () => {
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    if (hide.current) clearTimeout(hide.current);
    trickle.current = null;
    safety.current = null;
    hide.current = null;
  };

  const finish = () => {
    clearTimers();
    setProgress(100);
    hide.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      setVisible(true);
      setProgress(12);
      trickle.current = setInterval(() => {
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
      }, 220);
      // Never leave the bar hanging (e.g. navigation cancelled or same URL).
      safety.current = setTimeout(finish, 8000);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const current = window.location;
      if (url.pathname === current.pathname && url.search === current.search) return; // hash / same page
      start();
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  return (
    <div
      aria-hidden="true"
      className="route-progress"
      style={{
        opacity: visible ? 1 : 0,
        transform: `scaleX(${progress / 100})`,
      }}
    />
  );
}
