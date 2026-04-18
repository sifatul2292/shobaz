import { Metadata } from 'next';
import PublishersClient from './PublishersClient';

export const metadata: Metadata = {
  title: 'সকল প্রকাশনী | Shobaz',
  description: 'শোবাজে সকল বাংলা বইয়ের প্রকাশনীর তালিকা। আপনার পছন্দের প্রকাশনীর বই খুঁজুন এবং অর্ডার করুন।',
  alternates: { canonical: 'https://shobaz.com/publishers' },
  openGraph: {
    title: 'সকল প্রকাশনী | Shobaz',
    description: 'শোবাজে সকল বাংলা বইয়ের প্রকাশনীর তালিকা। আপনার পছন্দের প্রকাশনীর বই খুঁজুন।',
    url: 'https://shobaz.com/publishers',
    siteName: 'Shobaz',
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'সকল প্রকাশনী | Shobaz',
    description: 'শোবাজে সকল বাংলা বইয়ের প্রকাশনীর তালিকা।',
  },
};

export default function PublishersPage() {
  return <PublishersClient />;
}
