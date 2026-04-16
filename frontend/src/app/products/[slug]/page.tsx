import { Metadata } from 'next';
import ProductDetailPage from './ProductDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
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

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/product/get-by-slug/${slug}`, {
      cache: 'no-store', // always fresh — so product updates show immediately
    });
    const data = await res.json();
    const product = data?.data;

    if (!product) return { title: 'Shobaz - Online Bookstore' };

    const title = product.seoTitle || `${product.name} | Shobaz`;
    const rawDescription = product.seoDescription || product.shortDescription || product.description || '';
    const description = stripHtml(rawDescription);
    const keywords = product.seoKeywords || '';
    const image = product.images?.[0] || '';
    const imageUrl = image.startsWith('http') ? image : `${API_BASE}/api/upload/images/${image}`;
    const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com'}/products/${slug}`;

    return {
      title,
      description,
      keywords,
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
  } catch {
    return { title: 'Shobaz - Online Bookstore' };
  }
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <ProductDetailPage params={props.params} />;
}
