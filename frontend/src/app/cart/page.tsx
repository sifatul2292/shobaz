'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import api, { imgUrl } from '@/lib/api';
import { gtmViewCart } from '@/lib/gtm';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowRight, FaBookmark, FaHeart } from 'react-icons/fa';
import { HiOutlineTruck, HiOutlineShieldCheck, HiOutlineBookOpen } from 'react-icons/hi';

interface ShippingCharge {
  deliveryInDhaka: number;
  deliveryOutsideDhaka: number;
}

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
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [shippingCharge, setShippingCharge] = useState<ShippingCharge | null>(null);

  useEffect(() => {
    document.title = 'Cart - Shobaz';
    if (items.length > 0) {
      gtmViewCart(items.map(i => ({ ...i.product, quantity: i.quantity })), getTotalPrice());
    }
    api.get('/shipping-charge/get').then(res => {
      if (res.data?.data) setShippingCharge(res.data.data);
    }).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="relative mb-8">
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-green-100 to-cyan-100 rounded-full flex items-center justify-center">
                <FaShoppingCart className="text-6xl text-green-300" />
              </div>
              <div className="absolute -top-2 -right-8 w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-2xl">😢</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">আপনার কার্ট খালি</h2>
            <p className="text-gray-500 mb-8">মনে করিয়া দেখুন আপনার পছন্দের বইগুলো কোথায় রাখা হয়েছে</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl font-bold hover:from-green-500 hover:to-cyan-600 transition-all hover:scale-105 shadow-lg">
              <FaBookmark />
              বই কিনুন
              <FaArrowRight />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subtotal = getTotalPrice();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">আমার কার্ট</h1>
          <p className="text-gray-500">{items.length}টি পণ্য আপনার কার্টে আছে</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-3 space-y-4">
            {items.map((item) => {
              const product = item.product;
              const price = getCurrentPrice(product);
              const authorName = getAuthorName(product.author);
              const img = product.images?.[0];
              const name = product.name || 'Untitled';
              const totalItemPrice = price * item.quantity;
              
              return (
                <div key={item._id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="flex p-4 gap-4">
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} className="shrink-0">
                      <div className="w-28 h-36 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative">
                        {img ? (
                          <img src={imgUrl(img)!} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      </div>
                    </Link>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div className="min-w-0">
                          <Link href={`/products/${product.slug}`} className="font-bold text-lg text-gray-800 hover:text-green-500 line-clamp-2 transition-colors">
                            {name}
                          </Link>
                          {authorName && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              {authorName}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => removeItem(product._id)} 
                          className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="সরান"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-2xl font-bold text-green-500">৳{price}</span>
                        {product.discountAmount > 0 && (
                          <>
                            <span className="text-sm text-gray-400 line-through">৳{product.salePrice}</span>
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              -৳{product.discountAmount}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(product._id, Math.max(1, item.quantity - 1))} 
                            className="px-4 py-2 hover:bg-slate-50 font-bold text-gray-600 transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus className="text-xs" />
                          </button>
                          <span className="px-5 py-2 font-bold text-gray-800 min-w-[60px] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(product._id, item.quantity + 1)} 
                            className="px-4 py-2 hover:bg-slate-50 font-bold text-gray-600 transition-colors"
                          >
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                        <span className="text-lg font-bold text-gray-800">
                          = ৳{totalItemPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                    <button className="text-sm text-green-500 hover:text-green-600 flex items-center gap-2 transition-colors">
                      <FaHeart className="text-xs" />
                      পছন্দ তালিকায় রাখুন
                    </button>
                    <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      + আরও যোগ করুন
                    </Link>
                  </div>
                </div>
              );
            })}
            
            {/* Clear Cart */}
            <button 
              onClick={clearCart}
              className="text-red-500 text-sm hover:underline"
            >
              সমস্ত কার্ট মুছে ফেলুন
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden sticky top-24">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-cyan-500 px-6 py-4">
                <h3 className="font-bold text-white text-lg">অর্ডার সারাংশ</h3>
                <p className="text-green-100 text-sm">{items.length}টি পণ্য</p>
              </div>
              
              <div className="p-6">
                {/* Price Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>উপ-মোট</span>
                    <span>৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ঢাকার ভেতরে</span>
                    <span className="font-medium">৳{shippingCharge?.deliveryInDhaka ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ঢাকার বাইরে</span>
                    <span className="font-medium">৳{shippingCharge?.deliveryOutsideDhaka ?? '—'}</span>
                  </div>
                  <p className="text-xs text-gray-400">* চেকআউটে সঠিক চার্জ নির্বাচন করুন</p>
                  <div className="h-px bg-slate-100"></div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>সাব-টোটাল</span>
                    <span className="text-green-500">৳{subtotal}</span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <Link href="/checkout" className="block w-full bg-gradient-to-r from-green-500 to-cyan-500 text-white text-center py-4 rounded-xl font-bold hover:from-green-500 hover:to-cyan-600 transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl">
                  চেকআউটে যান
                  <FaArrowRight className="inline-block ml-2" />
                </Link>
                
                {/* Trust Badges */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <HiOutlineTruck className="text-green-600 text-xs" />
                    </div>
                    <span>দ্রুত ডেলিভারি</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiOutlineShieldCheck className="text-blue-600 text-xs" />
                    </div>
                    <span>১০০% নিরাপদ পেমেন্ট</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Continue Shopping */}
            <Link href="/products" className="block mt-4 text-center text-green-500 hover:text-green-600 font-medium transition-colors">
              + আরও বই যোগ করুন
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}