import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailPage from '../products/[slug]/ProductDetailClient';
import { buildProductJsonLd, buildProductMetadata, fetchProductAuthors, fetchProductBySlug, jsonLdString } from '@/lib/seo';

const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || '';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return { title: 'Shobaz - Online Bookstore', robots: { index: false } };
  return buildProductMetadata(product, slug, FB_APP_ID);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  // If no product found for this slug, show 404
  if (!product) notFound();

  const resolvedSlug = product.slug || slug;
  const resolvedParams = Promise.resolve({ slug: resolvedSlug });
  const authors = await fetchProductAuthors(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildProductJsonLd(product, resolvedSlug, authors)) }}
      />
      <ProductDetailPage params={resolvedParams} initialProduct={product} initialAuthors={authors} />
    </>
  );
}
