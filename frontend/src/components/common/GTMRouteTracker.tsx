'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GTMRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Small delay to let Next.js update document.title before we read it
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'page_view_stape',
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
