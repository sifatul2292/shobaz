import { Metadata } from 'next';
import { Suspense } from 'react';
import CommunicationBundleClient from './CommunicationBundleClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: 'মানুষের মন জয় করার ৫টি সেরা বই | Shobaz',
  description:
    'Influence, How to Win Friends, Never Split the Difference — দুনিয়ার সেরা People Skills বই। এখন সর্বোচ্চ ৪৩% ছাড়ে। সীমিত সময়ের অফার।',
  keywords: 'communication books, influence, how to win friends, never split the difference, crucial conversations, shobaz',
  alternates: { canonical: `${SITE_URL}/communication-bundle` },
  openGraph: {
    title: 'মানুষের মন জয় করার ৫টি সেরা বই | Shobaz',
    description: 'People Skills ও Communication-এর সেরা বই — এখন সর্বোচ্চ ৪৩% ছাড়ে',
    url: `${SITE_URL}/communication-bundle`,
    siteName: 'Shobaz',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'মানুষের মন জয় করার ৫টি সেরা বই | Shobaz',
    description: 'People Skills ও Communication-এর সেরা বই — এখন সর্বোচ্চ ৪৩% ছাড়ে',
  },
};

export default function CommunicationBundlePage() {
  return (
    <Suspense>
      <CommunicationBundleClient />
    </Suspense>
  );
}
