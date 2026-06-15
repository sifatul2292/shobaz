import { Metadata } from 'next';
import { Suspense } from 'react';
import NotebookBundleClient from './NotebookBundleClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: '২টি নোটবুক কিনলে ১টি ফ্রি | প্রিমিয়াম ফুটবল নোটবুক — Shobaz',
  description:
    '২টি নোটবুক কিনলে ১টি ফ্রি, আর ৫০০৳+ অর্ডারে নোটবুক উপহার। ৮০ GSM অফ-হোয়াইট পেপার, Rounded Corner ডিজাইন, সারাদেশে cash on delivery।',
  keywords: 'football notebook, world cup 2026, messi notebook, brazil notebook, shobaz, ফুটবল নোটবুক',
  alternates: { canonical: `${SITE_URL}/notebook-bundle` },
  openGraph: {
    title: '২টি নোটবুক কিনলে ১টি ফ্রি | প্রিমিয়াম ফুটবল নোটবুক — Shobaz',
    description: '২টি নোটবুক কিনলে ১টি ফ্রি, আর ৫০০৳+ অর্ডারে প্রিমিয়াম নোটবুক উপহার।',
    url: `${SITE_URL}/notebook-bundle`,
    siteName: 'Shobaz',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: '২টি নোটবুক কিনলে ১টি ফ্রি | প্রিমিয়াম ফুটবল নোটবুক — Shobaz',
    description: '২টি নোটবুক কিনলে ১টি ফ্রি, আর ৫০০৳+ অর্ডারে প্রিমিয়াম নোটবুক উপহার।',
  },
};

export default function NotebookBundlePage() {
  return (
    <Suspense>
      <NotebookBundleClient />
    </Suspense>
  );
}
