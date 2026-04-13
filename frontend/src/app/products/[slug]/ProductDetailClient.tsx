'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaChevronLeft, FaChevronRight, FaShare, FaHeart, FaStar, 
  FaShoppingCart, FaBoxOpen, FaTimes, FaCheck, FaTruck, 
  FaUndo, FaShieldAlt, FaEye, FaMinus, FaPlus,
  FaRegCommentDots, FaPlay, FaMoneyBillWave, FaMapMarkerAlt,
  FaClock, FaFilePdf, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

interface Props {
  params: Promise<{ slug: string }>;
}

interface BundleItem {
  product: Product;
  discount: number;
}

export default function ProductDetailClient({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bundleProducts, setBundleProducts] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [slug, setSlug] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [bundleSelected, setBundleSelected] = useState<string[]>([]);

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
          const filtered = allProducts.filter((p: Product) => p._id !== res.data.data._id);
          setRelatedProducts(filtered.slice(0, 6));
          
          // Create bundle products (3 random products + current)
          setBundleProducts(filtered.slice(0, 3).map((p: Product) => ({
            product: p,
            discount: 10 // 10% bundle discount
          })));
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

  const handleBundleToggle = (productId: string) => {
    setBundleSelected(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddBundleToCart = () => {
    if (product) {
      addItem(product, quantity);
      bundleSelected.forEach(id => {
        const item = bundleProducts.find(b => b.product._id === id);
        if (item) {
          addItem(item.product, 1);
        }
      });
      toast.success('🎉 বান্ডেল কার্টে যোগ হয়েছে!');
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

  const getPreviewUrl = (pdfUrl?: string) => {
    if (!pdfUrl) return null;
    if (pdfUrl.includes('drive.google.com')) {
      const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return pdfUrl;
  };

  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const bundleTotalPrice = bundleSelected.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) : 0);
  }, 0);

  const bundleSavings = bundleSelected.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? (getOriginalPrice(item.product) - getCurrentPrice(item.product)) * 0.1 : 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-500"></div>
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

  const tabs = [
    { id: 'description', label: 'বিস্তারিত' },
    { id: 'author', label: 'লেখক' },
  ].filter(tab => {
    if (tab.id === 'description') return product.description;
    if (tab.id === 'author') return authorName;
    return false;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-6">
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

          {/* Main Product Section - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Image & Preview */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                  {images[activeImage] ? (
                    <img
                      src={imgUrl(images[activeImage])!}
                      alt={product.name || 'Book'}
                      className="w-full h-full object-contain drop-shadow-xl"
                    />
                  ) : (
                    <span className="text-9xl filter drop-shadow-xl">📖</span>
                  )}
                </div>
                
                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {discountPercent}% ছাড়
                  </span>
                )}

                {/* Preview CTA Button */}
                {previewUrl && (
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <FaFilePdf />
                    একটু পড়ে দেখুন
                  </button>
                )}

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                    >
                      <FaChevronLeft className="text-gray-700" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                    >
                      <FaChevronRight className="text-gray-700" />
                    </button>
                  </>
                )}

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={handleWishlist} className={`bg-white shadow-lg rounded-full p-2.5 ${isWishlisted ? 'text-red-500' : 'text-gray-600'}`}>
                    <FaHeart className={isWishlisted ? 'fill-current' : ''} />
                  </button>
                  <button className="bg-white shadow-lg rounded-full p-2.5 text-gray-600">
                    <FaShare />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === activeImage ? 'border-teal-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Section */}
              {youtubeId && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <FaPlay className="text-red-500" /> ভিডিও রিভিউ
                    </h3>
                  </div>
                  <div 
                    className="aspect-video rounded-lg overflow-hidden bg-gray-900 cursor-pointer relative"
                    onClick={() => setShowVideoModal(true)}
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                        <FaPlay className="text-white text-xl ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Info & Actions */}
            <div className="lg:col-span-7 space-y-5">
              {/* Product Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>
                
                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {authorName && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-400">✍️</span>
                      <span className="text-sm text-gray-600">লেখক</span>
                      <span className="text-sm font-medium text-gray-800">{authorName}</span>
                    </div>
                  )}
                  {publisherName && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-400">🏢</span>
                      <span className="text-sm text-gray-600">প্রকাশনা</span>
                      <span className="text-sm font-medium text-gray-800">{publisherName}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-400">📚</span>
                      <span className="text-sm font-medium text-gray-800">{product.category.name}</span>
                    </div>
                  )}
                </div>

                {/* Ratings */}
                {(rating || reviewCount) && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-yellow-600 font-bold">{rating.toFixed(1)}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">{reviewCount} রিভিউ</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4 py-4 border-y border-gray-100">
                  <span className="text-4xl font-bold text-teal-600">৳{currentPrice}</span>
                  {discountPercent > 0 && originalPrice > 0 && (
                    <>
                      <span className="text-xl text-gray-400 line-through">৳{originalPrice}</span>
                      <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">-{discountPercent}%</span>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-3 mt-4">
                  {inStock ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaBoxOpen /> স্টকে আছে
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-500 font-medium">স্টকে নেই</span>
                  )}
                  
                  {product.totalPages && (
                    <span className="text-gray-500 text-sm">| 📄 {product.totalPages} পৃষ্ঠা</span>
                  )}
                  {product.edition && (
                    <span className="text-gray-500 text-sm">| 📓 {product.edition}</span>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <p className="text-gray-600 mt-4">{product.shortDescription}</p>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                      className="px-4 py-3 hover:bg-gray-50 text-xl font-bold"
                    >
                      <FaMinus />
                    </button>
                    <span className="px-6 py-3 font-bold text-lg min-w-[60px] text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)} 
                      className="px-4 py-3 hover:bg-gray-50 text-xl font-bold"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <button 
                    onClick={handleAddToCart} 
                    disabled={!inStock}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      inStock 
                        ? 'bg-teal-600 hover:bg-teal-700 text-white' 
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
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ⚡ এখনই কিনুন
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
                  <FaTruck className="text-2xl text-teal-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">ডেলিভারি</p>
                  <p className="text-sm font-bold text-gray-800">ঢাকা 60৳</p>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
                  <FaUndo className="text-2xl text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">রিটার্ন</p>
                  <p className="text-sm font-bold text-gray-800">৭ দিন</p>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
                  <FaShieldAlt className="text-2xl text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">নিরাপদ</p>
                  <p className="text-sm font-bold text-gray-800">১০০%</p>
                </div>
              </div>

              {/* Delivery Info Box */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-teal-600" /> ডেলিভারি তথ্য
                </h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>ঢাকার ভিতরে</span>
                    <span className="font-medium">60৳ (2-4 দিন)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ঢাকার বাইরে</span>
                    <span className="font-medium">75৳ (3-5 দিন)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Section */}
          {bundleProducts.length > 0 && (
            <div className="mt-10 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl shadow-lg border border-teal-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">📦 পাঠকরা একসাথে কিনছেন</h2>
                  <p className="text-gray-500 text-sm">বান্ডেলে ১০% ছাড় পান</p>
                </div>
                {bundleSelected.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">সেভ করুন</p>
                    <p className="text-lg font-bold text-green-600">৳{bundleSavings.toFixed(0)}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Current Product */}
                <div className="bg-white rounded-xl p-3 flex items-center gap-3 border-2 border-teal-500">
                  <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <img src={imgUrl(product.images[0])!} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{product.name}</p>
                    <p className="text-teal-600 font-bold">৳{currentPrice}</p>
                  </div>
                  <FaCheck className="text-teal-500 flex-shrink-0" />
                </div>

                {/* Bundle Items */}
                {bundleProducts.map((item) => (
                  <div 
                    key={item.product._id}
                    onClick={() => handleBundleToggle(item.product._id)}
                    className={`bg-white rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                      bundleSelected.includes(item.product._id) 
                        ? 'border-2 border-teal-500 ring-2 ring-teal-200' 
                        : 'border border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product.images?.[0] && (
                        <img src={imgUrl(item.product.images[0])!} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-teal-600 font-bold">৳{getCurrentPrice(item.product)}</p>
                        <span className="text-xs text-green-600">-১০%</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      bundleSelected.includes(item.product._id) 
                        ? 'bg-teal-500 border-teal-500' 
                        : 'border-gray-300'
                    }`}>
                      {bundleSelected.includes(item.product._id) && (
                        <FaCheck className="text-white text-xs" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAddBundleToCart}
                disabled={bundleSelected.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  bundleSelected.length > 0
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                🎁 বান্ডেল কার্টে যোগ করুন (৳{currentPrice + bundleTotalPrice})
              </button>
            </div>
          )}

          {/* Description Section with Tabs */}
          {tabs.length > 0 && (
            <div className="mt-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === 'description' && product.description && (
                  <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: product.description }} />
                )}
                {activeTab === 'author' && authorName && (
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {authorName[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{authorName}</h3>
                      <p className="text-gray-600">লেখকের বই সমূহ</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaRegCommentDots /> কাস্টমার রিভিউ ({product.reviews.length})
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {product.reviews.map((review) => (
                  <div key={review._id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(review.user?.name || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-gray-800">{review.user?.name || 'Anonymous'}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} className={`text-xs ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 সম্পর্কিত বই</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedProducts.map((p) => {
                  const pPrice = getCurrentPrice(p);
                  const pOriginal = getOriginalPrice(p);
                  const pDiscount = getDiscountPercent(p);
                  const pImg = p.images?.[0];
                  const pName = p.name || 'Untitled';
                  const pSlug = p.slug || p._id;
                  const pAuthor = getAuthorName(p.author);
                  
                  return (
                    <Link key={p._id} href={`/products/${pSlug}`} className="group">
                      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden flex items-center justify-center">
                          {pImg ? (
                            <img src={imgUrl(pImg)!} alt={pName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <span className="text-4xl">📖</span>
                          )}
                          {pDiscount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                              {pDiscount}% ছাড়
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{pName}</h3>
                          {pAuthor && <p className="text-xs text-gray-500 mb-1 truncate">{pAuthor}</p>}
                          {pOriginal > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-teal-600">৳{pPrice}</span>
                              {pDiscount > 0 && <span className="text-xs text-gray-400 line-through">৳{pOriginal}</span>}
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

      {/* PDF Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">প্রিভিউ</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <FaTimes />
              </button>
            </div>
            <div className="flex-1">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  allow="autoplay"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && youtubeId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowVideoModal(false)} 
                className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
              >
                <FaTimes className="text-xl" />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
