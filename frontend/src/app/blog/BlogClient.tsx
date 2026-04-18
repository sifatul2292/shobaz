'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Blog } from '@/types';
import Link from 'next/link';

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.post('/blog/get-all', { page, limit: 12 });
      if (res.data?.data) {
        const blogsData = res.data.data.items || res.data.data;
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ব্লগ</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link key={blog._id} href={`/blog/${blog.slug}`} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200">
                  <img src={imgUrl(blog.image) || ''} alt={blog.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 line-clamp-2 mb-2">{blog.title}</h3>
                  <p className="text-xs text-gray-500">{blog.createdAt}</p>
                </div>
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
