import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

// Fetch slugs from a POST endpoint with pagination body
async function fetchPostSlugs(
  endpoint: string,
  slugField = 'slug',
  limit = 10000
): Promise<string[]> {
  try {
    const res = await fetch(`${API}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, limit }),
      cache: 'no-store',
    });
    const json = await res.json();
    const raw = json?.data;
    const items: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
      ? raw.data
      : [];
    return items.map((i: any) => i[slugField]).filter(Boolean);
  } catch {
    return [];
  }
}

// Fetch slugs from a GET endpoint (no pagination body needed)
async function fetchGetSlugs(
  endpoint: string,
  slugField = 'slug'
): Promise<string[]> {
  try {
    const res = await fetch(`${API}/api/${endpoint}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const json = await res.json();
    const raw = json?.data;
    const items: any[] = Array.isArray(raw) ? raw : [];
    return items.map((i: any) => i[slugField]).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogs, authors, publishers, additionalPages] = await Promise.all([
    fetchPostSlugs('product/get-all'),           // POST — returns all products
    fetchPostSlugs('blog/get-all'),               // POST — returns all blogs
    fetchPostSlugs('author/get-all'),             // POST — returns all authors
    fetchPostSlugs('publisher/get-all'),          // POST — returns all publishers
    fetchGetSlugs('additional-page/get-all'),     // GET  — returns all custom pages
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,               lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE}/products`,       lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE}/authors`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE}/publishers`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE}/blog`,           lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE}/about`,          lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/contact`,        lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/privacy-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE}/terms`,          lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const productUrls: MetadataRoute.Sitemap = products.map((slug: string) => ({
    url: `${SITE}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogs.map((slug: string) => ({
    url: `${SITE}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const authorUrls: MetadataRoute.Sitemap = authors.map((slug: string) => ({
    url: `${SITE}/products?author=${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const publisherUrls: MetadataRoute.Sitemap = publishers.map((slug: string) => ({
    url: `${SITE}/products?publisher=${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  // Dynamic pages from the Additional Pages admin section (e.g. /page/about-us)
  const additionalPageUrls: MetadataRoute.Sitemap = additionalPages.map((slug: string) => ({
    url: `${SITE}/page/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  return [
    ...staticPages,
    ...productUrls,
    ...blogUrls,
    ...authorUrls,
    ...publisherUrls,
    ...additionalPageUrls,
  ];
}
