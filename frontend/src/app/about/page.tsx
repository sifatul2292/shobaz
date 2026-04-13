'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';

export default function AboutPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    api.get('/additional-page/about')
      .then(res => { if (res.data?.data) setContent(res.data.data.content); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">আমাদের সম্পর্কে</h1>
        {content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-gray-600">Shobaz বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন বইয়ের দোকান। আমরা বই প্রেমিদের জন্য বইয়ের একটি বিশাল সংগ্রহ প্রদান করি।</p>
        )}
      </main>
      <Footer />
    </div>
  );
}