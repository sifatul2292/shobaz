'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Author } from '@/types';
import Link from 'next/link';

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuthors();
  }, [page]);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await api.post('/author/get-all', { page, limit: 20 });
      if (res.data?.data) {
        const authorsData = res.data.data.items || res.data.data;
        setAuthors(Array.isArray(authorsData) ? authorsData : []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">লেখক</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {authors.map((author) => (
              <Link key={author._id} href={`/products?author=${author.slug}`} className="text-center group">
                <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 overflow-hidden mb-3">
                  {author.image ? (
                    <img src={imgUrl(author.image)!} alt={author.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">{author.name?.charAt(0)}</div>
                  )}
                </div>
                <h3 className="font-medium text-gray-800">{author.name}</h3>
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