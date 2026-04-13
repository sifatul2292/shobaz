'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaChevronLeft, FaChevronRight, FaShare, FaHeart, FaStar, 
  FaShoppingCart, FaBoxOpen, FaTimes, FaCheck, FaTruck, 
  FaUndo, FaShieldAlt, FaClock, FaEye, FaMinus, FaPlus,
  FaRegCommentDots
} from 'react-icons/fa';

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
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'উইশলিস্ট থেকে সরানো হয়েছে' : 'উইশলিস্টে যোগ হয়েছে');
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

  const getPreviewUrl = (pdfUrl?: string) => {
    if (!pdfUrl) return null;
    if (pdfUrl.includes('drive.google.com')) {
      const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return pdfUrl;
  };

  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-500"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-teal-200 opacity-30"></div>
            </div>
            <p className="text-gray-500 animate-pulse">লোড হচ্ছে...</p>
          </div>
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
            <div className="text-6xl mb-4">😕</div>
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
  const rating = product.ratingAvr || 0;
  const reviewCount = product.ratingCount || 0;
  const previewUrl = getPreviewUrl(product.pdfFile || product.previewPdfUrl);
  const youtubeId = getYouTubeId(product.videoUrl);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/" className="hover:text-teal-600 transition-colors">হোম</Link>
            <span className="text-gray-300">›</span>
            <Link href="/products" className="hover:text-teal-600 transition-colors">বই</Link>
            {product.category && (
              <>
                <span className="text-gray-300">›</span>
                <Link href={`/products?category=${product.category.slug}`} className="hover:text-teal-600 transition-colors">{product.category.name}</Link>
              </>
            )}
            <span className="text-gray-300">›</span>
            <span className="text-gray-700 font-medium">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Images */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Image with Lightbox */}
              <div 
                className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden group cursor-pointer"
                onClick={() => setShowLightbox(true)}
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center relative">
                  {images[activeImage] ? (
                    <img
                      src={imgUrl(images[activeImage])!}
                      alt={product.name || 'Book'}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-9xl filter drop-shadow-xl">📖</span>
                  )}
                  
                  {/* Zoom indicator */}
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaEye /> দেখুন
                  </div>
                </div>
                
                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 flex flex-col gap-1">
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg animate-pulse">
                      {discountPercent}% ছাড়
                    </span>
                  </div>
                )}

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <FaChevronLeft className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <FaChevronRight className="text-gray-700" />
                    </button>
                  </>
                )}

                {/* Share & Wishlist */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                    className={`bg-white/95 hover:bg-white shadow-xl rounded-full p-2.5 transition-all duration-300 hover:scale-110 ${isWishlisted ? 'text-red-500' : 'text-gray-600'}`}
                  >
                    <FaHeart className={isWishlisted ? 'fill-current' : ''} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="bg-white/95 hover:bg-white shadow-xl rounded-full p-2.5 transition-all duration-300 hover:scale-110 text-gray-600"
                  >
                    <FaShare />
                  </button>
                </div>

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                    {activeImage + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        idx === activeImage 
                          ? 'border-teal-500 shadow-lg scale-105' 
                          : 'border-transparent hover:border-gray-300 hover:scale-105'
                      }`}
                    >
                      <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Section */}
              {youtubeId && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    ভিডিও প্রিভিউ
                  </h3>
                  <div 
                    className="aspect-video rounded-xl overflow-hidden bg-black cursor-pointer relative"
                    onClick={() => setShowLightbox(true)}
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt="Video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl ml-1">▶</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PDF Preview Button */}
              {previewUrl && (
                <button 
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <span>📄</span>
                  একটু পড়ে দেখুন
                </button>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Product Info Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">{product.name}</h1>
                    
                    {/* Author & Publisher */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      {authorName && (
                        <Link 
                          href={`/products?author=${encodeURIComponent(authorName)}`}
                          className="flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-2 rounded-full hover:from-teal-100 hover:to-emerald-100 transition-all"
                        >
                          <span className="text-teal-600">✍️</span>
                          <span className="text-sm text-teal-700 font-medium">{authorName}</span>
                        </Link>
                      )}
                      {publisherName && (
                        <Link 
                          href={`/products?publisher=${encodeURIComponent(publisherName)}`}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full hover:from-blue-100 hover:to-indigo-100 transition-all"
                        >
                          <span className="text-blue-600">🏢</span>
                          <span className="text-sm text-blue-700 font-medium">{publisherName}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                {(rating || reviewCount) && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-yellow-600 font-bold">{rating.toFixed(1)}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">{reviewCount} রিভিউ</span>
                    {product.ratingDetails && (
                      <span className="text-teal-600 text-sm underline cursor-pointer hover:text-teal-700">
                        রেটিং দেখুন
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4 py-5 border-y border-gray-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      ৳{currentPrice}
                    </span>
                    {discountPercent > 0 && originalPrice > 0 && (
                      <>
                        <span className="text-xl text-gray-400 line-through">৳{originalPrice}</span>
                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                          সেভ ৳{originalPrice - currentPrice}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stock & Quick Info */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {inStock ? (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-4 py-2 rounded-full font-medium">
                      <FaBoxOpen className="text-green-500" />
                      <span>স্টকে আছে</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full font-medium">
                      <span>স্টকে নেই</span>
                    </div>
                  )}
                  
                  {product.totalPages && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm">
                      📄 {product.totalPages} পৃষ্ঠা
                    </span>
                  )}
                  {product.edition && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm">
                      📓 {product.edition}
                    </span>
                  )}
                  {product.language && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm">
                      🌍 {product.language}
                    </span>
                  )}
                </div>

                {/* Quantity & Add to Cart */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                        className="px-5 py-4 hover:bg-gray-100 text-xl font-bold transition-colors text-gray-600"
                      >
                        <FaMinus />
                      </button>
                      <span className="px-8 py-4 font-bold text-lg min-w-[80px] text-center bg-white">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => q + 1)} 
                        className="px-5 py-4 hover:bg-gray-100 text-xl font-bold transition-colors text-gray-600"
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <button 
                      onClick={handleAddToCart} 
                      disabled={!inStock}
                      className={`flex-1 py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                        inStock 
                          ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <FaShoppingCart className="text-lg" />
                      {isInCart ? 'কার্টে আছে ✓' : 'কার্টে যোগ করুন'}
                    </button>
                  </div>

                  <button 
                    onClick={handleBuyNow} 
                    disabled={!inStock}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      inStock 
                        ? 'bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    ⚡ এখনই কিনুন
                  </button>
                </div>
              </div>

              {/* Quick Info Cards - Glassmorphism */}
              <div className="grid grid-cols-3 gap-4">
                <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-5 text-center hover:bg-white/80 transition-all hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FaTruck className="text-xl text-teal-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">ফ্রি শিপিং</p>
                  <p className="text-sm font-bold text-gray-800">৳500+ অর্ডারে</p>
                </div>
                <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-5 text-center hover:bg-white/80 transition-all hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FaUndo className="text-xl text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">হass্যাসি রিটার্ন</p>
                  <p className="text-sm font-bold text-gray-800">৭ দিনের মধ্যে</p>
                </div>
                <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-5 text-center hover:bg-white/80 transition-all hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FaShieldAlt className="text-xl text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">নিরাপদ পেমেন্ট</p>
                  <p className="text-sm font-bold text-gray-800">১০০% নিরাপদ</p>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      📖 বিবরণ
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </div>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      ✨ বৈশিষ্ট্য
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 rounded-xl border border-teal-100">
                        <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FaCheck className="text-white text-xs" />
                        </div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      📋 স্পেসিফিকেশন
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <span className="text-gray-500 font-medium">{key}</span>
                        <span className="font-bold text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FaRegCommentDots /> কাস্টমার রিভিউ ({product.reviews.length})
                    </h2>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {product.reviews.map((review) => (
                      <div key={review._id} className="p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(review.user?.name || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800">{review.user?.name || 'Anonymous'}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar key={star} className={`text-xs ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                              <span className="text-gray-400 text-xs ml-2">
                                {review.createdAt && new Date(review.createdAt).toLocaleDateString('bn-BD')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">সম্পর্কিত বই</h2>
                </div>
                <Link href="/products" className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2">
                  সব দেখুন <span>→</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
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
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                        <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex items-center justify-center">
                          {pImg ? (
                            <img src={imgUrl(pImg)!} alt={pName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-5xl">📖</span>
                          )}
                          {pDiscountPercent > 0 && (
                            <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                              {pDiscountPercent}% ছাড়
                            </span>
                          )}
                          {/* Quick Add Button */}
                          <button 
                            onClick={(e) => { e.preventDefault(); addItem(p, 1); toast.success('🛒 কার্টে যোগ হয়েছে'); }}
                            className="absolute bottom-3 left-3 right-3 bg-teal-600 text-white py-2 rounded-full font-medium text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg"
                          >
                            কার্টে যোগ
                          </button>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 min-h-[2.5rem]">{pName}</h3>
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

      {/* Lightbox */}
      {showLightbox && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center">
          <button 
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <FaTimes className="text-2xl" />
          </button>
          
          <button 
            onClick={prevImage}
            className="absolute left-6 text-white/70 hover:text-white p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110"
          >
            <FaChevronLeft className="text-2xl" />
          </button>
          
          <div className="max-w-4xl max-h-[80vh] p-4">
            <img
              src={imgUrl(images[activeImage])!}
              alt={product.name || 'Book'}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
          
          <button 
            onClick={nextImage}
            className="absolute right-6 text-white/70 hover:text-white p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110"
          >
            <FaChevronRight className="text-2xl" />
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeImage ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800 text-lg">প্রিভিউ</h3>
              <button 
                onClick={() => setShowPreviewModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <iframe 
              src={previewUrl} 
              className="flex-1 w-full" 
              allow="autoplay" 
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
