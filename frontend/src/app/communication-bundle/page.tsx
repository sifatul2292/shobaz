import { Metadata } from 'next';
import { Suspense } from 'react';
import CommunicationBundleClient from './CommunicationBundleClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: 'Communication Skills ৫ বই Bundle | Shobaz',
  description:
    'Influence, How to Win Friends, Never Split the Difference, 48 Laws of Power ও Crucial Conversations — communication ও negotiation skill শেখার ৫ বই bundle.',
  keywords: 'communication books, influence, how to win friends, never split the difference, crucial conversations, shobaz',
  alternates: { canonical: `${SITE_URL}/communication-bundle` },
  openGraph: {
    title: 'Communication Skills ৫ বই Bundle | Shobaz',
    description: 'People Skills, negotiation ও influence শেখার ৫ বই bundle',
    url: `${SITE_URL}/communication-bundle`,
    siteName: 'Shobaz',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Communication Skills ৫ বই Bundle | Shobaz',
    description: 'People Skills, negotiation ও influence শেখার ৫ বই bundle',
  },
};

export default function CommunicationBundlePage() {
  return (
    <Suspense>
      <CommunicationBundleClient />
    </Suspense>
  );
}
