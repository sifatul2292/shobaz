import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'যোগাযোগ | Shobaz',
  description: 'অর্ডার, ডেলিভারি বা যেকোনো প্রশ্নে শবাজ টিমের সাথে যোগাযোগ করুন।',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
