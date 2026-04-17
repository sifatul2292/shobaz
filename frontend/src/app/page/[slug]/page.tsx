'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import Link from 'next/link';
import { FaChevronLeft } from 'react-icons/fa';

interface PageData {
  name: string;
  content: string;
  isHtml: boolean;
  menuLabel?: string;
}

export default function AdditionalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/additional-page/${slug}`)
      .then(res => {
        if (res.data?.data) {
          setPageData(res.data.data);
          document.title = `${res.data.data.menuLabel || res.data.data.name} - Shobaz`;
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6">
          <FaChevronLeft className="text-xs" />
          হোমপেজে ফিরুন
        </Link>

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        )}

        {notFound && !loading && (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📄</p>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">পেজটি পাওয়া যায়নি</h2>
            <p className="text-gray-500 mb-6">এই পেজটি হয়তো সরানো হয়েছে বা এখনো তৈরি হয়নি।</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors">
              হোমপেজে যান
            </Link>
          </div>
        )}

        {pageData && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Page header */}
            <div className="px-8 py-6 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800">
                {pageData.menuLabel || pageData.name}
              </h1>
            </div>

            {/* Page content */}
            <div className="px-8 py-8">
              {pageData.isHtml ? (
                <div
                  className="prose prose-green max-w-none text-gray-700 leading-relaxed
                    prose-headings:text-gray-800 prose-headings:font-bold
                    prose-p:mb-4 prose-p:leading-relaxed
                    prose-ul:list-disc prose-ul:pl-6
                    prose-ol:list-decimal prose-ol:pl-6
                    prose-li:mb-1
                    prose-a:text-green-600 prose-a:underline hover:prose-a:text-green-700
                    prose-strong:text-gray-800
                    prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2"
                  dangerouslySetInnerHTML={{ __html: pageData.content }}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {pageData.content}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
