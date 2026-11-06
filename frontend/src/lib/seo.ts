// Server-side SEO helpers shared by the product routes, homepage and
// collection pages. Keep this file free of client-only imports.
import type { Metadata } from 'next';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');
export const SITE_NAME = 'Shobaz';

export function stripHtml(html: string, max = 300): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function absoluteImage(image?: string | null): string {
  if (!image) return '';
  return image.startsWith('http') ? image : `${API_BASE}/api/upload/images/${image}`;
}

/**
 * Canonical short product URL (`/slug`), percent-encoded. Not trimmed: a few
 * legacy slugs contain spaces (even trailing ones) and only resolve verbatim.
 */
export function productUrl(slug: string): string {
  return `${SITE_URL}/${encodeURIComponent(safeDecode(slug))}`;
}

function firstNamed(value: any): { name?: string; slug?: string } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') return { name: value };
  return null;
}

export function productPrice(product: any): number {
  const sale = Number(product?.salePrice || product?.price || 0);
  const discount = Number(product?.discountAmount || 0);
  return Math.max(0, discount > 0 ? sale - discount : sale);
}

export function isOutOfStock(product: any): boolean {
  if (typeof product?.stock === 'number') return product.stock <= 0;
  if (product?.trackQuantity && typeof product?.quantity === 'number') return product.quantity <= 0;
  return false;
}

function safeDecode(value: string): string {
  if (!value.includes('%')) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function fetchProductBySlug(rawSlug: string, revalidate = 60) {
  // Route params can arrive still percent-encoded (e.g. legacy slugs with
  // spaces); decode once so we never double-encode when calling the API.
  const slug = safeDecode(rawSlug);
  // Try the slug as-is first, then common case variants — handles mixed-case slugs.
  const variants = Array.from(new Set([slug, slug.toLowerCase(), slug.charAt(0).toUpperCase() + slug.slice(1)]));
  for (const s of variants) {
    try {
      const res = await fetch(`${API_BASE}/api/product/get-by-slug/${encodeURIComponent(s)}`, {
        next: { revalidate },
      });
      const data = await res.json();
      if (data?.data) return data.data;
    } catch {
      // continue to next variant
    }
  }
  return null;
}

/** Full author records (image + bio) for the product's author(s). */
export async function fetchProductAuthors(product: any, revalidate = 3600): Promise<any[]> {
  const list = Array.isArray(product?.author) ? product.author : product?.author ? [product.author] : [];
  const ids = list.map((a: any) => (typeof a === 'object' ? a?._id : null)).filter(Boolean).slice(0, 3);
  const results = await Promise.all(ids.map(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/author/${id}`, { next: { revalidate } });
      const json = await res.json();
      return json?.data || null;
    } catch {
      return null;
    }
  }));
  return results.filter(Boolean);
}

/** Product + Book structured data and a breadcrumb trail for rich results. */
export function buildProductJsonLd(product: any, slug: string, authors: any[] = []) {
  const url = productUrl(product.slug || slug);
  const images = (Array.isArray(product.images) ? product.images : [])
    .map((img: string) => absoluteImage(img))
    .filter(Boolean)
    .slice(0, 6);
  const author = firstNamed(product.author);
  const publisher = firstNamed(product.publisher);
  const category = firstNamed(product.category);
  const description = stripHtml(product.seoDescription || product.shortDescription || product.description || '', 500);
  const ratingCount = Number(product.ratingCount || 0);
  const ratingAvr = Number(product.ratingAvr || 0);

  const productNode: Record<string, any> = {
    '@type': ['Product', 'Book'],
    '@id': `${url}#product`,
    name: product.name,
    url,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    sku: product.sku || product._id,
    ...(product.isbn ? { isbn: product.isbn } : {}),
    ...(author?.name ? {
      author: {
        '@type': 'Person',
        name: author.name,
        ...(author.slug ? { url: `${SITE_URL}/products?author=${encodeURIComponent(author.slug)}` } : {}),
        ...(authors[0]?.image ? { image: absoluteImage(authors[0].image) } : {}),
        ...(authors[0]?.description ? { description: stripHtml(authors[0].description, 300) } : {}),
      },
    } : {}),
    ...(publisher?.name
      ? { publisher: { '@type': 'Organization', name: publisher.name }, brand: { '@type': 'Brand', name: publisher.name } }
      : { brand: { '@type': 'Brand', name: SITE_NAME } }),
    ...(product.totalPages ? { numberOfPages: product.totalPages } : {}),
    ...(category?.name ? { category: category.name } : {}),
    inLanguage: Array.isArray(product.language) && product.language[0] === 'English' ? 'en' : 'bn',
    offers: {
      '@type': 'Offer',
      url,
      price: productPrice(product),
      priceCurrency: 'BDT',
      itemCondition: 'https://schema.org/NewCondition',
      availability: isOutOfStock(product) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
    ...(ratingCount > 0 && ratingAvr > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: ratingAvr.toFixed(1), reviewCount: ratingCount } }
      : {}),
  };

  const crumbs = [
    { name: 'হোম', item: `${SITE_URL}/` },
    { name: 'বই', item: `${SITE_URL}/products` },
    ...(category?.name && category?.slug
      ? [{ name: category.name, item: `${SITE_URL}/products?category=${encodeURIComponent(category.slug)}` }]
      : []),
    { name: product.name, item: url },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      productNode,
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
      },
    ],
  };
}

export function buildProductMetadata(product: any, slug: string, fbAppId = ''): Metadata {
  const title = product.seoTitle && product.seoTitle !== product.name
    ? product.seoTitle
    : `${product.name} | ${SITE_NAME}`;
  const description = stripHtml(product.seoDescription || product.shortDescription || product.description || '', 160);
  const imageUrl = absoluteImage(product.images?.[0]);
  const url = productUrl(product.slug || slug);
  return {
    title,
    description,
    keywords: product.seoKeywords || '',
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
      type: 'website' as const,
      locale: 'bn_BD',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    ...(fbAppId ? { other: { 'fb:app_id': fbAppId } } : {}),
  };
}

/** Escape `<` so JSON-LD can never close the surrounding script tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
