'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LazyImage from '@/components/ui/LazyImage';
import api, { imgUrl } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types';

const FEATURES = [
  { icon: '📓', label: 'Premium Quality', sub: 'উন্নত মানের কাগজ' },
  { icon: '⚽', label: 'Football Themed', sub: 'ফুটবল প্রেমীদের জন্য' },
  { icon: '📐', label: 'A5 Size', sub: 'পরিপাটি সাইজ' },
  { icon: '🚀', label: 'Fast Delivery', sub: 'দ্রুত ডেলিভারি' },
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function NotebookCard({
  product,
  onAddToCart,
  added,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  added: boolean;
}) {
  const img = product.images?.[0];
  const price = product.salePrice || product.price;
  const regularPrice = product.discountAmount && product.discountAmount > 0 ? price + product.discountAmount : null;
  const discountPct = regularPrice ? Math.round(((regularPrice - price) / regularPrice) * 100) : null;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col">
      <Link href={`/products/${product.slug}`} className="block relative overflow-hidden bg-gray-50 aspect-[3/4]">
        {img ? (
          <LazyImage
            src={imgUrl(img)!}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <span className="text-6xl">📓</span>
          </div>
        )}
        {discountPct && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            -{discountPct}%
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-3">
          <StarRating count={5} />
          <span className="text-xs text-gray-400">(50+)</span>
        </div>

        <div className="flex items-baseline gap-2 mb-4 mt-auto">
          <span className="text-xl font-black text-green-600" style={{ fontFamily: 'var(--sans)' }}>
            ৳{price}
          </span>
          {regularPrice && (
            <span className="text-sm text-gray-400 line-through" style={{ fontFamily: 'var(--sans)' }}>
              ৳{regularPrice}
            </span>
          )}
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
            added
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md active:scale-95'
          }`}
        >
          {added ? '✓ কার্টে আছে' : 'কার্টে যোগ করুন'}
        </button>
      </div>
    </div>
  );
}

export default function NotebooksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    api
      .get('/product/get-all-data', {
        params: { 'tags.name': 'notebook', page: 1, limit: 20, status: 'publish' },
      })
      .then((res) => {
        if (res.data?.data) setProducts(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem(product, 1);
      setAddedIds((prev) => new Set(prev).add(product._id));
    },
    [addItem],
  );

  const handleAddAll = useCallback(() => {
    products.forEach((p) => {
      addItem(p, 1);
      setAddedIds((prev) => new Set(prev).add(p._id));
    });
  }, [products, addItem]);

  const totalPrice = products.reduce((sum, p) => sum + (p.salePrice || p.price), 0);
  const allAdded = products.length > 0 && products.every((p) => addedIds.has(p._id));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#0a4d1a] via-[#1a6e2e] to-[#0a4d1a] text-white overflow-hidden">
        {/* decorative football pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none" aria-hidden>
          {['⚽', '🏆', '⚽', '🌟', '⚽'].map((e, i) => (
            <span
              key={i}
              className="absolute text-[120px] leading-none"
              style={{ top: `${[10, 60, 20, 70, 40][i]}%`, left: `${[5, 20, 55, 75, 90][i]}%` }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
            ⚡ Launch Offer — সীমিত সময়ের অফার
          </span>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
            Football Notebook
            <br />
            <span className="text-yellow-400">Collection</span>
          </h1>

          <p className="text-green-200 text-lg md:text-xl mb-2">
            ফুটবলের উত্তেজনা এখন তোমার নোটবুকে
          </p>
          <p className="text-green-300 text-sm mb-8">
            World Cup legends. Iconic moments. Premium quality notebooks for true fans.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-3 text-center">
              <div className="text-3xl font-black text-yellow-400" style={{ fontFamily: 'var(--sans)' }}>
                ৳190
              </div>
              <div className="text-xs text-green-200 line-through" style={{ fontFamily: 'var(--sans)' }}>
                ৳400
              </div>
              <div className="text-xs text-green-300">প্রতিটি নোটবুক</div>
            </div>
            <div className="bg-red-500 rounded-2xl px-6 py-3 text-center shadow-lg">
              <div className="text-3xl font-black text-white">53%</div>
              <div className="text-xs text-red-200">ছাড়</div>
            </div>
          </div>

          <a
            href="#products"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95"
          >
            এখনই দেখুন →
          </a>
        </div>
      </section>

      {/* FEATURE BADGES */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{f.label}</div>
                  <div className="text-xs text-gray-500">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section id="products" className="max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            Choose Your <span className="text-green-600">Legend</span>
          </h2>
          <p className="text-gray-500">তোমার পছন্দের নোটবুকটি বেছে নাও</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📓</p>
            <p>পণ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((p) => (
              <NotebookCard
                key={p._id}
                product={p}
                onAddToCart={handleAddToCart}
                added={addedIds.has(p._id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* BUNDLE CTA */}
      {products.length > 1 && (
        <section className="max-w-5xl mx-auto px-4 pb-12 w-full">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-8 text-white text-center shadow-xl">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-2xl font-black mb-2">সবগুলো নাও, বেশি সাশ্রয় করো</h3>
            <p className="text-green-200 mb-2 text-sm">
              Get all {products.length} notebooks — complete the collection
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-4xl font-black text-yellow-400" style={{ fontFamily: 'var(--sans)' }}>
                ৳{totalPrice}
              </span>
              <span className="text-green-300 text-sm">
                সর্বমোট ({products.length}টি নোটবুক)
              </span>
            </div>
            <button
              onClick={handleAddAll}
              className={`px-10 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                allAdded
                  ? 'bg-green-300 text-green-900 cursor-default'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 shadow-lg hover:shadow-xl'
              }`}
            >
              {allAdded ? '✓ সবগুলো কার্টে আছে' : `সবগুলো কার্টে যোগ করুন (৳${totalPrice})`}
            </button>
          </div>
        </section>
      )}

      {/* SOCIAL PROOF */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-xl font-black text-gray-800 mb-6">
            ফুটবল ভক্তরা বলছেন
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'রাহুল', text: 'নোটবুকের কোয়ালিটি অসাধারণ! Messi-র ছবি দেখে মনটা ভরে যায়।', stars: 5 },
              { name: 'তামিম', text: 'দাম কম কিন্তু মান অনেক ভালো। সবাইকে গিফট করেছি।', stars: 5 },
              { name: 'সিফাত', text: 'Brazil fan হিসেবে Hexa Loading notebook একদম পারফেক্ট!', stars: 5 },
            ].map((r) => (
              <div key={r.name} className="bg-gray-50 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{r.name}</div>
                    <StarRating count={r.stars} />
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">&ldquo;{r.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      {products.length > 0 && !allAdded && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 p-4 shadow-2xl">
          <button
            onClick={handleAddAll}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-transform"
          >
            সবগুলো কার্টে যোগ করুন — ৳{totalPrice}
          </button>
        </div>
      )}

      {/* bottom spacer for mobile sticky bar */}
      <div className="h-24 md:hidden" />

      <Footer />
    </div>
  );
}
