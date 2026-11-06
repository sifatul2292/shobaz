import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'আমার অ্যাকাউন্ট | Shobaz',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
