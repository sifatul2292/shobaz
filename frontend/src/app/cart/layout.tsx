import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'শপিং কার্ট | Shobaz',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
