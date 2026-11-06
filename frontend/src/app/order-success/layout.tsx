import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'অর্ডার সম্পন্ন | Shobaz',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
