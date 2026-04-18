import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

// Fetches all items from a paginated POST endpoint and returns their slugs
async function fetchAllSlugs(
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
    // Handle both { data: [...] } and { data: { data: [...], items: [...] } }
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogs, authors, publishers] = await Promise.all([
    fetchAllSlugs('product/get-all-basic'),
    fetchAllSlugs('blog/get-all'),
    fetchAllSlugs('author/get-all'),
    fetchAllSlugs('publisher/get-all'),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE}/authors`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/publishers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
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

  return [...staticPages, ...productUrls, ...blogUrls, ...authorUrls, ...publisherUrls];
}
