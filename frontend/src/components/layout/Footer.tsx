'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShopInfo } from '@/types';
import api, { imgUrl } from '@/lib/api';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaYoutube, FaInstagram, FaTwitter, FaChevronRight } from 'react-icons/fa';

interface Page {
  _id: string;
  title: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function Footer() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopRes, pagesRes, categoriesRes] = await Promise.all([
          api.get('/shop-information/get'),
          api.get('/additional-page/get-all?includeInactive=false'),
          api.post('/category/get-all', { filter: { visibility: true }, pagination: { currentPage: 1, pageSize: 6 } }),
        ]);
        if (shopRes.data?.data) setShopInfo(shopRes.data.data);
        if (pagesRes.data?.data) setPages(pagesRes.data.data);
        if (categoriesRes.data?.data) setCategories(categoriesRes.data.data);
      } catch (err: any) {
        console.log('Footer fetch error:', err.message);
      }
    };
    fetchData();
  }, []);

  const getPhone = () => shopInfo?.phones?.find(p => p.type === 0)?.value || shopInfo?.phones?.[0]?.value;
  const getEmail = () => shopInfo?.emails?.find(e => e.type === 0)?.value || shopInfo?.emails?.[0]?.value;
  const getAddress = () => shopInfo?.addresses?.find(a => a.type === 0)?.value || shopInfo?.addresses?.[0]?.value;
  const getFacebook = () => shopInfo?.socialLinks?.find(s => s.value?.includes('facebook'))?.value;
  const getYoutube = () => shopInfo?.socialLinks?.find(s => s.value?.includes('youtube'))?.value;
  const getInstagram = () => shopInfo?.socialLinks?.find(s => s.value?.includes('instagram'))?.value;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {shopInfo?.navLogo ? (
                <img src={imgUrl(shopInfo.navLogo)!} alt="Shobaz" className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">S</span>
                </div>
              )}
              <span className="text-xl font-bold text-white">
                {shopInfo?.siteName || 'Shobaz'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {shopInfo?.shortDescription || 'বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন বইয়ের দোকান'}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              {getAddress() && (
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-green-500 text-xs" />
                  <span className="text-gray-400">{getAddress()}</span>
                </div>
              )}
              {getPhone() && (
                <div className="flex items-center gap-2">
                  <FaPhone className="text-green-500 text-xs" />
                  <span className="text-gray-400">{getPhone()}</span>
                </div>
              )}
              {getEmail() && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-green-500 text-xs" />
                  <span className="text-gray-400">{getEmail()}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex gap-2 mt-4">
              {getFacebook() && (
                <a href={getFacebook()!} target="_blank" rel="noopener noreferrer" 
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-500 transition-colors">
                  <FaFacebook className="text-sm" />
                </a>
              )}
              {getYoutube() && (
                <a href={getYoutube()!} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                  <FaYoutube className="text-sm" />
                </a>
              )}
              {getInstagram() && (
                <a href={getInstagram()!} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pink-500 transition-colors">
                  <FaInstagram className="text-sm" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">দ্রুত লিংক</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm text-gray-400 hover:text-green-500 transition-colors">সকল বই</Link></li>
              <li><Link href="/authors" className="text-sm text-gray-400 hover:text-green-500 transition-colors">লেখক</Link></li>
              <li><Link href="/publishers" className="text-sm text-gray-400 hover:text-green-500 transition-colors">প্রকাশনা</Link></li>
              <li><Link href="/offers" className="text-sm text-gray-400 hover:text-green-500 transition-colors">অফার</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-400 hover:text-green-500 transition-colors">ব্লগ</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">ক্যাটাগরি</h3>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((category) => (
                <li key={category._id}>
                  <Link href={`/products?category=${category.slug}`} className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">গ্রাহক সেবা</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-green-500 transition-colors">যোগাযোগ</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-green-500 transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-green-500 transition-colors">শর্তাবলী</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-green-500 transition-colors">গোপনীয়তা নীতি</Link></li>
              {pages.slice(0, 3).map((page) => (
                <li key={page._id}>
                  <Link href={`/page/${page.slug}`} className="text-sm text-gray-400 hover:text-green-500 transition-colors">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} <span className="text-green-500">{shopInfo?.siteName || 'Shobaz'}</span>. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-green-500 transition-colors">শর্তাবলী</Link>
              <Link href="/privacy-policy" className="hover:text-green-500 transition-colors">গোপনীয়তা</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
