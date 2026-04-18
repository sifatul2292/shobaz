import { Metadata } from 'next';
import AuthorsClient from './AuthorsClient';

export const metadata: Metadata = {
  title: 'সকল লেখক | Shobaz',
  description: 'শোবাজে সকল বাংলা বইয়ের লেখকদের তালিকা। আপনার প্রিয় লেখকের বই খুঁজুন এবং অর্ডার করুন।',
  alternates: { canonical: 'https://shobaz.com/authors' },
  openGraph: {
    title: 'সকল লেখক | Shobaz',
    description: 'শোবাজে সকল বাংলা বইয়ের লেখকদের তালিকা। আপনার প্রিয় লেখকের বই খুঁজুন।',
    url: 'https://shobaz.com/authors',
    siteName: 'Shobaz',
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'সকল লেখক | Shobaz',
    description: 'শোবাজে সকল বাংলা বইয়ের লেখকদের তালিকা।',
  },
};

export default function AuthorsPage() {
  return <AuthorsClient />;
}
