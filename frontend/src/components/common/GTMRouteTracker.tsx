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
      // Fires page_view_stape (GA4 -> sGTM) + Meta PageView with one shared event_id.
      gtmPageView(pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
