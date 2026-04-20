import { Metadata } from 'next';
import HomeClient from './HomeClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

async function getHomeSeo() {
  try {
    const res = await fetch(`${API_BASE}/api/seoPage/get-by/home_page`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

async function getShopInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/shop-information/get`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.data ?? data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [seo, shop] = await Promise.all([getHomeSeo(), getShopInfo()]);

  const siteName = shop?.siteName || 'Shobaz';
  const shortDescription = shop?.shortDescription || 'জনপ্রিয় সকল বই এক প্ল্যাটফর্ম';
  const title = `${siteName} - ${shortDescription}`;
  const description =
    seo?.seoDescription || shortDescription;
  const keywords = seo?.keyWord || 'বাংলা বই, অনলাইন বইয়ের দোকান, ইসলামিক বই, shobaz';
  const imageUrl = seo?.image
    ? seo.image.startsWith('http')
      ? seo.image
      : `${API_BASE}/api/upload/images/${seo.image}`
    : '';

  return {
    title,
    description,
    keywords,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: 'Shobaz',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: 'Shobaz' }] : [],
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

export default function HomePage() {
  return <HomeClient />;
}
