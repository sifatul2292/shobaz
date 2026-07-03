'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { gtmPageView } from '@/lib/gtm';

export default function GTMRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Small delay to let Next.js update document.title before we read it
    const timer = setTimeout(() => {
      // Pushes page_view to dataLayer; Tagioo web/server containers forward to
      // GA4 and fire Meta PageView from this same event.
      gtmPageView(pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
