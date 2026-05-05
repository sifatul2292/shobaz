'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { gtmViewItem, gtmAddToCart } from '@/lib/gtm';
import { capiViewContent, capiAddToCart } from '@/lib/capi';
import { Product, ShippingCharge, Review } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { HiOutlineBookOpen, HiOutlineEye, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import {
  FaChevronLeft, FaChevronRight, FaShoppingCart, FaBoxOpen, FaTimes,
  FaCheck, FaTruck, FaUndo, FaShieldAlt, FaMoneyBillWave, FaStar,
  FaMinus, FaPlus, FaPlay, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const PdfViewer = dynamic(() => import('@/components/common/PdfViewer'), { ssr: false });

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
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
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
      // Run all three requests in parallel instead of sequentially
      const [res, relatedRes, shipRes] = await Promise.all([
        api.get(`/product/get-by-slug/${slug}`),
        api.get('/product/get-all-data'),
        api.get('/shipping-charge/get').catch(() => null),
      ]);

      if (shipRes?.data?.data) {
        setShippingCharge(shipRes.data.data);
      }

      if (res.data?.data) {
        const productData = res.data.data;
        setProduct(productData);
        document.title = `${productData.name} | Shobaz`;
        gtmViewItem(productData);
        capiViewContent(productData);

        if (relatedRes.data?.data) {
          let allProducts = relatedRes.data.data;
          if (allProducts.items) allProducts = allProducts.items;
          if (!Array.isArray(allProducts)) allProducts = [];

          const filtered = allProducts.filter((p: Product) => p._id !== productData._id);
          setRelatedProducts(filtered.slice(0, 10));

          const sortedByRating = [...filtered].sort((a, b) => (b.ratingAvr || 0) - (a.ratingAvr || 0));
          setBestSellers(sortedByRating.slice(0, 8));

          const backendBoughtTogether = productData.boughtTogetherProducts || [];

          let bundleItems: BundleItem[] = [];
          const bundleDiscount = 10;

          if (backendBoughtTogether?.length > 0) {
            bundleItems = backendBoughtTogether.map((p: any) => {
              // If backend didn't return slug, look it up from allProducts
              const fullProduct = allProducts.find((fp: Product) => fp._id === p._id);
              return {
                product: { ...p, slug: p.slug || fullProduct?.slug || '' },
                discount: bundleDiscount
              };
            });
          } else {
            bundleItems = filtered.slice(0, 3).map((p: Product) => ({
              product: p,
              discount: bundleDiscount
            }));
          }

          setBundleProducts(bundleItems);
          setSelectedBundle(bundleItems.map(b => b.product._id));
        }

        // Fetch reviews in background — doesn't block page render
        fetchReviews(productData._id);
      }
    } catch (err) { console.error(err); }

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
      gtmAddToCart(product, quantity);
      capiAddToCart(product, quantity);
      toast.success('কার্টে যোগ হয়েছে');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      gtmAddToCart(product, quantity);
      capiAddToCart(product, quantity);
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

  const getYoutubeId = (url?: string): string | null => {
    if (!url) return null;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return null;
  };

  const youtubeId = getYoutubeId(product?.videoUrl);

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex gap-2 mb-6">
              {[80, 50, 90, 140].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 bg-gray-200 rounded-full animate-pulse" style={{ width: w }} />
                  {i < 3 && <div className="w-1.5 h-3 bg-gray-200 rounded-full animate-pulse" />}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse mb-4" />
                  <div className="flex gap-2 justify-center">
                    {[0,1,2].map(i => <div key={i} className="w-12 h-16 bg-gray-200 rounded-xl animate-pulse" />)}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 space-y-5">
                  <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-9 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-px bg-gray-100" />
                  <div className="h-12 w-44 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-4/6" />
                  </div>
                  <div className="h-14 bg-gray-200 rounded-2xl animate-pulse" />
                  <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
                </div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-3">
                  <div className="h-5 w-32 bg-gray-200 rounded-full animate-pulse" />
                  {[0,1,2].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}
                </div>
              </div>
            </div>
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
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">পণ্য পাওয়া যায়নি</h2>
            <Link href="/products" className="text-emerald-500 hover:text-emerald-600 font-medium hover:underline">সকল বই দেখুন</Link>
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
            <Link href="/" className="hover:text-emerald-600 transition-colors font-medium">হোম</Link>
            <span className="text-gray-300">›</span>
            <Link href="/products" className="hover:text-emerald-600 transition-colors font-medium">বই</Link>
            {product.category?.[0] && (
              <>
                <span className="text-gray-300">›</span>
                <Link href={`/products?category=${product.category[0].slug}`} className="hover:text-emerald-600 transition-colors font-medium">{product.category[0].name}</Link>
              </>
            )}
            <span className="text-gray-300">›</span>
            <span className="text-gray-600 truncate max-w-[200px] font-medium">{product.name}</span>
          </nav>

          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">

            {/* ─────────────── LEFT: Image Panel ─────────────── */}
            <div className="md:col-span-1 lg:col-span-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sticky top-4">

                {/* Main image */}
                <div className="relative bg-gradient-to-b from-slate-50 to-gray-100 rounded-2xl overflow-hidden aspect-[3/4] mb-4 group">
                  {/* Discount badge */}
                  {discountPercent > 0 && (
                    <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      -{discountPercent}%
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => previewUrl && setShowPreviewModal(true)}
                    disabled={!previewUrl}
                    className={`w-full h-full flex items-center justify-center ${previewUrl ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {images[activeImage] ? (
                      <img
                        src={imgUrl(images[activeImage])!}
                        alt={product.name}
                        className="w-full h-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <HiOutlineBookOpen className="w-28 h-28 text-gray-200" />
                    )}
                  </button>

                  {/* Hover preview overlay */}
                  {previewUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-all duration-200 pointer-events-none rounded-2xl">
                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2">
                        <HiOutlineEye className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-gray-800">একটু পড়ুন</span>
                      </div>
                    </div>
                  )}

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center hover:bg-white hover:shadow-lg transition-all"
                      >
                        <FaChevronLeft className="text-gray-600 text-xs" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center hover:bg-white hover:shadow-lg transition-all"
                      >
                        <FaChevronRight className="text-gray-600 text-xs" />
                      </button>
                    </>
                  )}
                </div>

                {/* Preview pill button */}
                {previewUrl && (
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="w-full mb-4 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-4 py-2.5 text-xs font-semibold hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    একটু পড়ে দেখুন
                  </button>
                )}

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 justify-center mb-4">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`w-12 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          idx === activeImage
                            ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl(img)!} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                  {[
                    { icon: <FaUndo className="text-emerald-600 text-sm" />, label: 'ফ্রি রিটার্ন' },
                    { icon: <FaShieldAlt className="text-emerald-600 text-sm" />, label: 'নিরাপদ পেমেন্ট' },
                    { icon: <FaCheck className="text-emerald-600 text-sm" />, label: 'অরিজিনাল বই' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                        {icon}
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─────────────── CENTER: Product Info ─────────────── */}
            <div className="md:col-span-1 lg:col-span-5">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 space-y-5">

                {/* Category badge */}
                {product.category?.[0] && (
                  <Link
                    href={`/products?category=${product.category[0].slug}`}
                    className="inline-block bg-emerald-50 text-emerald-700 rounded-full px-3.5 py-1 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
                  >
                    {product.category[0].name}
                  </Link>
                )}

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug tracking-tight">
                  {product.name}
                </h1>

                {/* Author & Publisher */}
                <div className="space-y-1.5">
                  {authorName && (
                    <p className="text-sm text-gray-500">
                      লেখক:{' '}
                      <Link
                        href={`/products?author=${encodeURIComponent(authorName)}`}
                        className="text-emerald-600 font-semibold hover:underline"
                      >
                        {authorName}
                      </Link>
                    </p>
                  )}
                  {publisherName && (
                    <p className="text-sm text-gray-500">
                      প্রকাশনা: <span className="text-gray-800 font-semibold">{publisherName}</span>
                    </p>
                  )}
                  {product.weight && (
                    <p className="text-xs text-gray-400">ওজন: {product.weight}g</p>
                  )}
                </div>

                {/* Rating row */}
                {rating > 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-800">{rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({product.ratingCount || 0} রিভিউ)</span>
                  </div>
                )}

                <div className="h-px bg-gray-100" />

                {/* Price section */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">৳{currentPrice}</span>
                    {discountPercent > 0 && (
                      <>
                        <span className="text-xl text-gray-400 line-through font-medium">৳{originalPrice}</span>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                          -{discountPercent}% ছাড়
                        </span>
                      </>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-emerald-600 text-sm font-semibold">
                      আপনি বাঁচাচ্ছেন ৳{savings}
                    </p>
                  )}
                </div>

                {/* Stock badge */}
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 border rounded-full text-xs font-semibold ${
                  inStock
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    : 'border-red-200 text-red-600 bg-red-50'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {inStock ? 'স্টকে আছে' : 'স্টক শেষ'}
                </div>

                {/* Short description */}
                {product.shortDescription && (
                  <div>
                    <p className={`text-gray-600 text-sm leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                      {product.shortDescription.replace(/<[^>]*>/g, '')}
                    </p>
                    {product.shortDescription?.length > 150 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-emerald-600 text-xs font-semibold mt-2 hover:underline flex items-center gap-1"
                      >
                        {showFullDescription
                          ? <><FaChevronUp className="text-[10px]" /> কম দেখুন</>
                          : <><FaChevronDown className="text-[10px]" /> আরও দেখুন</>
                        }
                      </button>
                    )}
                  </div>
                )}

                <div className="h-px bg-gray-100" />

                {/* Quantity selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 font-semibold">পরিমাণ:</span>
                  <div className="inline-flex items-center bg-gray-100 rounded-full h-11 overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-gray-200 text-gray-700 transition-colors rounded-full"
                    >
                      <FaMinus className="text-xs" />
                    </button>
                    <span className="w-10 text-center font-extrabold text-gray-900 text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-11 h-11 flex items-center justify-center hover:bg-gray-200 text-gray-700 transition-colors rounded-full"
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 ${
                    inStock
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaShoppingCart className="text-lg" />
                  কার্টে যোগ করুন
                </button>

                {/* Buy now button */}
                <button
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className={`w-full py-4 rounded-2xl font-extrabold text-lg text-white transition-all duration-200 ${
                    inStock
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  এখনই অর্ডার করুন
                </button>

                {/* WhatsApp order button */}
                <a
                  href={`https://wa.me/8801893058682?text=${encodeURIComponent(`আমি এই বইটি অর্ডার করতে চাই: ${product?.name}\nলিংক: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-base bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-lg w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp-এ অর্ডার করুন
                </a>

                {/* YouTube embed */}
                {youtubeId && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FaPlay className="text-[8px]" /> PLAY
                      </span>
                      <h3 className="font-bold text-sm text-gray-700">বুক রিভিউ</h3>
                    </div>
                    <div className="aspect-video bg-black">
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

            {/* ─────────────── RIGHT: Delivery + Related ─────────────── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Delivery card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                    <FaTruck className="text-emerald-600 text-xs" />
                  </div>
                  ডেলিভারি তথ্য
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-xs text-gray-600 font-medium">ঢাকার ভেতরে</span>
                    <span className="text-xs font-extrabold text-emerald-700">৳{shippingCharge?.deliveryInDhaka || 60}</span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs text-gray-600 font-medium">ঢাকার বাইরে</span>
                    <span className="text-xs font-extrabold text-gray-700">৳{shippingCharge?.deliveryOutsideDhaka || 120}</span>
                  </div>
                  {shippingCharge?.deliveryOutsideBD ? (
                    <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-xs text-gray-600 font-medium">বাংলাদেশের বাইরে</span>
                      <span className="text-xs font-extrabold text-gray-700">৳{shippingCharge.deliveryOutsideBD}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-gray-50 border border-gray-100 opacity-40">
                      <span className="text-xs text-gray-500 font-medium">বাংলাদেশের বাইরে</span>
                      <span className="text-xs font-bold text-gray-400">N/A</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-3.5 text-center font-medium">১–৪ কার্যদিবসে ডেলিভারি</p>
              </div>

              {/* Related books */}
              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full inline-block" />
                    <h3 className="font-bold text-sm text-gray-900">সম্পর্কিত বই</h3>
                  </div>
                  <div className="space-y-3.5">
                    {relatedProducts.slice(0, 6).map((p) => {
                      const pPrice = getCurrentPrice(p);
                      const pOriginalPrice = getOriginalPrice(p);
                      const pDiscount = getDiscountPercent(p);
                      return (
                        <div key={p._id} className="flex gap-3 group">
                          <Link href={`/products/${p.slug}`} className="flex-shrink-0">
                            <div className="w-12 h-16 bg-gray-100 rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                              {p.images?.[0] && (
                                <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover" />
                              )}
                              {pDiscount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-bl-lg">
                                  -{pDiscount}%
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <Link href={`/products/${p.slug}`}>
                              <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                                {p.name}
                              </p>
                            </Link>
                            <div className="flex items-center justify-between mt-1.5">
                              <div>
                                <p className="text-xs font-extrabold text-gray-900">৳{pPrice}</p>
                                {pDiscount > 0 && (
                                  <p className="text-[10px] text-gray-400 line-through">৳{pOriginalPrice}</p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  addItem(p, 1);
                                  toast.success('কার্টে যোগ হয়েছে');
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────── Bundle Section ─────────────── */}
          {bundleProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                    <HiOutlineBookOpen className="text-emerald-600 w-4 h-4" />
                  </div>
                  একসাথে কিনুন
                </h2>
                {bundleSavings > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                    ৳{bundleSavings.toFixed(0)} সাশ্রয়
                  </span>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {/* Main product */}
                  <div className="text-center">
                    <div className="w-20 h-28 bg-gray-100 rounded-2xl overflow-hidden mb-2 mx-auto ring-2 ring-emerald-400 ring-offset-2 shadow-md">
                      {product?.images?.[0] && (
                        <img src={imgUrl(product.images[0])!} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <Link
                      href={`/products/${product?.slug || product?._id}`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline line-clamp-2 max-w-[80px] mx-auto block transition-colors"
                    >
                      {product?.name}
                    </Link>
                    <p className="text-xs font-extrabold text-gray-900 mt-1">৳{getCurrentPrice(product!)}</p>
                  </div>

                  {bundleProducts.map((item) => {
                    const itemPrice = getCurrentPrice(item.product);
                    const itemDiscount = getDiscountPercent(item.product);
                    const isSelected = selectedBundle.includes(item.product._id);

                    return (
                      <div key={item.product._id} className="flex items-center gap-4">
                        <span className="text-2xl text-gray-300 font-light select-none">+</span>
                        <div className="text-center">
                          {/* Image — click toggles selection */}
                          <div
                            className={`relative w-20 h-28 bg-gray-100 rounded-2xl overflow-hidden mb-2 cursor-pointer transition-all duration-200 mx-auto
                              ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 shadow-md' : 'opacity-55 hover:opacity-80 shadow-sm'}`}
                            onClick={() => handleToggleBundle(item.product._id)}
                          >
                            {item.product.images?.[0] && (
                              <img src={imgUrl(item.product.images[0])!} alt="" className="w-full h-full object-cover" />
                            )}
                            {itemDiscount > 0 && (
                              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                -{itemDiscount}%
                              </span>
                            )}
                            {isSelected ? (
                              <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                <FaCheck className="text-white text-[8px]" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center rounded-2xl">
                                <FaPlus className="text-white text-sm" />
                              </div>
                            )}
                          </div>
                          {/* Title — always a link using slug or _id */}
                          <Link
                            href={`/products/${item.product.slug || item.product._id}`}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline line-clamp-2 max-w-[80px] mx-auto block transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs font-extrabold text-gray-900 mt-1">৳{itemPrice}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Equals + Total */}
                  <div className="flex items-center gap-4">
                    <span className="text-2xl text-gray-300 font-light select-none">=</span>
                    <div className="bg-gradient-to-b from-emerald-50 to-white border border-emerald-100 rounded-2xl p-4 text-center min-w-[108px] shadow-sm">
                      <p className="text-[10px] text-gray-500 font-medium mb-1">মোট মূল্য</p>
                      <p className="text-2xl font-extrabold text-gray-900">৳{bundleTotal.toFixed(0)}</p>
                      {bundleSavings > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">সাশ্রয় ৳{bundleSavings.toFixed(0)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAddBundleToCart}
                    disabled={selectedBundle.length === 0}
                    className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
                  >
                    <FaShoppingCart />
                    সব একসাথে কার্টে যোগ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────── Tabs ─────────────── */}
          <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 bg-gray-50/70">
              {['description', 'specifications', 'author', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-4 text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white -mb-px'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
                >
                  {tab === 'description' ? 'বিবরণ' : tab === 'specifications' ? 'স্পেসিফিকেশন' : tab === 'author' ? 'লেখক' : 'রিভিউ'}
                  {tab === 'reviews' && product.ratingCount ? (
                    <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded-full">
                      {product.ratingCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 md:p-8">
              {activeTab === 'description' && product.description && (
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-a:text-emerald-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {activeTab === 'specifications' && (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.name && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold w-1/3 bg-gray-50/60">শিরোনাম</td>
                          <td className="py-3.5 px-5 text-gray-800">{product.name}</td>
                        </tr>
                      )}
                      {authorName && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">লেখক</td>
                          <td className="py-3.5 px-5 text-gray-800">{authorName}</td>
                        </tr>
                      )}
                      {publisherName && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">প্রকাশনী</td>
                          <td className="py-3.5 px-5 text-gray-800">{publisherName}</td>
                        </tr>
                      )}
                      {product.edition && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">সংস্করণ</td>
                          <td className="py-3.5 px-5 text-gray-800">{product.edition}</td>
                        </tr>
                      )}
                      {product.totalPages && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">পৃষ্ঠা সংখ্যা</td>
                          <td className="py-3.5 px-5 text-gray-800">{product.totalPages}</td>
                        </tr>
                      )}
                      {product.country && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">দেশ</td>
                          <td className="py-3.5 px-5 text-gray-800">{product.country}</td>
                        </tr>
                      )}
                      {product.language && (
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">ভাষা</td>
                          <td className="py-3.5 px-5 text-gray-800">{product.language}</td>
                        </tr>
                      )}
                      {product.weight && (
                        <tr>
                          <td className="py-3.5 px-5 text-gray-500 font-semibold bg-gray-50/60">ওজন</td>
                          <td className="py-3.5 px-5 text-gray-800">{product.weight}g</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'author' && authorName && (
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-extrabold text-xl">{authorName[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-gray-900 mb-1.5">{authorName}</h3>
                    <p className="text-gray-500 text-sm">লেখকের অন্যান্য বই সমূহ দেখতে লেখকের নামে সার্চ করুন।</p>
                    <Link
                      href={`/products?author=${encodeURIComponent(authorName)}`}
                      className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                    >
                      সকল বই দেখুন →
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating summary */}
                  {product.ratingAvr ? (
                    <div className="flex items-start gap-6 p-5 bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-100">
                      <div className="text-center flex-shrink-0">
                        <p className="text-5xl font-extrabold text-gray-900 leading-none mb-2">{product.ratingAvr.toFixed(1)}</p>
                        <div className="flex gap-0.5 justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FaStar key={s} className={`text-lg ${s <= Math.round(product.ratingAvr || 0) ? 'text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{product.ratingCount || 0} রিভিউ</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = product.ratingDetails?.find(r => r.stars === stars)?.count || 0;
                          const total = product.ratingCount || 1;
                          const percent = (count / total) * 100;
                          return (
                            <div key={stars} className="flex items-center gap-2.5 text-xs">
                              <span className="text-gray-500 w-10 text-right font-medium">{stars} ★</span>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-gray-400 w-6 font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Write review */}
                  {isAuthenticated() ? (
                    <div>
                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md"
                        >
                          রিভিউ লিখুন
                        </button>
                      ) : (
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                          <h4 className="font-extrabold text-gray-900">আপনার রিভিউ লিখুন</h4>
                          <div>
                            <label className="block text-gray-600 text-sm mb-2 font-semibold">রেটিং</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setNewReview({ ...newReview, rating: star })}
                                  className="text-2xl transition-transform hover:scale-110"
                                >
                                  <FaStar className={star <= newReview.rating ? 'text-amber-400' : 'text-gray-200'} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-600 text-sm mb-2 font-semibold">আপনার মন্তব্য</label>
                            <textarea
                              value={newReview.review}
                              onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                              placeholder="এই বইটি সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
                              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm bg-white transition-shadow"
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleSubmitReview}
                              disabled={submittingReview}
                              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                            >
                              {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
                            </button>
                            <button
                              onClick={() => { setShowReviewForm(false); setNewReview({ rating: 5, review: '' }); }}
                              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                            >
                              বাতিল
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 text-center">
                      <p className="text-gray-600 mb-4 text-sm font-medium">রিভিউ লিখতে লগইন করুন</p>
                      <div className="flex items-center justify-center gap-3">
                        <Link href="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                          লগইন
                        </Link>
                        <span className="text-gray-400 text-sm">বা</span>
                        <Link href="/register" className="text-emerald-600 hover:underline font-semibold text-sm">
                          নিবন্ধন করুন
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Reviews list */}
                  {loadingReviews ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="h-3 w-32 bg-gray-200 rounded-full" />
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full w-full" />
                          <div className="h-3 bg-gray-200 rounded-full w-4/5" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div key={review._id} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-700 font-extrabold text-sm">
                                {review.user?.name?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{review.user?.name || 'Anonymous'}</p>
                              <div className="flex gap-0.5 mt-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <FaStar key={s} className={`text-xs ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">{review.review}</p>
                          {review.reply && (
                            <div className="mt-3 pl-4 border-l-2 border-emerald-300 bg-emerald-50/70 rounded-r-xl p-3">
                              <p className="text-xs text-emerald-700 font-bold mb-1">বিক্রেতার উত্তর:</p>
                              <p className="text-gray-600 text-sm">{review.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaStar className="text-gray-300 text-2xl" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ লিখুন!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─────────────── Best Sellers ─────────────── */}
          {bestSellers.length > 0 && (
            <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1.5 h-7 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                <h2 className="text-base font-extrabold text-gray-900">সর্বাধিক বিক্রিত বই</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {bestSellers.slice(0, 8).map((p) => (
                  <div
                    key={p._id}
                    className="flex-shrink-0 w-28 group"
                  >
                    <Link href={`/products/${p.slug}`}>
                      <div className="w-28 h-36 bg-gray-100 rounded-2xl mb-2.5 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
                        {p.images?.[0] && (
                          <img src={imgUrl(p.images[0])!} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-emerald-600 transition-colors leading-snug">
                        {p.name}
                      </p>
                      <p className="text-xs font-extrabold text-gray-900 mb-2">৳{getCurrentPrice(p)}</p>
                    </Link>
                    <button
                      onClick={() => { addItem(p, 1); toast.success('কার্টে যোগ হয়েছে'); }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold py-2 rounded-xl transition-colors shadow-sm hover:shadow-md active:scale-95"
                    >
                      + কার্টে যোগ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ─────────────── PDF Preview Modal ─────────────── */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-[100]">
          <button
            onClick={() => setShowPreviewModal(false)}
            className="fixed top-4 right-4 z-[110] w-10 h-10 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105"
          >
            <FaTimes className="text-gray-700 text-sm" />
          </button>
          <div
            className="w-full h-full overflow-y-auto bg-black/80 backdrop-blur-md flex items-start justify-center py-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <div
              className="w-full max-w-3xl my-4 bg-white rounded-3xl shadow-2xl mx-2 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <PdfViewer file={previewUrl} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
