'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { imgUrl } from '@/lib/api';

const getAuthorName = (author: any) => {
  if (!author) return '';
  if (Array.isArray(author)) return author[0]?.name || '';
  if (typeof author === 'object') return author.name || '';
  return author as string;
};

const getCurrentPrice = (product: any) => {
  const salePrice = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
};

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 mb-2">কার্ট খালি</h2>
            <Link href="/products" className="text-teal-600 hover:underline">বই কিনুন</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 আমার কার্ট</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              const price = getCurrentPrice(product);
              const authorName = getAuthorName(product.author);
              const img = product.images?.[0];
              const name = product.name || 'Untitled';
              
              return (
                <div key={item._id} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <Link href={`/products/${product.slug}`} className="shrink-0">
                    <div className="w-24 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {img ? (
                        <img src={imgUrl(img)!} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">📖</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/products/${product.slug}`} className="font-medium text-gray-800 hover:text-teal-600">{name}</Link>
                    {authorName && <p className="text-sm text-gray-500">{authorName}</p>}
                    <p className="font-bold text-teal-600 mt-2">৳{price}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border-2 border-gray-200 rounded-lg">
                        <button onClick={() => updateQuantity(product._id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-50 font-bold">-</button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(product._id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-50 font-bold">+</button>
                      </div>
                      <button onClick={() => removeItem(product._id)} className="text-red-500 text-sm hover:underline">সরান</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4">💰 অর্ডার সারাংশ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>মোট পণ্য</span><span>{items.length}টি</span></div>
              <div className="flex justify-between"><span>মোট</span><span className="font-bold text-teal-600">৳{getTotalPrice()}</span></div>
            </div>
            <Link href="/checkout" className="block w-full bg-teal-600 text-white text-center py-3 rounded-lg font-medium mt-4 hover:bg-teal-700">
              চেকআউটে যান
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}