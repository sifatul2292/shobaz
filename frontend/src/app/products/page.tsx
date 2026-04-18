import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

async function getProductsSeo() {
  try {
    const res = await fetch(`${API_BASE}/api/seoPage/get-by/products`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getProductsSeo();

  const title = seo?.name || 'সকল বই | Shobaz';
  const description =
    seo?.seoDescription ||
    'শোবাজে সকল বাংলা বই, ইসলামিক বই ও পাঠ্যবইয়ের সংগ্রহ দেখুন। ক্যাটাগরি, লেখক ও প্রকাশনী অনুযায়ী ফিল্টার করুন।';
  const keywords = seo?.keyWord || 'বাংলা বই, সকল বই, বই কিনুন, shobaz';
  const imageUrl = seo?.image
    ? seo.image.startsWith('http')
      ? seo.image
      : `${API_BASE}/api/upload/images/${seo.image}`
    : '';
  const pageUrl = `${SITE_URL}/products`;

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
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: 'Shobaz Books' }] : [],
      type: 'website',
      locale: 'bn_BD',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsClient />
    </Suspense>
  );
}
