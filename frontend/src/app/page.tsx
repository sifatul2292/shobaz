'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { HiOutlineBookOpen, HiOutlineFire, HiOutlineSparkles, HiOutlineTruck, HiOutlineShieldCheck } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product, Category, Author, Publisher, Blog, Tag } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/* ── Helpers (stable, defined once at module level) ── */
function getCurrentPrice(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
}
function getDiscountPercent(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  if (!discount || !salePrice) return 0;
  return Math.round((discount / salePrice) * 100);
}

/* ── ProductCard — outside HomePage so React never remounts it ── */
const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (p: Product) => void;
}) {
  const salePrice = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  const currentPrice = getCurrentPrice(product);
  const discountPercent = getDiscountPercent(product);
  const img = product.images?.[0];
  const productName = product.name || 'Untitled Book';
  const productSlug = product.slug || product._id;
  const authorData = product.author;
  let authorName = '';
  if (Array.isArray(authorData)) authorName = authorData[0]?.name || '';
  else if (typeof authorData === 'object' && authorData) authorName = (authorData as any)?.name || '';
  else if (typeof authorData === 'string') authorName = authorData;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300 flex flex-col">
      <Link href={`/products/${productSlug}`} className="block relative overflow-hidden bg-gray-50">
        <div className="aspect-[3/4] flex items-center justify-center overflow-hidden">
          {img ? (
            <img src={imgUrl(img)!} alt={productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <HiOutlineBookOpen className="w-16 h-16 text-gray-200" />
          )}
        </div>
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discountPercent}%
          </span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${productSlug}`}>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-green-600 transition-colors">{productName}</h3>
        </Link>
        {authorName && <p className="text-xs text-gray-400 mt-0.5 truncate">{authorName}</p>}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-base font-bold text-gray-900">৳{currentPrice}</span>
            {discount > 0 && <span className="text-xs text-gray-400 line-through">৳{salePrice}</span>}
          </div>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              + কার্টে যোগ করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/* ── CategoryCard — outside HomePage ── */
const CategoryCard = memo(function CategoryCard({
  cat,
  categoryProducts,
}: {
  cat: Category;
  categoryProducts: { [key: string]: Product[] };
}) {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
      <Link href={`/products?category=${cat.slug}`} className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all'>
        <div className='w-10 h-10 bg-gradient-to-br from-green-100 to-cyan-100 rounded-full flex items-center justify-center'>
          {cat.image ? (
            <img src={imgUrl(cat.image)!} alt={cat.name} className='w-6 h-6 object-contain' />
          ) : (
            <HiOutlineBookOpen className="w-5 h-5 text-green-500" />
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-semibold text-gray-800 truncate'>{cat.name}</h3>
          <p className='text-xs text-gray-500'>{categoryProducts[cat.slug]?.length || 0} টি বই</p>
        </div>
      </Link>
      {categoryProducts[cat.slug] && categoryProducts[cat.slug].length > 0 && (
        <div className='grid grid-cols-4 gap-1 px-2 pb-2'>
          {categoryProducts[cat.slug].map((product) => {
            const img = product.images?.[0];
            const productName = product.name || 'Untitled';
            const productSlug = product.slug || product._id;
            return (
              <Link key={product._id} href={`/products/${productSlug}`} className='group'>
                <div className='bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all'>
                  <div className='aspect-square bg-gray-100 relative overflow-hidden'>
                    {img ? (
                      <img src={imgUrl(img)!} alt={productName} className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Link href={`/products?category=${cat.slug}`} className='block text-center py-2 text-green-500 text-sm font-medium hover:text-green-600 border-t border-gray-100'>
        সব বই দেখুন →
      </Link>
    </div>
  );
});

export default function HomePage() {
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryProducts, setCategoryProducts] = useState<{ [key: string]: Product[] }>({});

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product, 1);
    toast.success('🛒 কার্টে যোগ হয়েছে');
  }, [addItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, tagsRes, bannersRes, authorsRes, publishersRes, blogsRes] = await Promise.allSettled([
          api.get('/product/get-all-data'),
          api.post('/category/get-all'),
          api.get('/tag/get-all-basic'),
          api.get('/banner-carousel/get-all-basic'),
          api.get('/author/get-all-basic'),
          api.get('/publisher/get-all-basic'),
          api.get('/blog/get-all-basic'),
        ]);
        
        if (productsRes.status === 'fulfilled' && productsRes.value.data?.data) {
          let productsData = productsRes.value.data.data;
          if (productsRes.value.data.data.items) {
            productsData = productsRes.value.data.data.items;
          }
          if (Array.isArray(productsData)) {
            setProducts(productsData);
            setFeaturedProducts(productsData.filter((p: Product) => (p.discountAmount || 0) > 0).slice(0, 12));
            setNewProducts(productsData.slice(0, 12));
          }
        }
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.data) {
          let catsData = categoriesRes.value.data.data;
          if (categoriesRes.value.data.data.items) {
            catsData = categoriesRes.value.data.data.items;
          }
          if (Array.isArray(catsData)) {
            console.log('Categories fetched:', catsData.length, catsData);
            setCategories(catsData);
            
            if (productsRes.status === 'fulfilled' && productsRes.value.data?.data) {
              let productsData = productsRes.value.data.data;
              if (productsRes.value.data.data.items) {
                productsData = productsRes.value.data.data.items;
              }
              if (Array.isArray(productsData)) {
                const initialCategoryProducts: { [key: string]: Product[] } = {};
                catsData.forEach((cat: Category) => {
                  const filtered = productsData.filter((p: Product) => {
                    const c = p.category as any;
                    if (Array.isArray(c)) {
                      return c.some((c: any) => c.slug === cat.slug);
                    } else if (c?.slug) {
                      return c.slug === cat.slug;
                    }
                    return false;
                  }).slice(0, 4);
                  if (filtered.length > 0) {
                    initialCategoryProducts[cat.slug] = filtered;
                  }
                });
                setCategoryProducts(initialCategoryProducts);
              }
            }
          }
        } else if (categoriesRes.status === 'rejected') {
          console.error('Categories API failed:', categoriesRes.reason);
        }
        if (tagsRes.status === 'fulfilled' && tagsRes.value.data?.data) {
          setTags(tagsRes.value.data.data.slice(0, 20));
        }
        if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.data) {
          let bannerData = bannersRes.value.data.data;
          if (bannersRes.value.data.data.items) {
            bannerData = bannersRes.value.data.data.items;
          }
          setBanners(Array.isArray(bannerData) ? bannerData : []);
        }
        if (authorsRes.status === 'fulfilled' && authorsRes.value.data?.data) {
          setAuthors(authorsRes.value.data.data.slice(0, 10));
        }
        if (publishersRes.status === 'fulfilled' && publishersRes.value.data?.data) {
          setPublishers(publishersRes.value.data.data.slice(0, 10));
        }
        if (blogsRes.status === 'fulfilled' && blogsRes.value.data?.data) {
          setBlogs(blogsRes.value.data.data.slice(0, 3));
        }
      } catch (err: any) {
        console.error('Home page fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-500 text-lg">লোড হচ্ছে...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        {banners.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-4">
            <div className="relative h-[200px] md:h-[280px] lg:h-[350px] rounded-2xl overflow-hidden shadow-lg">
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true, dynamicBullets: true }}
                loop
                speed={800}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                className="h-full rounded-2xl"
              >
                {banners.map((banner) => (
                  <SwiperSlide key={banner._id} className="h-full rounded-2xl">
                    <Link href={banner.link || '/'} className="block w-full h-full">
                      {banner.image ? (
                        <img
                          src={imgUrl(banner.image)!}
                          alt={banner.title || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-green-500 to-green-700" />
                      )}
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Categories Section - Grid */}
        {categories.length > 0 && (
          <section className='max-w-7xl mx-auto px-4 py-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'><HiOutlineBookOpen className="w-5 h-5 text-green-500" /> বইয়ের ক্যাটাগরি</h2>
              </div>
              <Link href='/products' className='text-green-500 text-sm font-medium hover:underline'>সব দেখুন →</Link>
            </div>
            
            <div className='hidden md:grid md:grid-cols-4 gap-4'>
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard key={cat._id} cat={cat} categoryProducts={categoryProducts} />
              ))}
            </div>
            
            <div className='md:hidden'>
              <Swiper slidesPerView={1.2} spaceBetween={12} freeMode={true} modules={[Navigation]}>
                {categories.slice(0, 8).map((cat) => (
                  <SwiperSlide key={cat._id}>
<CategoryCard key={cat._id} cat={cat} categoryProducts={categoryProducts} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Featured Products - Hot Deals */}
        {featuredProducts.length > 0 && (
          <section className='max-w-7xl mx-auto px-4 py-10'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-2'><HiOutlineFire className='w-6 h-6 text-orange-500' /> হট ডিল</h2>
                <span className='bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium'>অফার</span>
              </div>
              <Link href='/products?sort=discountAmount' className='text-green-500 text-sm font-medium hover:underline'>সব দেখুন →</Link>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'>
              {featuredProducts.slice(0, 12).map((product) => (
                <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10 bg-white rounded-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><HiOutlineSparkles className="w-6 h-6 text-green-500" /> নতুন আগমন</h2>
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">নতুন</span>
              </div>
              <Link href="/products?sort=createdAt" className="text-green-500 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {newProducts.slice(0, 12).map((product) => (
                <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        {products.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><HiOutlineBookOpen className="w-6 h-6 text-green-500" /> সব বই</h2>
              <Link href="/products" className="text-green-500 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.slice(0, 24).map((product) => (
                <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🏷️ জনপ্রিয় ট্যাগ</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/products?tag=${tag.slug}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-green-500 hover:text-green-500 hover:shadow-md transition-all"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Authors */}
        {authors.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">জনপ্রিয় লেখক</h2>
                <p className="text-sm text-gray-500 mt-0.5">আপনার পছন্দের লেখকের বই খুঁজুন</p>
              </div>
              <Link href="/authors" className="text-green-600 text-sm font-semibold hover:underline">সব দেখুন →</Link>
            </div>
            <Swiper
              slidesPerView={3} spaceBetween={12}
              breakpoints={{ 480: { slidesPerView: 4 }, 640: { slidesPerView: 5 }, 768: { slidesPerView: 6 }, 1024: { slidesPerView: 8 } }}
              modules={[Navigation]}
            >
              {authors.map((author) => (
                <SwiperSlide key={author._id}>
                  <Link href={`/products?author=${author.slug}`} className="block text-center group py-2">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full overflow-hidden mb-2 shadow-sm border-2 border-transparent group-hover:border-green-400 transition-all duration-200">
                      {author.image ? (
                        <img src={imgUrl(author.image)!} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200 text-xl font-bold text-green-700">
                          {author.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 group-hover:text-green-600 transition-colors line-clamp-2 leading-snug px-1">{author.name}</p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Publishers */}
        {publishers.length > 0 && (
          <section className="bg-white py-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">জনপ্রিয় প্রকাশনা</h2>
                  <p className="text-sm text-gray-500 mt-0.5">দেশের সেরা প্রকাশনীর বই</p>
                </div>
                <Link href="/publishers" className="text-green-600 text-sm font-semibold hover:underline">সব দেখুন →</Link>
              </div>
              <Swiper
                slidesPerView={3} spaceBetween={12}
                breakpoints={{ 480: { slidesPerView: 4 }, 640: { slidesPerView: 5 }, 768: { slidesPerView: 6 }, 1024: { slidesPerView: 8 } }}
                modules={[Navigation]}
              >
                {publishers.map((pub) => (
                  <SwiperSlide key={pub._id}>
                    <Link href={`/products?publisher=${pub.slug}`} className="block group">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-green-300 hover:shadow-md transition-all duration-200 min-h-[90px] justify-center">
                        {pub.image ? (
                          <img src={imgUrl(pub.image)!} alt={pub.name} className="h-10 max-w-full object-contain" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                            <span className="text-green-700 font-bold text-sm">{pub.name?.charAt(0)}</span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-gray-700 group-hover:text-green-600 transition-colors text-center line-clamp-1">{pub.name}</p>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Blog */}
        {blogs.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">📰 ব্লগ</h2>
              <Link href="/blog" className="text-green-500 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((blog) => (
                <Link key={blog._id} href={`/blog/${blog.slug}`} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-video bg-gray-100">
                    {blog.image ? (
                      <img src={imgUrl(blog.image)!} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiOutlineBookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 line-clamp-2">{blog.title}</h3>
                    <p className="text-xs text-gray-500 mt-2">{blog.createdAt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Features Banner */}
        <section className="relative mt-10 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 via-green-500 to-teal-600 py-12">
            {/* subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/20">
                <div className="flex flex-col items-center text-center text-white px-6 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                    <HiOutlineBookOpen className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">বিভিন্ন বই</h3>
                  <p className="text-green-100 text-sm mt-1 font-medium">সব ধরনের ক্যাটাগরি</p>
                </div>
                <div className="flex flex-col items-center text-center text-white px-6 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                    <HiOutlineSparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">৫০০০+ গ্রাহক</h3>
                  <p className="text-green-100 text-sm mt-1 font-medium">সন্তুষ্ট ক্রেতা</p>
                </div>
                <div className="flex flex-col items-center text-center text-white px-6 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                    <HiOutlineTruck className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">কম খরচে ডেলিভারি</h3>
                  <p className="text-green-100 text-sm mt-1 font-medium">৬০ টাকা থেকে শুরু</p>
                </div>
                <div className="flex flex-col items-center text-center text-white px-6 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-inner">
                    <HiOutlineShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">১০০% গ্যারান্টি</h3>
                  <p className="text-green-100 text-sm mt-1 font-medium">সন্তুষ্টি নিশ্চিত</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}