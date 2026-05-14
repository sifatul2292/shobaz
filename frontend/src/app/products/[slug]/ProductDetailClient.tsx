'use client';

import { useState, useEffect, useRef } from 'react';
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
import { HiOutlineBookOpen } from 'react-icons/hi';
import { FaTimes, FaStar } from 'react-icons/fa';

const PdfViewer = dynamic(() => import('@/components/common/PdfViewer'), { ssr: false });

interface BundleItem {
  product: Product;
  discount: number;
}

interface Props {
  params: Promise<{ slug: string }>;
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
  const bestsellerScrollRef = useRef<HTMLDivElement>(null);

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
        capiViewContent(productData);

        if (relatedRes.data?.data) {
          let allProducts = relatedRes.data.data;
          if (allProducts.items) allProducts = allProducts.items;
          if (!Array.isArray(allProducts)) allProducts = [];

          const filtered = allProducts.filter((p: Product) => p._id !== productData._id);
          setRelatedProducts(filtered.slice(0, 10));

          const sortedByRating = [...filtered].sort((a: Product, b: Product) => (b.ratingAvr || 0) - (a.ratingAvr || 0));
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

  if (loading) {
    return (
      <div style={{ background: PARCHMENT, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', padding: '24px 24px 80px', width: '100%' }}>
          <div style={{ height: 14, width: 240, background: '#e5e7eb', borderRadius: 4, marginBottom: 24 }} />
          <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28% minmax(0,44%) 28%', gap: 32 }}>
              <div style={{ aspectRatio: '2/3', background: '#f1f5f9', borderRadius: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[80, 320, 200, 60, '100%', '100%', '100%'].map((w, i) => (
                  <div key={i} style={{ height: i === 1 ? 52 : i > 3 ? 52 : 18, width: typeof w === 'number' ? w : w, background: '#f1f5f9', borderRadius: 6 }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ height: 160, background: '#f1f5f9', borderRadius: 12 }} />
                <div style={{ height: 240, background: '#f1f5f9', borderRadius: 12 }} />
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
      <div style={{ background: PARCHMENT, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <HiOutlineBookOpen style={{ width: 48, height: 48, color: '#9ca3af', margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: 22, marginBottom: 12 }}>পণ্য পাওয়া যায়নি</h2>
            <Link href="/products" style={{ color: PRIMARY, fontWeight: 600 }}>সকল বই দেখুন →</Link>
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

  const sideRelated = relatedProducts.slice(0, 6);

  return (
    <div style={{ background: PARCHMENT, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Hind Siliguri', 'Inter', system-ui, sans-serif", color: '#0f172a' }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Breadcrumb */}
        <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 24px 6px' }}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            {[
              { label: 'হোম', href: '/' },
              { label: 'বই', href: '/products' },
              ...(categoryName ? [{ label: categoryName, href: `/products?category=${categorySlug}` }] : []),
              { label: product.name, href: '#' },
            ].map((item, i, arr) => {
              const last = i === arr.length - 1;
              return (
                <span key={i}>
                  <Link href={item.href} style={{ color: last ? PRIMARY : '#9ca3af', textDecoration: 'none', fontWeight: last ? 700 : 500 }}>
                    {item.label}
                  </Link>
                  {!last && <span style={{ margin: '0 8px', color: '#cbd5e1' }}>›</span>}
                </span>
              );
            })}
          </div>
        </nav>

        {/* ── Main 3-col card ── */}
        <section style={{ maxWidth: 1280, margin: '8px auto 0', padding: '0 24px' }}>
          <div className="pd-main-card">
            {/* LEFT: Cover */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'stretch' }}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '24px 8px 28px' }}>
                <div style={{ position: 'relative', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.20))', maxWidth: 260 }}>
                  {images[activeImage] ? (
                    <img
                      src={imgUrl(images[activeImage])!}
                      alt={product.name}
                      style={{ width: 250, height: 350, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                    />
                  ) : (
                    <div className={`cv ${cvClass(product._id)}`} style={{ width: 250, height: 350, borderRadius: 8 }}>
                      <div className="a">{authorName || 'AUTHOR'}</div>
                      <div className="t">{product.name}</div>
                      <div className="frame" />
                      <div className="num">S</div>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: '#dc2626', color: 'white', fontWeight: 800, fontSize: 12,
                      padding: '4px 10px', borderRadius: 8
                    }}>−{discountPercent}% ছাড়</div>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {images.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      style={{
                        aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                        border: idx === activeImage ? `2px solid ${PRIMARY}` : '1px solid #e5e7eb',
                        background: 'transparent', padding: 0
                      }}
                    >
                      <img src={imgUrl(img)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}

              {previewUrl && (
                <button
                  onClick={() => setShowPreviewModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'center',
                    color: PRIMARY, fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none',
                    textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <IcEye /> একটু পড়ে দেখুন
                </button>
              )}

              {/* Trust badges */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8
              }}>
                {[
                  { Icon: IcRefresh, label: 'ফ্রি রিটার্ন' },
                  { Icon: IcShield, label: 'নিরাপদ পেমেন্ট' },
                  { Icon: IcBookCheck, label: 'অরিজিনাল বই' },
                ].map(({ Icon, label }, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                    <Icon />
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER: Product info */}
            <div style={{ padding: '4px 4px' }}>
              {/* Category pill */}
              {categoryName && (
                <Link href={`/products?category=${categorySlug}`} style={{ textDecoration: 'none' }}>
                  <span style={{
                    display: 'inline-block', background: '#dcfce7', color: PRIMARY,
                    padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600
                  }}>{categoryName}</span>
                </Link>
              )}

              <h1 style={{
                fontSize: 30, fontWeight: 800, color: '#0f172a', margin: '12px 0 12px',
                lineHeight: 1.3, letterSpacing: '-0.005em'
              }}>{product.name}</h1>

              {rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ color: '#f59e0b', fontSize: 16, letterSpacing: 1 }}>{starStr(rating)}</span>
                  <strong style={{ fontSize: 14 }}>{rating.toFixed(1)}</strong>
                  <span style={{ color: '#9ca3af', fontSize: 13.5 }}>({product.ratingCount || 0} টি রিভিউ)</span>
                </div>
              )}

              {/* Meta grid */}
              <div style={{ display: 'grid', rowGap: 8 }}>
                {authorName && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
                    <span style={tinyLabel}>লেখক</span>
                    <span>
                      <Link href={authorSlug ? `/products?author=${encodeURIComponent(authorName)}` : '#'} style={{ color: PRIMARY, textDecoration: 'underline', textUnderlineOffset: 2, fontWeight: 600, fontSize: 14 }}>
                        {authorName}
                      </Link>
                    </span>
                  </div>
                )}
                {publisherName && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
                    <span style={tinyLabel}>প্রকাশনা</span>
                    <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 500 }}>{publisherName}</span>
                  </div>
                )}
                {product.weight && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
                    <span style={tinyLabel}>ওজন</span>
                    <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 500 }}>{product.weight}g</span>
                  </div>
                )}
              </div>

              <hr style={dividerStyle} />

              {/* Pricing */}
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 14, rowGap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: "'Inter', 'Hind Siliguri', sans-serif" }}>
                  ৳{currentPrice}
                </span>
                {discountPercent > 0 && (
                  <>
                    <span style={{ fontSize: 18, color: '#9ca3af', textDecoration: 'line-through' }}>৳{originalPrice}</span>
                    <span style={{
                      background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                      borderRadius: 999, padding: '2px 12px', fontSize: 13, fontWeight: 700
                    }}>−{discountPercent}% ছাড়</span>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p style={{ margin: '8px 0 16px', color: PRIMARY, fontSize: 13, fontStyle: 'italic', fontWeight: 600 }}>
                  আপনি বাঁচাচ্ছেন ৳{savings}
                </p>
              )}

              {/* Stock */}
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: inStock ? '#f0fdf4' : '#fef2f2',
                  color: inStock ? PRIMARY : '#dc2626',
                  border: `1px solid ${inStock ? '#86efac' : '#fecaca'}`,
                  padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: inStock ? PRIMARY : '#dc2626', display: 'inline-block' }}/>
                  {inStock ? 'স্টক আছে' : 'স্টক শেষ'}
                </span>
              </div>

              <hr style={dividerStyle} />

              {/* Description */}
              {(product.description || product.shortDescription) && (
                <>
                  <div style={{
                    color: '#374151', lineHeight: 1.85, fontSize: 15,
                    display: showFullDescription ? 'block' : '-webkit-box',
                    WebkitLineClamp: showFullDescription ? 'none' : 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                    dangerouslySetInnerHTML={{ __html: product.description || product.shortDescription || '' }}
                  />
                  <button onClick={() => setShowFullDescription(e => !e)} style={{
                    background: 'transparent', border: 'none', color: PRIMARY, padding: '10px 0 0',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    {showFullDescription ? 'কম দেখুন' : 'আরও দেখুন'} <IcChevDown />
                  </button>
                  <hr style={dividerStyle} />
                </>
              )}

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                <span style={tinyLabel}>পরিমাণ</span>
                <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IcMinus />
                  </button>
                  <div style={{ width: 56, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#0f172a', background: 'white' }}>
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IcPlus />
                  </button>
                </div>
                {product.totalPages && (
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>{product.totalPages} পৃষ্ঠা{product.edition ? ` · ${product.edition}` : ''}</span>
                )}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CTAButton
                  onClick={handleAddToCart}
                  style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', boxShadow: '0 4px 16px rgba(234,88,12,0.35)' }}
                  hoverShadow="0 10px 24px rgba(234,88,12,0.45)"
                >
                  <IcCart /><span>কার্টে যোগ করুন</span>
                </CTAButton>
                <CTAButton
                  onClick={handleBuyNow}
                  style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white', boxShadow: '0 4px 16px rgba(21,128,61,0.30)' }}
                  hoverShadow="0 10px 24px rgba(21,128,61,0.4)"
                >
                  <IcBolt /><span>এখনই অর্ডার করুন</span>
                </CTAButton>
                <a
                  href={`https://wa.me/8801893058682?text=${encodeURIComponent(`আমি এই বইটি অর্ডার করতে চাই: ${product?.name}\nলিংক: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: '#ffffff', color: '#128C7E', border: '2px solid #25D366',
                    borderRadius: 14, height: 56, fontSize: 16, fontWeight: 700,
                    textDecoration: 'none', fontFamily: 'inherit',
                    transition: 'background .2s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                >
                  <IcWhatsApp /><span>WhatsApp-এ অর্ডার করুন</span>
                </a>
              </div>
            </div>

            {/* RIGHT: Delivery + Related */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Delivery card */}
              <div style={sideCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                  <IcTruck />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>ডেলিভারির তথ্য</h3>
                </div>
                {[
                  { label: 'ঢাকার ভেতরে', value: `৳${shippingCharge?.deliveryInDhaka || 60}`, muted: false },
                  { label: 'ঢাকার বাইরে', value: `৳${shippingCharge?.deliveryOutsideDhaka || 120}`, muted: false },
                  { label: 'আন্তর্জাতিক', value: 'N/A', muted: true },
                ].map(({ label, value, muted }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14
                  }}>
                    <span style={{ color: muted ? '#9ca3af' : '#374151' }}>{label}</span>
                    <span style={{ color: muted ? '#9ca3af' : '#0f172a', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: 12, marginInline: -20, marginBottom: -20,
                  background: '#f8fafc', padding: '10px 20px', borderRadius: '0 0 20px 20px',
                  display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 12
                }}>
                  <IcClock /> ১–৪ কার্যদিবসে ডেলিভারি
                </div>
              </div>

              {/* Related books */}
              {sideRelated.length > 0 && (
                <div style={sideCardStyle}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>সম্পর্কিত বই</h3>
                  <div>
                    {sideRelated.map((b, i) => {
                      const bPrice = getCurrentPrice(b);
                      return (
                        <div key={b._id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 0',
                          borderBottom: i < sideRelated.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <Link href={`/products/${b.slug}`} style={{ width: 52, height: 68, flexShrink: 0, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'block' }}>
                            {b.images?.[0] ? (
                              <img src={imgUrl(b.images[0])!} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div className={`cv ${cvClass(b._id)}`} style={{ width: '100%', height: '100%' }}>
                                <div className="t" style={{ fontSize: 9 }}>{b.name}</div>
                              </div>
                            )}
                          </Link>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link href={`/products/${b.slug}`} style={{ textDecoration: 'none' }}>
                              <div style={{
                                fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.35,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                              }}>{b.name}</div>
                            </Link>
                            <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, marginTop: 2 }}>৳{bPrice}</div>
                          </div>
                          <button onClick={() => { addItem(b, 1); toast.success('কার্টে যোগ হয়েছে'); }} style={{
                            background: ORANGE, color: 'white', border: 'none', borderRadius: 999,
                            padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit', letterSpacing: 0.4, flexShrink: 0
                          }}>+ ADD</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Bundle section ── */}
        {bundleProducts.length > 0 && (
          <section style={{ maxWidth: 1280, margin: '32px auto 0', padding: '0 24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fefce8, #fff7ed)',
              border: '1.5px solid #fed7aa', borderRadius: 20, padding: 24,
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>📚 একসাথে কিনুন</h3>
                {bundleSavings > 0 && (
                  <span style={{ background: '#dcfce7', color: PRIMARY, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>
                    ৳{bundleSavings.toFixed(0)} সাশ্রয়
                  </span>
                )}
              </div>

              <div className="pd-bundle-row">
                {/* Current book */}
                <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #fde68a', display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 8, right: 8, background: PRIMARY, color: 'white', width: 20, height: 20, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>✓</span>
                  <div style={{ width: 60, height: 86, flexShrink: 0, borderRadius: 6, overflow: 'hidden', boxShadow: '0 6px 14px rgba(15,23,42,0.18)' }}>
                    {product.images?.[0] ? (
                      <img src={imgUrl(product.images[0])!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className={`cv ${cvClass(product._id)}`} style={{ width: '100%', height: '100%' }}>
                        <div className="t" style={{ fontSize: 10 }}>{product.name}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{authorName}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>৳{currentPrice}</div>
                  </div>
                </div>

                {bundleProducts.map((item) => {
                  const isSelected = selectedBundle.includes(item.product._id);
                  const itemPrice = getCurrentPrice(item.product);
                  const discountedItemPrice = Math.round(itemPrice * 0.9);
                  const itemAuthorName = getAuthorName(item.product.author);
                  return (
                    <div key={item.product._id} style={{ display: 'contents' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#d97706', fontWeight: 900 }}>+</div>
                      <div
                        onClick={() => handleToggleBundle(item.product._id)}
                        style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #fde68a', display: 'flex', gap: 14, alignItems: 'center', position: 'relative', cursor: 'pointer', opacity: isSelected ? 1 : 0.55, transition: 'opacity .2s' }}
                      >
                        <span style={{ position: 'absolute', top: 8, right: 8, background: isSelected ? PRIMARY : '#e5e7eb', color: 'white', width: 20, height: 20, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{isSelected ? '✓' : ''}</span>
                        <div style={{ width: 60, height: 86, flexShrink: 0, borderRadius: 6, overflow: 'hidden', boxShadow: '0 6px 14px rgba(15,23,42,0.18)' }}>
                          {item.product.images?.[0] ? (
                            <img src={imgUrl(item.product.images[0])!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className={`cv ${cvClass(item.product._id)}`} style={{ width: '100%', height: '100%' }}>
                              <div className="t" style={{ fontSize: 10 }}>{item.product.name}</div>
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.product.name}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{itemAuthorName}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>৳{discountedItemPrice} <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', fontWeight: 400 }}>৳{itemPrice}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#d97706', fontWeight: 900 }}>=</div>
                <div style={{ background: 'white', border: '1.5px solid #fcd34d', borderRadius: 14, padding: '16px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ ...tinyLabel, color: '#9ca3af' }}>মোট</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#d97706', lineHeight: 1.1, marginTop: 4 }}>৳{bundleTotal.toFixed(0)}</div>
                  {bundleSavings > 0 && <div style={{ fontSize: 12.5, color: PRIMARY, marginTop: 4, fontWeight: 700 }}>সাশ্রয় ৳{bundleSavings.toFixed(0)}</div>}
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{selectedBundle.length + 1}টি বই</div>
                </div>
              </div>

              <button
                onClick={handleAddBundleToCart}
                disabled={selectedBundle.length === 0}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(234,88,12,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(234,88,12,0.35)'; }}
                style={{
                  width: '100%', marginTop: 20,
                  background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white',
                  border: 'none', borderRadius: 14, height: 52, fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 16px rgba(234,88,12,0.35)',
                  transition: 'transform .15s ease, box-shadow .2s ease',
                  opacity: selectedBundle.length === 0 ? 0.6 : 1
                }}
              >
                <IcCart /> সব একসাথে কার্টে যোগ করুন
              </button>
            </div>
          </section>
        )}

        {/* ── Tabs ── */}
        <section style={{ maxWidth: 1280, margin: '32px auto 0', padding: '0 24px' }}>
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '12px 12px 0', gap: 4, overflowX: 'auto' }}>
              {[
                { id: 'description', label: 'বিবরণ' },
                { id: 'specifications', label: 'স্পেসিফিকেশন' },
                { id: 'author', label: 'লেখক' },
                { id: 'reviews', label: `রিভিউ${product.ratingCount ? ` (${product.ratingCount})` : ''}` },
              ].map(t => {
                const active = activeTab === t.id;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                    padding: '12px 18px', background: active ? '#f0fdf4' : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    fontSize: 15, whiteSpace: 'nowrap', color: active ? PRIMARY : '#9ca3af',
                    borderRadius: '10px 10px 0 0',
                    borderBottom: active ? `3px solid ${PRIMARY}` : '3px solid transparent',
                    marginBottom: -1, transition: 'all .2s ease'
                  }}>{t.label}</button>
                );
              })}
            </div>

            <div style={{ padding: 28 }}>
              {activeTab === 'description' && (
                product.description ? (
                  <div style={{ color: '#374151', fontSize: 15, lineHeight: 1.9, maxWidth: 880 }} dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : product.shortDescription ? (
                  <div style={{ color: '#374151', fontSize: 15, lineHeight: 1.9, maxWidth: 880 }}>
                    <p>{product.shortDescription.replace(/<[^>]*>/g, '')}</p>
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontFamily: 'var(--bn)' }}>বিবরণ পাওয়া যায়নি।</p>
                )
              )}

              {activeTab === 'specifications' && (
                <table style={{ width: '100%', maxWidth: 720, borderCollapse: 'collapse', fontSize: 15 }}>
                  <tbody>
                    {[
                      ['শিরোনাম', product.name],
                      authorName ? ['লেখক', authorName] : null,
                      publisherName ? ['প্রকাশনী', publisherName] : null,
                      product.edition ? ['সংস্করণ', product.edition] : null,
                      product.totalPages ? ['পৃষ্ঠা সংখ্যা', String(product.totalPages)] : null,
                      product.country ? ['দেশ', product.country] : null,
                      product.language ? ['ভাষা', product.language] : null,
                      product.weight ? ['ওজন', `${product.weight}g`] : null,
                    ].filter(Boolean).map(([k, v], i) => (
                      <tr key={k as string} style={{ background: i % 2 ? '#f9fafb' : 'transparent' }}>
                        <td style={{ padding: '14px 18px', color: '#6b7280', width: 200, fontWeight: 600 }}>{k}</td>
                        <td style={{ padding: '14px 18px', color: '#0f172a', fontWeight: 600 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'author' && authorName && (
                <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', maxWidth: 820 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%', background: '#dcfce7', color: '#15803d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 800, flexShrink: 0
                  }}>{authorName[0]}</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{authorName}</h4>
                    <p style={{ margin: '0 0 16px', color: '#374151', fontSize: 15, lineHeight: 1.85 }}>
                      লেখকের অন্যান্য বই সমূহ দেখতে নিচের লিঙ্কে যান।
                    </p>
                    <Link href={`/products?author=${encodeURIComponent(authorName)}`} style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                      লেখকের সব বই দেখুন →
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 820 }}>
                  {rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 18, background: '#f9fafb', borderRadius: 14, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{rating.toFixed(1)}</div>
                        <div style={{ color: '#f59e0b', fontSize: 16, marginTop: 4 }}>{'★'.repeat(Math.round(rating))}</div>
                        <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 4 }}>{product.ratingCount || 0} টি রিভিউ</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
                        {[5, 4, 3, 2, 1].map(s => {
                          const count = product.ratingDetails?.find((r: any) => r.stars === s)?.count || 0;
                          const total = product.ratingCount || 1;
                          const percent = (count / total) * 100;
                          return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                              <span style={{ width: 32, color: '#9ca3af' }}>{s}★</span>
                              <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', background: PRIMARY }} />
                              </div>
                              <span style={{ width: 36, color: '#9ca3af', textAlign: 'right' }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isAuthenticated() ? (
                    !showReviewForm ? (
                      <button onClick={() => setShowReviewForm(true)} style={{
                        alignSelf: 'flex-start', background: 'white', border: `1px solid ${PRIMARY}`,
                        color: PRIMARY, borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}>রিভিউ লিখুন</button>
                    ) : (
                      <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h4 style={{ fontFamily: 'var(--bn)', fontWeight: 600, fontSize: 18, margin: 0 }}>আপনার রিভিউ লিখুন</h4>
                        <div>
                          <div style={{ ...tinyLabel, marginBottom: 8 }}>রেটিং</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 24 }}>
                                <FaStar style={{ color: star <= newReview.rating ? '#f59e0b' : '#e5e7eb' }} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ ...tinyLabel, marginBottom: 8 }}>মন্তব্য</div>
                          <textarea
                            value={newReview.review}
                            onChange={e => setNewReview({ ...newReview, review: e.target.value })}
                            placeholder="এই বইটি সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
                            rows={4}
                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', color: '#0f172a', fontFamily: 'var(--bn)', fontSize: 15, lineHeight: 1.6, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={handleSubmitReview} disabled={submittingReview} style={{ background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
                          </button>
                          <button onClick={() => { setShowReviewForm(false); setNewReview({ rating: 5, review: '' }); }} style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            বাতিল
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={{ padding: 24, background: '#f9fafb', borderRadius: 16, textAlign: 'center' }}>
                      <p style={{ color: '#374151', marginBottom: 16, fontFamily: 'var(--bn)' }}>রিভিউ লিখতে লগইন করুন</p>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                        <Link href="/login" style={{ background: PRIMARY, color: 'white', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>লগইন</Link>
                        <Link href="/register" style={{ background: 'white', border: `1px solid ${PRIMARY}`, color: PRIMARY, borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>নিবন্ধন</Link>
                      </div>
                    </div>
                  )}

                  {loadingReviews ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ height: 90, background: '#f1f5f9', borderRadius: 12 }} />)}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div>
                      {reviews.map((review, i) => (
                        <div key={review._id} style={{ padding: '18px 0', borderBottom: i < reviews.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 999, background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {review.user?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>{review.user?.name || 'Anonymous'}</div>
                            </div>
                            <span style={{ color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(review.rating)}</span>
                          </div>
                          <p style={{ margin: '0 0 0 48px', color: '#374151', fontSize: 14.5, lineHeight: 1.75 }}>{review.review}</p>
                          {review.reply && (
                            <div style={{ marginTop: 10, marginLeft: 48, padding: '10px 14px', borderLeft: `2px solid ${PRIMARY}`, background: '#f0fdf4', borderRadius: '0 8px 8px 0' }}>
                              <h4 style={{ margin: '0 0 4px', fontSize: 13, color: '#15803d', fontWeight: 700 }}>বিক্রেতার উত্তর:</h4>
                              <p style={{ margin: 0, color: '#374151', fontSize: 13.5 }}>{review.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontFamily: 'var(--bn)' }}>
                      এখনো কোনো রিভিউ নেই। প্রথম রিভিউ লিখুন!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Video section ── */}
        {youtubeId && (
          <section style={{ maxWidth: 1280, margin: '32px auto 0', padding: '0 24px' }}>
            <div className="video-section">
              <div className="video-player" onClick={() => setShowVideoModal(true)}>
                <div className="video-thumb-meta">
                  <span>বুক রিভিউ</span>
                  <span className="live">▶ PLAY</span>
                </div>
                <button className="play-btn" type="button">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div className="video-thumb-bottom">
                  <div className="vt">{product.name} — বুক রিভিউ</div>
                  <div className="vd">YouTube · {authorName}</div>
                </div>
              </div>
              <div className="video-side">
                <div>
                  <div className="sub">BOOK REVIEW · ভিডিও রিভিউ</div>
                  <h3><span className="bn">{product.name} নিয়ে আলোচনা</span></h3>
                  <p>এই বইটির বিস্তারিত রিভিউ দেখুন।</p>
                </div>
                <div>
                  <div className="video-reviewer">
                    <div className="video-reviewer-av">{authorName?.[0] || 'A'}</div>
                    <div>
                      <div className="video-reviewer-name">বুক রিভিউ</div>
                      <div className="video-reviewer-meta">Shobaz Editorial · বাংলাদেশ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {youtubeId && (
          <div className={`video-modal-bg${showVideoModal ? ' open' : ''}`} onClick={() => setShowVideoModal(false)}>
            <div className="video-modal" onClick={e => e.stopPropagation()}>
              <button className="video-modal-x" type="button" onClick={() => setShowVideoModal(false)}>×</button>
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

        {/* ── Bestsellers carousel ── */}
        {bestSellers.length > 0 && (
          <section style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <IcFlame /> সর্বাধিক বিক্রিত বই
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {[IcChevL, IcChevR].map((Ic, dir) => (
                  <button key={dir} onClick={() => bestsellerScrollRef.current?.scrollBy({ left: dir === 0 ? -320 : 320, behavior: 'smooth' })} style={{
                    width: 40, height: 40, borderRadius: 999, background: 'white',
                    border: '1.5px solid #e2e8f0', cursor: 'pointer', color: '#374151',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Ic />
                  </button>
                ))}
              </div>
            </div>
            <div ref={bestsellerScrollRef} style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', scrollbarWidth: 'thin' }}>
              {bestSellers.map(b => {
                const bPrice = getCurrentPrice(b);
                const bOriginal = getOriginalPrice(b);
                const bDisc = getDiscountPercent(b);
                const bAuthor = getAuthorName(b.author);
                return (
                  <div
                    key={b._id}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 30px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
                    style={{ flex: '0 0 220px', scrollSnapAlign: 'start', background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', transition: 'transform .2s ease, box-shadow .2s ease' }}
                  >
                    <Link href={`/products/${b.slug}`} style={{ display: 'block', position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#f8fafc', marginBottom: 12, textDecoration: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
                        {b.images?.[0] ? (
                          <img src={imgUrl(b.images[0])!} alt={b.name} style={{ width: 120, height: 170, objectFit: 'cover', borderRadius: 6, boxShadow: '0 12px 18px rgba(15,23,42,0.18)' }} />
                        ) : (
                          <div className={`cv ${cvClass(b._id)}`} style={{ width: 120, height: 170, borderRadius: 6 }}>
                            <div className="a">{bAuthor?.split(' ')[0] || ''}</div>
                            <div className="t">{b.name}</div>
                            <div className="frame" />
                          </div>
                        )}
                      </div>
                      {bDisc > 0 && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: '#dc2626', color: 'white', fontWeight: 800, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>−{bDisc}%</div>
                      )}
                    </Link>
                    <Link href={`/products/${b.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>{b.name}</div>
                    </Link>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{bAuthor}</div>
                    {b.ratingAvr && (
                      <div style={{ marginTop: 4, color: '#f59e0b', fontSize: 11 }}>{'★'.repeat(Math.round(b.ratingAvr))} <span style={{ color: '#9ca3af' }}>({b.ratingCount || 0})</span></div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: PRIMARY }}> ৳{bPrice}</span>
                      {bDisc > 0 && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>৳{bOriginal}</span>}
                    </div>
                    <button
                      onClick={() => { addItem(b, 1); toast.success('কার্টে যোগ হয়েছে'); }}
                      style={{ marginTop: 12, width: '100%', height: 40, background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <IcCart size={16} /> কার্টে যোগ করুন
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* PDF Preview Modal */}
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
