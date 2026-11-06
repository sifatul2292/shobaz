'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { gtmViewItem, gtmAddToCart } from '@/lib/gtm';
import { phViewItem, phAddToCart } from '@/lib/posthog';
import { Product, ShippingCharge, Review, Author } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { HiOutlineBookOpen } from 'react-icons/hi';
import { FaTimes, FaStar } from 'react-icons/fa';
import HomeProductCard from '@/components/home/HomeProductCard';
import ProductRail from '@/components/home/ProductRail';

const PdfViewer = dynamic(() => import('@/components/common/PdfViewer'), { ssr: false });

interface BundleItem {
  product: Product;
  discount: number;
}

interface Props {
  params: Promise<{ slug: string }>;
  /** Product fetched on the server — renders the page immediately (SEO + no spinner). */
  initialProduct?: Product;
  /** Full author record(s) (photo + bio) fetched on the server. */
  initialAuthors?: Author[];
}

const CV_CLASSES = ['cv-1','cv-2','cv-3','cv-4','cv-5','cv-6','cv-7','cv-8','cv-9','cv-10','cv-11','cv-12'];
function cvClass(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return CV_CLASSES[Math.abs(h) % 12];
}

const PRIMARY = '#16a34a';
const ORANGE = '#ea580c';
const PARCHMENT = '#f5f0e8';
const API_IMAGE_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// SVG Icon components
const IcRefresh = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 15.5-6.36L21 8"/><polyline points="21 3 21 8 16 8"/>
    <path d="M21 12a9 9 0 0 1-15.5 6.36L3 16"/><polyline points="3 21 3 16 8 16"/>
  </svg>
);
const IcShield = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcBookCheck = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h6a3 3 0 0 1 3 3v14"/><path d="M20 4h-6a3 3 0 0 0-3 3"/>
    <polyline points="14 14 16 16 20 12"/>
  </svg>
);
const IcTruck = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6" width="14" height="11" rx="1.5"/>
    <path d="M15 9h4l3 4v4h-7"/>
    <circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>
  </svg>
);
const IcClock = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
  </svg>
);
const IcCart = ({ size = 20, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>
    <path d="M3 4h2l2.6 12.2a1.8 1.8 0 0 0 1.8 1.5h7.5a1.8 1.8 0 0 0 1.8-1.4L21 9H6"/>
  </svg>
);
const IcBolt = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="white" stroke="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6z"/>
  </svg>
);
const IcWhatsApp = () => (
  <svg width={20} height={20} viewBox="0 0 32 32" fill="#25D366">
    <path d="M16.003 3C9.376 3 4 8.377 4 15.005c0 2.367.685 4.585 1.873 6.451L4 28l6.713-1.83a11.94 11.94 0 0 0 5.29 1.244C22.63 27.414 28 22.038 28 15.41 28 8.783 22.624 3 16.003 3zm0 22.117a9.962 9.962 0 0 1-5.083-1.393l-.364-.216-3.985 1.087 1.066-3.892-.237-.4a9.946 9.946 0 0 1-1.52-5.298c0-5.51 4.483-9.994 9.993-9.994 5.508 0 9.994 4.484 9.994 9.994 0 5.51-4.486 9.994-9.864 10.112z"/>
    <path d="M21.55 17.92c-.302-.151-1.79-.883-2.066-.983-.277-.1-.479-.151-.68.151-.201.302-.78.983-.957 1.184-.176.202-.353.227-.655.075-.302-.151-1.276-.47-2.43-1.498-.899-.802-1.504-1.79-1.68-2.092-.176-.302-.019-.466.132-.617.135-.135.302-.353.453-.529.151-.176.201-.302.302-.504.1-.202.05-.378-.025-.529-.075-.151-.68-1.64-.932-2.247-.246-.59-.495-.51-.68-.52l-.58-.01a1.115 1.115 0 0 0-.806.378c-.277.302-1.058 1.034-1.058 2.522 0 1.488 1.083 2.925 1.234 3.127.151.202 2.134 3.257 5.169 4.566.722.312 1.286.498 1.726.638.725.23 1.385.197 1.906.12.582-.087 1.79-.731 2.042-1.437.252-.706.252-1.31.176-1.437-.075-.126-.277-.202-.579-.353z"/>
  </svg>
);
const IcFlame = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="#ea580c">
    <path d="M12 2c-1 4-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 0-4 1-6-1-9z"/>
  </svg>
);
const IcChevL = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 6 9 12 15 18"/>
  </svg>
);
const IcChevR = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18"/>
  </svg>
);
const IcChevDown = ({ color = PRIMARY }: { color?: string }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcEye = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcMinus = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.4" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcPlus = ({ color = PRIMARY }: { color?: string }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

function decodeHTML(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function showcaseImgUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_IMAGE_BASE}/api/upload/images/${path}`;
}

const dividerStyle: React.CSSProperties = { border: 0, borderTop: '1px solid #f1f5f9', margin: '20px 0' };
const tinyLabel: React.CSSProperties = { fontSize: 12, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' };
const sideCardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 20,
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9'
};

function CTAButton({ onClick, style, hoverShadow, hoverBg, children }: {
  onClick: () => void;
  style: React.CSSProperties;
  hoverShadow?: string;
  hoverBg?: string;
  children: React.ReactNode;
}) {
  const baseShadow = style.boxShadow || 'none';
  const baseBg = style.background as string;
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        if (hoverShadow) e.currentTarget.style.boxShadow = hoverShadow;
        if (hoverBg) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = baseShadow;
        if (hoverBg && baseBg) e.currentTarget.style.background = baseBg;
      }}
      style={{
        ...style,
        border: style.border || 'none', borderRadius: 14, height: 56,
        fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'transform .15s ease, box-shadow .2s ease, background .2s ease'
      }}
    >{children}</button>
  );
}

export default function ProductDetailClient({ params, initialProduct, initialAuthors }: Props) {
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [bundleProducts, setBundleProducts] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [showStickyBuy, setShowStickyBuy] = useState(false);
  const [authorDetails, setAuthorDetails] = useState<Author[]>(initialAuthors ?? []);
  const [authorBooks, setAuthorBooks] = useState<Product[]>([]);
  const [showFullBio, setShowFullBio] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const ctaRef = useRef<HTMLDivElement>(null);

  // Read the URL after mount so server and client markup match (SSR hydration).
  useEffect(() => { setPageUrl(window.location.href); }, []);
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
  const bestsellerScrollRef = useRef<HTMLDivElement>(null);
  const showcaseTouchStartX = useRef<number | null>(null);
  const [showcaseLightboxIndex, setShowcaseLightboxIndex] = useState<number | null>(null);

  const { addItem, items } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (showcaseLightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowcaseLightboxIndex(null);
      if (event.key === 'ArrowLeft') moveShowcaseLightbox(-1);
      if (event.key === 'ArrowRight') moveShowcaseLightbox(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showcaseLightboxIndex]);

  // Fallback: load the author record client-side if the server didn't send it.
  const firstAuthorId = (() => {
    const a: any = product?.author;
    const first = Array.isArray(a) ? a[0] : a;
    return first && typeof first === 'object' ? first._id : '';
  })();
  useEffect(() => {
    if (!firstAuthorId || authorDetails.some(a => a._id === firstAuthorId)) return;
    api.get(`/author/${firstAuthorId}`)
      .then(res => { if (res.data?.data) setAuthorDetails([res.data.data]); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstAuthorId]);

  // PDF reader: lock page scroll and close on Escape.
  useEffect(() => {
    if (!showPreviewModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPreviewModal(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [showPreviewModal]);

  // Mobile sticky buy bar: appears once the main buttons scroll out of view.
  const hasProduct = Boolean(product);
  // Plain scroll check (passive + coalesced) — stays correct after reloads that
  // restore the scroll position, where an observer's first callback can lag.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    let pending = false;
    const check = () => {
      pending = false;
      setShowStickyBuy(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      setTimeout(check, 60);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [hasProduct, loading]);

  useEffect(() => {
    document.body.classList.toggle('has-sticky-buy', showStickyBuy);
    return () => document.body.classList.remove('has-sticky-buy');
  }, [showStickyBuy]);

  const fetchProduct = async () => {
    // Keep server-rendered content on screen while fresh data loads.
    if (!product) setLoading(true);
    try {
      const [res, relatedRes, shipRes] = await Promise.all([
        api.get(`/product/get-by-slug/${slug}`),
        api.get('/product/get-all-data'),
        api.get('/shipping-charge/get').catch(() => null),
      ]);

      if (shipRes?.data?.data) setShippingCharge(shipRes.data.data);

      if (res.data?.data) {
        const productData = res.data.data;
        setProduct(productData);
        document.title = `${productData.name} | Shobaz`;
        gtmViewItem(productData);
        phViewItem(productData);

        if (relatedRes.data?.data) {
          let allProducts = relatedRes.data.data;
          if (allProducts.items) allProducts = allProducts.items;
          if (!Array.isArray(allProducts)) allProducts = [];

          const filtered = allProducts.filter((p: Product) => p._id !== productData._id);
          setRelatedProducts(filtered.slice(0, 10));

          // Other books by the same author(s), for the author section.
          const authorList: any[] = Array.isArray(productData.author) ? productData.author : productData.author ? [productData.author] : [];
          const authorKeys = new Set(authorList.flatMap((a: any) => (typeof a === 'object' ? [a?._id, a?.slug] : [a])).filter(Boolean));
          setAuthorBooks(filtered.filter((p: any) => {
            const pa: any[] = Array.isArray(p.author) ? p.author : p.author ? [p.author] : [];
            return pa.some((a: any) => authorKeys.has(typeof a === 'object' ? a?._id : a) || (typeof a === 'object' && authorKeys.has(a?.slug)));
          }).slice(0, 8));

          const sortedByRating = [...filtered].sort((a: Product, b: Product) => (b.totalSold || 0) - (a.totalSold || 0));
          setBestSellers(sortedByRating.slice(0, 10));

          const backendBoughtTogether = productData.boughtTogetherProducts || [];
          const bundleDiscount = 10;
          let bundleItems: BundleItem[] = [];

          if (backendBoughtTogether?.length > 0) {
            bundleItems = backendBoughtTogether.map((p: any) => {
              const fullProduct = allProducts.find((fp: Product) => fp._id === p._id);
              return { product: { ...p, slug: p.slug || fullProduct?.slug || '' }, discount: bundleDiscount };
            });
          } else {
            bundleItems = filtered.slice(0, 3).map((p: Product) => ({ product: p, discount: bundleDiscount }));
          }

          setBundleProducts(bundleItems);
          setSelectedBundle(bundleItems.map((b: BundleItem) => b.product._id));
        }

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
        setReviews(productReviews.filter((r: Review) => r.status === true));
      }
    } catch (err) { console.error('Failed to fetch reviews:', err); }
    setLoadingReviews(false);
  };

  const handleSubmitReview = async () => {
    if (!product || !newReview.review.trim()) { toast.error('Please write a review'); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post('/review/add', { product: product._id, rating: newReview.rating, review: newReview.review });
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

  // Visual confirmation comes from the global add-to-cart notification.
  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      gtmAddToCart(product, quantity);
      phAddToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      gtmAddToCart(product, quantity);
      phAddToCart(product, quantity);
      window.location.href = '/checkout';
    }
  };

  const handleToggleBundle = (productId: string) => {
    setSelectedBundle(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
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
  const getCategorySlug = (cat: any) => {
    if (!cat) return '';
    if (Array.isArray(cat)) return cat[0]?.slug || '';
    if (typeof cat === 'object') return cat.slug || '';
    return '';
  };
  const getCategoryName = (cat: any) => {
    if (!cat) return '';
    if (Array.isArray(cat)) return cat[0]?.name || '';
    if (typeof cat === 'object') return cat.name || '';
    return '';
  };
  const getAuthorSlug = (author: any) => {
    if (!author) return '';
    if (Array.isArray(author)) return author[0]?.slug || '';
    if (typeof author === 'object') return author.slug || '';
    return '';
  };

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

  const starStr = (n: number) => '★'.repeat(Math.min(5, Math.max(0, Math.round(n)))) + '☆'.repeat(5 - Math.min(5, Math.max(0, Math.round(n))));

  const moveShowcaseLightbox = (direction: number) => {
    setShowcaseLightboxIndex((current) => {
      const count = product?.showcaseImages?.filter(Boolean).length || 0;
      if (current === null || count === 0) return current;
      return (current + direction + count) % count;
    });
  };

  const onShowcaseTouchEnd = (clientX: number) => {
    if (showcaseTouchStartX.current === null) return;
    const delta = clientX - showcaseTouchStartX.current;
    showcaseTouchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    moveShowcaseLightbox(delta > 0 ? -1 : 1);
  };

  if (loading) {
    return (
      <div className="pdp min-h-screen flex flex-col">
        <Header />
        <main className="flex-1" aria-busy="true" aria-label="লোড হচ্ছে">
          <div className="pdp-wrap">
            <div className="skeleton" style={{ height: 12, width: 200, borderRadius: 4, margin: '16px 0 18px' }} />
            <div className="pdp-main">
              <div className="skeleton pdp-stage" />
              <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
                <div className="skeleton" style={{ height: 12, width: 90, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 30, width: '80%', borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 14, width: '45%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 6, marginTop: 8 }} />
                <div className="skeleton" style={{ height: 48, borderRadius: 999, marginTop: 12 }} />
                <div className="skeleton" style={{ height: 48, borderRadius: 999 }} />
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
      <div className="pdp min-h-screen flex flex-col">
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <HiOutlineBookOpen style={{ width: 44, height: 44, color: '#a3a3a3', margin: '0 auto 14px' }} />
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: 20, marginBottom: 12 }}>পণ্য পাওয়া যায়নি</h2>
            <Link href="/products" className="pdp-link">সকল বই দেখুন →</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images || [];
  const showcaseImages = (product.showcaseImages || []).filter(Boolean);
  const showcaseTrackImages = showcaseImages.length > 2 ? [...showcaseImages, ...showcaseImages] : showcaseImages;
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);
  const savings = originalPrice - currentPrice;
  const authorName = getAuthorName(product.author);
  const publisherName = getPublisherName(product.publisher);
  const categoryName = getCategoryName(product.category);
  const categorySlug = getCategorySlug(product.category);
  const authorSlug = getAuthorSlug(product.author);
  const inStock = product.quantity === undefined || product.quantity > 0;
  const rating = product.ratingAvr || 0;
  const youtubeId = getYoutubeId(product?.videoUrl);

  const bundleTotal = currentPrice + selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.9 : 0);
  }, 0);
  const bundleSavings = selectedBundle.reduce((sum, id) => {
    const item = bundleProducts.find(b => b.product._id === id);
    return sum + (item ? getCurrentPrice(item.product) * 0.1 : 0);
  }, 0);

  const productSpecRows = [
    ['শিরোনাম', product.name],
    authorName ? ['লেখক', authorName] : null,
    publisherName ? ['প্রকাশনী', publisherName] : null,
    product.edition ? ['সংস্করণ', product.edition] : null,
    product.totalPages ? ['পৃষ্ঠা সংখ্যা', String(product.totalPages)] : null,
    product.country ? ['দেশ', product.country] : null,
    product.language ? ['ভাষা', Array.isArray(product.language) ? product.language.join(', ') : product.language] : null,
    product.weight ? ['ওজন', `${product.weight}g`] : null,
  ].filter((row): row is [string, string] => Boolean(row));

  const descriptionHtml = product.description ? decodeHTML(product.description) : '';
  const authorHref = authorSlug ? `/products?author=${encodeURIComponent(authorSlug)}` : `/products?q=${encodeURIComponent(authorName)}`;
  const recommendations = bestSellers.length > 0 ? bestSellers : relatedProducts;

  return (
    <div className="pdp min-h-screen flex flex-col">
      <Header />

      <main style={{ flex: 1 }}>
        <div className="pdp-wrap">
          {/* Breadcrumb */}
          <nav className="pdp-crumbs" aria-label="Breadcrumb">
            <Link href="/">হোম</Link>
            <span aria-hidden="true">/</span>
            <Link href="/products">বই</Link>
            {categoryName && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/products?category=${categorySlug}`}>{categoryName}</Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="pdp-crumbs-current" aria-current="page">{product.name}</span>
          </nav>

          {/* ── Gallery + buy box ── */}
          <section className="pdp-main">
            <div className="pdp-gallery">
              <div className={`pdp-stage${previewUrl ? ' has-peek' : ''}`}>
                {images[activeImage] ? (
                  <img
                    key={activeImage}
                    className="pdp-cover-img"
                    src={imgUrl(images[activeImage])!}
                    alt={product.name}
                    fetchPriority={activeImage === 0 ? 'high' : 'auto'}
                    decoding="async"
                  />
                ) : (
                  <div className={`cv ${cvClass(product._id)}`} style={{ width: '62%', aspectRatio: '2 / 3', borderRadius: 6 }}>
                    <div className="a">{authorName || 'AUTHOR'}</div>
                    <div className="t">{product.name}</div>
                    <div className="frame" />
                    <div className="num">S</div>
                  </div>
                )}
                {discountPercent > 0 && <span className="pdp-badge">−{discountPercent}%</span>}
                {product.badge && <span className="pdp-badge pdp-badge--alt">{product.badge}</span>}
                {previewUrl && (
                  <button type="button" className="pdp-peek" onClick={() => setShowPreviewModal(true)} aria-haspopup="dialog">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z" /><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z" /></svg>
                    একটু পড়ে দেখুন
                  </button>
                )}
              </div>

              {images.length > 1 && (
                <div className="pdp-thumbs">
                  {images.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pdp-thumb${idx === activeImage ? ' is-active' : ''}`}
                      onClick={() => setActiveImage(idx)}
                      aria-label={`ছবি ${idx + 1}`}
                      aria-pressed={idx === activeImage}
                    >
                      <img src={imgUrl(img)!} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

            </div>

            <div className="pdp-info">
              {categoryName && (
                <Link href={`/products?category=${categorySlug}`} className="pdp-eyebrow">{categoryName}</Link>
              )}

              <h1 className="pdp-title">{product.name}</h1>

              {(product.taglineEn || product.tagline) && (
                <p className="pdp-tagline">{product.taglineEn || product.tagline}</p>
              )}

              <p className="pdp-byline">
                {authorName && (
                  <>লেখক: {authorSlug ? <Link href={authorHref}>{authorName}</Link> : <span>{authorName}</span>}</>
                )}
                {authorName && publisherName && <span className="pdp-dot" aria-hidden="true">·</span>}
                {publisherName && <span>{publisherName}</span>}
              </p>

              {rating > 0 && (
                <a href="#reviews" className="pdp-rating">
                  <span className="pdp-stars">{starStr(rating)}</span>
                  <b>{rating.toFixed(1)}</b>
                  <span>({product.ratingCount || 0} টি রিভিউ)</span>
                </a>
              )}

              <div className="pdp-price">
                <span className="pdp-price-now">৳{currentPrice}</span>
                {discountPercent > 0 && (
                  <>
                    <s className="pdp-price-was">৳{originalPrice}</s>
                    <span className="pdp-price-off">−{discountPercent}% ছাড়</span>
                  </>
                )}
              </div>
              {savings > 0 && <p className="pdp-save">আপনি বাঁচাচ্ছেন ৳{savings}</p>}
              {product.dollarPrice && product.dollarPrice > 0 && (
                <p className="pdp-note">
                  আন্তর্জাতিক মূল্য ${product.dollarPrice} (~৳{Math.round(product.dollarPrice * 110).toLocaleString('bn-BD')}) — আজই পাচ্ছেন মাত্র ৳{currentPrice}!
                </p>
              )}

              <p className={`pdp-stock${inStock ? '' : ' is-out'}`}>
                <span aria-hidden="true" />
                {inStock ? 'স্টক আছে' : 'স্টক শেষ'}
                {product.totalPages ? <em> · {product.totalPages} পৃষ্ঠা{product.edition ? ` · ${product.edition}` : ''}</em> : null}
              </p>

              {/* Quantity */}
              <div className="pdp-qty-row">
                <span className="pdp-label">পরিমাণ</span>
                <div className="pdp-qty">
                  <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="কমান">−</button>
                  <span aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(q => q + 1)} aria-label="বাড়ান">+</button>
                </div>
              </div>

              {/* CTA buttons */}
              <div ref={ctaRef} className="pdp-ctas">
                <button type="button" className="pdp-btn pdp-btn--outline" onClick={handleAddToCart}>
                  কার্টে যোগ করুন
                </button>
                <button type="button" className="pdp-btn pdp-btn--solid" onClick={handleBuyNow}>
                  এখনই অর্ডার করুন
                </button>
                <a
                  href={`https://wa.me/8801893058682?text=${encodeURIComponent(`আমি এই বইটি অর্ডার করতে চাই: ${product?.name}\nলিংক: ${pageUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdp-btn pdp-btn--wa"
                >
                  <IcWhatsApp /><span>WhatsApp-এ অর্ডার করুন</span>
                </a>
              </div>

              {/* Free notebook offer */}
              <a href="/notebook-bundle" className="pdp-offer">
                <span aria-hidden="true">🎁</span>
                <span>
                  <b>৳৫০০+ অর্ডার</b> বা <b>২টি নোটবুক</b> কিনলে একটি প্রিমিয়াম নোটবুক <b className="pdp-offer-free">ফ্রি</b> — কার্টে গিয়ে বেছে নিন →
                </span>
              </a>

              {/* Trust */}
              <ul className="pdp-trust">
                <li><IcRefresh /><span>ফ্রি রিটার্ন</span></li>
                <li><IcShield /><span>নিরাপদ পেমেন্ট</span></li>
                <li><IcBookCheck /><span>অরিজিনাল বই</span></li>
              </ul>

              {/* Collapsible details (Shopify "collapsible tabs") */}
              <div className="pdp-accordions">
                <details className="pdp-acc" open>
                  <summary>বিবরণ</summary>
                  <div className="pdp-acc-body">
                    {descriptionHtml ? (
                      <>
                        <div
                          className={`pdp-desc${showFullDescription ? ' is-open' : ''}`}
                          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                        />
                        <button type="button" className="pdp-more" onClick={() => setShowFullDescription(e => !e)}>
                          {showFullDescription ? 'কম দেখুন' : 'আরও দেখুন'}
                          <span style={{ display: 'inline-flex', transition: 'transform .3s cubic-bezier(.22,1,.36,1)', transform: showFullDescription ? 'rotate(180deg)' : 'none' }}><IcChevDown color="currentColor" /></span>
                        </button>
                      </>
                    ) : product.shortDescription ? (
                      <p>{product.shortDescription.replace(/<[^>]*>/g, '')}</p>
                    ) : (
                      <p className="pdp-muted">বিবরণ পাওয়া যায়নি।</p>
                    )}
                  </div>
                </details>

                <details className="pdp-acc">
                  <summary>স্পেসিফিকেশন</summary>
                  <div className="pdp-acc-body">
                    <dl className="pdp-specs">
                      {productSpecRows.map(([k, v]) => (
                        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                      ))}
                    </dl>
                  </div>
                </details>

                <details className="pdp-acc">
                  <summary>ডেলিভারি ও রিটার্ন</summary>
                  <div className="pdp-acc-body">
                    <dl className="pdp-specs">
                      <div><dt>ঢাকার ভেতরে</dt><dd>৳{shippingCharge?.deliveryInDhaka || 60}</dd></div>
                      <div><dt>ঢাকার বাইরে</dt><dd>৳{shippingCharge?.deliveryOutsideDhaka || 120}</dd></div>
                      <div><dt>আন্তর্জাতিক</dt><dd className="pdp-muted">N/A</dd></div>
                    </dl>
                    <p className="pdp-muted" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}><IcClock /> ১–৪ কার্যদিবসে ডেলিভারি</p>
                  </div>
                </details>

              </div>
            </div>
          </section>
        </div>

        {/* ── About the author (outside the accordions) ── */}
        {authorName && (() => {
          const info: any = authorDetails.find(a => a._id === firstAuthorId) || authorDetails[0] || null;
          const photo = info?.image ? imgUrl(info.image) : null;
          const bio: string = (info?.description || info?.descriptionEn || '').trim();
          const bioIsHtml = /<[a-z][\s\S]*>/i.test(bio);
          const longBio = bio.replace(/<[^>]*>/g, '').length > 320;
          return (
            <section className="pdp-section pdp-section--author" aria-labelledby="pdp-author-title">
              <div className="pdp-wrap">
                <div className="pdp-author-card">
                  <div className="pdp-author-photo">
                    {photo ? <img src={photo} alt={authorName} loading="lazy" /> : <span aria-hidden="true">{authorName.trim()[0]}</span>}
                  </div>
                  <div className="pdp-author-body">
                    <span className="pdp-eyebrow">লেখক সম্পর্কে</span>
                    <h2 id="pdp-author-title">{authorName}</h2>
                    {bio ? (
                      <>
                        {bioIsHtml ? (
                          <div className={`pdp-author-bio${longBio && !showFullBio ? ' is-clamped' : ''}`} dangerouslySetInnerHTML={{ __html: decodeHTML(bio) }} />
                        ) : (
                          <p className={`pdp-author-bio${longBio && !showFullBio ? ' is-clamped' : ''}`}>{bio}</p>
                        )}
                        {longBio && (
                          <button type="button" className="pdp-more" onClick={() => setShowFullBio(v => !v)}>
                            {showFullBio ? 'কম দেখুন' : 'আরও পড়ুন'}
                            <span style={{ display: 'inline-flex', transition: 'transform .3s cubic-bezier(.22,1,.36,1)', transform: showFullBio ? 'rotate(180deg)' : 'none' }}><IcChevDown color="currentColor" /></span>
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="pdp-author-bio pdp-muted">{authorName}-এর লেখা অন্যান্য বই শবাজে পাওয়া যাচ্ছে।</p>
                    )}
                    <Link href={authorHref} className="pdp-btn-sm pdp-author-cta">লেখকের সব বই দেখুন →</Link>
                  </div>
                </div>

                {authorBooks.length > 0 && (
                  <div className="pdp-author-books">
                    <div className="pdp-head">
                      <h3>{authorName}-এর আরও বই</h3>
                    </div>
                    <ProductRail label={`${authorName}-এর আরও বই`}>
                      {authorBooks.map(b => (
                        <HomeProductCard key={b._id} product={b} onAdd={(p) => addItem(p, 1)} />
                      ))}
                    </ProductRail>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ── Product showcase slider ── */}
        {showcaseImages.length > 0 && (
          <section className="pdp-section">
            <div className="pdp-wrap">
              <div className="pdp-head">
                <h2>আরও ভালো করে দেখুন</h2>
                <span className="pdp-muted">{showcaseImages.length} ছবি</span>
              </div>
              <div className="pd-showcase-viewport">
                <div className={showcaseImages.length > 2 ? 'pd-showcase-track is-moving' : 'pd-showcase-track'}>
                  {showcaseTrackImages.map((image, index) => {
                    const realIndex = index % showcaseImages.length;
                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        className="pd-showcase-item"
                        onClick={() => setShowcaseLightboxIndex(realIndex)}
                        aria-label={`${product.name} image ${realIndex + 1}`}
                      >
                        <img src={showcaseImgUrl(image)} alt={`${product.name} showcase ${realIndex + 1}`} loading="lazy" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Bought together ── */}
        {bundleProducts.length > 0 && (
          <section className="pdp-section">
            <div className="pdp-wrap">
              <div className="pdp-bundle">
                <div className="pdp-head">
                  <h2>{product.boughtTogetherTitle || 'একসাথে কিনুন'}</h2>
                  {bundleSavings > 0 && <span className="pdp-chip">৳{bundleSavings.toFixed(0)} সাশ্রয়</span>}
                </div>

                <div className="pdp-bundle-list">
                  <div className="pdp-bundle-item is-current">
                    <span className="pdp-check is-on" aria-hidden="true">✓</span>
                    <span className="pdp-bundle-thumb">
                      {product.images?.[0] ? <img src={imgUrl(product.images[0])!} alt="" /> : null}
                    </span>
                    <span className="pdp-bundle-text">
                      <b>{product.name}</b>
                      <small>এই বইটি</small>
                    </span>
                    <span className="pdp-bundle-price">৳{currentPrice}</span>
                  </div>

                  {bundleProducts.map((item) => {
                    const isSelected = selectedBundle.includes(item.product._id);
                    const itemPrice = getCurrentPrice(item.product);
                    const discountedItemPrice = Math.round(itemPrice * 0.9);
                    const itemAuthorName = getAuthorName(item.product.author);
                    return (
                      <button
                        key={item.product._id}
                        type="button"
                        className={`pdp-bundle-item${isSelected ? '' : ' is-off'}`}
                        onClick={() => handleToggleBundle(item.product._id)}
                        aria-pressed={isSelected}
                      >
                        <span className={`pdp-check${isSelected ? ' is-on' : ''}`} aria-hidden="true">{isSelected ? '✓' : ''}</span>
                        <span className="pdp-bundle-thumb">
                          {item.product.images?.[0] ? <img src={imgUrl(item.product.images[0])!} alt="" loading="lazy" /> : null}
                        </span>
                        <span className="pdp-bundle-text">
                          <b>{item.product.name}</b>
                          {itemAuthorName && <small>{itemAuthorName}</small>}
                        </span>
                        <span className="pdp-bundle-price">
                          ৳{discountedItemPrice}
                          <s>৳{itemPrice}</s>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pdp-bundle-foot">
                  <div>
                    <span className="pdp-muted">মোট ({selectedBundle.length + 1}টি বই)</span>
                    <b className="pdp-bundle-total">৳{bundleTotal.toFixed(0)}</b>
                  </div>
                  <button
                    type="button"
                    className="pdp-btn pdp-btn--solid"
                    onClick={handleAddBundleToCart}
                    disabled={selectedBundle.length === 0}
                  >
                    সব একসাথে কার্টে যোগ করুন
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Video review ── */}
        {youtubeId && (
          <section className="pdp-section">
            <div className="pdp-wrap">
              <div className="pdp-head"><h2>বুক রিভিউ</h2></div>
              <button type="button" className="pdp-video" onClick={() => setShowVideoModal(true)} aria-label={`${product.name} বুক রিভিউ ভিডিও চালান`}>
                <img src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} alt="" loading="lazy" />
                <span className="pdp-video-play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span className="pdp-video-caption">{product.name} — বুক রিভিউ{authorName ? ` · ${authorName}` : ''}</span>
              </button>
            </div>
          </section>
        )}

        {youtubeId && (
          <div className={`video-modal-bg${showVideoModal ? ' open' : ''}`} onClick={() => setShowVideoModal(false)}>
            <div className="video-modal" onClick={e => e.stopPropagation()}>
              <button className="video-modal-x" type="button" onClick={() => setShowVideoModal(false)} aria-label="বন্ধ করুন">×</button>
              {showVideoModal && (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Book Review"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <section className="pdp-section" id="reviews">
          <div className="pdp-wrap">
            <div className="pdp-head">
              <h2>রিভিউ{product.ratingCount ? ` (${product.ratingCount})` : ''}</h2>
              {isAuthenticated() && !showReviewForm && (
                <button type="button" className="pdp-btn-sm" onClick={() => setShowReviewForm(true)}>রিভিউ লিখুন</button>
              )}
            </div>

            <div className="pdp-reviews">
              {rating > 0 && (
                <div className="pdp-review-summary">
                  <div>
                    <b>{rating.toFixed(1)}</b>
                    <span className="pdp-stars">{'★'.repeat(Math.round(rating))}</span>
                    <small>{product.ratingCount || 0} টি রিভিউ</small>
                  </div>
                  <div className="pdp-bars">
                    {[5, 4, 3, 2, 1].map(s => {
                      const details: any = product.ratingDetails;
                      // API sends { oneStar, twoStar, … }; older data used [{ stars, count }].
                      const count = (Array.isArray(details)
                        ? details.find((r: any) => r.stars === s)?.count
                        : details?.[`${['one', 'two', 'three', 'four', 'five'][s - 1]}Star`]) || 0;
                      const total = product.ratingCount || 1;
                      const percent = (count / total) * 100;
                      return (
                        <div key={s} className="pdp-bar">
                          <span>{s}★</span>
                          <span className="pdp-bar-track"><span style={{ width: `${percent}%` }} /></span>
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pdp-review-list">
                {isAuthenticated() ? (
                  showReviewForm && (
                    <div className="pdp-review-form">
                      <h3>আপনার রিভিউ লিখুন</h3>
                      <div className="pdp-review-stars" role="radiogroup" aria-label="রেটিং">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} aria-label={`${star} স্টার`} aria-checked={newReview.rating === star} role="radio">
                            <FaStar style={{ color: star <= newReview.rating ? '#111' : '#d4d4d4' }} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newReview.review}
                        onChange={e => setNewReview({ ...newReview, review: e.target.value })}
                        placeholder="এই বইটি সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
                        rows={4}
                        aria-label="মন্তব্য"
                      />
                      <div className="pdp-review-actions">
                        <button type="button" className="pdp-btn pdp-btn--solid" onClick={handleSubmitReview} disabled={submittingReview}>
                          {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
                        </button>
                        <button type="button" className="pdp-btn pdp-btn--outline" onClick={() => { setShowReviewForm(false); setNewReview({ rating: 5, review: '' }); }}>
                          বাতিল
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="pdp-review-login">
                    <span>রিভিউ লিখতে লগইন করুন</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <Link href="/login" className="pdp-btn-sm is-solid">লগইন</Link>
                      <Link href="/register" className="pdp-btn-sm">নিবন্ধন</Link>
                    </span>
                  </div>
                )}

                {loadingReviews ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <article key={review._id} className="pdp-review">
                      <header>
                        <span className="pdp-review-avatar" aria-hidden="true">{review.user?.name?.[0]?.toUpperCase() || 'A'}</span>
                        <b>{review.user?.name || 'Anonymous'}</b>
                        <span className="pdp-stars">{'★'.repeat(review.rating)}</span>
                      </header>
                      <p>{review.review}</p>
                      {review.reply && (
                        <div className="pdp-review-reply">
                          <b>বিক্রেতার উত্তর:</b>
                          <p>{review.reply}</p>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="pdp-muted" style={{ padding: '8px 0' }}>এখনো কোনো রিভিউ নেই। প্রথম রিভিউ লিখুন!</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Recommendations (same card + rail as the homepage) ── */}
        {recommendations.length > 0 && (
          <section className="pdp-section pdp-section--last">
            <div className="pdp-wrap">
              <div className="pdp-head">
                <h2>সর্বাধিক বিক্রিত বই</h2>
                <Link href="/products" className="home-viewall">সব দেখুন →</Link>
              </div>
              <ProductRail label="সর্বাধিক বিক্রিত বই">
                {recommendations.map(b => (
                  <HomeProductCard key={b._id} product={b} onAdd={(p) => addItem(p, 1)} />
                ))}
              </ProductRail>
            </div>
          </section>
        )}
      </main>

      {/* PDF Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="pdp-reader" role="dialog" aria-modal="true" aria-label={`${product.name} — একটু পড়ে দেখুন`} onClick={() => setShowPreviewModal(false)}>
          <div className="pdp-reader-panel" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-reader-bar">
              <div className="pdp-reader-title">
                <span>একটু পড়ে দেখুন</span>
                <b>{product.name}</b>
              </div>
              <button type="button" className="pdp-btn-sm is-solid" onClick={() => { setShowPreviewModal(false); handleAddToCart(); }}>
                কার্টে যোগ করুন
              </button>
              <button type="button" className="pdp-reader-close" onClick={() => setShowPreviewModal(false)} aria-label="বন্ধ করুন">
                <FaTimes />
              </button>
            </div>
            <div className="pdp-reader-body">
              <PdfViewer file={previewUrl} />
            </div>
          </div>
        </div>
      )}

      {showcaseLightboxIndex !== null && showcaseImages[showcaseLightboxIndex] && (
        <div
          className="pd-showcase-modal"
          onClick={() => setShowcaseLightboxIndex(null)}
          onTouchStart={(event) => { showcaseTouchStartX.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => onShowcaseTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <button className="pd-showcase-close" type="button" onClick={() => setShowcaseLightboxIndex(null)} aria-label="Close image preview">×</button>
          {showcaseImages.length > 1 && (
            <button className="pd-showcase-nav prev" type="button" onClick={(event) => { event.stopPropagation(); moveShowcaseLightbox(-1); }} aria-label="Previous image">
              <IcChevL />
            </button>
          )}
          <div className="pd-showcase-frame" onClick={(event) => event.stopPropagation()}>
            <img src={showcaseImgUrl(showcaseImages[showcaseLightboxIndex])} alt={`${product.name} large preview`} />
            <div className="pd-showcase-count">{showcaseLightboxIndex + 1} / {showcaseImages.length}</div>
          </div>
          {showcaseImages.length > 1 && (
            <button className="pd-showcase-nav next" type="button" onClick={(event) => { event.stopPropagation(); moveShowcaseLightbox(1); }} aria-label="Next image">
              <IcChevR />
            </button>
          )}
        </div>
      )}

      {/* Mobile sticky buy bar — same handlers as the main buttons */}
      <div className={`pd-sticky-buy${showStickyBuy ? ' is-visible' : ''}`} aria-hidden={!showStickyBuy}>
        <div className="pd-sticky-info">
          {images[0] && <img src={imgUrl(images[0])!} alt="" />}
          <div style={{ minWidth: 0 }}>
            <div className="pd-sticky-name">{product.name}</div>
            <div className="pd-sticky-price">
              ৳{currentPrice}
              {discountPercent > 0 && <s>৳{originalPrice}</s>}
            </div>
          </div>
        </div>
        <button type="button" className="pd-sticky-btn cart" onClick={handleAddToCart} tabIndex={showStickyBuy ? 0 : -1} aria-label="কার্টে যোগ করুন">
          <IcCart size={18} color="currentColor" />
        </button>
        <button type="button" className="pd-sticky-btn buy" onClick={handleBuyNow} tabIndex={showStickyBuy ? 0 : -1}>
          এখনই অর্ডার
        </button>
      </div>

      <Footer />
    </div>
  );
}
