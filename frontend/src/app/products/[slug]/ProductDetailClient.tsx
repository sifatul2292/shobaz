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
  FaUndo, FaShieldAlt, FaMinus, FaPlus, FaPlay
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem, items } = useCartStore();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
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
          setRelatedProducts(allProducts.filter((p: Product) => p._id !== res.data.data._id).slice(0, 6));
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      toast.success('কার্টে যোগ হয়েছে');
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

  const getOriginalPrice = (p: Product) => p.salePrice || 0;

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
    if (product?.images) setActiveImage((prev) => (prev + 1) % product.images!.length);
  };

  const prevImage = () => {
    if (product?.images) setActiveImage((prev) => (prev - 1 + product.images!.length) % product.images!.length);
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
  const rating = product.ratingAvr || 0;
  const reviewCount = product.ratingCount || 0;
  const previewUrl = getPreviewUrl(product.pdfFile || product.previewPdfUrl);
  const youtubeId = getYouTubeId(product.videoUrl);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-teal-600">হোম</Link>
            <span>›</span>
            <Link href="/products" className="hover:text-teal-600">বই</Link>
            {product.category && (
              <>
                <span>›</span>
                <Link href={`/products?category=${product.category.slug}`} className="hover:text-teal-600">{product.category.name}</Link>
              </>
            )}
            <span>›</span>
            <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Left - Image */}
              <div className="space-y-4">
                <div className="relative bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] flex items-center justify-center p-6">
                    {images[activeImage] ? (
                      <img
                        src={imgUrl(images[activeImage])!}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-8xl">📖</span>
                    )}
                  </div>
                  
                  {discountPercent > 0 && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
                      {discountPercent}% ছাড়
                    </span>
                  )}

                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50">
                        <FaChevronLeft className="text-gray-600" />
                      </button>
                      <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50">
                        <FaChevronRight className="text-gray-600" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 justify-center">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`w-14 h-18 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === activeImage ? 'border-teal-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview Button */}
                {previewUrl && (
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaBoxOpen className="text-teal-600" />
                    একটু পড়ে দেখুন
                  </button>
                )}

                {/* Video */}
                {youtubeId && (
                  <div 
                    className="aspect-video rounded-xl overflow-hidden bg-gray-900 cursor-pointer relative"
                    onClick={() => setShowVideoModal(true)}
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt="Video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                        <FaPlay className="text-white text-xl ml-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right - Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
                  
                  {/* Author & Publisher */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {authorName && (
                      <span className="text-gray-600">লেখক: <span className="font-medium text-gray-900">{authorName}</span></span>
                    )}
                  </div>
                  {publisherName && (
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-gray-600">প্রকাশনা: <span className="font-medium text-gray-900">{publisherName}</span></span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {(rating || reviewCount) && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-gray-600">{rating.toFixed(1)} ({reviewCount} রিভিউ)</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-3 py-4 border-y border-gray-100">
                  <span className="text-3xl font-bold text-teal-600">৳{currentPrice}</span>
                  {discountPercent > 0 && originalPrice > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through">৳{originalPrice}</span>
                      <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded">-{discountPercent}%</span>
                    </>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-3">
                  {inStock ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <FaBoxOpen /> স্টকে আছে
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">স্টকে নেই</span>
                  )}
                  {product.totalPages && <span className="text-gray-500 text-sm">{product.totalPages} পৃষ্ঠা</span>}
                  {product.edition && <span className="text-gray-500 text-sm">{product.edition} সংস্করণ</span>}
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-gray-50 font-bold">−</button>
                    <span className="px-4 py-2 font-medium min-w-[50px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-2 hover:bg-gray-50 font-bold">+</button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button 
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
                      inStock ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isInCart ? '✓ কার্টে আছে' : 'কার্টে যোগ করুন'}
                  </button>
                  <button 
                    onClick={handleBuyNow}
                    disabled={!inStock}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
                      inStock ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    এখনই কিনুন
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <FaTruck className="text-xl text-teal-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">ফ্রি শিপিং</p>
                    <p className="text-sm font-bold text-gray-800">৳500+</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <FaUndo className="text-xl text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">রিটার্ন</p>
                    <p className="text-sm font-bold text-gray-800">৭ দিন</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <FaShieldAlt className="text-xl text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">নিরাপদ</p>
                    <p className="text-sm font-bold text-gray-800">পেমেন্ট</p>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <p className="font-medium text-gray-800">ডেলিভারি:</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ঢাকার ভিতরে</span>
                    <span className="font-medium">60৳ (2-4 দিন)</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ঢাকার বাইরে</span>
                    <span className="font-medium">75৳ (3-5 দিন)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-10 pt-10 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">বিবরণ</h2>
                <div className="text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            {/* Reviews */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="mt-10 pt-10 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">রিভিউ ({product.reviews.length})</h2>
                <div className="space-y-4">
                  {product.reviews.map((review) => (
                    <div key={review._id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} className={`text-xs ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
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
              <div className="mt-10 pt-10 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">সম্পর্কিত বই</h2>
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
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center">
                            {pImg ? (
                              <img src={imgUrl(pImg)!} alt={pName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl">📖</span>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{pName}</h3>
                            {pAuthor && <p className="text-xs text-gray-500 mt-1">{pAuthor}</p>}
                            {pOriginal > 0 && (
                              <div className="flex items-center gap-1 mt-2">
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
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">প্রিভিউ</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <FaTimes />
              </button>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" allow="autoplay" />
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && youtubeId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <button onClick={() => setShowVideoModal(false)} className="absolute top-2 right-2 z-10 p-2 bg-white/20 rounded-full text-white">
                <FaTimes />
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
