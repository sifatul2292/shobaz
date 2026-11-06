import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে | Shobaz',
  description: 'শবাজ — বাংলাদেশের অনলাইন বইয়ের দোকান। জনপ্রিয় বই, নোটবুক ও বান্ডেল — সারাদেশে ডেলিভারি।',
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
