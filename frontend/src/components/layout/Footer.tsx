'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShopInfo } from '@/types';
import api from '@/lib/api';

export default function Footer() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [pages, setPages] = useState<{ _id: string; title: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopRes, pagesRes] = await Promise.all([
          api.get('/shop-information/get'),
          api.get('/additional-page/get-all?includeInactive=false'),
        ]);
        if (shopRes.data?.data) setShopInfo(shopRes.data.data);
        if (pagesRes.data?.data) setPages(pagesRes.data.data);
      } catch (err: any) {
        console.log('Footer fetch error (ignoring):', err.message);
      }
    };
    fetchData();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Shobaz</h3>
            <p className="text-sm text-gray-400 mb-4">
              বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন বইয়ের দোকান। আমরা বই প্রেমিদের জন্য বইয়ের একটি বিশাল সংগ্রহ প্রদান করি।
            </p>
            <div className="flex gap-3">
            {shopInfo?.facebook && (
              <a href={shopInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z"/></svg>
              </a>
            )}
            {shopInfo?.youtube && (
              <a href={shopInfo.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615,3.184c-3.604-.246-11.631-.245-15.23,0-3.897.266-4.356,2.62-4.385,8.816.029,6.185.484,8.549,4.385,8.816,3.6.245,11.626.246,15.23,0,3.897-.266,4.356-2.62,4.385-8.816-.029-6.185-.484-8.549-4.385-8.816Zm-10.615,12.816v-8l8,3.993-8,4.007Z"/></svg>
              </a>
            )}
          </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">দ্রুত লিংক</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm hover:text-green-500 transition-colors">সকল বই</Link></li>
              <li><Link href="/authors" className="text-sm hover:text-green-500 transition-colors">লেখক</Link></li>
              <li><Link href="/publishers" className="text-sm hover:text-green-500 transition-colors">প্রকাশনা</Link></li>
              <li><Link href="/offers" className="text-sm hover:text-green-500 transition-colors">অফার</Link></li>
              <li><Link href="/blog" className="text-sm hover:text-green-500 transition-colors">ব্লগ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">গ্রাহক সেবা</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-sm hover:text-green-500 transition-colors">যোগাযোগ</Link></li>
              <li><Link href="/about" className="text-sm hover:text-green-500 transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link href="/terms" className="text-sm hover:text-green-500 transition-colors">শর্তাবলী</Link></li>
              <li><Link href="/privacy-policy" className="text-sm hover:text-green-500 transition-colors">গোপনীয়তা নীতি</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">যোগাযোগ</h3>
            <ul className="space-y-3 text-sm">
              {shopInfo?.address && (
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span>{shopInfo.address}</span>
                </li>
              )}
              {shopInfo?.phone && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span>{shopInfo.phone}</span>
                </li>
              )}
              {shopInfo?.email && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>{shopInfo.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500">© ২০২৬ Shobaz। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
}