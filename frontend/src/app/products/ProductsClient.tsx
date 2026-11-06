'use client';

import { Suspense } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { getCached, setCached } from '@/lib/cache';
import { gtmSearch } from '@/lib/gtm';
import { Product, Category, Author, Publisher } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import HomeProductCard from '@/components/home/HomeProductCard';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'discount';

function CollectionSkeleton() {
  return (
    <div className="collection-grid" aria-busy="true" aria-label="লোড হচ্ছে">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="home-skeleton-card">
          <div className="skeleton" style={{ aspectRatio: '4 / 5', borderRadius: 10 }} />
          <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 4, marginTop: 10 }} />
          <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 4, marginTop: 6 }} />
          <div className="skeleton" style={{ height: 34, borderRadius: 999, marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

// Module scope: the filter/sort memo runs during render, *before* any
// component-level const declared below it would be initialised. Defining it
// inside the component crashed the page on "price" sort or price filtering.
function getCurrentPrice(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
}

function nameFromList(list: any[], slug: string): string {
  const hit = list.find((x: any) => x?.slug === slug);
  return hit?.name || '';
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCartStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const itemsPerPage = 12;

  // Mobile filter sheet: lock background scroll and close on Escape.
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFiltersOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [filtersOpen]);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    publisher: searchParams.get('publisher') || '',
    tag: searchParams.get('tag') || '',
    q: searchParams.get('q') || '',
    priceMin: '',
    priceMax: '',
  });

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      author: searchParams.get('author') || '',
      publisher: searchParams.get('publisher') || '',
      tag: searchParams.get('tag') || '',
      q: searchParams.get('q') || '',
      priceMin: '',
      priceMax: '',
    });
    setPage(1);
  }, [searchParams]);

  // Title comes from server metadata (tag/author aware) — no client override.
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cachedCategories = getCached<Category[]>('categories');
      const cachedAuthors = getCached<Author[]>('authors');
      const cachedPublishers = getCached<Publisher[]>('publishers');

      const [productsRes, categoriesRes, authorsRes, publishersRes] = await Promise.allSettled([
        api.get('/product/get-all-data'),
        cachedCategories ? Promise.resolve({ data: { data: cachedCategories } }) : api.post('/category/get-all', { filter: {}, pagination: {} }),
        cachedAuthors ? Promise.resolve({ data: { data: cachedAuthors } }) : api.get('/author/get-all-basic'),
        cachedPublishers ? Promise.resolve({ data: { data: cachedPublishers } }) : api.get('/publisher/get-all-basic'),
      ]);

      if (productsRes.status === 'fulfilled' && productsRes.value.data?.data) {
        let productsData = productsRes.value.data.data;
        if (productsRes.value.data.data.items) {
          productsData = productsRes.value.data.data.items;
        }
        if (Array.isArray(productsData)) {
          setAllProducts(productsData);
        }
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.data) {
        let catsData = categoriesRes.value.data.data;
        if (categoriesRes.value.data.data.items) {
          catsData = categoriesRes.value.data.data.items;
        }
        if (Array.isArray(catsData)) {
          if (!cachedCategories) setCached('categories', catsData);
          setCategories(catsData);
        }
      }
      if (authorsRes.status === 'fulfilled' && authorsRes.value.data?.data) {
        const authorsData = authorsRes.value.data.data;
        if (!cachedAuthors && Array.isArray(authorsData)) setCached('authors', authorsData);
        setAuthors(authorsData);
      }
      if (publishersRes.status === 'fulfilled' && publishersRes.value.data?.data) {
        const publishersData = publishersRes.value.data.data;
        if (!cachedPublishers && Array.isArray(publishersData)) setCached('publishers', publishersData);
        setPublishers(publishersData);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (filters.category) {

      filtered = filtered.filter((p: Product) => {
        const cat = p.category as any;
        if (Array.isArray(cat)) {
          return cat.some((c: any) => c.slug === filters.category);
        } else if (cat?.slug) {
          return cat.slug === filters.category;
        }
        return false;
      });
    }
    if (filters.tag) {
      filtered = filtered.filter((p: Product) => {
        const tags = (p as any).tags;
        if (Array.isArray(tags)) {
          return tags.some((t: any) => t.slug === filters.tag);
        }
        return false;
      });
    }
    if (filters.author) {
      filtered = filtered.filter((p: Product) => {
        const auth = p.author as any;
        if (Array.isArray(auth)) {
          return auth.some((a: any) => a.slug === filters.author);
        } else if (auth?.slug) {
          return auth.slug === filters.author;
        }
        return false;
      });
    }
    if (filters.publisher) {
      filtered = filtered.filter((p: Product) => {
        const pub = p.publisher as any;
        if (Array.isArray(pub)) {
          return pub.some((p: any) => p.slug === filters.publisher);
        } else if (pub?.slug) {
          return pub.slug === filters.publisher;
        }
        return false;
      });
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      filtered = filtered.filter((p: Product) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q)
      );
    }
    if (filters.priceMin) {
      filtered = filtered.filter((p: Product) => {
        const price = getCurrentPrice(p);
        return price >= Number(filters.priceMin);
      });
    }
    if (filters.priceMax) {
      filtered = filtered.filter((p: Product) => {
        const price = getCurrentPrice(p);
        return price <= Number(filters.priceMax);
      });
    }

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => getCurrentPrice(a) - getCurrentPrice(b));
        break;
      case 'price-desc':
        filtered.sort((a, b) => getCurrentPrice(b) - getCurrentPrice(a));
        break;
      case 'name-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discountAmount || 0) - (a.discountAmount || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }, [allProducts, filters, sortBy]);

  useEffect(() => {
    if (filters.q && filteredProducts.length >= 0 && !loading) {
      document.title = `"${filters.q}" সার্চ রেজাল্ট | Shobaz`;
      gtmSearch(filters.q, filteredProducts);
    }
  }, [filters.q, filteredProducts, loading]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const getDiscountPercent = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    if (!discount || !salePrice) return 0;
    return Math.round((discount / salePrice) * 100);
  };

  // Feedback is shown by the card itself + the global add-to-cart notification.
  const handleAddToCart = (product: any) => {
    addItem(product, 1);
  };

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = [
    filters.category,
    filters.tag,
    filters.author,
    filters.publisher,
    filters.q,
    filters.priceMin || filters.priceMax,
  ].filter(Boolean).length;

  // Heading reflects the active collection (tag / category / author / publisher / search).
  const tagName = useMemo(() => {
    if (!filters.tag) return '';
    for (const p of allProducts) {
      const hit = ((p as any).tags || []).find((t: any) => t?.slug === filters.tag);
      if (hit?.name) return hit.name as string;
    }
    return '';
  }, [allProducts, filters.tag]);

  const heading = filters.q
    ? `"${filters.q}" — সার্চ রেজাল্ট`
    : filters.category
      ? (categories.find(c => c.slug === filters.category)?.name || decodeURIComponent(filters.category))
      : filters.tag
        ? (tagName || decodeURIComponent(filters.tag).replace(/-/g, ' '))
        : filters.author
          ? (nameFromList(authors, filters.author) || decodeURIComponent(filters.author))
          : filters.publisher
            ? (nameFromList(publishers, filters.publisher) || decodeURIComponent(filters.publisher))
            : 'সকল বই';

  const eyebrow = filters.author ? 'লেখক' : filters.publisher ? 'প্রকাশনী' : filters.q ? 'সার্চ' : 'বই';

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid var(--line-soft)',
    borderRadius: 'var(--radius)',
    background: 'var(--card)',
    color: 'var(--ink)',
    fontFamily: 'var(--bn)',
    fontSize: 13,
    outline: 'none',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--line-soft)',
    borderRadius: 'var(--radius)',
    background: 'var(--card)',
    color: 'var(--ink)',
    fontFamily: 'var(--bn)',
    fontSize: 13,
    outline: 'none',
  };

  const filterFields = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { label: 'ক্যাটাগরি', key: 'category', items: categories.slice(0, 30), labelField: 'name', valueField: 'slug', defaultLabel: 'সব ক্যাটাগরি' },
        { label: 'লেখক', key: 'author', items: authors.slice(0, 20), labelField: 'name', valueField: 'slug', defaultLabel: 'সব লেখক' },
        { label: 'প্রকাশনী', key: 'publisher', items: publishers.slice(0, 20), labelField: 'name', valueField: 'slug', defaultLabel: 'সব প্রকাশনী' },
      ].map(({ label, key, items, labelField, valueField, defaultLabel }) => (
        <div key={key}>
          <label htmlFor={`filter-${key}`} style={{ display: 'block', fontFamily: 'var(--bn)', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</label>
          <select
            id={`filter-${key}`}
            value={(filters as any)[key]}
            onChange={(e) => { updateURL(key, e.target.value); setFiltersOpen(false); }}
            style={selectStyle}
            className="w-full collection-field"
          >
            <option value="">{defaultLabel}</option>
            {items.map((item: any) => (
              <option key={item._id} value={item[valueField]}>{item[labelField]}</option>
            ))}
          </select>
        </div>
      ))}

      <div>
        <span style={{ display: 'block', fontFamily: 'var(--bn)', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>দাম (৳)</span>
        <div className="flex gap-2">
          <input type="number" inputMode="numeric" aria-label="সর্বনিম্ন দাম" placeholder="সর্বনিম্ন" value={filters.priceMin} onChange={(e) => { setFilters({ ...filters, priceMin: e.target.value }); setPage(1); }} style={inputStyle} className="collection-field" />
          <input type="number" inputMode="numeric" aria-label="সর্বোচ্চ দাম" placeholder="সর্বোচ্চ" value={filters.priceMax} onChange={(e) => { setFilters({ ...filters, priceMax: e.target.value }); setPage(1); }} style={inputStyle} className="collection-field" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="collection-hero">
          <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '0 24px' }}>
            <nav aria-label="Breadcrumb" style={{ fontFamily: 'var(--bn)', fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
              <Link href="/" style={{ color: 'var(--muted)' }}>হোম</Link>
              <span style={{ margin: '0 8px', opacity: .5 }}>›</span>
              <span>{eyebrow}</span>
            </nav>
            <h1 style={{ fontFamily: 'var(--bn)', fontWeight: 700, fontSize: 'clamp(26px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.01em', color: 'var(--ink)', margin: '0 0 6px' }}>
              {heading}
            </h1>
            <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: 'var(--muted)' }}>
              {loading ? 'বই লোড হচ্ছে…' : `${filteredProducts.length.toLocaleString('bn-BD')}টি বই`}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '28px 24px 48px' }}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar (desktop) */}
            <aside className="hidden lg:block lg:w-60 flex-shrink-0">
              <div style={{ border: '1px solid var(--line-soft)', borderRadius: 14, padding: 20, background: 'var(--card)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 style={{ fontFamily: 'var(--bn)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: 0 }}>ফিল্টার</h2>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} style={{ fontFamily: 'var(--bn)', fontSize: 12, color: 'var(--muted)', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>
                      মুছে ফেলুন ({activeFiltersCount})
                    </button>
                  )}
                </div>
                {filterFields}
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar: filter button (mobile) + sort chips */}
              <div className="collection-toolbar">
                <button
                  type="button"
                  className="collection-filter-btn lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={filtersOpen}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                  ফিল্টার{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </button>
                <div className="collection-sort" role="group" aria-label="সাজান">
                  <span className="hidden sm:inline" style={{ fontFamily: 'var(--bn)', fontSize: 13, color: 'var(--muted)' }}>সাজান:</span>
                  {([
                    { value: 'newest', label: 'নতুন' },
                    { value: 'price-asc', label: 'দাম ↑' },
                    { value: 'price-desc', label: 'দাম ↓' },
                    { value: 'discount', label: 'বেশি ছাড়' },
                  ] as { value: SortOption; label: string }[]).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => { setSortBy(value); setPage(1); }}
                      className={`sort-chip${sortBy === value ? ' is-active' : ''}`}
                      aria-pressed={sortBy === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <CollectionSkeleton />
              ) : paginatedProducts.length === 0 ? (
                <div style={{ border: '1px solid var(--line-soft)', borderRadius: 16, padding: '64px 24px', textAlign: 'center', background: 'var(--card)' }}>
                  <HiOutlineBookOpen style={{ width: 48, height: 48, color: 'var(--muted)', margin: '0 auto 16px' }} />
                  <h3 style={{ fontFamily: 'var(--bn)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>কোনো বই পাওয়া যায়নি</h3>
                  <p style={{ fontFamily: 'var(--bn)', color: 'var(--muted)', marginBottom: 20 }}>ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
                  <button onClick={clearFilters} className="btn btn-accent btn-sm"><span className="bn">ফিল্টার মুছুন</span></button>
                </div>
              ) : (
                <div key={`${page}-${sortBy}-${searchParams.toString()}`} className="collection-grid grid-rise">
                  {paginatedProducts.map((product, i) => (
                    <HomeProductCard key={product._id} product={product} onAdd={handleAddToCart} eager={page === 1 && i < 4} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-10" aria-label="পেজ">
                  <button
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="page-btn"
                    aria-label="আগের পেজ"
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (page > 3) pageNum = page - 2 + i;
                      if (page > totalPages - 3) pageNum = totalPages - 4 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`page-btn${page === pageNum ? ' is-active' : ''}`}
                        aria-current={page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="page-btn"
                    aria-label="পরের পেজ"
                  >
                    →
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter sheet */}
      <div className={`sheet-overlay lg:hidden${filtersOpen ? ' is-open' : ''}`} onClick={() => setFiltersOpen(false)} aria-hidden="true" />
      <div
        className={`filter-sheet lg:hidden${filtersOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="ফিল্টার"
        aria-hidden={!filtersOpen}
      >
        <div className="filter-sheet-handle" aria-hidden="true" />
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--bn)', fontWeight: 700, fontSize: 18, margin: 0 }}>ফিল্টার</h2>
          <button type="button" onClick={() => setFiltersOpen(false)} className="sheet-close" aria-label="বন্ধ করুন">✕</button>
        </div>
        {filterFields}
        <div className="grid grid-cols-2 gap-3" style={{ marginTop: 22 }}>
          <button type="button" className="sheet-btn ghost" onClick={() => { clearFilters(); setFiltersOpen(false); }}>সব মুছুন</button>
          <button type="button" className="sheet-btn solid" onClick={() => setFiltersOpen(false)}>
            {filteredProducts.length.toLocaleString('bn-BD')}টি বই দেখুন
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin rounded-full h-10 w-10" style={{ borderBottom: '2px solid var(--accent)' }} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
