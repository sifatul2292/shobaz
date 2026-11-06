import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private / transactional pages carry no search value and waste crawl budget.
        disallow: [
          '/cart',
          '/checkout',
          '/order-success',
          '/profile',
          '/wishlist',
          '/login',
          '/register',
          '/admin',
          '/ingest/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
