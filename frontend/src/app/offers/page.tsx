import { Metadata } from 'next';
import { Suspense } from 'react';
import OffersClient from './OffersClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

async function getOffersSeo() {
  try {
    const res = await fetch(`${API_BASE}/api/seoPage/get-by/offers`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getOffersSeo();

  const title = seo?.name || 'বিশেষ অফার ও ছাড় | Shobaz';
  const description =
    seo?.seoDescription ||
    'শবাজে সেরা বইগুলোতে সর্বোচ্চ ৫২% ছাড়। ফ্রি ডেলিভারি, ফ্রি নোটবুক অফার, কম্বো ডিল এবং আরও অনেক কিছু।';
  const keywords = seo?.keyWord || 'বই অফার, বই ছাড়, shobaz অফার, বই ডিল, কম দামে বই';
  const pageUrl = `${SITE_URL}/offers`;

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
      type: 'website',
      locale: 'bn_BD',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function OffersPage() {
  return (
    <Suspense>
      <OffersClient />
    </Suspense>
  );
}
