import { Metadata } from 'next';
import ProductDetailPage from './ProductDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';
const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || '';

// Strip HTML tags and decode entities for clean plain text
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/product/get-by-slug/${slug}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Shobaz - Online Bookstore' };

  const title = product.seoTitle || `${product.name} | Shobaz`;
  const rawDescription = product.seoDescription || product.shortDescription || product.description || '';
  const description = stripHtml(rawDescription);
  const keywords = product.seoKeywords || '';
  const image = product.images?.[0] || '';
  const imageUrl = image.startsWith('http') ? image : `${API_BASE}/api/upload/images/${image}`;
  const pageUrl = `${SITE_URL}/products/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Shobaz',
      images: image ? [{ url: imageUrl, width: 800, height: 600, alt: product.name }] : [],
      type: 'website',
      locale: 'bn_BD',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [imageUrl] : [],
    },
    other: FB_APP_ID ? { 'fb:app_id': FB_APP_ID } : {},
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  let jsonLd = null;
  if (product) {
    const image = product.images?.[0] || '';
    const imageUrl = image.startsWith('http') ? image : `${API_BASE}/api/upload/images/${image}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: product.name,
      url: `${SITE_URL}/products/${slug}`,
      description: stripHtml(product.shortDescription || product.description || ''),
      ...(imageUrl ? { image: imageUrl } : {}),
      ...(product.author?.name ? { author: { '@type': 'Person', name: product.author.name } } : {}),
      ...(product.publisher?.name ? { publisher: { '@type': 'Organization', name: product.publisher.name } } : {}),
      ...(product.totalPages ? { numberOfPages: product.totalPages } : {}),
      inLanguage: 'bn',
      offers: {
        '@type': 'Offer',
        price: product.salePrice || product.price,
        priceCurrency: 'BDT',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/products/${slug}`,
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailPage params={params} />
    </>
  );
}
