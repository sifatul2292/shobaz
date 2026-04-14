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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopRes, pagesRes, categoriesRes] = await Promise.all([
          api.get('/shop-information/get'),
          api.get('/additional-page/get-all?includeInactive=false'),
          api.post('/category/get-all', { filter: { visibility: true }, pagination: { currentPage: 1, pageSize: 8 } }),
        ]);
        if (shopRes.data?.data) setShopInfo(shopRes.data.data);
        if (pagesRes.data?.data) setPages(pagesRes.data.data);
        if (categoriesRes.data?.data) setCategories(categoriesRes.data.data);
      } catch (err: any) {
        console.log('Footer fetch error:', err.message);
      } finally {
        setIsLoading(false);
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
  const getTwitter = () => shopInfo?.socialLinks?.find(s => s.value?.includes('twitter'))?.value;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-green-50 via-white to-cyan-50 text-gray-800 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {shopInfo?.navLogo ? (
                <img src={imgUrl(shopInfo.navLogo)!} alt="Shobaz" className="h-12 w-auto" />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">S</span>
                </div>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-cyan-600 text-green-600">
                {shopInfo?.siteName || 'Shobaz'}
              </span>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed max-w-md">
              {shopInfo?.shortDescription || 'বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন বইয়ের দোকান। আমরা বই প্রেমিদের জন্য বইয়ের একটি বিশাল সংগ্রহ প্রদান করি।'}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              {getAddress() && (
                <div className="flex items-start gap-3 text-gray-600">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <FaMapMarkerAlt className="text-green-400" />
                  </div>
                  <span className="text-sm">{getAddress()}</span>
                </div>
              )}
              {getPhone() && (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <FaPhone className="text-green-400" />
                  </div>
                  <span className="text-sm">{getPhone()}</span>
                </div>
              )}
              {getEmail() && (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <FaEnvelope className="text-green-400" />
                  </div>
                  <span className="text-sm">{getEmail()}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {getFacebook() && (
                <a href={getFacebook()!} target="_blank" rel="noopener noreferrer" 
                  className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center hover:bg-green-500 transition-all duration-300 hover:-translate-y-1">
                  <FaFacebook className="text-green-400" />
                </a>
              )}
              {getYoutube() && (
                <a href={getYoutube()!} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center hover:bg-red-500 transition-all duration-300 hover:-translate-y-1">
                  <FaYoutube className="text-red-400" />
                </a>
              )}
              {getInstagram() && (
                <a href={getInstagram()!} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center hover:bg-pink-500 transition-all duration-300 hover:-translate-y-1">
                  <FaInstagram className="text-pink-400" />
                </a>
              )}
              {getTwitter() && (
                <a href={getTwitter()!} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-all duration-300 hover:-translate-y-1">
                  <FaTwitter className="text-blue-400" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-cyan-600 rounded-full"></span>
              দ্রুত লিংক
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  সকল বই
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  লেখক
                </Link>
              </li>
              <li>
                <Link href="/publishers" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  প্রকাশনা
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  অফার
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  ব্লগ
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-cyan-600 rounded-full"></span>
              বইয়ের ক্যাটাগরি
            </h3>
            <ul className="space-y-3">
              {categories.slice(0, 6).map((category) => (
                <li key={category._id}>
                  <Link href={`/products?category=${category.slug}`} 
                    className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                    <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-cyan-600 rounded-full"></span>
              গ্রাহক সেবা
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  যোগাযোগ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  শর্তাবলী
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  গোপনীয়তা নীতি
                </Link>
              </li>
              {pages.map((page) => (
                <li key={page._id}>
                  <Link href={`/page/${page.slug}`} 
                    className="text-gray-600 hover:text-green-400 transition-colors flex items-center gap-2 group">
                    <FaChevronRight className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 pt-10 border-t border-slate-700/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">নিউজলেটার সাবস্ক্রাইব করুন</h3>
              <p className="text-gray-600 text-sm">নতুন বই এবং অফারের আপডেট পেতে আমাদের সাথে থাকুন</p>
            </div>
            <form className="flex w-full lg:w-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="আপনার ইমেইল" 
                className="flex-1 lg:w-72 px-5 py-3 bg-white border border-gray-200 rounded-l-xl focus:outline-none focus:border-green-500 text-gray-800 placeholder-gray-400"
              />
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-500 hover:to-cyan-600 rounded-r-xl font-medium transition-all">
                সাবস্ক্রাইব
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-slate-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} <span className="text-green-400 font-medium">{shopInfo?.siteName || 'Shobaz'}</span>. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/terms" className="hover:text-green-400 transition-colors">শর্তাবলী</Link>
              <Link href="/privacy-policy" className="hover:text-green-400 transition-colors">গোপনীয়তা নীতি</Link>
              <Link href="/refund-policy" className="hover:text-green-400 transition-colors">রিফান্ড পলিসি</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">Designed with</span>
              <span className="text-red-500">❤</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
