'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Product, ShopInfo } from '@/types';
import api, { imgUrl } from '@/lib/api';
import toast from 'react-hot-toast';

import { HiOutlineTruck, HiOutlineSparkles, HiOutlineShieldCheck, HiOutlineBookOpen } from 'react-icons/hi';

const CORE_ROUTES = ['products', 'authors', 'publishers', 'offers', 'blog', 'about', 'contact'];

function getDynamicHref(slug: string) {
  if (CORE_ROUTES.includes(slug)) return `/${slug}`;
  if (slug === 'home' || slug === 'index') return '/';
  return `/pages/${slug}`;
}

const NAV_LINKS = [
  { label: 'মূলপাতা', href: '/' },
  { label: 'সকল বই', href: '/products' },
  { label: 'লেখক', href: '/authors' },
  { label: 'প্রকাশনা', href: '/publishers' },
  { label: 'অফার', href: '/offers' },
  { label: 'ব্লগ', href: '/blog' },
  { label: 'আমাদের বিশেষিত', href: '/about' },
];

const ANNOUNCEMENTS = [
  { icon: HiOutlineTruck, text: 'TK.500+ অর্ডারে বিনামূল্যে ডেলিভারি' },
  { icon: HiOutlineBookOpen, text: 'নির্বাচিত বইয়ে ৩০% পর্যন্ত ছাড়' },
  { icon: HiOutlineSparkles, text: 'ঢাকায় মাত্র ৬০ টাকায় ডেলিভারি' },
  { icon: HiOutlineShieldCheck, text: 'প্রতিটি অর্ডারে বিশেষ উপহার' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pages, setPages] = useState<{ _id: string; title: string; slug: string }[]>([]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { items, addItem } = useCartStore();

  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const res = await api.get('/shop-information/get');
        if (res.data?.data) setShopInfo(res.data.data);
      } catch (err) { console.error(err); }
    };
    const fetchPages = async () => {
      try {
        const res = await api.get('/additional-page/get-all');
        if (res.data?.data) setPages(res.data.data.slice(0, 5));
      } catch (err) { console.error(err); }
    };
    fetchShopInfo();
    fetchPages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/product/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      setSearchResults({ products: res.data?.data || [] });
      setOpen(true);
    } catch (err) { console.error(err); }
    finally { setIsSearching(false); }
  };

  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) { setSearchResults(null); setOpen(false); return; }
    try {
      const res = await api.get(`/product/search?q=${encodeURIComponent(value)}&limit=10`);
      setSearchResults({ products: res.data?.data || [] });
      setOpen(true);
    } catch (err) { console.error(err); }
  };

  const handleAddToCartSearch = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success('🛒 কার্টে যোগ হয়েছে');
  };

  const Logo = () => (
    shopInfo?.navLogo || shopInfo?.siteLogo ? (
      <img
        src={imgUrl(shopInfo?.navLogo || shopInfo?.siteLogo) || ''}
        alt="Logo"
        className="h-9 w-auto max-w-[120px] object-contain"
      />
    ) : (
      <div className="h-9 px-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-md">
        <span className="text-white font-black text-xl">শবাজ</span>
      </div>
    )
  );

  const SearchBox = ({ className = '' }: { className?: string }) => (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className={`flex items-center bg-white transition-all duration-200 ${open ? 'ring-2 ring-green-500' : 'border border-gray-200'} rounded-xl`}>
          <button type="submit" className="px-3.5 text-gray-400 hover:text-green-600 shrink-0">
            {isSearching ? (
              <svg className="w-5 h-5 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
          <input
            type="text"
            placeholder="বই খুঁজুন..."
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 py-2.5 pr-2 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
          />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(''); setSearchResults(null); setOpen(false); }} className="pr-3 text-gray-400 hover:text-gray-600 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {open && searchResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[70vh] overflow-auto z-50">
          {(!searchResults.products || searchResults.products.length === 0) ? (
            <div className="p-4 text-center text-gray-500">কোনো ফলাফল পাওয়া যায়নি</div>
          ) : (
            <div className="p-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">বই</h4>
              {searchResults.products.slice(0, 6).map((product) => {
                const authorName = Array.isArray(product.author) ? product.author[0]?.name : product.author;
                const originalPrice = product.salePrice || 0;
                const discount = product.discountAmount || 0;
                const currentPrice = originalPrice - discount;
                return (
                  <Link key={product._id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                    <img src={imgUrl(product.images?.[0]) || ''} alt={product.name} className="w-10 h-14 object-cover rounded shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate">{product.name}</h5>
                      <p className="text-xs text-gray-500 truncate">{authorName}</p>
                      <p className="text-sm font-bold text-green-600">
                        {discount > 0 && <span className="text-xs text-gray-400 line-through mr-1">৳{originalPrice}</span>}
                        ৳{currentPrice}
                      </p>
                    </div>
                    <button onClick={(e) => handleAddToCartSearch(e, product)} className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-full text-xs font-medium shrink-0">
                      +কার্ট
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
          {searchResults.products && searchResults.products.length > 0 && (
            <Link href={`/products?q=${searchQuery}`} onClick={() => setOpen(false)} className="block p-3 text-center text-green-600 font-medium border-t hover:bg-gray-50 text-sm">
              সব দেখুন →
            </Link>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-1.5 text-xs sm:text-sm">
        <span className="flex items-center justify-center gap-2">
          {React.createElement(ANNOUNCEMENTS[announcementIndex].icon, { className: "w-3.5 h-3.5 shrink-0" })}
          <span>{ANNOUNCEMENTS[announcementIndex].text}</span>
        </span>
      </div>

      {/* ── DESKTOP HEADER (lg+) ── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="shrink-0"><Logo /></Link>
          <SearchBox className="flex-1 max-w-2xl" />
          <div className="flex items-center gap-1 shrink-0">
            <Link href="/contact" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] text-gray-500">যোগাযোগ</span>
            </Link>
            <Link href="/wishlist" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-[10px] text-gray-500">ইচ্ছা তালিকা</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 relative">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-[10px] text-gray-500">কার্ট</span>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{items.length}</span>
              )}
            </Link>
            <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] text-gray-500">অ্যাকাউন্ট</span>
            </Link>
          </div>
        </div>
        <nav className="flex items-center gap-1 mt-3 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${pathname === link.href ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {link.label}
            </Link>
          ))}
          {pages.map((page) => (
            <Link key={page._id} href={getDynamicHref(page.slug)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap">
              {page.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── MOBILE HEADER (<lg) ── */}
      <div className="lg:hidden">
        {/* Row 1: Logo + action icons */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="shrink-0"><Logo /></Link>
          <div className="flex items-center gap-1">
            <Link href="/cart" className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {items.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">{items.length}</span>
              )}
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="মেনু খুলুন"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: Search bar full width */}
        <div className="px-4 pb-3">
          <SearchBox className="w-full" />
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 lg:hidden ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-700 shrink-0">
          <Link href="/" onClick={() => setDrawerOpen(false)}>
            <span className="text-white font-black text-xl">শবাজ</span>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="মেনু বন্ধ করুন"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div className="flex-1 overflow-auto py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 text-base font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-green-50 text-green-700 border-r-4 border-green-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {pages.map((page) => (
            <Link
              key={page._id}
              href={getDynamicHref(page.slug)}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-5 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {page.title}
            </Link>
          ))}

          {/* Drawer footer links */}
          <div className="border-t border-gray-100 mt-3 pt-3">
            <Link href="/login" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-5 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              লগইন
            </Link>
            <Link href="/register" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-5 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              রেজিস্টার
            </Link>
            <Link href="/contact" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-5 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              যোগাযোগ
            </Link>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </header>
  );
}
