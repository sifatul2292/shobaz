'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.post('/user/wishlist/get-all', {});
      if (res.data?.data) setProducts(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success('কার্টে যোগ হয়েছে');
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await api.delete(`/user/wishlist/remove/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      toast.success('সরানো হয়েছে');
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ইচ্ছা তালিকা খালি</h2>
            <Link href="/products" className="text-green-600 hover:underline">বই কিনুন</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">আমার ইচ্ছা তালিকা</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Link href={`/products/${product.slug}`}>
                <div className="aspect-[3/4] bg-gray-100">
                  <img src={imgUrl(product.images?.[0]) || ''} alt={product.name} className="w-full h-full object-cover" />
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/products/${product.slug}`} className="text-sm font-medium line-clamp-2">{product.name}</Link>
                <p className="text-sm font-bold text-green-600 mt-1">৳{product.salePrice || product.price}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleAddToCart(product)} className="flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700">কার্টে</button>
                  <button onClick={() => removeFromWishlist(product._id)} className="px-3 py-2 border border-red-500 text-red-500 text-xs rounded hover:bg-red-50">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}