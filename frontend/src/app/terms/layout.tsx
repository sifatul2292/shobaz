import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'শর্তাবলী | Shobaz',
  description: 'শবাজ ওয়েবসাইট ব্যবহারের শর্তাবলী ও অর্ডার নীতিমালা।',
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
