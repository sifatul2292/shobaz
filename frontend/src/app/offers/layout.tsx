import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'অফার ও ছাড় | Shobaz',
  description: 'নির্বাচিত বইয়ে বিশেষ ছাড় ও চলমান অফারসমূহ — শবাজ।',
  alternates: { canonical: `${SITE_URL}/offers` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
