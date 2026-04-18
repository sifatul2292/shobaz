'use client';

import { Suspense } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { getCached, setCached } from '@/lib/cache';
import LazyImage from '@/components/ui/LazyImage';
import { gtmSearch } from '@/lib/gtm';
import { Product, Category, Author, Publisher } from '@/types';
import { useCartStore } from '@/store/useCartStore';
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
    toast.success('🛒 কার্টে যোগ হয়েছে');
  };

  const activeFiltersCount = [
    filters.category,
    filters.author,
    filters.publisher,
    filters.q,
    filters.priceMin || filters.priceMax,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-green-500 to-green-700 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <HiOutlineBookOpen className="w-7 h-7" />
              {filters.category ? `${decodeURIComponent(filters.category)}` : 'সকল বই'}
            </h1>
            <p className="text-green-100">{filteredProducts.length} টি বই পাওয়া গেছে</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">ফিল্টার</h2>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-sm text-red-500 hover:underline">
                      সব মুছুন ({activeFiltersCount})
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ক্যাটাগরি</label>
                    <select 
                      value={filters.category}
                      onChange={(e) => updateURL('category', e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">সব ক্যাটাগরি</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">লেখক</label>
                    <select 
                      value={filters.author}
                      onChange={(e) => updateURL('author', e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">সব লেখক</option>
                      {authors.slice(0, 20).map((auth) => (
                        <option key={auth._id} value={auth.slug}>{auth.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">প্রকাশনা</label>
                    <select 
                      value={filters.publisher}
                      onChange={(e) => updateURL('publisher', e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">সব প্রকাশনা</option>
                      {publishers.slice(0, 20).map((pub) => (
                        <option key={pub._id} value={pub.slug}>{pub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">মূল্য পরিসর</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="কম"
                        value={filters.priceMin}
                        onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="বেশি"
                        value={filters.priceMax}
                        onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {filters.category && (
                    <Link href="/products" className="block text-center py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition">
                      সব ক্যাটাগরি দেখুন
                    </Link>
                  )}
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <select 
                      value={filters.sortBy}
                      onChange={(e) => updateURL('sort', e.target.value)}
                      className="p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="newest">নতুন আগমন</option>
                      <option value="price-asc">দাম: কম থেকে বেশি</option>
                      <option value="price-desc">দাম: বেশি থেকে কম</option>
                      <option value="name-asc">নাম: A-Z</option>
                      <option value="discount">অফার</option>
                    </select>

                    <div className="hidden md:flex border border-gray-200 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 ${viewMode === 'grid' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 ${viewMode === 'list' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">কোনো বই পাওয়া যায়নি</h3>
                  <p className="text-gray-500 mb-4">আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
                  <button onClick={clearFilters} className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-500 transition">
                    ফিল্টার মুছুন
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedProducts.map((product) => {
                    const salePrice = product.salePrice || 0;
                    const discount = product.discountAmount || 0;
                    const currentPrice = getCurrentPrice(product);
                    const discountPercent = getDiscountPercent(product);
                    const img = product.images?.[0];
                    const productName = product.name || 'Untitled';
                    const productSlug = product.slug || product._id;
                    const authorData = product.author;
                    let authorName = '';
                    if (Array.isArray(authorData)) {
                      authorName = authorData[0]?.name || '';
                    } else if (typeof authorData === 'object' && authorData) {
                      authorName = (authorData as any)?.name || '';
                    }
                    
                    return (
                      <Link key={product._id} href={`/products/${productSlug}`} className="group">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                          <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center">
                            {img ? (
                              <LazyImage src={imgUrl(img)!} alt={productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <HiOutlineBookOpen className="w-20 h-20 text-gray-300" />
                              </div>
                            )}
                            {discountPercent > 0 && (
                              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>
                          <div className="p-4 pb-4 group-hover:pb-16 transition-all duration-300">
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{productName}</h3>
                            {authorName && <p className="text-xs text-gray-500 mb-2 truncate">{authorName}</p>}
                            {salePrice > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-500">৳{currentPrice}</span>
                                {discount > 0 && <span className="text-sm text-gray-400 line-through">৳{salePrice}</span>}
                              </div>
                            )}
                            {salePrice === 0 && <p className="text-sm font-bold text-green-500">Free</p>}
                            <button 
                              onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                              className="absolute bottom-3 left-4 right-4 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg"
                            >
                              কার্টে যোগ করুন
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedProducts.map((product) => {
                    const salePrice = product.salePrice || 0;
                    const discount = product.discountAmount || 0;
                    const currentPrice = getCurrentPrice(product);
                    const discountPercent = getDiscountPercent(product);
                    const img = product.images?.[0];
                    const productName = product.name || 'Untitled';
                    const productSlug = product.slug || product._id;
                    const authorData = product.author;
                    let authorName = '';
                    if (Array.isArray(authorData)) {
                      authorName = authorData[0]?.name || '';
                    } else if (typeof authorData === 'object' && authorData) {
                      authorName = (authorData as any)?.name || '';
                    }
                    
                    return (
                      <Link key={product._id} href={`/products/${productSlug}`} className="group">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-2xl transition-all duration-300 flex gap-4">
                          <div className="w-24 h-32 md:w-32 md:h-44 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {img ? (
                              <LazyImage src={imgUrl(img)!} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 mb-1">{productName}</h3>
                                {authorName && <p className="text-sm text-gray-500 mb-2">লেখক: {authorName}</p>}
                              </div>
                              {discountPercent > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xl font-bold text-green-500">৳{currentPrice}</span>
                              {discount > 0 && <span className="text-sm text-gray-400 line-through">৳{salePrice}</span>}
                            </div>
                            <button 
                              onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                              className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-sm transition"
                            >
                              কার্টে যোগ করুন
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
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
                        className={`w-10 h-10 rounded-xl font-medium transition ${
                          page === pageNum ? 'bg-green-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
