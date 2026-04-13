'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailClient({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [slug, setSlug] = useState('');

  const { addItem } = useCartStore();

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
            <h2 className="text-xl font-bold text-gray-800 mb-2">পণ্য পাওয়া যা���়নি</h2>
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
  const bookDetails = [
    product.edition && { label: 'সংস্করণ', value: product.edition },
    product.totalPages && { label: 'পৃষ্ঠা সংখ্যা', value: product.totalPages.toString() },
    product.weight && { label: 'ওজন', value: product.weight },
    product.language && { label: 'ভাষা', value: product.language },
    product.country && { label: 'দেশ', value: product.country },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                  {images[0] ? (
                    <img
                      src={imgUrl(images[0])!}
                      alt={product.name || 'Book'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-8xl">📖</span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className="w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-teal-500 transition-colors"
                    >
                      <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Section */}
              {product.videoUrl && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="font-bold text-gray-800 mb-3">🎬 ভিডিও</h3>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
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

            {/* Details Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                {authorName && (
                  <p className="text-gray-600 mt-2">
                    ✍️ লেখক: <span className="font-medium text-gray-800">{authorName}</span>
                  </p>
                )}
                {publisherName && (
                  <p className="text-gray-600">
                    🏢 প্রকাশনা: <span className="font-medium text-gray-800">{publisherName}</span>
                  </p>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-teal-600">৳{currentPrice}</span>
                  {discountPercent > 0 && originalPrice > 0 && (
                    <>
                      <span className="text-xl text-gray-400 line-through">৳{originalPrice}</span>
                      <span className="bg-red-500 text-white text-sm px-2 py-1 rounded">-{discountPercent}% ছাড়</span>
                    </>
                  )}
                </div>
                {product.quantity !== undefined && product.quantity > 0 && (
                  <p className="text-sm text-green-600 mt-2">✓ স্টকে আছে</p>
                )}
              </div>

              {/* Ratings */}
              {(product.ratingAvr || product.ratingCount) && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-lg">
                          {star <= Math.round(product.ratingAvr || 0) ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {product.ratingAvr?.toFixed(1)} ({product.ratingCount} রিভিউ)
                    </span>
                  </div>
                  {product.ratingDetails && (
                    <div className="mt-3 space-y-1">
                      {product.ratingDetails.map((r) => (
                        <div key={r.stars} className="flex items-center gap-2 text-sm">
                          <span>{r.stars} ⭐</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${(r.count / (product.ratingCount || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-500 w-8">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="px-4 py-3 hover:bg-gray-50 text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 font-medium text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)} 
                    className="px-4 py-3 hover:bg-gray-50 text-xl font-bold"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart} 
                  className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🛒</span>
                  <span>কার্টে যোগ করুন</span>
                </button>
              </div>

              <button 
                onClick={handleBuyNow} 
                className="w-full bg-orange-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors text-lg"
              >
                এখনই কিনুন
              </button>

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3">📖 বিবরণ</h3>
                  <div className="text-gray-600 text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: product.description }} />
                </div>
              )}
            </div>
          </div>

          {/* Book Details */}
          {bookDetails.length > 0 && (
            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📚 বইয়ের বিবরণ</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {bookDetails.map((detail, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-sm text-gray-500">{detail.label}</p>
                    <p className="font-medium text-gray-800">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">✨ বৈশিষ্ট্য</h2>
              <ul className="space-y-2">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📋 স্পেসিফিকেশন</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{key}</span>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">💬 গ্রাহক রিভিউ ({product.reviews.length})</h2>
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-sm">
                            {star <= review.rating ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="font-medium text-gray-800">{review.user?.name || 'Anonymous'}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 সম্পর্কিত বই</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden flex items-center justify-center">
                          {pImg ? (
                            <img src={imgUrl(pImg)!} alt={pName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <span className="text-4xl">📖</span>
                          )}
                          {pDiscountPercent > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                              {pDiscountPercent}% OFF
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 min-h-[2.5rem]">{pName}</h3>
                          {pAuthor && <p className="text-xs text-gray-500 mb-2">{pAuthor}</p>}
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