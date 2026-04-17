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

  const ColHeading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 pb-2 border-b border-gray-700">
      {children}
    </h3>
  );

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />

      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {shopInfo?.navLogo ? (
                <img src={imgUrl(shopInfo.navLogo)!} alt="Shobaz" className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">S</span>
                </div>
              )}
              <span className="text-xl font-bold text-white">{shopInfo?.siteName || 'Shobaz'}</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              {shopInfo?.shortDescription || 'বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন বইয়ের দোকান'}
            </p>
            <div className="space-y-2 text-sm mb-5">
              {getAddress() && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-green-500 mt-0.5 shrink-0" />
                  <span>{getAddress()}</span>
                </div>
              )}
              {getPhone() && (
                <div className="flex items-center gap-2">
                  <FaPhone className="text-green-500 shrink-0" />
                  <a href={`tel:${getPhone()}`} className="hover:text-green-400 transition-colors">{getPhone()}</a>
                </div>
              )}
              {getEmail() && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-green-500 shrink-0" />
                  <a href={`mailto:${getEmail()}`} className="hover:text-green-400 transition-colors">{getEmail()}</a>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {getFacebook() && (
                <a href={getFacebook()!} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <FaFacebook />
                </a>
              )}
              {getYoutube() && (
                <a href={getYoutube()!} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                  <FaYoutube />
                </a>
              )}
              {getInstagram() && (
                <a href={getInstagram()!} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                  <FaInstagram />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <ColHeading>দ্রুত লিংক</ColHeading>
            <ul className="space-y-2.5">
              {[
                { href: '/products', label: 'সকল বই' },
                { href: '/authors', label: 'লেখক' },
                { href: '/publishers', label: 'প্রকাশনা' },
                { href: '/offers', label: 'অফার' },
                { href: '/blog', label: 'ব্লগ' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm flex items-center gap-1.5 hover:text-green-400 transition-colors group">
                    <FaChevronRight className="text-[8px] text-gray-600 group-hover:text-green-400 transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <ColHeading>ক্যাটাগরি</ColHeading>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat._id}>
                  <Link href={`/products?category=${cat.slug}`} className="text-sm flex items-center gap-1.5 hover:text-green-400 transition-colors group">
                    <FaChevronRight className="text-[8px] text-gray-600 group-hover:text-green-400 transition-colors" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <ColHeading>গ্রাহক সেবা</ColHeading>
            <ul className="space-y-2.5">
              {[
                { href: '/contact', label: 'যোগাযোগ' },
                { href: '/about', label: 'আমাদের সম্পর্কে' },
                { href: '/terms', label: 'শর্তাবলী' },
                { href: '/privacy-policy', label: 'গোপনীয়তা নীতি' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm flex items-center gap-1.5 hover:text-green-400 transition-colors group">
                    <FaChevronRight className="text-[8px] text-gray-600 group-hover:text-green-400 transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
              {pages.slice(0, 3).map((page) => (
                <li key={page._id}>
                  <Link href={`/page/${page.slug}`} className="text-sm flex items-center gap-1.5 hover:text-green-400 transition-colors group">
                    <FaChevronRight className="text-[8px] text-gray-600 group-hover:text-green-400 transition-colors" />
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            © {currentYear} <span className="text-green-500 font-medium">{shopInfo?.siteName || 'Shobaz'}</span>. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-gray-600 hover:text-green-400 transition-colors">শর্তাবলী</Link>
            <span className="text-gray-700">·</span>
            <Link href="/privacy-policy" className="text-gray-600 hover:text-green-400 transition-colors">গোপনীয়তা</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
