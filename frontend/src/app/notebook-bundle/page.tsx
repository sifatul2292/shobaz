import { Metadata } from 'next';
import { Suspense } from 'react';
import NotebookBundleClient from './NotebookBundleClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: 'World Cup 2026 Inspired Notebook Collection | Shobaz',
  description:
    'Argentina ও Brazil fan-দের জন্য football-inspired A5 ruled notebook collection — 70 GSM paper, matte laminated cover, cash on delivery.',
  keywords: 'football notebook, world cup 2026, messi notebook, brazil notebook, shobaz, ফুটবল নোটবুক',
  alternates: { canonical: `${SITE_URL}/notebook-bundle` },
  openGraph: {
    title: 'World Cup 2026 Inspired Notebook Collection | Shobaz',
    description: 'Argentina ও Brazil fan-দের জন্য football-inspired A5 ruled notebook collection',
    url: `${SITE_URL}/notebook-bundle`,
    siteName: 'Shobaz',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Cup 2026 Inspired Notebook Collection | Shobaz',
    description: 'Argentina ও Brazil fan-দের জন্য football-inspired A5 ruled notebook collection',
  },
};

export default function NotebookBundlePage() {
  return (
    <Suspense>
      <NotebookBundleClient />
    </Suspense>
  );
}
