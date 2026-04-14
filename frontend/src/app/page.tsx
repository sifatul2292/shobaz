'use client';

import { useState, useEffect } from 'react';
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

export default function HomePage() {
  const router = useRouter();
  const { addItem } = useCartStore();
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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<{ [key: string]: Product[] }>({});

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success('🛒 কার্টে যোগ হয়েছে');
  };

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

  const getCurrentPrice = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    return discount > 0 ? salePrice - discount : salePrice;
  };

  const getOriginalPrice = (p: Product) => {
    return p.salePrice || 0;
  };

  const getDiscountPercent = (p: Product) => {
    const salePrice = p.salePrice || 0;
    const discount = p.discountAmount || 0;
    if (!discount || !salePrice) return 0;
    return Math.round((discount / salePrice) * 100);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryHover = async (categorySlug: string) => {
    if (categoryProducts[categorySlug]) return;
    
    const allProducts = [...products, ...featuredProducts, ...newProducts];
    const categoryFiltered = allProducts.filter((p: Product) => {
      const cat = p.category as any;
      if (Array.isArray(cat)) {
        return cat.some((c: any) => c.slug === categorySlug);
      } else if (cat?.slug) {
        return cat.slug === categorySlug;
      }
      return false;
    }).slice(0, 4);
    
    setCategoryProducts(prev => ({ ...prev, [categorySlug]: categoryFiltered }));
  };

  const ProductCard = ({ product, showAddToCart }: { product: Product; showAddToCart?: boolean }) => {
    const salePrice = product.salePrice || 0;
    const discount = product.discountAmount || 0;
    const currentPrice = getCurrentPrice(product);
    const discountPercent = getDiscountPercent(product);
    const img = product.images?.[0];
    const productName = product.name || 'Untitled Book';
    const productSlug = product.slug || product._id;
    const authorData = product.author;
    let authorName = '';
    if (Array.isArray(authorData)) {
      authorName = authorData[0]?.name || '';
    } else if (typeof authorData === 'object' && authorData) {
      authorName = (authorData as any)?.name || '';
    } else if (typeof authorData === 'string') {
      authorName = authorData;
    }
    
    return (
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
        {/* Image Section */}
        <Link href={`/products/${productSlug}`} className="block">
          <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center">
            {img ? (
              <img src={imgUrl(img)!} alt={productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-7xl filter drop-shadow-lg">📖</span>
              </div>
            )}
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </Link>
        
        {/* Text Section - button expands on hover */}
        <div className="p-4 pb-4 group-hover:pb-16 transition-all duration-300">
          <Link href={`/products/${productSlug}`} className="block cursor-pointer">
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{productName}</h3>
            {authorName && <p className="text-xs text-gray-500 mb-2 truncate">{authorName}</p>}
            {salePrice > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-teal-600">৳{currentPrice}</span>
                {discount > 0 && <span className="text-sm text-gray-400 line-through">৳{salePrice}</span>}
              </div>
            )}
            {salePrice === 0 && <p className="text-sm font-bold text-teal-600">Free</p>}
          </Link>
          
          {/* Add to Cart Button - shows on hover */}
          <button 
            onClick={() => handleAddToCart(product)}
            className="absolute bottom-3 left-4 right-4 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg"
          >
            কার্টে যোগ করুন
          </button>
        </div>
      </div>
    );
  };

const CategoryCard = ({ cat }: { cat: Category }) => {
    return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
      <Link href={`/products?category=${cat.slug}`} className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all'>
        <div className='w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center'>
          {cat.image ? (
            <img src={imgUrl(cat.image)!} alt={cat.name} className='w-6 h-6 object-contain' />
          ) : (
            <span className='text-xl'>📚</span>
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
                      <div className='w-full h-full flex items-center justify-center text-2xl'>📖</div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      
      <Link href={`/products?category=${cat.slug}`} className='block text-center py-2 text-teal-600 text-sm font-medium hover:text-teal-700 border-t border-gray-100'>
        সব বই দেখুন →
      </Link>
    </div>
  );
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
          <section className="relative h-[300px] md:h-[400px] lg:h-[500px]">
            <Swiper modules={[Navigation, Autoplay]} autoplay={{ delay: 5000 }} navigation pagination={{ clickable: true }} loop className="h-full">
              {banners.map((banner) => (
                <SwiperSlide key={banner._id} className="h-full">
                  <Link href={banner.link || '/'}>
                    <div className="w-full h-full bg-gradient-to-r from-teal-600 to-teal-800 relative">
                      {banner.image && (
                        <img src={imgUrl(banner.image)!} alt={banner.title || ''} className="w-full h-full object-cover opacity-30" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white px-4">
                          <h1 className="text-3xl md:text-5xl font-bold mb-4">{banner.title || 'বইয়ের জগৎ'}</h1>
                          <p className="text-lg md:text-xl text-teal-100">{banner.description || 'সেরা বইয়ের সংগ্রহ'}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Categories Section - Grid */}
        {categories.length > 0 && (
          <section className='max-w-7xl mx-auto px-4 py-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <h2 className='text-xl font-bold text-gray-800'>📚 বইয়ের ক্যাটাগরি</h2>
              </div>
              <Link href='/products' className='text-teal-600 text-sm font-medium hover:underline'>সব দেখুন →</Link>
            </div>
            
            <div className='hidden md:grid md:grid-cols-4 gap-4'>
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard key={cat._id} cat={cat} />
              ))}
            </div>
            
            <div className='md:hidden'>
              <Swiper slidesPerView={1.2} spaceBetween={12} freeMode={true} modules={[Navigation]}>
                {categories.slice(0, 8).map((cat) => (
                  <SwiperSlide key={cat._id}>
<CategoryCard key={cat._id} cat={cat} />
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
                <h2 className='text-2xl font-bold text-gray-800'>🔥 হট ডিল</h2>
                <span className='bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium'>অফার</span>
              </div>
              <Link href='/products?sort=discountAmount' className='text-teal-600 text-sm font-medium hover:underline'>সব দেখুন →</Link>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'>
              {featuredProducts.slice(0, 12).map((product) => (
                <ProductCard key={product._id} product={product} showAddToCart />
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10 bg-white rounded-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800">🆕 নতুন আগমন</h2>
                <span className="bg-teal-500 text-white text-xs px-3 py-1 rounded-full font-medium">নতুন</span>
              </div>
              <Link href="/products?sort=createdAt" className="text-teal-600 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {newProducts.slice(0, 12).map((product) => (
                <ProductCard key={product._id} product={product} showAddToCart />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        {products.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 সব বই</h2>
              <Link href="/products" className="text-teal-600 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.slice(0, 24).map((product) => (
                <ProductCard key={product._id} product={product} />
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
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-teal-500 hover:text-teal-600 hover:shadow-md transition-all"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Authors */}
        {authors.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">✍️ জনপ্রিয় লেখক</h2>
              <Link href="/authors" className="text-teal-600 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <Swiper slidesPerView={2} spaceBetween={16} breakpoints={{ 640: { slidesPerView: 4 }, 768: { slidesPerView: 5 }, 1024: { slidesPerView: 8 } }} modules={[Navigation]}>
              {authors.map((author) => (
                <SwiperSlide key={author._id}>
                  <Link href={`/products?author=${author.slug}`} className="block text-center group">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 overflow-hidden mb-2 ring-2 ring-transparent group-hover:ring-teal-500 transition-all">
                      {author.image ? (
                        <img src={imgUrl(author.image)!} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{author.name?.charAt(0)}</div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600">{author.name}</span>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Publishers */}
        {publishers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8 bg-white rounded-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">🏢 জনপ্রিয় প্রকাশনা</h2>
              <Link href="/publishers" className="text-teal-600 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <Swiper slidesPerView={2} spaceBetween={16} breakpoints={{ 640: { slidesPerView: 4 }, 768: { slidesPerView: 5 }, 1024: { slidesPerView: 8 } }} modules={[Navigation]}>
              {publishers.map((pub) => (
                <SwiperSlide key={pub._id}>
                  <Link href={`/products?publisher=${pub.slug}`} className="block text-center group">
                    <div className="h-16 mx-auto rounded-lg bg-gray-50 overflow-hidden mb-2 flex items-center justify-center px-4">
                      {pub.image ? (
                        <img src={imgUrl(pub.image)!} alt={pub.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">{pub.name}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600">{pub.name}</span>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* Blog */}
        {blogs.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">📰 ব্লগ</h2>
              <Link href="/blog" className="text-teal-600 text-sm font-medium hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((blog) => (
                <Link key={blog._id} href={`/blog/${blog.slug}`} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-video bg-gray-100">
                    {blog.image ? (
                      <img src={imgUrl(blog.image)!} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
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
        <section className="bg-teal-600 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="text-white">
                <div className="text-4xl mb-2">📚</div>
                <h3 className="text-xl font-bold">৫০,০০০+ বই</h3>
                <p className="text-teal-200 text-sm">বিভিন্ন ক্যাটাগরি</p>
              </div>
              <div className="text-white">
                <div className="text-4xl mb-2">🚚</div>
                <h3 className="text-xl font-bold">ফ্রি ডেলিভারি</h3>
                <p className="text-teal-200 text-sm">৫০০+ টাকায়</p>
              </div>
              <div className="text-white">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-xl font-bold">দ্রুত ডেলিভারি</h3>
                <p className="text-teal-200 text-sm">২-৫ দিনে</p>
              </div>
              <div className="text-white">
                <div className="text-4xl mb-2">🛡️</div>
                <h3 className="text-xl font-bold">গারান্টি</h3>
                <p className="text-teal-200 text-sm">১০০% সন্তুষ্টি</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}