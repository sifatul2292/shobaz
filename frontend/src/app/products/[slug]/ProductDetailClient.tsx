'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product, ShippingCharge, Review } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';
import { HiOutlineBookOpen, HiOutlineEye, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { 
  FaChevronLeft, FaChevronRight, FaShoppingCart, FaBoxOpen, FaTimes, 
  FaCheck, FaTruck, FaUndo, FaShieldAlt, FaMoneyBillWave, FaStar,
  FaMinus, FaPlus, FaPlay, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BundleItem {
  product: Product;
  discount: number;
}

interface Props {
  params: Promise<{ slug: string }>;
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
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [shippingCharge, setShippingCharge] = useState<ShippingCharge | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem, items } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

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
        const productData = res.data.data;
        setProduct(productData);
        
        console.log('Product boughtTogetherProducts:', productData.boughtTogetherProducts);
        console.log('Product boughtTogetherIds:', productData.boughtTogetherIds);
        
        const relatedRes = await api.get('/product/get-all-data');
        if (relatedRes.data?.data) {
          let allProducts = relatedRes.data.data;
          if (allProducts.items) allProducts = allProducts.items;
          if (!Array.isArray(allProducts)) allProducts = [];
          
          const filtered = allProducts.filter((p: Product) => p._id !== productData._id);
          setRelatedProducts(filtered.slice(0, 10));
          
          // Bundle products from backend
          const backendBoughtTogether = productData.boughtTogetherProducts || [];
          console.log('Backend bought together:', backendBoughtTogether);
          
          let bundleItems: BundleItem[] = [];
          const bundleDiscount = 10;
          
          if (backendBoughtTogether?.length > 0) {
            bundleItems = backendBoughtTogether.map((p: any) => ({
              product: { ...p, slug: p.slug || '' },
              discount: bundleDiscount
            }));
          } else {
            // Fallback to related products if no bought together configured
            bundleItems = filtered.slice(0, 3).map((p: Product) => ({
              product: p,
              discount: bundleDiscount
            }));
          }
          
          setBundleProducts(bundleItems);
          setSelectedBundle(bundleItems.map(b => b.product._id));
        }

        // Fetch reviews for this product
        fetchReviews(productData._id);
      }
    } catch (err) { console.error(err); }

    // Fetch shipping charge
    try {
      const shipRes = await api.get('/shipping-charge/get');
      if (shipRes.data?.data) {
        setShippingCharge(shipRes.data.data);
      }
    } catch (shipErr) { console.error('Failed to fetch shipping charge:', shipErr); }

    setLoading(false);
  };

  const fetchReviews = async (productId: string) => {
    setLoadingReviews(true);
    try {
      const res = await api.post('/review/get-all-review-by-query', {
        filter: {},
        pagination: { currentPage: 1, pageSize: 10 },
        sort: { createdAt: -1 }
      });
      if (res.data?.data) {
        const allReviews = res.data.data;
        const productReviews = allReviews.filter((r: any) => r.product?._id === productId || r.product === productId);
        const approvedReviews = productReviews.filter((r: Review) => r.status === true);
        setReviews(approvedReviews);
      }
    } catch (err) { console.error('Failed to fetch reviews:', err); }
    setLoadingReviews(false);
  };

  const handleSubmitReview = async () => {
    if (!product || !newReview.review.trim()) {
      toast.error('Please write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post('/review/add', {
        product: product._id,
        rating: newReview.rating,
        review: newReview.review
      });
      if (res.data?.success) {
        toast.success('Review submitted! It will be visible after approval.');
        setShowReviewForm(false);
        setNewReview({ rating: 5, review: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
    setSubmittingReview(false);
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

  const handleToggleBundle = (productId: string) => {
    setSelectedBundle(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddBundleToCart = () => {
    if (product) {
      addItem(product, quantity);
      selectedBundle.forEach(id => {
        const item = bundleProducts.find(b => b.product._id === id);
        if (item) addItem(item.product, 1);
      });
      toast.success('বান্ডেল কার্টে যোগ হয়েছে!');
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
  const previewUrl = product?.pdfFile || product?.previewPdfUrl;
  
  // Extract YouTube video ID from various URL formats
  const getYoutubeId = (url?: string): string | null => {
    if (!url) return null;
    
    // Handle youtu.be format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    
    // Handle youtube.com/watch?v= format
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    
    // Handle youtube.com/embed/ format
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    
    // Handle youtube.com/shorts/ format
    const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    
    // Handle direct video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    
    return null;
  };
  
  const youtubeId = getYoutubeId(product?.videoUrl);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
            <Link href="/products" className="text-green-500 hover:underline">সকল বই দেখুন</Link>
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
  const savings = originalPrice - currentPrice;
  const authorName = getAuthorName(product.author);
  const publisherName = getPublisherName(product.publisher);
  const inStock = product.quantity === undefined || product.quantity > 0;
  const rating = product.ratingAvr || 0;
  const bundleDiscount = 10;

  const nextImage = () => product?.images && setActiveImage((prev) => (prev + 1) % product.images!.length);
  const prevImage = () => product?.images && setActiveImage((prev) => (prev - 1 + product.images!.length) % product.images!.length);

  const bundleTotal = currentPrice + selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.9 : 0);
  }, 0);

  const bundleSavings = selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.1 : 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-green-500">হোম</Link>
            <span>›</span>
            <Link href="/products" className="hover:text-green-500">বই</Link>
            {product.category?.[0] && (
              <>
                <span>›</span>
                <Link href={`/products?category=${product.category[0].slug}`} className="hover:text-green-500">{product.category[0].name}</Link>
              </>
            )}
            <span>›</span>
            <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            
            {/* LEFT: Product Image + Preview */}
            <div className="md:col-span-1 lg:col-span-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
                {/* Preview Button - Above Image */}
                {previewUrl && (
                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="mb-3 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <HiOutlineEye className="w-3.5 h-3.5" />
                    একটু পড়ে দেখুন
                    <svg className="w-3 h-3 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}

                {/* Main Image - Clickable for PDF Preview */}
                <div className="relative bg-gray-50 rounded-lg group mb-3">
                  <button 
                    type="button"
                    onClick={() => previewUrl && setShowPreviewModal(true)}
                    disabled={!previewUrl}
                    className={`w-full aspect-[3/4] flex items-center justify-center ${previewUrl ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {images[activeImage] ? (
                      <img src={imgUrl(images[activeImage])!} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <HiOutlineBookOpen className="w-32 h-32 text-gray-300" />
                    )}
                  </button>
                  
                  {previewUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-lg transition-opacity pointer-events-none">
                      <div className="bg-white/90 rounded-full p-3">
                        <HiOutlineEye className="w-7 h-7 text-green-500" />
                      </div>
                    </div>
                  )}
                  
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2">
                        <FaChevronLeft className="text-gray-600" />
                      </button>
                      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2">
                        <FaChevronRight className="text-gray-600" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 justify-center mb-3">
                    {images.map((img, idx) => (
                      <button key={idx} onClick={() => setActiveImage(idx)} className={`w-12 h-14 rounded border-2 ${idx === activeImage ? 'border-green-500' : 'border-gray-200'}`}>
                        <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* CENTER: Product Info */}
            <div className="md:col-span-1 lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>
                
                {/* Author, Category, Publisher */}
                <div className="space-y-2 mb-4">
                  {authorName && <p className="text-gray-600">লেখক: <Link href={`/products?author=${encodeURIComponent(authorName)}`} className="text-green-500 hover:underline font-medium">{authorName}</Link></p>}
                  {product.category?.[0] && <p className="text-gray-600">ক্যাটাগরি: <Link href={`/products?category=${product.category[0].slug}`} className="text-green-500 hover:underline font-medium">{product.category[0].name}</Link></p>}
                  {publisherName && <p className="text-gray-600">প্রকাশনা: <span className="font-medium">{publisherName}</span></p>}
                  {product.weight && <p className="text-gray-500 text-sm">ওজন: {product.weight}g</p>}
                </div>

                {/* Price Block */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-red-600">৳{currentPrice}</span>
                    {discountPercent > 0 && (
                      <>
                        <span className="text-gray-400 line-through">৳{originalPrice}</span>
                        <span className="text-green-600 text-sm font-medium">-{discountPercent}%</span>
                      </>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-green-600 text-sm">You Save ৳{savings} ({discountPercent}% Off)</p>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2 mb-4">
                  {inStock ? (
                    <span className="text-green-600 font-medium flex items-center gap-1"><FaBoxOpen /> In Stock</span>
                  ) : (
                    <span className="text-red-500 font-medium">Stock Out</span>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className={`text-gray-600 text-sm ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                      {product.shortDescription.replace(/<[^>]*>/g, '')}
                    </p>
                    {product.shortDescription?.length > 150 && (
                      <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-green-500 text-sm font-medium mt-1">
                        {showFullDescription ? 'আরও কম দেখুন' : 'আরও দেখুন'}
                      </button>
                    )}
                  </div>
                )}

                {/* CTA Area */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-100 text-lg font-bold transition-transform hover:scale-110">−</button>
                    <span className="px-5 py-3 font-bold text-lg min-w-[60px] text-center bg-white">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-3 hover:bg-gray-100 text-lg font-bold transition-transform hover:scale-110">+</button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className={`flex-1 py-3.5 rounded-lg font-bold text-base transition-all hover:scale-[1.02] shadow-sm ${inStock ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    🛒 কার্টে যোগ করুন
                  </button>
                </div>

                <button 
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className={`w-full py-4 rounded-lg font-bold text-lg text-white transition-all hover:scale-[1.01] shadow-md ${inStock ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gray-200 text-gray-400'}`}
                >
                  এখনই অর্ডার করুন
                </button>

                {/* Book Review Video */}
                {youtubeId && (
                  <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-lg text-green-600 mb-3">বুক রিভিউ</h3>
                    <div className="aspect-video rounded-lg overflow-hidden shadow-md bg-black">
                      <iframe 
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                        className="w-full h-full" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                        title="Book Review Video"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Video + Delivery + Related */}
            <div className="lg:col-span-3 space-y-5">
              {/* Delivery Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                  <FaTruck className="text-green-500 text-xs" /> Delivery
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer group">
                    <span className="text-gray-600">Inside Dhaka</span>
                    <span className="font-bold text-green-600">৳{shippingCharge?.deliveryInDhaka || 60}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <span className="text-gray-600">Outside Dhaka</span>
                    <span className="font-bold text-gray-700">৳{shippingCharge?.deliveryOutsideDhaka || 120}</span>
                  </div>
                  {shippingCharge?.deliveryOutsideBD ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                      <span className="text-gray-600">Outside Bangladesh</span>
                      <span className="font-bold text-gray-700">৳{shippingCharge.deliveryOutsideBD}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 opacity-60">
                      <span className="text-gray-500">Outside Bangladesh</span>
                      <span className="font-bold text-gray-400">N/A</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Delivery in 1-4 business days</p>
              </div>

              {/* Related Books */}
              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                  <h3 className="font-bold text-sm text-green-600 mb-2">Related Books</h3>
                  <div className="space-y-2">
                    {relatedProducts.slice(0, 6).map((p) => {
                      const pPrice = getCurrentPrice(p);
                      const pOriginalPrice = getOriginalPrice(p);
                      const pDiscount = getDiscountPercent(p);
                      return (
                        <Link key={p._id} href={`/products/${p.slug}`} className="flex gap-2 group">
                          <div className="w-12 h-16 bg-gray-100 rounded-lg flex-shrink-0 shadow-sm overflow-hidden relative">
                            {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover rounded-lg" />}
                            {pDiscount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                                -{pDiscount}%
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-green-500 transition-colors">{p.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <FaStar className="text-yellow-400 text-[10px]" />
                              <span className="text-[10px] text-gray-500">{p.ratingAvr?.toFixed(1) || 0}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <div>
                                <p className="text-xs font-bold text-green-500">৳{pPrice}</p>
                                {pDiscount > 0 && (
                                  <p className="text-[10px] text-gray-400 line-through">৳{pOriginalPrice}</p>
                                )}
                              </div>
                              <button 
                                onClick={(e) => { e.preventDefault(); addItem(p, 1); toast.success('কার্টে যোগ হয়েছে'); }}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-medium px-2 py-1 rounded"
                              >
                                + Add
                              </button>
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

          {/* Bought Together - Modern Card Layout */}
          {bundleProducts.length > 0 && (
            <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <HiOutlineBookOpen className="w-6 h-6" />
                  পাঠকেরা একসাথে কিনে থাকেন
                </h2>
                <p className="text-green-100 text-sm mt-1">Save 10% when you buy together</p>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
                  {/* Main product */}
                  <div className="text-center">
                    <div className="w-28 h-36 bg-gray-100 rounded-xl overflow-hidden mb-2 shadow-md">
                      {product?.images?.[0] && <img src={imgUrl(product.images[0])!} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <p className="text-xs font-medium text-gray-700 line-clamp-2 max-w-[110px] mx-auto">{product?.name}</p>
                    <p className="text-sm font-bold text-green-500 mt-1">৳{getCurrentPrice(product!)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-gray-400">+</span>
                    <div className="w-28 h-36 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-dashed border-green-300 flex items-center justify-center">
                      <span className="text-green-500 font-medium text-sm px-2">Select Books</span>
                    </div>
                  </div>
                  
                  {bundleProducts.map((item) => {
                    const itemPrice = getCurrentPrice(item.product);
                    const itemOriginal = getOriginalPrice(item.product);
                    const itemDiscount = getDiscountPercent(item.product);
                    const isSelected = selectedBundle.includes(item.product._id);
                    
                    return (
                      <div key={item.product._id} className="text-center group">
                        <div 
                          className={`relative w-28 h-36 bg-gray-100 rounded-xl overflow-hidden mb-2 shadow-md cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-4 ring-green-500 ring-offset-2' : ''}`}
                          onClick={() => handleToggleBundle(item.product._id)}
                        >
                          {item.product.images?.[0] && <img src={imgUrl(item.product.images[0])!} alt="" className="w-full h-full object-cover" />}
                          {itemDiscount > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{itemDiscount}%</span>
                          )}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-0' : 'opacity-100'}`}>
                            <FaPlus className="text-white text-2xl" />
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <FaCheck className="text-white text-xs" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-700 line-clamp-2 max-w-[110px] mx-auto">{item.product.name}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <p className="text-sm font-bold text-green-500">৳{itemPrice}</p>
                          {itemDiscount > 0 && <p className="text-xs text-gray-400 line-through">৳{itemOriginal}</p>}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-gray-400">=</span>
                    <span className="text-2xl font-bold text-gray-400">→</span>
                  </div>
                  
                  {/* Total Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 min-w-[140px] text-center border border-orange-100">
                    <p className="text-xs text-gray-500 mb-1">Bundle Price</p>
                    <p className="text-2xl font-bold text-orange-600">৳{bundleTotal.toFixed(0)}</p>
                    {bundleSavings > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1">You save ৳{bundleSavings.toFixed(0)}</p>
                    )}
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleAddBundleToCart} 
                    disabled={selectedBundle.length === 0}
                    className="w-full max-w-md bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                  >
                    🛒 Add {selectedBundle.length > 0 ? selectedBundle.length + 1 : 'All'} to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Description Tabs */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {['description', 'specifications', 'author', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-4 text-base font-medium transition-colors ${activeTab === tab ? 'text-green-500 border-b-2 border-green-500 bg-green-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  {tab === 'description' ? 'বিবরণ' : tab === 'specifications' ? 'স্পেসিফিকেশন' : tab === 'author' ? 'লেখক' : 'রিভিউ'}
                </button>
              ))}
            </div>
            <div className="p-5 bg-white">
              {activeTab === 'description' && product.description && (
                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
              )}
              {activeTab === 'specifications' && (
                <div className="space-y-0">
                  <table className="w-full">
                    <tbody>
                      {product.name && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium w-1/3">Title</td>
                          <td className="py-3 text-gray-800">{product.name}</td>
                        </tr>
                      )}
                      {authorName && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Author</td>
                          <td className="py-3 text-gray-800">{authorName}</td>
                        </tr>
                      )}
                      {publisherName && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Publisher</td>
                          <td className="py-3 text-gray-800">{publisherName}</td>
                        </tr>
                      )}
                      {product.edition && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Edition</td>
                          <td className="py-3 text-gray-800">{product.edition}</td>
                        </tr>
                      )}
                      {product.totalPages && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Number of Pages</td>
                          <td className="py-3 text-gray-800">{product.totalPages}</td>
                        </tr>
                      )}
                      {product.country && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Country</td>
                          <td className="py-3 text-gray-800">{product.country}</td>
                        </tr>
                      )}
                      {product.language && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Language</td>
                          <td className="py-3 text-gray-800">{product.language}</td>
                        </tr>
                      )}
                      {product.weight && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3 text-gray-500 font-medium">Weight</td>
                          <td className="py-3 text-gray-800">{product.weight}g</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'author' && authorName && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-3">{authorName}</h3>
                  <p className="text-gray-600">লেখকের অন্যান্য বই সমূহ দেখতে লেখকের নামে সার্চ করুন।</p>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div>
                  {/* Rating Summary */}
                  {product.ratingAvr ? (
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900">{product.ratingAvr.toFixed(1)}</p>
                        <div className="flex gap-1 justify-center my-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} className={star <= Math.round(product.ratingAvr || 0) ? 'text-yellow-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">{product.ratingCount || 0} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = product.ratingDetails?.find(r => r.stars === stars)?.count || 0;
                          const total = product.ratingCount || 1;
                          const percent = (count / total) * 100;
                          return (
                            <div key={stars} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-8">{stars} star</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Write Review Button */}
                  {isAuthenticated() ? (
                    <div className="mb-6">
                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Write a Review
                        </button>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-4">Write Your Review</h4>
                          <div className="mb-4">
                            <label className="block text-gray-600 text-sm mb-2">Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setNewReview({ ...newReview, rating: star })}
                                  className="text-2xl transition-transform hover:scale-110"
                                >
                                  <FaStar className={star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-600 text-sm mb-2">Your Review</label>
                            <textarea
                              value={newReview.review}
                              onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                              placeholder="Share your experience with this book..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleSubmitReview}
                              disabled={submittingReview}
                              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                            <button
                              onClick={() => { setShowReviewForm(false); setNewReview({ rating: 5, review: '' }); }}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <p className="text-gray-600 mb-3">Please login to write a review</p>
                      <Link href="/login" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium inline-block">
                        Login
                      </Link>
                      <span className="text-gray-500 mx-2">or</span>
                      <Link href="/register" className="text-green-500 hover:underline font-medium">
                        Register
                      </Link>
                    </div>
                  )}

                  {/* Reviews List */}
                  {loadingReviews ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review._id} className="border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-bold text-sm">
                                {review.user?.name?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800">{review.user?.name || 'Anonymous'}</span>
                            <div className="flex gap-1 ml-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar key={star} className={star <= review.rating ? 'text-yellow-400 text-xs' : 'text-gray-300 text-xs'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{review.review}</p>
                          {review.reply && (
                            <div className="mt-3 pl-4 border-l-2 border-green-200 bg-green-50 rounded p-3">
                              <p className="text-xs text-green-500 font-medium mb-1">Seller Reply:</p>
                              <p className="text-gray-600 text-sm">{review.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recently Viewed & Best Sellers */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="mt-10">
                <h2 className="text-xl font-bold text-green-600 mb-5">সর্বশেষ দেখা বই</h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {relatedProducts.slice(0, 8).map((p) => (
                    <Link key={p._id} href={`/products/${p.slug}`} className="flex-shrink-0 w-36 group">
                      <div className="w-28 h-40 bg-gray-100 rounded-lg mb-3 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-green-500">{p.name}</p>
                      <p className="text-sm font-bold text-green-500">৳{getCurrentPrice(p)}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-10">
                <h2 className="text-xl font-bold text-green-600 mb-5">সর্বাধিক বিক্রিত বই</h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {relatedProducts.slice(0, 8).map((p) => (
                    <Link key={p._id} href={`/products/${p.slug}`} className="flex-shrink-0 w-36 group">
                      <div className="w-28 h-40 bg-gray-100 rounded-lg mb-3 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        {p.images?.[0] && <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-green-500">{p.name}</p>
                      <p className="text-sm font-bold text-green-500">৳{getCurrentPrice(p)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-[100]">
          {/* Close Button - outside scroll container */}
          <button 
            onClick={() => setShowPreviewModal(false)} 
            className="fixed top-4 right-4 z-[110] w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <FaTimes className="text-gray-800 w-5 h-5" />
          </button>

          {/* Scrollable Background */}
          <div 
            className="w-full h-full overflow-y-auto bg-black/90 backdrop-blur-sm flex items-start justify-center py-4"
            onClick={() => setShowPreviewModal(false)}
          >
            {/* PDF Viewer */}
            <div 
              className="w-full max-w-3xl my-4 bg-white rounded-lg shadow-2xl mx-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Document
                file={previewUrl}
                onLoadSuccess={({ numPages }: { numPages: number }) => {
                  setNumPages(numPages);
                  setPdfLoading(false);
                }}
                loading={
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>
                }
              >
                <div className="flex flex-col items-center gap-4 md:gap-6 px-2 md:px-4 py-4 md:py-6">
                  {Array.from(new Array(numPages), (_, index) => (
                    <Page 
                      key={index + 1}
                      pageNumber={index + 1} 
                      width={Math.min(500, window.innerWidth - 40)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-lg bg-white"
                    />
                  ))}
                </div>
              </Document>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
