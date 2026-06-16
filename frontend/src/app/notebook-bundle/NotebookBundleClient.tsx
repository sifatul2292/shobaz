'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProductCard from '@/components/common/ProductCard';
import FreeNotebookPicker from '@/components/common/FreeNotebookPicker';
import {
  FREE_NOTEBOOK_SLUGS,
  hasNotebookTag,
  isFreeNotebookEligible,
  getPaidNotebookQty,
  getPaidSubtotal,
  remainingForThreshold,
} from '@/lib/notebookOffer';

declare global {
  interface Window {
    fbq?: (event: string, name: string, params?: Record<string, unknown>) => void;
  }
}

const NOTEBOOK_TAG = 'notebook';
const NOTEBOOK_COLLECTION_SIZE = 3;

const NOTEBOOK_COLORS = [
  { color: '#74ACDF', dark: true },
  { color: '#3D7CC9', dark: false },
  { color: '#009C3B', dark: false },
  { color: '#1B2A4A', dark: false },
  { color: '#0D1B3E', dark: false },
];

const ARGENTINA_SLUGS = ['for-every-heart-81', 'messi-s-glory-15', 'blueandwhite'];
const BRAZIL_SLUGS = ['hexa-loading-46', 'we-never-stopped-dreaming-74', 'generations-of-greatness-15'];
const ARGENTINA_ORDER = ['for every heart', 'messi', 'blue white', 'blue & white'];
const BRAZIL_ORDER = ['hexa', 'we never stopped', 'generations'];

const REAL_NOTEBOOK_PHOTOS = [
  { src: '/images/notebook-bundle/offer-gallery/notebook-set-01.webp', alt: 'Three published Shobaz football notebooks together' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-video-01.webp', alt: 'Argentina and Brazil notebooks close up' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-video-02.webp', alt: 'Hexa Loading notebook close up' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-video-03.webp', alt: 'Blue and White Forever notebook stack' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-balcony-01.webp', alt: 'Blue and White Forever notebook held outside' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-pages-01.webp', alt: 'Notebook off-white pages and rounded corners' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-balcony-02.webp', alt: 'Argentina notebook held outside' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-balcony-03.webp', alt: 'Hexa Loading notebook held outside' },
  { src: '/images/notebook-bundle/offer-gallery/notebook-detail-01.webp', alt: 'Rounded corner notebook detail' },
];

const HERO_NOTEBOOK_PHOTOS = [
  '/images/notebook-bundle/offer-gallery/notebook-balcony-02.webp',
  '/images/notebook-bundle/offer-gallery/notebook-balcony-03.webp',
  '/images/notebook-bundle/offer-gallery/notebook-balcony-01.webp',
];

const FALLBACK_NOTEBOOK_PRODUCTS = [
  {
    _id: 'campaign-notebook-argentina-heart',
    name: 'Argentina - For Every Heart',
    slug: 'for-every-heart-81',
    images: ['/images/notebook-bundle/offer-gallery/notebook-balcony-02.webp'],
    price: 400,
    salePrice: 400,
    discountAmount: 240,
    stock: 24,
    status: 'publish',
    tags: [{ name: NOTEBOOK_TAG, slug: NOTEBOOK_TAG }],
  },
  {
    _id: 'campaign-notebook-hexa-loading',
    name: 'Brazil - Hexa Loading',
    slug: 'hexa-loading-46',
    images: ['/images/notebook-bundle/offer-gallery/notebook-balcony-03.webp'],
    price: 400,
    salePrice: 400,
    discountAmount: 240,
    stock: 26,
    status: 'publish',
    tags: [{ name: NOTEBOOK_TAG, slug: NOTEBOOK_TAG }],
  },
  {
    _id: 'campaign-notebook-blue-white',
    name: 'Argentina - Blue & White Forever',
    slug: 'blueandwhite',
    images: ['/images/notebook-bundle/offer-gallery/notebook-balcony-01.webp'],
    price: 400,
    salePrice: 400,
    discountAmount: 240,
    stock: 21,
    status: 'publish',
    tags: [{ name: NOTEBOOK_TAG, slug: NOTEBOOK_TAG }],
  },
] as unknown as Product[];

function normalizeProducts(payload: any): Product[] {
  const data = payload?.data?.data;
  const productsData = Array.isArray(data) ? data : data?.items;
  return Array.isArray(productsData) ? productsData : [];
}

function isSlugMatch(product: Product, slugs: string[]): boolean {
  const slug = product.slug?.toLowerCase();
  return Boolean(slug && slugs.some((s) => s.toLowerCase() === slug));
}

function getSearchText(product: Product): string {
  return `${product.name ?? ''} ${product.slug ?? ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getProductRank(product: Product, patterns: string[]): number {
  const text = getSearchText(product);
  const rank = patterns.findIndex((pattern) => text.includes(pattern.replace(/[^a-z0-9]+/g, ' ').trim()));
  return rank === -1 ? patterns.length : rank;
}

function sortProductsByOrder(products: Product[], patterns: string[]): Product[] {
  return [...products].sort((a, b) => getProductRank(a, patterns) - getProductRank(b, patterns));
}

function isArgentinaProduct(product: Product): boolean {
  const text = getSearchText(product);
  return text.includes('argentina') || isSlugMatch(product, ARGENTINA_SLUGS);
}

function isBrazilProduct(product: Product): boolean {
  const text = getSearchText(product);
  return text.includes('brazil') || isSlugMatch(product, BRAZIL_SLUGS);
}

function splitNotebookProducts(products: Product[]) {
  return {
    argentinaProducts: sortProductsByOrder(products.filter(isArgentinaProduct), ARGENTINA_ORDER),
    brazilProducts: sortProductsByOrder(products.filter(isBrazilProduct), BRAZIL_ORDER),
  };
}

function getProductPrice(p: Product): { price: number; original: number; discountPct: number } {
  const original = p.salePrice || p.price || 0;
  const discount = p.discountAmount || 0;
  const price = original - discount;
  const pct = original > 0 ? Math.round((discount / original) * 100) : 0;
  return { price, original, discountPct: pct };
}

const FAQS = [
  { q: 'ফ্রি নোটবুক কীভাবে পাবো?', a: '২টি নোটবুক একসাথে কিনলে অথবা ৫০০ টাকার উপরে যেকোনো অর্ডার করলে — কার্টে গিয়ে যেকোনো একটি নোটবুক ফ্রি বেছে নিতে পারবেন। প্রতি অর্ডারে ১টি নোটবুক ফ্রি।' },
  { q: 'ডেলিভারি কতদিনে পাবো?', a: 'অর্ডার কনফার্ম হবার পর ঢাকায় ২-৩ কর্মদিবস, ঢাকার বাইরে ৩-৫ কর্মদিবসের মধ্যে পেয়ে যাবেন। অগ্রিম পেমেন্ট ছাড়াই সারা দেশে ক্যাশ অন ডেলিভারি।' },
  { q: 'নোটবুকের কাগজ কেমন?', a: '৮০ GSM অফসেট অফ-হোয়াইট পেপার — হাতে লিখতে আরামদায়ক, কালি ব্লিড করে না। সুন্দর Rounded Corner ডিজাইন।' },
  { q: 'পেমেন্ট অপশন কী কী?', a: 'ক্যাশ অন ডেলিভারি, bKash, Nagad, Rocket — সব পেমেন্ট মেথড supported।' },
];

const WA_LINK = 'https://wa.me/8801XXXXXXXXX';
const NOTEBOOK_TIMER_KEY = 'nb_bundle_discount_timer_end';

function Stars({ n = 5, size = 14 }: { n?: number; size?: number }) {
  return <span style={{ color: '#D4AF37', fontSize: size, letterSpacing: 1 }}>{'★'.repeat(n)}</span>;
}

function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M20.5 3.5A11 11 0 0 0 3.5 17l-1.5 5 5.2-1.4A11 11 0 1 0 20.5 3.5zm-8.5 17a8.7 8.7 0 0 1-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.7 8.7 0 1 1 7.2 3.9zM16.7 14c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.6.8-.8 1-.3.1-.5 0a7 7 0 0 1-3.5-3c-.3-.5.3-.4.7-1.3.1-.2 0-.3 0-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2c0 1.3.9 2.5 1 2.7s1.9 3 4.7 4.2c.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.2-.2-.4-.3z" />
    </svg>
  );
}

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? 'mobile' : w < 900 ? 'tablet' : 'desktop');
    };
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return bp;
}

function useFadeRef() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect(); }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const fadeStyle: React.CSSProperties = { opacity: 0, transform: 'translateY(28px)', transition: 'opacity 0.55s ease, transform 0.55s ease' };
const padTime = (value: number) => String(value).padStart(2, '0');

export default function NotebookBundleClient() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [atBundle, setAtBundle] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [discountTimeLeft, setDiscountTimeLeft] = useState({ h: 23, m: 59, s: 59 });
  const addItem = useCartStore((s) => s.addItem);
  const setFreeGift = useCartStore((s) => s.setFreeGift);
  const cartItems = useCartStore((s) => s.items);
  const giftItem = cartItems.find((i) => i.isFreeGift);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  const [r1, r2, r3, r4, r5, r6] = [useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef()];

  useEffect(() => {
    const fetchNotebookProducts = async () => {
      let prods: Product[] = [];

      try {
        const filteredRes = await api.get('/product/get-all-data', {
          params: {
            'tags.name': NOTEBOOK_TAG,
            page: 1,
            limit: NOTEBOOK_COLLECTION_SIZE,
            status: 'publish',
          },
        });
        const filteredProducts = normalizeProducts(filteredRes);
        const taggedProducts = filteredProducts.filter(hasNotebookTag);
        prods = (taggedProducts.length > 0 ? taggedProducts : filteredProducts).slice(0, NOTEBOOK_COLLECTION_SIZE);
      } catch {
      }

      try {
        const allRes = await api.get('/product/get-all-data', {
          params: { page: 1, limit: 200, status: 'publish' },
        });
        const allProducts = normalizeProducts(allRes);

        if (prods.length < NOTEBOOK_COLLECTION_SIZE) {
          const fallbackProducts = allProducts.filter(hasNotebookTag);
          const byId = new Map(prods.map((p) => [p._id, p]));
          fallbackProducts.forEach((p) => byId.set(p._id, p));
          prods = Array.from(byId.values()).slice(0, NOTEBOOK_COLLECTION_SIZE);
        }

        const campaignProducts = FREE_NOTEBOOK_SLUGS
          .map((slug) => allProducts.find((p) => p.slug?.toLowerCase() === slug.toLowerCase() && hasNotebookTag(p)))
          .filter((p): p is Product => Boolean(p));
        if (campaignProducts.length > 0) {
          prods = campaignProducts.slice(0, NOTEBOOK_COLLECTION_SIZE);
        }

        // Best sellers: non-notebook products, ranked by totalSold.
        const topSellers = allProducts
          .filter((p) => !hasNotebookTag(p))
          .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
          .slice(0, 8);
        setBestsellers(topSellers);

        setProducts(prods);
        setQtyMap(Object.fromEntries(prods.map((p) => [p._id, 1])));
      } catch {
        const fallback = prods.length > 0 ? prods : FALLBACK_NOTEBOOK_PRODUCTS;
        setProducts(fallback);
        setQtyMap(Object.fromEntries(fallback.map((p) => [p._id, 1])));
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookProducts();
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', { content_name: 'Notebook Bundle', content_type: 'product_group' });
    }
  }, []);

  // Bundle section visibility
  useEffect(() => {
    const el = document.getElementById('nb-books');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setAtBundle(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const getTimerEnd = () => {
      const now = Date.now();
      const stored = Number(localStorage.getItem(NOTEBOOK_TIMER_KEY));
      if (stored && stored > now) return stored;
      const next = now + 24 * 60 * 60 * 1000;
      localStorage.setItem(NOTEBOOK_TIMER_KEY, String(next));
      return next;
    };
    let timerEnd = getTimerEnd();
    const tick = () => {
      const now = Date.now();
      if (timerEnd <= now) timerEnd = getTimerEnd();
      const diff = Math.max(0, timerEnd - now);
      setDiscountTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Offer state derived from the real cart.
  const paidNotebookQty = getPaidNotebookQty(cartItems);
  const paidSubtotal = getPaidSubtotal(cartItems);
  const eligible = isFreeNotebookEligible(cartItems);
  const remaining = remainingForThreshold(cartItems);
  const modalOfferTitle = paidNotebookQty >= 2
    ? '২ টি নোটবুক কিনলে ১ টি ফ্রি'
    : '৫০০ টাকার উপর যেকোনো বই কিনলে ১ টি নোটবুক ফ্রি';
  const modalOfferCopy = paidNotebookQty >= 2
    ? 'আপনার কার্টে ২টি নোটবুক আছে। এখন যেকোনো একটি নোটবুক ফ্রি বেছে নিন, তারপর checkout-এ চলে যান।'
    : 'আপনার অর্ডার ৫০০ টাকার বেশি হয়েছে। উপহার হিসেবে যেকোনো একটি প্রিমিয়াম নোটবুক বেছে নিন।';

  useEffect(() => {
    if (eligible && !giftItem && cartItems.some((item) => !item.isFreeGift)) {
      setGiftModalOpen(true);
    }
  }, [eligible, giftItem, cartItems]);

  const getQty = (id: string) => qtyMap[id] ?? 1;
  const setQty = (id: string, q: number) =>
    setQtyMap((prev) => ({ ...prev, [id]: Math.max(1, q) }));

  const handleAddToCart = (product: Product, qty = 1) => {
    addItem(product, qty);
    toast.success(`${qty} টি ${product.name} কার্টে যোগ হয়েছে!`);
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: product.name, content_ids: [product._id], content_type: 'product', quantity: qty, currency: 'BDT' });
    }
  };

  const handlePickFreeGift = (product: Product) => {
    setFreeGift(product);
    toast.success(`${product.name} ফ্রি উপহার হিসেবে যোগ হয়েছে!`);
  };

  const handlePickFreeGiftAndCheckout = (product: Product) => {
    setFreeGift(product);
    setGiftModalOpen(false);
    toast.success(`${product.name} ফ্রি উপহার হিসেবে যোগ হয়েছে!`);
    window.setTimeout(() => router.push('/checkout'), 80);
  };

  const activePhoto = activePhotoIndex === null ? null : REAL_NOTEBOOK_PHOTOS[activePhotoIndex];
  const showNextPhoto = () => setActivePhotoIndex((i) => (i === null ? 0 : (i + 1) % REAL_NOTEBOOK_PHOTOS.length));
  const showPrevPhoto = () => setActivePhotoIndex((i) => (i === null ? 0 : (i - 1 + REAL_NOTEBOOK_PHOTOS.length) % REAL_NOTEBOOK_PHOTOS.length));

  useEffect(() => {
    if (activePhotoIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePhotoIndex(null);
      if (event.key === 'ArrowRight') showNextPhoto();
      if (event.key === 'ArrowLeft') showPrevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePhotoIndex]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@400;500;600;700&display=swap');

        .nb-serif { font-family: "Fraunces", Georgia, serif; }
        .nb-ui    { font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; }
        .nb-num   { font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; font-feature-settings: "tnum" 1; }

        /* Strip */
        .nb-strip { background: #071A07; color: #E8F5E9; font-size: 13px; letter-spacing: 0.01em; font-family: "Inter", sans-serif; }
        .nb-strip-row { max-width: 1180px; margin: 0 auto; padding: 0 22px; display: flex; align-items: center; justify-content: space-between; height: 38px; gap: 16px; }
        .nb-strip-left { display:flex; align-items:center; gap:10px; }
        .nb-pulse { width:8px; height:8px; border-radius:50%; background: #4CAF50; animation: nbPulse 1.6s infinite; flex-shrink:0; }
        @keyframes nbPulse { 0% { box-shadow:0 0 0 0 rgba(76,175,80,0.6); } 70% { box-shadow:0 0 0 8px rgba(76,175,80,0); } 100% { box-shadow:0 0 0 0 rgba(76,175,80,0); } }
        @keyframes nbGiftReveal { 0% { opacity:0; transform: translateY(18px) scale(0.96); } 60% { transform: translateY(-2px) scale(1.01); } 100% { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes nbGiftGlow { 0%,100% { box-shadow:0 0 0 0 rgba(212,175,55,0); } 50% { box-shadow:0 0 0 6px rgba(212,175,55,0.18); } }
        .nb-gift-reveal { animation: nbGiftReveal 0.55s cubic-bezier(.2,.7,.2,1), nbGiftGlow 2.4s ease-in-out 0.55s infinite; }
        @keyframes nbGiftConfirm { 0% { opacity:0; transform: scale(0.92); } 100% { opacity:1; transform: scale(1); } }
        .nb-gift-confirm { animation: nbGiftConfirm 0.35s ease; }
        .nb-cd { display:flex; align-items:center; gap:6px; }
        .nb-cd b { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 2px 7px; min-width: 28px; text-align: center; font-family: "Inter", sans-serif; font-weight: 600; font-feature-settings: "tnum" 1; }

        /* Value strip */
        .nb-value-strip { background: #071A07; color: #C8E6C9; padding: 15px 0; border-top: 1px solid #1B3D1B; border-bottom: 1px solid #1B3D1B; }
        .nb-value-row { max-width: 1180px; margin: 0 auto; padding: 0 22px; display:flex; align-items:center; gap: 40px; justify-content: center; font-family: "Inter", sans-serif; font-size: 13px; letter-spacing: 0.02em; flex-wrap: wrap; }
        .nb-value-row > div { display:flex; align-items:center; gap: 10px; opacity: 0.95; }

        /* Eyebrow */
        .nb-eyebrow { display:inline-flex; align-items:center; gap:10px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #1B6B1B; font-family: "Inter", sans-serif; font-weight: 600; padding: 6px 12px; background: #C8E6C9; border-radius: 999px; margin-bottom: 18px; }
        .nb-eyebrow .dot { width:6px; height:6px; border-radius:50%; background: #1B6B1B; }
        .nb-section-eyebrow { display: inline-block; font-family: "Inter", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #4A6B4A; margin-bottom: 14px; }
        .nb-section-eyebrow::before { content:"— "; }

        /* Section head */
        .nb-section-head { text-align:center; max-width: 720px; margin: 0 auto 52px; }
        .nb-section-title { font-family: "Hind Siliguri", sans-serif; font-weight: 600; font-size: clamp(26px, 3.6vw, 40px); line-height: 1.18; letter-spacing: -0.01em; color: #071A07; margin: 0 0 12px; }
        .nb-section-sub { color: #2E4A2E; font-size: 16px; max-width: 560px; margin: 0 auto; }

        /* Hero */
        .nb-hero { padding: 72px 0 84px; background: #EDF4ED; position: relative; overflow: hidden; max-width: 100vw; }
        .nb-hero-art { position: absolute; right: -6%; top: -10%; width: 60%; height: 120%; pointer-events: none; z-index: 0; }
        .nb-container { max-width: 1180px; margin: 0 auto; padding: 0 22px; }
        .nb-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; position: relative; z-index: 1; }
        .nb-lede-bn { font-family: "Hind Siliguri", sans-serif; font-weight: 700; font-size: clamp(30px, 4.6vw, 52px); line-height: 1.16; letter-spacing: -0.005em; margin: 20px 0 16px; color: #071A07; }
        .nb-lede-bn span { color: #1B6B1B; }
        .nb-lede-bn em { color: #D4AF37; font-style: normal; }
        .nb-sub { color: #2E4A2E; font-size: 17px; max-width: 480px; margin-bottom: 26px; line-height: 1.65; }
        .nb-sub b { color: #071A07; font-weight: 600; }
        .nb-price-row { display:flex; align-items: baseline; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
        .nb-price-now { font-family: "Fraunces", serif; font-size: 42px; font-weight: 600; letter-spacing: -0.02em; color: #071A07; }
        .nb-price-was { color: #4A6B4A; text-decoration: line-through; font-size: 18px; font-family: "Inter", sans-serif; }
        .nb-save-pill { background: #C62828; color: #fff; font-family: "Inter", sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 0.04em; padding: 5px 10px; border-radius: 4px; }
        .nb-cta-row { display:flex; gap:12px; flex-wrap:wrap; }
        .nb-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; padding: 15px 24px; border-radius: 12px; font-weight: 600; font-size: 15px; border: 1px solid transparent; cursor: pointer; transition: transform .12s ease, background .15s ease; font-family: "Hind Siliguri", sans-serif; text-decoration: none; }
        .nb-btn:hover { transform: translateY(-1px); }
        .nb-btn-primary { background: #1B6B1B; color: #fff; box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 10px 22px -10px rgba(27,107,27,0.55); }
        .nb-btn-primary:hover { background: #2E7D32; }
        .nb-btn-ghost { background: transparent; color: #071A07; border-color: #A5C8A5; }
        .nb-btn-ghost:hover { background: #E8F5E9; }
        .nb-trust-mini { margin-top: 24px; display:flex; align-items: center; gap: 20px; color: #4A6B4A; font-size: 13px; flex-wrap: wrap; }
        .nb-trust-mini b { color: #2E4A2E; font-weight: 600; }
        .nb-free-pill { display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:10px 14px; border-radius:12px; background:#D4AF37; color:#071A07; font-family:"Hind Siliguri",sans-serif; font-weight:800; font-size:15px; box-shadow:0 12px 24px -18px rgba(7,26,7,0.5); }
        .nb-offer-chips { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; max-width:540px; margin:18px 0 0; }
        .nb-offer-chip { border:1px solid #B7D9B7; background:#F6FBF6; border-radius:14px; padding:12px 14px; color:#071A07; box-shadow:0 16px 32px -28px rgba(7,26,7,0.42); }
        .nb-offer-chip strong { display:block; font-family:"Hind Siliguri",sans-serif; font-size:17px; line-height:1.25; margin-bottom:4px; }
        .nb-offer-chip span { display:block; font-size:12px; color:#4A6B4A; line-height:1.45; }

        /* Notebook stack */
        .nb-stack-wrap { position: relative; height: 460px; display:flex; align-items:center; justify-content:center; }
        .nb-stack { position: relative; width: 485px; height: 420px; }
        .nb-book { position: absolute; width: 150px; height: 220px; border-radius: 3px 6px 6px 3px; box-shadow: 0 24px 36px -18px rgba(7,26,7,0.45), 0 6px 14px -6px rgba(7,26,7,0.30); overflow: hidden; transition: transform .35s cubic-bezier(.2,.7,.2,1); }
        .nb-book::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background: linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0)); z-index:1; }
        .nb-book::after { content:""; position:absolute; inset:0; background: linear-gradient(115deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 38%); pointer-events:none; z-index:2; }
        .nb-book .nb-cover { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between; padding:14px 12px; z-index:3; }
        .nb-book .nb-btop { font-family: "Inter", sans-serif; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.7; }
        .nb-book .nb-bttl { font-family: "Fraunces", serif; font-weight: 700; font-size: 18px; line-height: 1.05; letter-spacing: -0.01em; }
        .nb-book .nb-bauth { font-family: "Inter", sans-serif; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.8; }
        .nb-book .nb-ptag { position:absolute; top:8px; right:-8px; z-index:4; background: #C62828; color:#fff; font-family: "Inter", sans-serif; font-weight:700; font-size:11px; padding: 4px 8px; border-radius: 3px; box-shadow: 0 4px 10px -4px rgba(198,40,40,.6); }
        .nb-b1 { left:0px; top:40px; transform:rotate(-9deg); }
        .nb-b2 { left:75px; top:70px; transform:rotate(-4deg); }
        .nb-b3 { left:140px; top:90px; transform:rotate(0deg); }
        .nb-b4 { left:205px; top:70px; transform:rotate(4deg); }
        .nb-b5 { left:270px; top:40px; transform:rotate(9deg); }
        .nb-b6 { left:335px; top:75px; transform:rotate(13deg); }
        .nb-stack:hover .nb-b1 { transform: rotate(-13deg) translate(-8px, -6px); }
        .nb-stack:hover .nb-b2 { transform: rotate(-6deg) translate(-4px, -4px); }
        .nb-stack:hover .nb-b3 { transform: rotate(0deg) translate(0, -10px); }
        .nb-stack:hover .nb-b4 { transform: rotate(6deg) translate(4px, -4px); }
        .nb-stack:hover .nb-b5 { transform: rotate(13deg) translate(8px, -6px); }
        .nb-stack:hover .nb-b6 { transform: rotate(17deg) translate(12px, -4px); }
        .nb-stack-floor { position: absolute; left: 10%; right: 10%; bottom: 0; height: 24px; background: radial-gradient(50% 50% at 50% 50%, rgba(7,26,7,0.18), rgba(0,0,0,0)); filter: blur(6px); }

        /* Notebook cards */
        .nb-books-section { background: #E8F5E9; padding: 96px 0; }
        .nb-bcard { background: #F1F8F1; border-radius: 16px; overflow: hidden; border: 1px solid #C8E6C9; display:flex; flex-direction:column; transition: transform .2s ease, box-shadow .2s ease; }
        .nb-bcard:hover { transform: translateY(-3px); box-shadow: 0 1px 0 rgba(7,26,7,0.04), 0 12px 32px -16px rgba(7,26,7,0.16); }
        .nb-bcard .nb-thumb { aspect-ratio: 3/4; position:relative; display:grid;place-items:center; overflow:hidden; }
        .nb-mini-book { width: 62%; aspect-ratio: 2/3; border-radius: 2px 4px 4px 2px; box-shadow: 0 16px 24px -12px rgba(0,0,0,0.4), 0 4px 8px -4px rgba(0,0,0,0.25); padding: 12px 10px; display:flex; flex-direction:column; justify-content:space-between; position: relative; }
        .nb-mini-book::before { content:""; position:absolute; left:0;top:0;bottom:0;width:3px; background:linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0)); }
        .nb-mini-book::after { content:""; position:absolute;inset:0; background:linear-gradient(115deg,rgba(255,255,255,0.18),rgba(255,255,255,0) 40%); pointer-events:none; }
        .nb-mb-top { font-family:"Inter",sans-serif; font-size:8px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.7; }
        .nb-mb-ttl { font-family:"Fraunces",serif; font-weight:700; font-size:14px; line-height:1.05; }
        .nb-mb-auth { font-family:"Inter",sans-serif; font-size:8px; letter-spacing:0.1em; text-transform:uppercase; opacity:0.8; }
        .nb-bcard .nb-bdg { position:absolute; top:10px; left:10px; background: #C62828; color:#fff; font-family:"Inter",sans-serif; font-weight:700; font-size:10px; padding:4px 8px; border-radius:4px; }
        .nb-bcard .nb-popular-badge { position:absolute; top:10px; right:10px; background: linear-gradient(135deg,#1B6B1B,#D4AF37); color:#fff; font-family:"Inter",sans-serif; font-weight:700; font-size:9px; padding:3px 8px; border-radius:4px; letter-spacing:0.04em; }
        .nb-bcard .nb-body { padding: 14px 16px 16px; display:flex;flex-direction:column;gap:6px;flex:1; }
        .nb-bcard h4 { font-family:"Hind Siliguri",sans-serif; font-size:15px; font-weight:600; margin:0; line-height:1.25; color:#071A07; }
        .nb-bcard h4 .en { display:block; font-family:"Fraunces",serif; font-style:italic; font-weight:500; font-size:12px; color:#4A6B4A; margin-top:2px; }
        .nb-bcard .nb-aline { font-size:12px; color:#4A6B4A; }
        .nb-bcard .nb-stars-row { display:flex;gap:6px;align-items:center;font-size:11px;color:#4A6B4A; }
        .nb-bcard .nb-pline { margin-top:auto; display:flex; align-items:baseline; gap:7px; padding-top:8px; }
        .nb-bcard .nb-pnow { font-family:"Inter",sans-serif; font-weight:700; font-size:17px; color:#071A07; }
        .nb-bcard .nb-pwas { font-family:"Inter",sans-serif; text-decoration:line-through; color:#4A6B4A; font-size:12px; }
        .nb-bcard .nb-scarcity { font-size:11px; color:#C62828; font-weight:600; }
        .nb-bcard .nb-actions { display:flex; gap:6px; margin-top:8px; }
        .nb-btn-mini-ghost { border:0; background:transparent; color:#2E4A2E; padding:5px 0 0; font-size:12px; border-radius:0; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
        .nb-btn-mini-ghost:hover { background:#E8F5E9; }
        .nb-btn-mini-primary { background:#1B6B1B; color:#fff; padding:11px 10px; font-size:13px; border-radius:10px; cursor:pointer; border:none; flex:1; font-family:"Hind Siliguri",sans-serif; font-weight:700; }
        .nb-btn-mini-primary:hover { background:#2E7D32; }

        /* Real photo proof */
        .nb-real-section { background:#F1F8F1; padding:96px 0; border-top:1px solid #C8E6C9; border-bottom:1px solid #C8E6C9; }
        .nb-real-wrap { display:grid; grid-template-columns:minmax(0, 0.82fr) minmax(0, 1.18fr); gap:42px; align-items:start; }
        .nb-real-copy { position:sticky; top:92px; padding-top:8px; }
        .nb-real-copy .nb-section-title { text-align:left; margin-bottom:14px; }
        .nb-real-copy .nb-section-sub { margin:0; max-width:430px; }
        .nb-real-note { margin-top:24px; display:grid; gap:10px; max-width:430px; }
        .nb-real-note div { display:flex; align-items:center; gap:10px; color:#2E4A2E; font-family:"Hind Siliguri",sans-serif; font-size:14px; line-height:1.35; }
        .nb-real-note span { width:24px; height:24px; border-radius:999px; display:grid; place-items:center; flex-shrink:0; background:#C8E6C9; color:#1B6B1B; font-family:"Inter",sans-serif; font-size:12px; font-weight:800; }
        .nb-photo-slider { overflow:hidden; border-radius:22px; padding:10px; background:#E8F5E9; border:1px solid #C8E6C9; box-shadow:0 28px 58px -36px rgba(7,26,7,0.5); }
        .nb-slide-track { display:flex; gap:14px; width:max-content; animation:nbAutoSlide 36s linear infinite; }
        .nb-photo-slider:hover .nb-slide-track { animation-play-state:paused; }
        @keyframes nbAutoSlide { from { transform:translateX(0); } to { transform:translateX(calc(-50% - 7px)); } }
        .nb-real-photo { position:relative; margin:0; border-radius:16px; overflow:hidden; background:#E8F5E9; border:1px solid #C8E6C9; box-shadow:0 18px 38px -28px rgba(7,26,7,0.45); flex:0 0 clamp(210px, 22vw, 310px); height:390px; }
        .nb-real-photo button { width:100%; height:100%; padding:0; border:0; cursor:zoom-in; background:transparent; display:block; }
        .nb-real-photo img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .45s cubic-bezier(.2,.7,.2,1); }
        .nb-real-photo:hover img { transform:scale(1.035); }
        .nb-real-photo::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(7,26,7,0) 62%, rgba(7,26,7,0.28)); pointer-events:none; }
        .nb-real-caption { margin-top:16px; color:#4A6B4A; font-family:"Inter",sans-serif; font-size:12px; line-height:1.6; }
        .nb-photo-modal { position:fixed; inset:0; z-index:100; background:rgba(7,26,7,0.82); backdrop-filter:blur(8px); display:grid; place-items:center; padding:22px; }
        .nb-photo-dialog { position:relative; width:min(920px, 100%); max-height:92vh; border-radius:18px; overflow:hidden; background:#071A07; box-shadow:0 30px 80px rgba(0,0,0,0.42); }
        .nb-photo-dialog img { width:100%; max-height:92vh; object-fit:contain; display:block; background:#071A07; }
        .nb-photo-close { position:absolute; top:12px; right:12px; width:38px; height:38px; border:1px solid rgba(255,255,255,0.26); border-radius:999px; background:rgba(7,26,7,0.72); color:#fff; cursor:pointer; font-size:22px; line-height:1; display:grid; place-items:center; }
        .nb-photo-nav { position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px; border:1px solid rgba(255,255,255,0.28); border-radius:999px; background:rgba(7,26,7,0.72); color:#fff; cursor:pointer; font-size:28px; line-height:1; display:grid; place-items:center; }
        .nb-photo-prev { left:14px; }
        .nb-photo-next { right:14px; }
        .nb-photo-count { position:absolute; left:14px; bottom:14px; padding:6px 10px; border-radius:999px; background:rgba(7,26,7,0.74); color:#E8F5E9; font-family:"Inter",sans-serif; font-size:12px; font-weight:700; }

        /* Builder */
        .nb-builder-wrap { background: #EDF4ED; padding: 96px 0; }
        .nb-builder { background: linear-gradient(180deg, #071A07 0%, #1B3D1B 100%); color: #E8F5E9; border-radius: 28px; padding: 38px; box-shadow: 0 30px 60px -30px rgba(7,26,7,0.5); }
        .nb-builder-head { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:26px; }
        .nb-builder-head .nb-section-eyebrow { color:#D4AF37; }
        .nb-builder-head h3 { font-family:"Hind Siliguri",sans-serif; font-weight:600; font-size:27px; line-height:1.2; margin:0 0 6px; }
        .nb-builder-head p { margin:0; color:rgba(200,230,201,0.7); font-size:14px; max-width:460px; }
        .nb-builder-price { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:14px 18px; text-align:right; min-width:200px; }
        .nb-builder-price .lbl { font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(200,230,201,0.6);font-family:"Inter",sans-serif; }
        .nb-builder-price .val { font-family:"Fraunces",serif; font-weight:600; font-size:34px; letter-spacing:-0.02em; line-height:1.1; }
        .nb-builder-price .save { font-family:"Inter",sans-serif; font-size:12px; color:#D4AF37; font-weight:600; }
        .nb-builder-product-list { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
        .nb-pick { background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.12); border-radius:16px; padding:10px 46px 10px 10px; cursor:pointer; position:relative; transition:all .18s ease; text-align:left; display:flex; align-items:center; gap:12px; min-height:92px; }
        .nb-pick:hover { background:rgba(255,255,255,0.07); }
        .nb-pick.on { background:rgba(212,175,55,0.18); border-color:#D4AF37; }
        .nb-pick .nb-pick-check { position:absolute; top:50%; right:12px; transform:translateY(-50%); width:26px; height:26px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.3); background:transparent; display:grid; place-items:center; transition:all .18s ease; }
        .nb-pick.on .nb-pick-check { background:#D4AF37; border-color:#D4AF37; }
        .nb-pick-thumb { width:54px; height:72px; flex-shrink:0; border-radius:8px; overflow:hidden; background:rgba(255,255,255,0.06); box-shadow:0 8px 14px -8px rgba(0,0,0,0.42); display:grid; place-items:center; }
        .nb-pick-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .nb-pmini { width:100%; height:100%; border-radius:2px 4px 4px 2px; padding:8px 6px; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 8px 14px -6px rgba(0,0,0,0.4); }
        .nb-pmini::before { content:""; position:absolute; left:0;top:0;bottom:0;width:2px; background:rgba(0,0,0,0.2); }
        .nb-pmini .pt { font-family:"Fraunces",serif; font-weight:700; font-size:11px; line-height:1.05; }
        .nb-pmini .pa { font-family:"Inter",sans-serif; font-size:7px; letter-spacing:0.1em; text-transform:uppercase; opacity:0.8; }
        .nb-pick-copy { min-width:0; }
        .nb-pick .nb-ptitle { font-family:"Hind Siliguri",sans-serif; font-weight:700; font-size:14px; line-height:1.25; margin-bottom:4px; color:#E8F5E9; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .nb-pick .nb-pprice { font-family:"Inter",sans-serif; font-weight:600; font-size:13px; opacity:0.85; color:#E8F5E9; }
        .nb-builder-totals { margin-top:24px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.12); }
        .nb-totals-left { display:flex; gap:24px; flex-wrap:wrap; }
        .nb-totals-left > div { display:flex; flex-direction:column; gap:2px; }
        .nb-totals-left .l { font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(200,230,201,0.55);font-family:"Inter",sans-serif; }
        .nb-totals-left .v { font-family:"Inter",sans-serif; font-size:17px; font-weight:600; }
        .nb-totals-left .v.strike { text-decoration:line-through;color:rgba(200,230,201,0.5);font-weight:500; }
        .nb-totals-left .v.gold { color:#D4AF37; }
        .nb-builder-cta { width:100%; margin-top:20px; background:#D4AF37; color:#071A07; padding:18px 26px; border-radius:14px; font-weight:700; font-size:16px; display:inline-flex;align-items:center;justify-content:center;gap:10px; transition:transform .12s ease, background .15s ease; cursor:pointer; border:none; font-family:"Hind Siliguri",sans-serif; }
        .nb-builder-cta:hover { background:#E8C84A; transform:translateY(-1px); }
        .nb-builder-fineprint { margin-top:14px;text-align:center;font-size:12.5px;color:rgba(200,230,201,0.6);display:flex;gap:18px;justify-content:center;flex-wrap:wrap; }
        .nb-builder-delivery { margin:0 0 28px; border:2px solid #D4AF37; background:linear-gradient(135deg,#D4AF37 0%,#F4DF79 58%,#FFF5B8 100%); color:#071A07; border-radius:18px; padding:20px 22px; display:flex; align-items:center; justify-content:space-between; gap:18px; box-shadow:0 24px 42px -28px rgba(212,175,55,0.95), 0 0 0 6px rgba(212,175,55,0.10); position:relative; overflow:hidden; }
        .nb-builder-delivery::before { content:"FREE DELIVERY"; position:absolute; right:18px; top:10px; font-family:"Inter",sans-serif; font-size:10px; font-weight:900; letter-spacing:0.18em; color:rgba(7,26,7,0.34); }
        .nb-builder-delivery strong { display:flex; align-items:center; gap:10px; font-family:"Hind Siliguri",sans-serif; font-size:24px; font-weight:900; line-height:1.18; color:#071A07; padding-right:118px; }
        .nb-builder-delivery strong::before { content:"🚚"; width:42px; height:42px; border-radius:999px; background:#071A07; display:grid; place-items:center; flex-shrink:0; font-size:22px; }
        .nb-builder-delivery span { font-family:"Hind Siliguri",sans-serif; font-size:14px; font-weight:800; color:#1B3D1B; text-align:right; position:relative; z-index:1; }
        .nb-offer-panel { margin:0 0 22px; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
        .nb-offer-panel-card { border:1px solid rgba(212,175,55,0.35); background:rgba(255,255,255,0.05); border-radius:16px; padding:16px; }
        .nb-offer-panel-card b { display:block; color:#F4DF79; font-family:"Hind Siliguri",sans-serif; font-size:20px; line-height:1.25; margin-bottom:6px; }
        .nb-offer-panel-card span { color:rgba(232,245,233,0.74); font-size:13px; line-height:1.55; }

        /* Gift modal */
        .nb-gift-modal { position:fixed; inset:0; z-index:120; display:grid; place-items:center; padding:18px; background:rgba(7,26,7,0.72); backdrop-filter:blur(8px); animation:nbGiftBackdrop .2s ease; }
        .nb-gift-modal-card { width:min(760px, 100%); max-height:92vh; overflow:auto; background:#F6FBF6; color:#071A07; border-radius:24px; border:1px solid #C8E6C9; box-shadow:0 34px 90px rgba(7,26,7,0.38); padding:24px; animation:nbGiftPop .42s cubic-bezier(.2,.75,.18,1); }
        @keyframes nbGiftBackdrop { from { opacity:0; } to { opacity:1; } }
        @keyframes nbGiftPop { 0% { opacity:0; transform:translateY(18px) scale(.96); } 70% { transform:translateY(-3px) scale(1.01); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        .nb-gift-modal-top { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:18px; }
        .nb-gift-modal-badge { display:inline-flex; align-items:center; gap:8px; padding:7px 11px; border-radius:999px; background:#D4AF37; color:#071A07; font-family:"Hind Siliguri",sans-serif; font-weight:900; font-size:13px; margin-bottom:10px; }
        .nb-gift-modal h3 { margin:0 0 8px; font-family:"Hind Siliguri",sans-serif; font-size:30px; line-height:1.14; }
        .nb-gift-modal p { margin:0; color:#2E4A2E; font-size:15px; line-height:1.65; max-width:580px; }
        .nb-gift-close { width:38px; height:38px; border-radius:999px; border:1px solid #B7D9B7; background:#fff; color:#071A07; cursor:pointer; font-size:22px; line-height:1; display:grid; place-items:center; flex-shrink:0; }
        .nb-gift-modal-foot { margin-top:14px; text-align:center; color:#4A6B4A; font-family:"Hind Siliguri",sans-serif; font-size:13px; }

        /* Quality */
        .nb-quality-section { background: #EDF4ED; padding: 96px 0; }
        .nb-timer-box { margin:24px auto 0; max-width:520px; border:1px solid #D4AF37; background:#071A07; color:#E8F5E9; border-radius:18px; padding:18px; box-shadow:0 20px 42px -30px rgba(7,26,7,0.7); }
        .nb-timer-label { font-family:"Hind Siliguri",sans-serif; font-size:14px; color:#D4AF37; font-weight:800; margin-bottom:10px; }
        .nb-timer-row { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:10px; }
        .nb-timer-cell { border:1px solid rgba(212,175,55,0.28); background:rgba(255,255,255,0.06); border-radius:12px; padding:10px 6px; }
        .nb-timer-num { display:block; font-family:"Inter",sans-serif; font-size:30px; font-weight:900; line-height:1; color:#F4DF79; font-feature-settings:"tnum" 1; }
        .nb-timer-unit { display:block; margin-top:6px; font-family:"Inter",sans-serif; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(232,245,233,0.68); }
        .nb-qcard { background:#F1F8F1; border:1px solid #C8E6C9; border-radius:16px; padding:24px; position:relative; }
        .nb-qcard .qno { font-family:"Fraunces",serif; font-style:italic; font-weight:500; font-size:14px; color:#4A6B4A; margin-bottom:14px; }
        .nb-qcard .qico { width:44px;height:44px;border-radius:12px; background:#C8E6C9;color:#1B6B1B; display:grid;place-items:center; margin-bottom:16px; }
        .nb-qcard h4 { font-family:"Inter",sans-serif; font-weight:600; font-size:14px; letter-spacing:0.02em; margin:0 0 8px; color:#071A07; }
        .nb-qcard p { font-size:13.5px; color:#2E4A2E; margin:0; line-height:1.5; }
        .nb-promise { margin-top:26px; background:#F1F8F1; border:1px solid #1B6B1B; border-left:4px solid #1B6B1B; border-radius:14px; padding:20px 24px; display:flex; align-items:center; gap:16px; }
        .nb-promise p { margin:0; color:#071A07; font-size:15px; }
        .nb-promise b { color:#1B6B1B; }

        /* FAQ */
        .nb-faq-section { background: #EDF4ED; padding: 96px 0; }
        .nb-faq-list { max-width:760px; margin:0 auto; display:flex;flex-direction:column;gap:8px; }
        .nb-faq-item { background:#F1F8F1; border:1px solid #C8E6C9; border-radius:14px; overflow:hidden; }
        .nb-faq-item.on { border-color:#1B6B1B; }
        .nb-faq-q { width:100%;text-align:left;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px; font-weight:600;font-size:15px;color:#071A07; font-family:"Hind Siliguri",sans-serif; cursor:pointer; background:none; border:none; }
        .nb-pm { width:26px;height:26px;border-radius:50%; border:1px solid #A5C8A5; display:grid;place-items:center; transition:transform .2s ease,background .15s ease; flex-shrink:0; }
        .nb-faq-item.on .nb-pm { background:#1B6B1B; border-color:#1B6B1B; transform:rotate(45deg); }
        .nb-faq-a { max-height:0; overflow:hidden; transition:max-height .25s ease; border-left:4px solid transparent; }
        .nb-faq-item.on .nb-faq-a { max-height:300px; border-left-color:#1B6B1B; }
        .nb-faq-a-inner { padding:0 24px 20px; color:#2E4A2E; font-size:15px; line-height:1.7; }
        .nb-faq-help { margin-top:22px;text-align:center; }
        .nb-faq-help a { display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border:1px solid #A5C8A5;border-radius:999px;background:#F1F8F1;font-size:14px;color:#2E4A2E;text-decoration:none; }
        .nb-faq-help a:hover { color:#071A07; }
        .nb-wa-dot { width:18px;height:18px;border-radius:50%;background:#25D366;display:grid;place-items:center; }

        /* Final CTA */
        .nb-final-cta { background: #071A07; color: #E8F5E9; text-align:center; padding: 100px 0; position:relative; overflow:hidden; }
        .nb-final-cta::before { content:""; position:absolute; top:0; left:50%; width:90%; max-width:800px; height:1px; background:linear-gradient(90deg,transparent,#D4AF37,transparent); transform:translateX(-50%); }
        .nb-final-cta .nb-section-eyebrow { color:rgba(212,175,55,0.8); }
        .nb-final-cta h2 { font-family:"Hind Siliguri",sans-serif; font-weight:600; font-size:clamp(28px,4vw,46px); margin:0 0 14px; color:#F1F8F1; line-height:1.18; }
        .nb-final-cta p { color:rgba(200,230,201,0.7); max-width:540px; margin:0 auto 26px; }
        .nb-final-cta .nb-btn-ghost { color:#E8F5E9;border-color:rgba(255,255,255,0.2); }
        .nb-final-cta .nb-btn-ghost:hover { background:rgba(255,255,255,0.05); }
        .nb-final-cta .nb-btn-primary { background:#D4AF37;color:#071A07; }
        .nb-final-cta .nb-btn-primary:hover { background:#E8C84A; }

        /* Mobile sticky bar */
        .nb-mobile-bar { display:none; position:fixed;bottom:0;left:0;right:0;z-index:50; padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px)); background:rgba(237,244,237,0.97); backdrop-filter:blur(10px); border-top:1px solid #C8E6C9; align-items:center;justify-content:space-between;gap:10px; }
        .nb-mobile-bar .mb-price { display:flex;flex-direction:column; }
        .nb-mobile-bar .mb-price .now { font-family:"Fraunces",serif;font-weight:600;font-size:21px;line-height:1;color:#071A07; }
        .nb-mobile-bar .mb-price .was { font-family:"Inter",sans-serif;text-decoration:line-through;color:#4A6B4A;font-size:12px; }

        /* World Cup badge */
        .nb-wc-badge { display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#D4AF37,#B8963A);color:#071A07;font-family:"Inter",sans-serif;font-weight:700;font-size:11px;letter-spacing:0.08em;padding:5px 12px;border-radius:999px;margin-bottom:12px; }

        @media (max-width:900px) {
          .nb-hero { padding:40px 0 32px; overflow:hidden; }
          .nb-hero-grid { grid-template-columns:1fr; gap:16px; }
          .nb-stack-wrap { height:285px; order:-1; width:100%; overflow:hidden; align-items:flex-start; justify-content:center; }
          .nb-stack { width:390px; height:285px; transform:none; }
          .nb-book { width:112px; height:164px; }
          .nb-book .nb-bttl { font-size:14px; }
          .nb-b1 { left:0px; top:33px; } .nb-b2 { left:56px; top:57px; } .nb-b3 { left:104px; top:74px; } .nb-b4 { left:152px; top:57px; } .nb-b5 { left:200px; top:33px; } .nb-b6 { left:248px; top:57px; }
          .nb-sub { max-width:100%; overflow-wrap:break-word; word-break:break-word; }
          .nb-lede-bn { font-size:32px; overflow-wrap:break-word; word-break:break-word; }
          .nb-price-now { font-size:36px; }
          .nb-builder-head { flex-direction:column; }
          .nb-builder-price { width:100%; text-align:left; min-width:0; }
          .nb-builder { padding:24px; border-radius:20px; }
          .nb-package-grid { grid-template-columns:1fr; }
          .nb-package-card.featured { transform:none; }
          .nb-builder-delivery { flex-direction:column; align-items:flex-start; }
          .nb-builder-delivery span { text-align:left; }
          .nb-builder-delivery::before { right:16px; top:12px; }
          .nb-builder-delivery strong { padding-right:0; font-size:20px; }
          .nb-builder-product-list { grid-template-columns:1fr; }
          .nb-real-wrap { grid-template-columns:1fr; gap:26px; }
          .nb-real-copy { position:static; padding-top:0; }
          .nb-offer-panel { grid-template-columns:1fr; }
          section.nb-books-section, .nb-real-section, .nb-builder-wrap, .nb-quality-section, .nb-faq-section { padding-top:64px !important; padding-bottom:64px !important; }
        }
        @media (max-width:640px) {
          .nb-strip-row .nb-strip-right-num { display:none; }
          .nb-mobile-bar { display:flex; }
          body { padding-bottom: 76px; }
          .nb-stack-wrap { height:220px; width:100%; overflow:hidden; align-items:flex-start; justify-content:center; }
          .nb-stack { width:310px; height:220px; transform:none; }
          .nb-book { width:96px; height:142px; }
          .nb-book .nb-bttl { font-size:11px; }
          .nb-b1 { left:0px; top:27px; } .nb-b2 { left:43px; top:46px; } .nb-b3 { left:80px; top:59px; } .nb-b4 { left:117px; top:46px; } .nb-b5 { left:154px; top:27px; } .nb-b6 { left:191px; top:46px; }
          .nb-lede-bn { font-size:26px; overflow-wrap:break-word; word-break:break-word; }
          .nb-sub { font-size:15px; max-width:100%; overflow-wrap:break-word; word-break:break-word; }
          .nb-price-row { gap:10px; flex-wrap:wrap; }
          .nb-save-pill { font-size:11px; }
          .nb-cta-row .nb-btn { flex:1 1 100%; }
          .nb-offer-chips { grid-template-columns:1fr; }
          .nb-final-cta { padding:64px 0; }
          .nb-value-row > div:nth-child(n+3) { display:none; }
          .nb-photo-slider { margin:0 -22px; border-radius:0; border-left:0; border-right:0; }
          .nb-real-photo { flex-basis:76vw; height:360px; }
          .nb-books-section .nb-container { padding:0 14px; }
          .nb-books-section .nb-bcard .nb-thumb { aspect-ratio: 1 / 1.35; }
          .nb-books-section .nb-bcard .nb-body { padding:10px; }
          .nb-books-section .nb-bcard h4 { font-size:12px; }
          .nb-books-section .nb-bcard .nb-pnow { font-size:15px; }
          .nb-books-section .nb-btn-mini-primary { font-size:12px; padding:10px 8px; }
          .nb-photo-modal { padding:12px; }
          .nb-photo-nav { width:38px; height:38px; font-size:24px; }
          .nb-photo-prev { left:8px; }
          .nb-photo-next { right:8px; }
          .nb-timer-num { font-size:24px; }
          .nb-gift-modal-card { padding:18px; border-radius:18px; }
          .nb-gift-modal h3 { font-size:24px; }
        }
        @media (max-width:1100px) { .nb-book-grid-3 { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      `}</style>

      {/* ── Announcement strip ── */}
      <div className="nb-strip">
        <div className="nb-strip-row">
          <div className="nb-strip-left">
            <span className="nb-pulse" />
            <span>⚽ World Cup 2026 Inspired Notebook Collection</span>
          </div>
          <div className="nb-strip-right-num nb-strip-left">
            <span>Cash on delivery · ৩-৫ দিনে ডেলিভারি</span>
          </div>
        </div>
      </div>

      <Header />

      <main style={{ background: '#EDF4ED' }}>

        {/* ── Hero ── */}
        <section className="nb-hero">
          <div className="nb-hero-art" aria-hidden="true">
            <svg viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice">
              {/* Football/pitch circles */}
              <circle cx="500" cy="280" r="260" fill="none" stroke="#A5C8A5" strokeWidth="1" strokeDasharray="2 6" opacity="0.6"/>
              <circle cx="500" cy="280" r="190" fill="none" stroke="#A5C8A5" strokeWidth="1" opacity="0.4"/>
              <circle cx="500" cy="280" r="120" fill="#C8E6C9" opacity="0.35"/>
              {/* Football pentagon pattern */}
              <polygon points="500,210 526,228 516,258 484,258 474,228" fill="none" stroke="#A5C8A5" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
          <div className="nb-container">
            <div ref={r1} style={{ ...fadeStyle }}>
              <div className="nb-hero-grid">
                <div>
                  <div className="nb-wc-badge">⚽ WORLD CUP 2026 INSPIRED COLLECTION</div>
                  <span className="nb-eyebrow"><span className="dot" />🎁 ফ্রি নোটবুক অফার চলছে</span>
                  <h1 className="nb-lede-bn">
                    <em>৳১৬০-তে প্রিমিয়াম ফুটবল নোটবুক</em>{' '}
                    <span>আর ফ্রি গিফট অফার</span>
                  </h1>
                  <p className="nb-sub">
                    সবাজ থেকে মাত্র ২টি নোটবুক কিনলেই সঙ্গে পাচ্ছেন আরও ১টি নোটবুক <b>একদম বিনামূল্যে।</b>{' '}
                    আর <b>৫০০ টাকার উপর যেকোনো বই কিনলে</b> উপহার হিসেবে থাকছে এই প্রিমিয়াম নোটবুকগুলো।
                  </p>
                  <p className="nb-sub" style={{ fontStyle: 'italic', marginTop: -10 }}>
                    ক্লাস নোট, ডায়েরি, to-do list — প্রতিদিনের লেখায় পছন্দের দলের vibe থাকুক।
                  </p>
                  <div className="nb-price-row">
                    <span className="nb-price-now nb-num">৳160</span>
                    <span className="nb-save-pill">প্রতি নোটবুক · ২ কিনলে ১ ফ্রি</span>
                  </div>
                  <div className="nb-cta-row">
                    <a href="#nb-books" className="nb-btn nb-btn-primary">
                      নোটবুক বেছে অর্ডার করো
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </a>
                    <a href="#nb-books" className="nb-btn nb-btn-ghost">ফ্রি নোটবুক বেছে নাও</a>
                  </div>
                  <div className="nb-trust-mini">
                    <div><b>৮০ GSM</b> অফসেট পেপার</div>
                    <div>·</div>
                    <div><b>Rounded Corner</b> ডিজাইন</div>
                    <div>·</div>
                    <div>Cash on delivery</div>
                  </div>
                  <div className="nb-free-pill">অফার আনলক হলে ৩টির মধ্যে যেকোনো ১টি নোটবুক ফ্রি বেছে নিন</div>
                </div>

                {/* Notebook stack */}
                <div className="nb-stack-wrap" aria-hidden="true">
                  <div className="nb-stack">
                    {(products.length > 0 ? products.slice(0, NOTEBOOK_COLLECTION_SIZE) : Array(NOTEBOOK_COLLECTION_SIZE).fill(null)).map((p: Product | null, i) => {
                      const src = HERO_NOTEBOOK_PHOTOS[i] ?? (p ? imgUrl(p.images?.[0]) : null);
                      const cls = ['nb-b1','nb-b3','nb-b5'][i] ?? 'nb-b3';
                      const col = NOTEBOOK_COLORS[i % NOTEBOOK_COLORS.length];
                      const { discountPct: nbDiscPct } = p ? getProductPrice(p) : { discountPct: 0 };
                      return (
                        <div key={p ? p._id : i}
                          className={`nb-book ${cls}`}
                          style={{ background: col.color, color: col.dark ? '#1a1a1a' : '#fff', border: col.dark ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                          {src ? (
                            <img src={src} alt={p?.name ?? ''} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="nb-cover" style={{ color: col.dark ? '#1a1a1a' : '#fff' }}>
                              <div className="nb-btop">⚽</div>
                              <div className="nb-bttl" style={{ fontSize: i === 0 ? 22 : 18 }}>{p?.name ?? ''}</div>
                              <div className="nb-bauth">⚽ NOTEBOOK</div>
                            </div>
                          )}
                          {(i === 0 || i === 2) && nbDiscPct > 0 && <span className="nb-ptag">{nbDiscPct}%</span>}
                        </div>
                      );
                    })}
                    <div className="nb-stack-floor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Value strip ── */}
        <div className="nb-value-strip">
          <div className="nb-value-row">
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/></svg>, label: '৮০ GSM অফ-হোয়াইট পেপার' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M5 7l3 3 11-11M5 17l3 3 11-11"/></svg>, label: 'Rounded Corner ডিজাইন' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M20 12V6H4v12h7"/><path d="M16 19l2 2 4-4"/></svg>, label: '২ কিনলে ১ নোটবুক ফ্রি' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M12 2l9 4v6c0 5-3.8 9-9 10-5.2-1-9-5-9-10V6z"/><path d="M9 12l2 2 4-4"/></svg>, label: 'সারাদেশে হোম ডেলিভারি' },
            ].map((v, i) => (
              <div key={i}>{v.icon}<span>{v.label}</span></div>
            ))}
          </div>
        </div>

        {/* ── Real Product Photos ── */}
        <section className="nb-real-section">
          <div className="nb-container">
            <div ref={r6} style={fadeStyle}>
              <div className="nb-real-wrap">
                <div className="nb-real-copy">
                  <div className="nb-section-eyebrow">বাস্তব ছবি</div>
                  <h2 className="nb-section-title">৩টি প্রিমিয়াম নোটবুক, বাস্তব ছবিতে</h2>
                  <p className="nb-section-sub">
                    Product mockup নয়। অর্ডার করার আগে cover print, rounded corner, paper finish আর notebook size ভালোভাবে দেখে নিতে পারেন।
                  </p>
                  <div className="nb-real-note">
                    <div><span>1</span>Blue & White Forever, For Every Heart, Hexa Loading — এই ৩টি published design</div>
                    <div><span>2</span>Rounded corner ও off-white page quality পরিষ্কারভাবে দেখা যায়</div>
                    <div><span>3</span>Slider pause করতে ছবির ওপর hover করুন, বড় করে দেখতে ছবিতে click করুন</div>
                  </div>
                  <div className="nb-real-caption">
                    ছবিগুলো automatic slide হবে। কোনো ছবি বড় করে দেখতে ছবির ওপর tap করুন।
                  </div>
                <div className="nb-timer-box" aria-label="২৪ ঘণ্টার অফার টাইমার">
                  <div className="nb-timer-label">অফার শেষ হতে বাকি</div>
                  <div className="nb-timer-row">
                    <div className="nb-timer-cell"><span className="nb-timer-num">{padTime(discountTimeLeft.h)}</span><span className="nb-timer-unit">Hours</span></div>
                    <div className="nb-timer-cell"><span className="nb-timer-num">{padTime(discountTimeLeft.m)}</span><span className="nb-timer-unit">Minutes</span></div>
                    <div className="nb-timer-cell"><span className="nb-timer-num">{padTime(discountTimeLeft.s)}</span><span className="nb-timer-unit">Seconds</span></div>
                  </div>
                </div>
                </div>
                <div className="nb-photo-slider" aria-label="Real notebook product photo slider">
                  <div className="nb-slide-track">
                    {[...REAL_NOTEBOOK_PHOTOS, ...REAL_NOTEBOOK_PHOTOS].map((photo, index) => {
                      const realIndex = index % REAL_NOTEBOOK_PHOTOS.length;
                      return (
                        <figure key={`${photo.src}-${index}`} className="nb-real-photo">
                          <button type="button" onClick={() => setActivePhotoIndex(realIndex)} aria-label={`${photo.alt} বড় করে দেখুন`}>
                            <img src={photo.src} alt={photo.alt} loading="lazy" />
                          </button>
                        </figure>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Notebook Cards ── */}
        <section id="nb-books" className="nb-books-section">
          <div className="nb-container">
            <div ref={r2} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">২টি নিলে ১টি ফ্রি</div>
                <h2 className="nb-section-title">২ টি নোটবুক কিনলে ১ টি ফ্রি</h2>
                <p className="nb-section-sub">এই তিনটি published notebook থেকে যেকোনো ২টি কার্টে যোগ করুন। সঙ্গে সঙ্গে একটি animation popup খুলবে, সেখান থেকে ৩টির মধ্যে যেকোনো ১টি free notebook বেছে checkout-এ যেতে পারবেন।</p>
              </div>
              <div className="nb-offer-chips" aria-label="Current offers" style={{ maxWidth: 880, margin: '0 auto 28px' }}>
                <div className="nb-offer-chip">
                  <strong>২ টি নোটবুক কিনলে ১ টি ফ্রি</strong>
                  <span>নিচের ৩টি নোটবুক থেকে যেকোনো ২টি কার্টে যোগ করলেই free notebook picker খুলবে।</span>
                </div>
                <div className="nb-offer-chip">
                  <strong>৫০০ টাকার উপর যেকোনো বই কিনলে ১ টি নোটবুক ফ্রি</strong>
                  <span>Best selling books বা site-এর যেকোনো বই মিলিয়ে ৫০০৳+ হলেই gift notebook পাবেন।</span>
                </div>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#4A6B4A', fontSize: 16 }}>লোড হচ্ছে...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0, 1fr))', gap: isMobile ? 12 : 20, maxWidth: 880, margin: '0 auto' }}>
                  {products.map((p, i) => {
                    const src = imgUrl(p.images?.[0]);
                    const { price, original, discountPct: nbDiscPct } = getProductPrice(p);
                    const col = NOTEBOOK_COLORS[i % NOTEBOOK_COLORS.length];
                    const qty = getQty(p._id);
                    return (
                      <div key={p._id} className="nb-bcard">
                        <div className="nb-thumb" style={{ background: 'linear-gradient(160deg, #E8F5E9, #C8E6C9)' }}>
                          {nbDiscPct > 0 && <span className="nb-bdg">{nbDiscPct}% OFF</span>}
                          {src ? (
                            <img src={src} alt={p.name} loading="lazy" style={{ width: '62%', aspectRatio: '2/3', objectFit: 'contain', borderRadius: '2px 4px 4px 2px', boxShadow: '0 16px 24px -12px rgba(0,0,0,0.4)' }} />
                          ) : (
                            <div className="nb-mini-book" style={{ background: col.color, color: col.dark ? '#1a1a1a' : '#fff' }}>
                              <div className="nb-mb-top">⚽</div>
                              <div className="nb-mb-ttl">{p.name}</div>
                              <div className="nb-mb-auth">⚽ 2026</div>
                            </div>
                          )}
                        </div>
                        <div className="nb-body">
                          <h4>{p.name}</h4>
                          <div className="nb-stars-row" style={{ color: '#4A6B4A', fontSize: 12 }}>৮০ GSM · Rounded Corner</div>
                          <div className="nb-pline">
                            <span className="nb-pnow nb-num">৳{price}</span>
                            {original > price && <span className="nb-pwas nb-num">৳{original}</span>}
                          </div>
                          {(p.stock ?? 0) > 0 && <div className="nb-scarcity">⚡ মাত্র {p.stock} টি বাকি</div>}
                          {/* Quantity stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px' }}>
                            <button aria-label="কমান" onClick={() => setQty(p._id, qty - 1)} disabled={qty <= 1}
                              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #C8E6C9', background: '#F1F8F1', cursor: qty <= 1 ? 'not-allowed' : 'pointer', fontSize: 17, fontWeight: 700, color: '#1B6B1B', opacity: qty <= 1 ? 0.5 : 1 }}>−</button>
                            <span className="nb-num" style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#071A07' }}>{qty}</span>
                            <button aria-label="বাড়ান" onClick={() => setQty(p._id, qty + 1)}
                              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #C8E6C9', background: '#F1F8F1', cursor: 'pointer', fontSize: 17, fontWeight: 700, color: '#1B6B1B' }}>+</button>
                          </div>
                          <div className="nb-actions">
                            <button className="nb-btn-mini-primary" onClick={() => handleAddToCart(p, qty)}>কার্টে যোগ করুন</button>
                          </div>
                          <Link href={`/${p.slug}`} className="nb-btn-mini-ghost">বিস্তারিত দেখো</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── Best Sellers ── */}
        {bestsellers.length > 0 && (
          <section className="nb-books-section" style={{ background: '#F1F8F1' }}>
            <div className="nb-container">
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">আমাদের ব্র্যান্ড</div>
                <h2 className="nb-section-title">Best Selling Books</h2>
                <p className="nb-section-sub">৫০০ টাকার উপর যেকোনো বই কিনলে ১ টি নোটবুক ফ্রি। বই কার্টে যোগ করে order value ৫০০৳+ হলেই popup থেকে আপনার gift notebook বেছে নিতে পারবেন।</p>
                <div style={{ marginTop: 22 }}>
                  <Link href="/products" className="nb-btn nb-btn-primary">
                    সব বই দেখুন
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </Link>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : isTablet ? 'repeat(3, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap: isMobile ? 12 : 20 }}>
                {bestsellers.map((p) => (
                  <ProductCard key={p._id} product={p} onAddToCart={() => handleAddToCart(p, 1)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Quality ── */}
        <section className="nb-quality-section">
          <div className="nb-container">
            <div ref={r4} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">প্রিমিয়াম কোয়ালিটি</div>
                <h2 className="nb-section-title">কেন এই নোটবুক প্রিমিয়াম</h2>
                <p className="nb-section-sub">৮০ GSM অফ-হোয়াইট পেপার, Rounded Corner ডিজাইন ও টেকসই পেপারব্যাক কভার। দেশের যেকোনো প্রান্তে হোম ডেলিভারি।</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { n: 'i.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 16h6"/></svg>, title: '৮০ GSM অফসেট পেপার', body: 'প্রিমিয়াম অফ-হোয়াইট কাগজ — লিখতে আরামদায়ক, কালি ব্লিড করে না।' },
                  { n: 'ii.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>, title: 'Rounded Corner ডিজাইন', body: 'সুন্দর গোলাকার কোণা — আরও প্রিমিয়াম ও এলিগ্যান্ট লুক।' },
                  { n: 'iii.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 3v18"/></svg>, title: 'টেকসই পেপারব্যাক কভার', body: 'মজবুত পেপারব্যাক কভার ও প্রিমিয়াম ফিনিশ — দীর্ঘস্থায়ী।' },
                  { n: 'iv.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>, title: 'অগ্রিম পেমেন্ট ছাড়াই', body: 'সারাদেশে হোম ডেলিভারি — হাতে পেয়ে টাকা পরিশোধ করুন।' },
                ].map((q, i) => (
                  <div key={i} className="nb-qcard">
                    <div className="qno">{q.n}</div>
                    <div className="qico">{q.icon}</div>
                    <h4>{q.title}</h4>
                    <p>{q.body}</p>
                  </div>
                ))}
              </div>
              <div className="nb-promise">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#1B6B1B" strokeWidth="1.5" style={{ flexShrink: 0 }}><path d="M12 2l9 4v6c0 5-3.8 9-9 10-5.2-1-9-5-9-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
                <p><b>আমাদের প্রতিশ্রুতি:</b> নোটবুক পেয়ে প্রিন্ট বা quality-তে কোনো সমস্যা হলে — পুরো টাকা ফেরত, কোনো প্রশ্ন নয়।</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="nb-faq-section">
          <div className="nb-container">
            <div ref={r5} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">প্রশ্ন ও উত্তর</div>
                <h2 className="nb-section-title">সচরাচর জিজ্ঞাসা</h2>
              </div>
              <div className="nb-faq-list">
                {FAQS.map((faq, i) => (
                  <div key={i} className={`nb-faq-item${openFaq === i ? ' on' : ''}`}>
                    <button className="nb-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {faq.q}
                      <span className="nb-pm">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={openFaq === i ? 'white' : '#071A07'} strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                      </span>
                    </button>
                    <div className="nb-faq-a">
                      <div className="nb-faq-a-inner">{faq.a}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="nb-faq-help">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <span className="nb-wa-dot"><WaIcon size={11} /></span>
                  আরও প্রশ্ন আছে? WhatsApp-এ মেসেজ করো
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="nb-final-cta">
          <div className="nb-container">
            <div className="nb-section-eyebrow">শেষ ধাপ</div>
            <h2>২টি কিনুন, ১টি নোটবুক ফ্রি নিন</h2>
            <p>৮০ GSM অফ-হোয়াইট পেপার, Rounded Corner ডিজাইন — সারাদেশে cash on delivery। অফার শেষ হওয়ার আগেই অর্ডার করুন।</p>
            <div className="nb-cta-row" style={{ justifyContent: 'center' }}>
              <a href="#nb-books" className="nb-btn nb-btn-primary">
                নোটবুক বেছে অর্ডার করো
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#nb-books" className="nb-btn nb-btn-ghost">ফ্রি নোটবুক বেছে নাও</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {activePhoto && (
        <div className="nb-photo-modal" role="dialog" aria-modal="true" aria-label="Notebook photo preview" onClick={() => setActivePhotoIndex(null)}>
          <div className="nb-photo-dialog" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="nb-photo-close" onClick={() => setActivePhotoIndex(null)} aria-label="বন্ধ করুন">×</button>
            <button type="button" className="nb-photo-nav nb-photo-prev" onClick={showPrevPhoto} aria-label="আগের ছবি">‹</button>
            <button type="button" className="nb-photo-nav nb-photo-next" onClick={showNextPhoto} aria-label="পরের ছবি">›</button>
            <div className="nb-photo-count">{(activePhotoIndex ?? 0) + 1} / {REAL_NOTEBOOK_PHOTOS.length}</div>
            <img src={activePhoto.src} alt={activePhoto.alt} />
          </div>
        </div>
      )}

      {giftModalOpen && eligible && !giftItem && (
        <div className="nb-gift-modal" role="dialog" aria-modal="true" aria-label="Free notebook offer">
          <div className="nb-gift-modal-card">
            <div className="nb-gift-modal-top">
              <div>
                <div className="nb-gift-modal-badge">ফ্রি গিফট আনলকড</div>
                <h3>{modalOfferTitle}</h3>
                <p>{modalOfferCopy}</p>
              </div>
              <button type="button" className="nb-gift-close" onClick={() => setGiftModalOpen(false)} aria-label="বন্ধ করুন">×</button>
            </div>
            <FreeNotebookPicker
              notebooks={products}
              selectedId={undefined}
              onPick={handlePickFreeGiftAndCheckout}
            />
            <div className="nb-gift-modal-foot">
              কার্টে নোটবুক: {paidNotebookQty} টি · অর্ডার ভ্যালু: ৳{paidSubtotal}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sticky bar ── */}
      {!atBundle && (
        <div className="nb-mobile-bar">
          <div className="mb-price">
            <span className="now nb-num" style={{ fontSize: 16 }}>{eligible ? '🎁 ফ্রি নোটবুক আনলকড' : '২ কিনলে ১ ফ্রি'}</span>
            <span className="was nb-num">{paidNotebookQty}টি নোটবুক কার্টে</span>
          </div>
          <a href="#nb-books" className="nb-btn nb-btn-primary" style={{ padding: '12px 18px', fontSize: 14 }}>
            অর্ডার করো
          </a>
        </div>
      )}

    </>
  );
}
