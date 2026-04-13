'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Publisher } from '@/types';
import Link from 'next/link';

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPublishers();
  }, [page]);

  const fetchPublishers = async () => {
    setLoading(true);
    try {
      const res = await api.post('/publisher/get-all', { page, limit: 20 });
      if (res.data?.data) {
        const pubsData = res.data.data.items || res.data.data;
        setPublishers(Array.isArray(pubsData) ? pubsData : []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">প্রকাশনা</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {publishers.map((pub) => (
              <Link key={pub._id} href={`/products?publisher=${pub.slug}`} className="text-center group">
                <div className="w-32 h-20 mx-auto rounded-lg bg-gray-100 overflow-hidden mb-3 flex items-center justify-center">
                  {pub.image ? (
                    <img src={imgUrl(pub.image)!} alt={pub.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-sm font-medium text-gray-500 px-2">{pub.name}</span>
                  )}
                </div>
                <h3 className="font-medium text-gray-800 text-sm">{pub.name}</h3>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">আগে</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)} className={`px-4 py-2 rounded-lg border ${page === i + 1 ? 'bg-green-600 text-white' : 'hover:bg-gray-50'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">পরে</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}