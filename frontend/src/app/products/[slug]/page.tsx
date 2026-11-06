import { Metadata } from 'next';
import ProductDetailPage from './ProductDetailClient';
import { buildProductJsonLd, buildProductMetadata, fetchProductAuthors, fetchProductBySlug, jsonLdString } from '@/lib/seo';

const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || '';

// `/products/:slug` renders the same page as `/:slug`. Its canonical points at
// the short `/:slug` form (the one listed in the sitemap) so search engines
// consolidate both URLs instead of treating them as duplicates.
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return { title: 'Shobaz - Online Bookstore', robots: { index: false } };
  return buildProductMetadata(product, slug, FB_APP_ID);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  const authors = product ? await fetchProductAuthors(product) : [];

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(buildProductJsonLd(product, product.slug || slug, authors)) }}
        />
      )}
      <ProductDetailPage params={params} initialProduct={product || undefined} initialAuthors={authors} />
    </>
  );
}
