import { Metadata } from 'next';
import BlogClient from './BlogClient';

export const metadata: Metadata = {
  title: 'ব্লগ | Shobaz - বই রিভিউ ও পাঠ আলোচনা',
  description: 'শোবাজ ব্লগে বই রিভিউ, লেখক পরিচিতি ও পাঠ আলোচনা পড়ুন। বাংলা বইয়ের সেরা পাঠ পর্যালোচনা।',
  alternates: { canonical: 'https://shobaz.com/blog' },
  openGraph: {
    title: 'ব্লগ | Shobaz - বই রিভিউ ও পাঠ আলোচনা',
    description: 'শোবাজ ব্লগে বই রিভিউ, লেখক পরিচিতি ও পাঠ আলোচনা পড়ুন।',
    url: 'https://shobaz.com/blog',
    siteName: 'Shobaz',
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ব্লগ | Shobaz - বই রিভিউ ও পাঠ আলোচনা',
    description: 'শোবাজ ব্লগে বই রিভিউ, লেখক পরিচিতি ও পাঠ আলোচনা পড়ুন।',
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
