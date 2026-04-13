'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    api.get('/additional-page/privacy-policy')
      .then(res => { if (res.data?.data) setContent(res.data.data.content); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">গোপনীয়তা নীতি</h1>
        {content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : <p className="text-gray-600">গোপনীয়তা নীতি যোগ করা হবে।</p>}
      </main>
      <Footer />
    </div>
  );
}