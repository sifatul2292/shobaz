'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Product, ShopInfo } from '@/types';
import api, { imgUrl } from '@/lib/api';

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
  '🎉 TK.500+ অর্ডারে বিনামূল্যে ডেলিভারি',
  '📚 নির্বাচিত বইয়ে ৩০% পর্যন্ত ছাড়',
  '🚚 ঢাকায় মাত্র ৬০ টাকায় ডেলিভারি',
  '🎁 প্রতিটি অর্ডারে বিশেষ উপহার',
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

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
  const { items } = useCartStore();

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
      const res = await api.get(`/product/get-all?q=${encodeURIComponent(searchQuery)}&page=1&limit=20`);
      setSearchResults({ products: res.data?.data || [] });
      setOpen(true);
    } catch (err) { console.error(err); }
    finally { setIsSearching(false); }
  };

  const handleInputChange = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) { setSearchResults(null); setOpen(false); return; }
    try {
      const res = await api.get(`/product/get-all?q=${encodeURIComponent(value)}&page=1&limit=10`);
      setSearchResults({ products: res.data?.data || [] });
      setOpen(true);
    } catch (err) { console.error(err); }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-1.5 text-sm">
        <span className="animate-pulse">{ANNOUNCEMENTS[announcementIndex]}</span>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
            {shopInfo?.navLogo || shopInfo?.siteLogo ? (
              <img
                src={imgUrl(shopInfo?.navLogo || shopInfo?.siteLogo) || ''}
                alt="Logo"
                className="w-[125px] h-10 rounded-xl object-contain"
              />
            ) : (
              <div className="w-[125px] h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-xl">শ</span>
              </div>
            )}
          </Link>

          {/* Search */}
          <div ref={wrapRef} className="flex-1 min-w-0 max-w-2xl relative">
            <form onSubmit={handleSearch}>
              <div className={`flex items-center bg-white transition-all duration-200 overflow-visible ${open ? 'ring-2 ring-green-500' : 'border border-gray-200'} rounded-xl`}>
                <button type="submit" className="px-4 text-gray-400 hover:text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="বই খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="flex-1 py-3 pr-4 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSearchResults(null); setOpen(false); }} className="pr-4 text-gray-400 hover:text-gray-600">
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
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">বই</h4>
                    {searchResults.products.slice(0, 6).map((product) => (
                      <Link key={product._id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <img src={imgUrl(product.images?.[0]) || ''} alt={product.name} className="w-12 h-16 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium truncate">{product.name}</h5>
                          <p className="text-xs text-gray-500">{product.author}</p>
                          <p className="text-sm font-bold text-green-600">৳{product.salePrice || product.regularPrice}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.products && searchResults.products.length > 0 && (
                  <Link href={`/products?q=${searchQuery}`} onClick={() => setOpen(false)} className="block p-3 text-center text-green-600 font-medium border-t hover:bg-gray-50">
                    সব দেখুন →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <Link href="/contact" className="hidden lg:flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] text-gray-500">যোগাযোগ</span>
            </Link>
            <Link href="/wishlist" className="hidden md:flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
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
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{items.length}</span>
              )}
            </Link>
            <Link href="/login" className="hidden sm:flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] text-gray-500">অ্যাকাউন্ট</span>
            </Link>
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 mt-3 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {link.label}
            </Link>
          ))}
          {pages.map((page) => (
            <Link key={page._id} href={getDynamicHref(page.slug)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              {page.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5">
            <div className="w-[125px] h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-lg">শ</span>
            </div>
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium mb-1 ${pathname === link.href ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
              {link.label}
            </Link>
          ))}
          {pages.map((page) => (
            <Link key={page._id} href={getDynamicHref(page.slug)} onClick={() => setDrawerOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 mb-1">
              {page.title}
            </Link>
          ))}
          <div className="border-t mt-4 pt-4">
            <Link href="/login" onClick={() => setDrawerOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100">লগইন</Link>
            <Link href="/register" onClick={() => setDrawerOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100">রেজিস্টার</Link>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && <div className="fixed inset-0 bg-black/50 z-60 md:hidden" onClick={() => setDrawerOpen(false)} />}
    </header>
  );
}