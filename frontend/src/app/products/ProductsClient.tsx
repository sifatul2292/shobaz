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
import ProductCard from '@/components/common/ProductCard';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'discount';

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
  const itemsPerPage = 12;

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    publisher: searchParams.get('publisher') || '',
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sort') || 'newest',
    priceMin: '',
    priceMax: '',
  });

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      author: searchParams.get('author') || '',
      publisher: searchParams.get('publisher') || '',
      q: searchParams.get('q') || '',
      sortBy: searchParams.get('sort') || 'newest',
      priceMin: '',
      priceMax: '',
    });
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    document.title = 'All Books - Shobaz';
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

    switch (filters.sortBy) {
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
  }, [allProducts, filters]);

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

  const getCurrentPrice = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    return discount > 0 ? salePrice - discount : salePrice;
  };

  const getDiscountPercent = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    if (!discount || !salePrice) return 0;
    return Math.round((discount / salePrice) * 100);
  };

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success('🛒 Added to cart');
  };

  const activeFiltersCount = [
    filters.category,
    filters.author,
    filters.publisher,
    filters.q,
    filters.priceMin || filters.priceMax,
  ].filter(Boolean).length;

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div style={{ borderBottom: '1px solid var(--line-soft)', padding: '32px 0', background: 'var(--card)' }}>
          <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '0 24px' }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
              Books
            </p>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 'clamp(28px,4vw,48px)', letterSpacing: '-.02em', color: 'var(--ink)', margin: '0 0 6px' }}>
              {filters.category
                ? (categories.find(c => c.slug === filters.category)?.name || decodeURIComponent(filters.category))
                : 'All Books'}
            </h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)' }}>
              {filteredProducts.length} books found
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '32px 24px' }}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-56 flex-shrink-0">
              <div style={{ border: '1px solid var(--line-soft)', borderRadius: 'var(--radius-lg)', padding: 20, background: 'var(--card)' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>Filters</h2>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>
                      Clear ({activeFiltersCount})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Category', key: 'category', items: categories.slice(0, 30), labelField: 'name', valueField: 'slug', defaultLabel: 'All Categories' },
                    { label: 'Author', key: 'author', items: authors.slice(0, 20), labelField: 'name', valueField: 'slug', defaultLabel: 'All Authors' },
                    { label: 'Publisher', key: 'publisher', items: publishers.slice(0, 20), labelField: 'name', valueField: 'slug', defaultLabel: 'All Publishers' },
                  ].map(({ label, key, items, labelField, valueField, defaultLabel }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{label}</label>
                      <select
                        value={(filters as any)[key]}
                        onChange={(e) => updateURL(key, e.target.value)}
                        style={selectStyle}
                        className="w-full"
                      >
                        <option value="">{defaultLabel}</option>
                        {items.map((item: any) => (
                          <option key={item._id} value={item[valueField]}>{item[labelField]}</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Price</label>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.priceMin} onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })} style={inputStyle} />
                      <input type="number" placeholder="Max" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1">
              {/* Sort bar */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Sort by</span>
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'price-asc', label: 'Price ↑' },
                  { value: 'price-desc', label: 'Price ↓' },
                  { value: 'discount', label: 'Discount' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateURL('sort', value)}
                    className={`chip${filters.sortBy === value ? ' solid' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10" style={{ borderBottom: '2px solid var(--accent)' }} />
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div style={{ border: '1px solid var(--line-soft)', borderRadius: 'var(--radius-lg)', padding: '64px 24px', textAlign: 'center', background: 'var(--card)' }}>
                  <HiOutlineBookOpen style={{ width: 48, height: 48, color: 'var(--muted)', margin: '0 auto 16px' }} />
                  <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>No books found</h3>
                  <p style={{ fontFamily: 'var(--sans)', color: 'var(--muted)', marginBottom: 20 }}>Try changing your filters</p>
                  <button onClick={clearFilters} className="btn btn-accent btn-sm">Clear filters</button>
                </div>
              ) : (
                <div className="book-grid">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ opacity: page === 1 ? .4 : 1 }}
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
                        onClick={() => setPage(pageNum)}
                        className={`chip${page === pageNum ? ' solid' : ''}`}
                        style={{ cursor: 'pointer', width: 36, textAlign: 'center' }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn btn-ghost btn-sm"
                    style={{ opacity: page === totalPages ? .4 : 1 }}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
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
