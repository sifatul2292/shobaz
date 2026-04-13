'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">অর্ডার সফল!</h1>
          <p className="text-gray-600 mb-6">আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
          <div className="flex gap-3 justify-center">
            <Link href="/products" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">আরও কেনাকুষ্টা</Link>
            <Link href="/profile/orders" className="border border-green-600 text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50">অর্ডার দেখুন</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}