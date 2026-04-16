import { Metadata } from 'next';
import ProductDetailPage from './ProductDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/product/get-by-slug/${slug}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const product = data?.data;

    if (!product) return { title: 'Shobaz - Online Bookstore' };

    const title = product.seoTitle || `${product.name} | Shobaz`;
    const description = product.seoDescription || product.shortDescription || product.description?.slice(0, 160) || '';
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
    };
  } catch {
    return { title: 'Shobaz - Online Bookstore' };
  }
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <ProductDetailPage params={props.params} />;
}
