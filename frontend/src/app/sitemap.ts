import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

// Regenerate at most hourly instead of hitting the API on every crawl.
export const revalidate = 3600;

type Row = { slug?: string; updatedAt?: string };

// The `*/get-all` POST endpoints only return `_id` + `name` unless a `select`
// is supplied, which left the sitemap without a single product. The
// storefront's GET listing endpoints include slugs, so read those instead.
async function fetchRows(endpoint: string): Promise<Row[]> {
  try {
    const res = await fetch(`${API}/api/${endpoint}`, { next: { revalidate } });
    const json = await res.json();
    const raw = json?.data;
    const items: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
      ? raw.data
      : [];
    return items.filter((i) => typeof i?.slug === 'string' && i.slug.length > 0);
  } catch {
    return [];
  }
}

const enc = (slug: string) => encodeURIComponent(slug);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogs, authors, publishers, additionalPages, sections] = await Promise.all([
    fetchRows('product/get-all-data'),
    fetchRows('blog/get-all-basic'),
    fetchRows('author/get-all-basic'),
    fetchRows('publisher/get-all-basic'),
    fetchRows('additional-page/get-all'),
    fetchRows('tag/get-homepage-sections'),
  ]);

  const now = new Date();
  const lastMod = (row: Row) => (row.updatedAt ? new Date(row.updatedAt) : now);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,               lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE}/products`,       lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE}/notebook-bundle`,      lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/finance-bundle`,       lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/communication-bundle`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/authors`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${SITE}/publishers`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${SITE}/blog`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${SITE}/about`,          lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/contact`,        lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/privacy-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE}/terms`,          lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const seen = new Set<string>();
  const unique = (entries: MetadataRoute.Sitemap) =>
    entries.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE}/${enc(p.slug!)}`,
    lastModified: lastMod(p),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const collectionUrls: MetadataRoute.Sitemap = sections.map((s) => ({
    url: `${SITE}/products?tag=${enc(s.slug!)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${SITE}/blog/${enc(b.slug!)}`,
    lastModified: lastMod(b),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const authorUrls: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${SITE}/products?author=${enc(a.slug!)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const publisherUrls: MetadataRoute.Sitemap = publishers.map((p) => ({
    url: `${SITE}/products?publisher=${enc(p.slug!)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.4,
  }));

  // Dynamic pages from the Additional Pages admin section (e.g. /page/delivery-policy)
  const additionalPageUrls: MetadataRoute.Sitemap = additionalPages.map((p) => ({
    url: `${SITE}/page/${enc(p.slug!)}`,
    lastModified: lastMod(p),
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  return unique([
    ...staticPages,
    ...productUrls,
    ...collectionUrls,
    ...blogUrls,
    ...authorUrls,
    ...publisherUrls,
    ...additionalPageUrls,
  ]);
}
