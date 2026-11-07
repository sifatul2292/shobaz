'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { trackAddToCart } from '@/lib/trackCart';
import { useAuthStore } from '@/store/useAuthStore';
import { Product, ShopInfo } from '@/types';
import api, { imgUrl } from '@/lib/api';
import { phSearch } from '@/lib/posthog';
import toast from 'react-hot-toast';

const CORE_ROUTES = ['products', 'authors', 'publishers', 'offers', 'blog', 'about', 'contact'];

function getDynamicHref(slug: string) {
  if (CORE_ROUTES.includes(slug)) return `/${slug}`;
  if (slug === 'home' || slug === 'index') return '/';
  // Additional pages live at /page/[slug] (the old /pages/ prefix 404'd).
  return `/page/${slug}`;
}

// The header remounts on every page (it lives inside each page component), so
// keep shop info + menu pages for the session. This removes the logo flashing
// back to the text placeholder and the duplicate API calls on each navigation.
type MenuPage = { _id: string; title?: string; name?: string; menuLabel?: string; slug: string };
// The API sends `name` / `menuLabel`; older data used `title`.
const pageLabel = (p: MenuPage) => p.menuLabel || p.title || p.name || '';
let shopInfoMemo: ShopInfo | null = null;
let pagesMemo: MenuPage[] | null = null;

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'All Books', href: '/products' },
  { label: 'Bestselling', href: '/products?tag=our-bestselling-books' },
  { label: 'Business', href: '/products?tag=business-and-entrepreneurship' },
  { label: 'Marketing', href: '/products?tag=marketing-and-leadership' },
  { label: 'Finance', href: '/products?tag=finance-and-wealth' },
  { label: 'Mindset', href: '/products?tag=mindset-and-psychology' },
  { label: 'Productivity', href: '/products?tag=productivity-and-habits' },
  { label: 'Communication', href: '/products?tag=people-skill-and-communication' },
  { label: 'Finance Bundle', href: '/finance-bundle' },
  { label: 'Communication Bundle', href: '/communication-bundle' },
  { label: 'Notebook Bundle', href: '/notebook-bundle' },
];

const ANNOUNCEMENTS = [
  { text: '🎁 ২টি নোটবুক কিনলে ১টি নোটবুক ফ্রি' },
  { text: '🎁 ৫০০ টাকার উপরে যেকোনো বই কিনলে ১টি নোটবুক ফ্রি' },
  { text: 'নির্বাচিত বইয়ে ৩০% পর্যন্ত ছাড়' },
  { text: 'ঢাকায় মাত্র ৬০ টাকায় ডেলিভারি' },
  { text: 'প্রতিটি অর্ডারে বিশেষ উপহার' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(shopInfoMemo);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pages, setPages] = useState<MenuPage[]>(pagesMemo ?? []);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);
  const prevCartCount = useRef<number | null>(null);
  const { items, addItem } = useCartStore();
  const { user, token, logout } = useAuthStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMounted, setAuthMounted] = useState(false);

  useEffect(() => {
    setAuthMounted(true);
    const fetchShopInfo = async () => {
      try {
        const res = await api.get('/shop-information/get');
        if (res.data?.data) { shopInfoMemo = res.data.data; setShopInfo(res.data.data); }
      } catch (err) { console.error(err); }
    };
    const fetchPages = async () => {
      try {
        const res = await api.get('/additional-page/get-all');
        if (res.data?.data) { pagesMemo = res.data.data.slice(0, 5); setPages(pagesMemo!); }
      } catch (err) { console.error(err); }
    };
    if (!shopInfoMemo) fetchShopInfo();
    if (!pagesMemo) fetchPages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Shopify-style sticky header: tucks away while scrolling down, slides back
  // in as soon as the visitor scrolls up.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        setScrolled(y > 8);
        if (y < 160) setHeaderHidden(false);
        else if (delta > 6) setHeaderHidden(true);
        else if (delta < -6) setHeaderHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keep the header visible while a menu, search result list or account panel is open.
  const forceHeaderVisible = drawerOpen || open || searchOpen || accountOpen;

  // Lock page scroll behind the mobile drawer and close it with Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // Close the drawer / search dropdown after any navigation.
  useEffect(() => {
    setDrawerOpen(false);
    setOpen(false);
  }, [pathname]);

  // Small "bump" on the cart icon whenever the count changes after mount.
  useEffect(() => {
    if (!authMounted) return;
    if (prevCartCount.current !== null && prevCartCount.current !== items.length) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 520);
      prevCartCount.current = items.length;
      return () => clearTimeout(t);
    }
    prevCartCount.current = items.length;
  }, [items.length, authMounted]);

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest?.('[data-search-wrap]')) {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    phSearch(searchQuery.trim(), searchResults?.products?.length ?? 0);
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Debounced live search: one request per pause in typing, stale responses ignored.
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      searchSeq.current += 1;
      setIsSearching(false);
      setSearchResults(null);
      setOpen(false);
      return;
    }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const seq = ++searchSeq.current;
      try {
        const res = await api.get(`/product/search?q=${encodeURIComponent(value.trim())}&limit=10`);
        if (seq !== searchSeq.current) return;
        setSearchResults({ products: res.data?.data || [] });
        setOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        if (seq === searchSeq.current) setIsSearching(false);
      }
    }, 220);
  };

  // Cart feedback comes from the global add-to-cart notification.
  const handleAddToCartSearch = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    trackAddToCart(product, 1);
  };

  const Logo = () => (
    shopInfo?.navLogo || shopInfo?.siteLogo ? (
      <img
        src={imgUrl(shopInfo?.navLogo || shopInfo?.siteLogo) || ''}
        alt={shopInfo?.siteName || 'Shobaz'}
        className="sh-logo-img"
      />
    ) : (
      // Quiet wordmark while the shop logo loads — no dark block flashing in.
      <span className="sh-logo-text">Shobaz</span>
    )
  );

  const IconSearch = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  );
  const IconUser = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  );
  const IconBag = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
  );
  const IconMenu = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
  );
  const IconClose = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
  );

  const cartCount = authMounted ? items.length : 0;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href.split('?')[0] && !href.includes('?'));

  const SearchBox = ({ className = '' }: { className?: string }) => (
    <div ref={wrapRef} data-search-wrap className={`sh-search ${className}`}>
      <form onSubmit={handleSearch} role="search">
        <div className={`sh-search-field${open ? ' is-open' : ''}`}>
          <button type="submit" className="sh-search-submit" aria-label="খুঁজুন">
            {isSearching ? <span className="sh-spinner" aria-hidden="true" /> : <IconSearch />}
          </button>
          <input
            type="text"
            placeholder="বই, লেখক বা বিষয় খুঁজুন"
            aria-label="বই খুঁজুন"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="sh-search-clear" aria-label="মুছুন" onClick={() => { setSearchQuery(''); setSearchResults(null); setOpen(false); }}>
              <IconClose />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {open && searchResults && (
        <div className="search-dropdown sh-results">
          {(!searchResults.products || searchResults.products.length === 0) ? (
            <div className="sh-results-empty">কোনো ফলাফল পাওয়া যায়নি</div>
          ) : (
            <div className="sh-results-list">
              {searchResults.products.slice(0, 6).map((product) => {
                const authorName = Array.isArray(product.author) ? (product.author[0] as any)?.name : (product.author as any)?.name || product.author;
                const originalPrice = product.salePrice || 0;
                const discount = product.discountAmount || 0;
                const currentPrice = originalPrice - discount;
                return (
                  <Link key={product._id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="sh-result group">
                    <img src={imgUrl(product.images?.[0]) || ''} alt={product.name} loading="lazy" />
                    <div className="sh-result-info">
                      <h5>{product.name}</h5>
                      <p>{authorName as string}</p>
                      <p className="sh-result-price">
                        ৳{currentPrice}
                        {discount > 0 && <s>৳{originalPrice}</s>}
                      </p>
                    </div>
                    <button onClick={(e) => handleAddToCartSearch(e, product)} className="sh-result-add" aria-label={`${product.name} কার্টে যোগ করুন`}>
                      + কার্ট
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
          {searchResults.products && searchResults.products.length > 0 && (
            <Link href={`/products?q=${encodeURIComponent(searchQuery.trim())}`} onClick={() => setOpen(false)} className="sh-results-all">
              সব ফলাফল দেখুন →
            </Link>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
    <header
      className={`site-header sh sticky top-0 z-50${headerHidden && !forceHeaderVisible ? ' is-hidden' : ''}${scrolled ? ' is-scrolled' : ''}`}
    >
      {/* Announcement Bar */}
      <div className="ann-bar" aria-live="polite">
        <span key={announcementIndex} className="ann-item">
          {ANNOUNCEMENTS[announcementIndex].text}
        </span>
      </div>

      <div className="sh-inner">
        <div className="sh-row">
          {/* Phone: menu button on the left (Shopify pattern) */}
          <button type="button" className="sh-icon sh-only-mobile" onClick={() => setDrawerOpen(true)} aria-label="মেনু খুলুন">
            <IconMenu />
          </button>

          <Link href="/" className="sh-logo" aria-label={`${shopInfo?.siteName || 'Shobaz'} হোম`}><Logo /></Link>

          {SearchBox({ className: 'sh-only-desktop' })}

          <div className="sh-actions">
            <button
              type="button"
              className={`sh-icon sh-only-mobile${searchOpen ? ' is-active' : ''}`}
              onClick={() => setSearchOpen(v => !v)}
              aria-label={searchOpen ? 'সার্চ বন্ধ করুন' : 'সার্চ'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <IconClose /> : <IconSearch />}
            </button>

            {/* Account — auth-aware */}
            {authMounted && token ? (
              <div ref={accountRef} className="sh-account sh-only-desktop">
                <button type="button" className={`sh-icon${accountOpen ? ' is-active' : ''}`} onClick={() => setAccountOpen(v => !v)} aria-label="অ্যাকাউন্ট" aria-expanded={accountOpen}>
                  <IconUser />
                  <span className="sh-account-dot" aria-hidden="true" />
                </button>
                {accountOpen && (
                  <div className="sh-menu">
                    <div className="sh-menu-user">
                      <b>{user?.name || 'ব্যবহারকারী'}</b>
                      {user?.email && <span>{user.email}</span>}
                    </div>
                    <Link href="/profile" onClick={() => setAccountOpen(false)}>ড্যাশবোর্ড</Link>
                    <Link href="/profile?tab=orders" onClick={() => setAccountOpen(false)}>আমার অর্ডার</Link>
                    <button type="button" onClick={handleLogout} className="sh-menu-danger">লগআউট</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="sh-icon sh-only-desktop" aria-label="লগইন">
                <IconUser />
              </Link>
            )}

            <Link href="/cart" className="sh-icon sh-cart" aria-label={`কার্ট${cartCount ? `, ${cartCount}টি পণ্য` : ''}`}>
              <IconBag />
              {cartCount > 0 && (
                <span className={`cart-badge${cartBump ? ' is-bumping' : ''}`}>{cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Phone: collapsible search */}
        <div className={`sh-mobile-search sh-only-mobile${searchOpen ? ' is-open' : ''}`}>
          {SearchBox({ className: '' })}
        </div>

        {/* Desktop navigation */}
        <nav className="header-nav sh-nav sh-only-desktop" aria-label="প্রধান মেনু">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`header-nav-link${isActive(link.href) ? ' is-active' : ''}`}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className={`header-nav-link${pathname === '/contact' ? ' is-active' : ''}`}>যোগাযোগ</Link>
        </nav>
      </div>
    </header>

      {/* Mobile Drawer — rendered outside <header> so the header's hide-on-scroll
          transform never becomes its containing block (caused sideways scroll). */}
      <div
        className={`mobile-drawer sh-drawer${drawerOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="মেনু"
        aria-hidden={!drawerOpen}
      >
        <div className="sh-drawer-head">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="sh-logo"><Logo /></Link>
          <button type="button" onClick={() => setDrawerOpen(false)} className="sh-icon" aria-label="মেনু বন্ধ করুন">
            <IconClose />
          </button>
        </div>

        <nav className="sh-drawer-nav stagger" aria-label="মোবাইল মেনু">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className={`sh-drawer-link${isActive(link.href) ? ' is-active' : ''}`}
              style={{ ['--i' as string]: i }}
            >
              {link.label}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
          ))}
          <div className="sh-drawer-secondary">
            <Link href="/contact" onClick={() => setDrawerOpen(false)}>যোগাযোগ</Link>
            {pages.map((page) => (
              <Link key={page._id} href={getDynamicHref(page.slug)} onClick={() => setDrawerOpen(false)}>
                {pageLabel(page)}
              </Link>
            ))}
          </div>
        </nav>

        {/* Drawer footer — auth-aware */}
        <div className="sh-drawer-foot">
          {authMounted && token ? (
            <>
              <div className="sh-drawer-user">
                <b>{user?.name || 'ব্যবহারকারী'}</b>
                {user?.email && <span>{user.email}</span>}
              </div>
              <Link href="/profile?tab=orders" onClick={() => setDrawerOpen(false)} className="sh-drawer-sub">আমার অর্ডার</Link>
              <button type="button" onClick={handleLogout} className="sh-drawer-sub sh-menu-danger">লগআউট</button>
            </>
          ) : (
            <div className="sh-drawer-auth">
              <Link href="/login" onClick={() => setDrawerOpen(false)} className="sh-drawer-btn solid">লগইন</Link>
              <Link href="/register" onClick={() => setDrawerOpen(false)} className="sh-drawer-btn ghost">রেজিস্টার</Link>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Overlay */}
      <div
        className={`drawer-overlay${drawerOpen ? ' is-open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}
