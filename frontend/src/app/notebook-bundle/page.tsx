import { Metadata } from 'next';
import { Suspense } from 'react';
import NotebookBundleClient from './NotebookBundleClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: 'FIFA World Cup 2026 Notebook Collection | Shobaz',
  description:
    'ফুটবল legends-এর থিমে তৈরি প্রিমিয়াম নোটবুক কালেকশন — এখন ৫৩% ছাড়ে। Blue & White Forever, Messi\'s Glory, Hexa Loading আরও অনেক।',
  keywords: 'football notebook, world cup 2026, messi notebook, brazil notebook, shobaz, ফুটবল নোটবুক',
  alternates: { canonical: `${SITE_URL}/notebook-bundle` },
  openGraph: {
    title: 'FIFA World Cup 2026 Notebook Collection | Shobaz',
    description: 'ফুটবল legends-এর থিমে তৈরি প্রিমিয়াম নোটবুক — এখন ৫৩% ছাড়ে',
    url: `${SITE_URL}/notebook-bundle`,
    siteName: 'Shobaz',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FIFA World Cup 2026 Notebook Collection | Shobaz',
    description: 'ফুটবল legends-এর থিমে তৈরি প্রিমিয়াম নোটবুক — এখন ৫৩% ছাড়ে',
  },
};

export default function NotebookBundlePage() {
  return (
    <Suspense>
      <NotebookBundleClient />
    </Suspense>
  );
}
