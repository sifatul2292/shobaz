import { Metadata } from 'next';
import HomeClient from './HomeClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

async function getHomeSeo() {
  try {
    const res = await fetch(`${API_BASE}/api/seoPage/get-by/home_page`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getHomeSeo();

  const title = seo?.name || 'Shobaz - অনলাইন বইয়ের দোকান';
  const description =
    seo?.seoDescription ||
    'শোবাজ — বাংলাদেশের বিশ্বস্ত অনলাইন বইয়ের দোকান। সেরা বাংলা বই, ইসলামিক বই ও পাঠ্যবই অর্ডার করুন।';
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
