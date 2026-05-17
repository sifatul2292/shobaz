import { Metadata } from 'next';
import { Suspense } from 'react';
import FinanceBundleClient from './FinanceBundleClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

export const metadata: Metadata = {
  title: 'অর্থনৈতিক স্বাধীনতার পথে ৫টি সেরা বই | Shobaz',
  description:
    'দুনিয়ার সফল মানুষদের পড়া ৫টি সেরা ফিন্যান্স বই — এখন সর্বোচ্চ ৪৪% ছাড়ে। সীমিত সময়ের অফার।',
  keywords: 'finance books, rich dad poor dad, psychology of money, intelligent investor, shobaz',
  alternates: { canonical: `${SITE_URL}/finance-bundle` },
  openGraph: {
    title: 'অর্থনৈতিক স্বাধীনতার পথে ৫টি সেরা বই | Shobaz',
    description: 'দুনিয়ার সফল মানুষদের পড়া বই — এখন সর্বোচ্চ ৪৪% ছাড়ে',
    url: `${SITE_URL}/finance-bundle`,
    siteName: 'Shobaz',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'অর্থনৈতিক স্বাধীনতার পথে ৫টি সেরা বই | Shobaz',
    description: 'দুনিয়ার সফল মানুষদের পড়া বই — এখন সর্বোচ্চ ৪৪% ছাড়ে',
  },
};

export default function FinanceBundlePage() {
  return (
    <Suspense>
      <FinanceBundleClient />
    </Suspense>
  );
}
