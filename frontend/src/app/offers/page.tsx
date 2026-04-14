'use client';

import { useState, useEffect } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import Link from 'next/link';

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/product/get-all', { page: 1, limit: 20, type: 'featured' })
      .then(res => { if (res.data?.data) setProducts(res.data.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getPrice = (p: Product) => {
    if (p.discountAmount && p.discountAmount > 0) return (p.salePrice || p.price) - p.discountAmount;
    return p.salePrice || p.price;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">বিশেষ অফার</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">কোনো অফার পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] bg-gray-100 relative">
                    {product.images?.[0] ? (
                      <img src={imgUrl(product.images[0])!} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <HiOutlineBookOpen className="w-16 h-16 text-gray-300" />
                    )}
                    {product.discountAmount && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">-{product.discountAmount}%</span>}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-green-600">৳{getPrice(product)}</span>
                      {product.discountAmount && <span className="text-xs text-gray-400 line-through">৳{product.price}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}