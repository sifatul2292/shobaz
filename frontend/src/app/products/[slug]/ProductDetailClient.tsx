'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaShare, FaHeart, FaStar, FaShoppingCart, FaBoxOpen } from 'react-icons/fa';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailClient({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [slug, setSlug] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  const { addItem, items } = useCartStore();

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
    });
  }, [params]);

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/product/get-by-slug/${slug}`);
      if (res.data?.data) {
        setProduct(res.data.data);
        const relatedRes = await api.get('/product/get-all-data');
        if (relatedRes.data?.data) {
          const allProducts = relatedRes.data.data;
          setRelatedProducts(allProducts.filter((p: Product) => p._id !== res.data.data._id).slice(0, 10));
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      toast.success('🛒 কার্টে যোগ হয়েছে');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      window.location.href = '/checkout';
    }
  };

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

  const getAuthorName = (author: any) => {
    if (!author) return '';
    if (Array.isArray(author)) return author[0]?.name || '';
    if (typeof author === 'object') return author.name || '';
    return author as string;
  };

  const getPublisherName = (publisher: any) => {
    if (!publisher) return '';
    if (Array.isArray(publisher)) return publisher[0]?.name || '';
    if (typeof publisher === 'object') return publisher.name || '';
    return publisher as string;
  };

  const isInCart = items.some(item => item.product._id === product?._id);

  const nextImage = () => {
    if (product?.images) {
      setActiveImage((prev) => (prev + 1) % product.images!.length);
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setActiveImage((prev) => (prev - 1 + product.images!.length) % product.images!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">পণ্য পাওয়া যায়নি</h2>
            <Link href="/products" className="text-teal-600 hover:underline">সকল বই দেখুন</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images || [];
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);
  const authorName = getAuthorName(product.author);
  const publisherName = getPublisherName(product.publisher);
  const inStock = product.quantity === undefined || product.quantity > 0;

  const tabs = [
    { id: 'description', label: 'বিবরণ' },
    { id: 'features', label: 'বৈশিষ্ট্য' },
    { id: 'specs', label: 'স্পেসিফিকেশন' },
    { id: 'reviews', label: 'রিভিউ' },
  ].filter(tab => {
    if (tab.id === 'description') return product.description;
    if (tab.id === 'features') return product.features?.length;
    if (tab.id === 'specs') return product.specifications && Object.keys(product.specifications).length > 0;
    if (tab.id === 'reviews') return product.reviews?.length;
    return false;
  });

  if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-teal-600">হোম</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-teal-600">বই</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={`/products?category=${product.category.slug}`} className="hover:text-teal-600">{product.category.name}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Images */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  {images[activeImage] ? (
                    <img
                      src={imgUrl(images[activeImage])!}
                      alt={product.name || 'Book'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-9xl">📖</span>
                  )}
                </div>
                
                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {discountPercent}% ছাড়
                  </span>
                )}

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaChevronLeft className="text-gray-700" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaChevronRight className="text-gray-700" />
                    </button>
                  </>
                )}

                {/* Share & Wishlist */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button className="bg-white/90 hover:bg-white shadow-lg rounded-full p-2.5 transition-colors">
                    <FaShare className="text-gray-600" />
                  </button>
                  <button className="bg-white/90 hover:bg-white shadow-lg rounded-full p-2.5 transition-colors">
                    <FaHeart className="text-gray-600 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        idx === activeImage ? 'border-teal-500 shadow-md' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Section */}
              {product.videoUrl && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    ভিডিও
                  </h3>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={product.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Product Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">{product.name}</h1>
                
                {/* Author & Publisher */}
                <div className="flex flex-wrap gap-4 mb-4">
                  {authorName && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                      <span className="text-gray-400">✍️</span>
                      <span className="text-sm text-gray-600">লেখক:</span>
                      <span className="text-sm font-medium text-gray-800">{authorName}</span>
                    </div>
                  )}
                  {publisherName && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                      <span className="text-gray-400">🏢</span>
                      <span className="text-sm text-gray-600">প্রকাশনা:</span>
                      <span className="text-sm font-medium text-gray-800">{publisherName}</span>
                    </div>
                  )}
                </div>

                {/* Ratings */}
                {(product.ratingAvr || product.ratingCount) && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className={`text-sm ${star <= Math.round(product.ratingAvr || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {product.ratingAvr?.toFixed(1)} ({product.ratingCount} রিভিউ)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4 py-4 border-y border-gray-100">
                  <span className="text-4xl font-bold text-teal-600">৳{currentPrice}</span>
                  {discountPercent > 0 && originalPrice > 0 && (
                    <>
                      <span className="text-xl text-gray-400 line-through">৳{originalPrice}</span>
                      <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">-{discountPercent}%</span>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2 mt-4">
                  {inStock ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaBoxOpen />
                      স্টকে আছে
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-500 font-medium">
                      স্টকে নেই
                    </span>
                  )}
                  {product.totalPages && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500 text-sm">{product.totalPages} পৃষ্ঠা</span>
                    </>
                  )}
                  {product.edition && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500 text-sm">{product.edition} সংস্করণ</span>
                    </>
                  )}
                </div>

                {/* Quantity & Add to Cart */}
                <div className="mt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                        className="px-5 py-3 hover:bg-gray-50 text-xl font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="px-6 py-3 font-medium text-lg min-w-[60px] text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => q + 1)} 
                        className="px-5 py-3 hover:bg-gray-50 text-xl font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={handleAddToCart} 
                      disabled={!inStock}
                      className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                        inStock 
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <FaShoppingCart />
                      {isInCart ? 'কার্টে আছে' : 'কার্টে যোগ করুন'}
                    </button>
                  </div>

                  <button 
                    onClick={handleBuyNow} 
                    disabled={!inStock}
                    className={`w-full mt-3 py-4 rounded-xl font-bold text-lg transition-all ${
                      inStock 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    এখনই কিনুন
                  </button>
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
                  <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">🚚</span>
                  </div>
                  <p className="text-xs text-gray-500">ফ্রি শিপিং</p>
                  <p className="text-sm font-medium text-gray-800">৳500+ অর্ডারে</p>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
                  <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">🔄</span>
                  </div>
                  <p className="text-xs text-gray-500">অ্যাসি রিটার্ন</p>
                  <p className="text-sm font-medium text-gray-800">৭ দিনের মধ্যে</p>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
                  <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">✅</span>
                  </div>
                  <p className="text-xs text-gray-500">১০০%</p>
                  <p className="text-sm font-medium text-gray-800">অরিজিনাল</p>
                </div>
              </div>

              {/* Tabs */}
              {tabs.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Tab Headers */}
                  <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'description' && product.description && (
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: product.description }} />
                      </div>
                    )}

                    {activeTab === 'features' && product.features && product.features.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                            <span className="text-teal-600 mt-0.5">✓</span>
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'specs' && product.specifications && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-500">{key}</span>
                            <span className="font-medium text-gray-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'reviews' && product.reviews && product.reviews.length > 0 && (
                      <div className="space-y-4">
                        {product.reviews.map((review) => (
                          <div key={review._id} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar key={star} className={`text-xs ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="font-medium text-gray-800">{review.user?.name || 'Anonymous'}</span>
                              <span className="text-gray-400 text-sm">
                                {review.createdAt && new Date(review.createdAt).toLocaleDateString('bn-BD')}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">সম্পর্কিত বই</h2>
                <Link href="/products" className="text-teal-600 hover:text-teal-700 font-medium">
                  সব দেখুন →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {relatedProducts.slice(0, 6).map((p) => {
                  const pCurrentPrice = getCurrentPrice(p);
                  const pOriginalPrice = getOriginalPrice(p);
                  const pDiscountPercent = getDiscountPercent(p);
                  const pImg = p.images?.[0];
                  const pName = p.name || 'Untitled';
                  const pSlug = p.slug || p._id;
                  const pAuthor = getAuthorName(p.author);
                  
                  return (
                    <Link key={p._id} href={`/products/${pSlug}`} className="group">
                      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                        <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center">
                          {pImg ? (
                            <img src={imgUrl(pImg)!} alt={pName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-5xl">📖</span>
                          )}
                          {pDiscountPercent > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {pDiscountPercent}% ছাড়
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 min-h-[2.5rem]">{pName}</h3>
                          {pAuthor && <p className="text-xs text-gray-500 mb-2 truncate">{pAuthor}</p>}
                          {pOriginalPrice > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-teal-600">৳{pCurrentPrice}</span>
                              {pDiscountPercent > 0 && <span className="text-xs text-gray-400 line-through">৳{pOriginalPrice}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
