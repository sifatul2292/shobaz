import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'প্রাইভেসি পলিসি | Shobaz',
  description: 'শবাজ কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখে।',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
