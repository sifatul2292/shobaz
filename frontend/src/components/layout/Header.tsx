'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
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
  { icon: HiOutlineTruck, text: '৯৫০ টাকার উপরে অর্ডার করলে একটি নোটবুক ফ্রি' },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const { items, addItem } = useCartStore();
  const { user, token, logout } = useAuthStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMounted, setAuthMounted] = useState(false);

  useEffect(() => {
    setAuthMounted(true);
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
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    setDrawerOpen(false);
    toast.success('লগআউট সফল হয়েছে');
    router.push('/');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/product/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const results = res.data?.data || [];
      setSearchResults({ products: results });
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
      <div className="h-9 px-3 flex items-center justify-center" style={{ background: 'var(--ink)', borderRadius: 'var(--radius)' }}>
        <span style={{ color: 'var(--bg)', fontWeight: 900, fontSize: 20, fontFamily: 'var(--bn)' }}>শবাজ</span>
      </div>
    )
  );

  const SearchBox = ({ className = '' }: { className?: string }) => (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div
          className="flex items-center transition-all duration-200"
          style={{
            background: 'var(--card)',
            border: open ? '1px solid var(--ink)' : '1px solid var(--line-soft)',
            borderRadius: 'var(--radius)',
          }}
        >
          <button type="submit" className="px-3.5 shrink-0" style={{ color: 'var(--muted)' }}>
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
            className="flex-1 py-2.5 pr-2 outline-none bg-transparent text-sm"
            style={{ fontFamily: 'var(--bn)', color: 'var(--ink)' }}
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
        <div className="absolute top-full left-0 right-0 mt-2 max-h-[70vh] overflow-auto z-50" style={{ background: 'var(--bg)', border: '1px solid var(--line-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)' }}>
          {(!searchResults.products || searchResults.products.length === 0) ? (
            <div className="p-4 text-center" style={{ fontFamily: 'var(--bn)', color: 'var(--muted)' }}>কোনো ফলাফল পাওয়া যায়নি</div>
          ) : (
            <div className="p-2">
              <h4 className="px-2 mb-2" style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>বই</h4>
              {searchResults.products.slice(0, 6).map((product) => {
                const authorName = Array.isArray(product.author) ? (product.author[0] as any)?.name : (product.author as any)?.name || product.author;
                const originalPrice = product.salePrice || 0;
                const discount = product.discountAmount || 0;
                const currentPrice = originalPrice - discount;
                return (
                  <Link key={product._id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 p-2 group" style={{ borderRadius: 'var(--radius)', transition: 'background .15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <img src={imgUrl(product.images?.[0]) || ''} alt={product.name} className="w-10 h-14 object-cover shrink-0" style={{ borderRadius: 'var(--radius)' }} />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm truncate" style={{ fontFamily: 'var(--bn)', fontWeight: 600, color: 'var(--ink)' }}>{product.name}</h5>
                      <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{authorName as string}</p>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {discount > 0 && <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontWeight: 400, marginRight: 4 }}>৳{originalPrice}</span>}
                        ৳{currentPrice}
                      </p>
                    </div>
                    <button onClick={(e) => handleAddToCartSearch(e, product)} className="btn btn-accent btn-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      +কার্ট
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
          {searchResults.products && searchResults.products.length > 0 && (
            <Link href={`/products?q=${searchQuery}`} onClick={() => setOpen(false)} className="block p-3 text-center text-sm" style={{ borderTop: '1px solid var(--line-soft)', fontFamily: 'var(--sans)', color: 'var(--accent)', fontWeight: 500 }}>
              সব দেখুন →
            </Link>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line-soft)' }}>
      {/* Announcement Bar */}
      <div className="ann-bar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {React.createElement(ANNOUNCEMENTS[announcementIndex].icon, { style: { width: 14, height: 14, flexShrink: 0 } })}
          <span>{ANNOUNCEMENTS[announcementIndex].text}</span>
        </span>
      </div>

      {/* ── DESKTOP HEADER (lg+) ── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="shrink-0"><Logo /></Link>
          <SearchBox className="flex-1 max-w-2xl" />
          <div className="flex items-center gap-1 shrink-0">
            {[
              { href: '/contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'যোগাযোগ' },
              { href: '/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'ইচ্ছা তালিকা' },
            ].map(({ href, icon, label }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1.5" style={{ borderRadius: 'var(--radius)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--ink-2)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
                <span style={{ fontSize: 10, fontFamily: 'var(--bn)', color: 'var(--muted)' }}>{label}</span>
              </Link>
            ))}
            {/* Account — auth-aware */}
            {authMounted && token ? (
              <div ref={accountRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5"
                  style={{ borderRadius: 'var(--radius)', background: accountOpen ? 'var(--bg-2)' : 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => { if (!accountOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span style={{ fontSize: 10, fontFamily: 'var(--bn)', color: 'var(--accent)', fontWeight: 600 }}>{user?.name?.split(' ')[0] || 'আমি'}</span>
                </button>
                {accountOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 168, background: 'white', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', zIndex: 200, padding: 8, fontFamily: 'var(--bn)' }}>
                    <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user?.name || 'ব্যবহারকারী'}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{user?.email || ''}</div>
                    </div>
                    <Link href="/profile" onClick={() => setAccountOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, fontSize: 13, color: '#374151', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      ড্যাশবোর্ড
                    </Link>
                    <Link href="/profile?tab=orders" onClick={() => setAccountOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, fontSize: 13, color: '#374151', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                      আমার অর্ডার
                    </Link>
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--bn)' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      লগআউট
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5" style={{ borderRadius: 'var(--radius)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--ink-2)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span style={{ fontSize: 10, fontFamily: 'var(--bn)', color: 'var(--muted)' }}>লগইন</span>
              </Link>
            )}
            <Link href="/cart" className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative" style={{ borderRadius: 'var(--radius)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--ink-2)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span style={{ fontSize: 10, fontFamily: 'var(--bn)', color: 'var(--muted)' }}>কার্ট</span>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--accent)', fontSize: 10 }}>{items.length}</span>
              )}
            </Link>
          </div>
        </div>
        <nav className="flex items-center gap-0 mt-3 overflow-x-auto" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 whitespace-nowrap text-sm"
              style={{
                fontFamily: 'var(--bn)',
                fontWeight: pathname === link.href ? 600 : 400,
                color: pathname === link.href ? 'var(--ink)' : 'var(--ink-2)',
                borderBottom: pathname === link.href ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color .15s ease, border-color .15s ease',
              }}
              onMouseEnter={e => { if (pathname !== link.href) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'; }}
              onMouseLeave={e => { if (pathname !== link.href) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-2)'; }}
            >
              {link.label}
            </Link>
          ))}
          {pages.map((page) => (
            <Link
              key={page._id}
              href={getDynamicHref(page.slug)}
              className="px-4 py-2 whitespace-nowrap text-sm"
              style={{ fontFamily: 'var(--bn)', color: 'var(--ink-2)', borderBottom: '2px solid transparent' }}
            >
              {page.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── MOBILE HEADER (<lg) ── */}
      <div className="lg:hidden">
        {/* Row 1: Logo + icons */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="shrink-0"><Logo /></Link>
          <div className="flex items-center gap-1">
            {/* Search icon */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              className="w-11 h-11 flex items-center justify-center transition-colors"
              style={{ borderRadius: 'var(--radius)', color: searchOpen ? 'var(--accent)' : 'var(--ink-2)', background: searchOpen ? 'var(--bg-2)' : 'transparent' }}
              aria-label="সার্চ"
            >
              {searchOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
            {/* Cart */}
            <Link href="/cart" className="relative w-11 h-11 flex items-center justify-center transition-colors" style={{ borderRadius: 'var(--radius)', color: 'var(--ink-2)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {items.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none" style={{ background: 'var(--accent)' }}>{items.length}</span>
              )}
            </Link>
            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 flex items-center justify-center transition-colors"
              style={{ borderRadius: 'var(--radius)', color: 'var(--ink-2)' }}
              aria-label="মেনু খুলুন"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible search panel */}
        <div className={`overflow-hidden transition-all duration-200 ${searchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-3 pt-1">
            <SearchBox className="w-full" />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 z-[70] flex flex-col transition-transform duration-300 lg:hidden ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ background: 'var(--bg)', borderLeft: '1px solid var(--line-soft)', boxShadow: '-8px 0 32px rgba(15,15,14,.12)' }}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: 'var(--ink)', borderBottom: '1px solid var(--line)' }}>
          <Link href="/" onClick={() => setDrawerOpen(false)}>
            <span style={{ color: 'var(--bg)', fontWeight: 900, fontSize: 20, fontFamily: 'var(--bn)' }}>শবাজ</span>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center transition-colors"
            style={{ borderRadius: 'var(--radius)', background: 'rgba(246,241,231,.15)', color: 'var(--bg)' }}
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
              className="flex items-center px-5 py-3.5 text-base transition-colors"
              style={{
                fontFamily: 'var(--bn)',
                fontWeight: pathname === link.href ? 600 : 400,
                color: pathname === link.href ? 'var(--accent)' : 'var(--ink-2)',
                borderRight: pathname === link.href ? '3px solid var(--accent)' : '3px solid transparent',
                background: pathname === link.href ? 'var(--bg-2)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
          {pages.map((page) => (
            <Link
              key={page._id}
              href={getDynamicHref(page.slug)}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center px-5 py-3.5 text-base"
              style={{ fontFamily: 'var(--bn)', color: 'var(--ink-2)', borderRight: '3px solid transparent' }}
            >
              {page.title}
            </Link>
          ))}

          {/* Drawer footer — auth-aware */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
            {authMounted && token ? (
              <>
                <div className="px-5 py-3" style={{ fontFamily: 'var(--bn)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{user?.name || 'ব্যবহারকারী'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email || ''}</div>
                </div>
                <Link href="/profile?tab=orders" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-5 py-3.5 text-base" style={{ fontFamily: 'var(--bn)', color: 'var(--ink-2)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  আমার অর্ডার
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-3.5 text-base w-full text-left" style={{ fontFamily: 'var(--bn)', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  লগআউট
                </button>
              </>
            ) : (
              <>
                {[
                  { href: '/login', label: 'লগইন', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { href: '/register', label: 'রেজিস্টার', d: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
                  { href: '/contact', label: 'যোগাযোগ', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                ].map(({ href, label, d }) => (
                  <Link key={href} href={href} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-5 py-3.5 text-base" style={{ fontFamily: 'var(--bn)', color: 'var(--ink-2)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--muted)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
                    </svg>
                    {label}
                  </Link>
                ))}
              </>
            )}
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
