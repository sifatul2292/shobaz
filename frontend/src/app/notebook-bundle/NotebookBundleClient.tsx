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

declare global {
  interface Window {
    fbq?: (event: string, name: string, params?: Record<string, unknown>) => void;
  }
}

const TIMER_KEY = 'nb_bundle_timer_end';
const NOTEBOOK_TAG = 'notebook';
const NOTEBOOK_COLLECTION_SIZE = 6;

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

function normalizeProducts(payload: any): Product[] {
  const data = payload?.data?.data;
  const productsData = Array.isArray(data) ? data : data?.items;
  return Array.isArray(productsData) ? productsData : [];
}

function hasNotebookTag(product: Product): boolean {
  const tags = (product as any).tags;
  if (!Array.isArray(tags)) return false;
  return tags.some((tag: any) => {
    const slug = typeof tag?.slug === 'string' ? tag.slug.toLowerCase() : '';
    const name = typeof tag?.name === 'string' ? tag.name.toLowerCase() : '';
    return slug === NOTEBOOK_TAG || name === NOTEBOOK_TAG;
  });
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
  { q: 'ডেলিভারি কতদিনে পাবো?', a: 'অর্ডার কনফার্ম হবার পর ঢাকায় ২-৩ কর্মদিবস, ঢাকার বাইরে ৩-৫ কর্মদিবসের মধ্যে পেয়ে যাবেন। সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।' },
  { q: 'নোটবুকের কাগজ কেমন?', a: '৭০ GSM premium offset paper — হাতে লিখতে আরামদায়ক, কালি ব্লিড করে না। রুলড লাইন সহ।' },
  { q: 'পেমেন্ট অপশন কী কী?', a: 'ক্যাশ অন ডেলিভারি, bKash, Nagad, Rocket — সব পেমেন্ট মেথড supported।' },
  { q: 'গিফট হিসেবে দেওয়া যাবে?', a: 'অবশ্যই! ফুটবল প্রেমীদের জন্য পারফেক্ট গিফট। বিশেষ গিফট প্যাকেজিং-এর জন্য অর্ডারে নোট করুন।' },
];

const REVIEWS = [
  { name: 'আরিফ হোসেন', location: 'ঢাকা', init: 'আ', color: '#1B6B1B', text: "Blue & White Forever নোটবুকটা পেয়ে মনে হলো আর্জেন্টিনার জার্সি হাতে পেয়েছি! কোয়ালিটি দুর্দান্ত।" },
  { name: 'রিফাত', location: 'চট্টগ্রাম', init: 'রি', color: '#D4AF37', text: "Hexa Loading নোটবুক Brazil fan হিসেবে আমার must-have। বাঁধাই শক্ত, কাগজ smooth।" },
  { name: 'সাদমান', location: 'সিলেট', init: 'স', color: '#0D1B3E', text: "বন্ধুকে Messi's Glory gift দিয়েছিলাম — সে কান্নাই করে ফেলল! World Cup 2026-এর আগে পারফেক্ট।" },
];

const WA_LINK = 'https://wa.me/8801XXXXXXXXX';

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

export default function NotebookBundleClient() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set<string>());
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [visitorCount, setVisitorCount] = useState(87);
  const [visitorFade, setVisitorFade] = useState(true);
  const [atBundle, setAtBundle] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  const [r1, r2, r3, r4, r5, r6, r7, r8] = [
    useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(),
    useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(),
  ];

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
        if (prods.length < NOTEBOOK_COLLECTION_SIZE) {
          const allRes = await api.get('/product/get-all-data', {
            params: { page: 1, limit: 200, status: 'publish' },
          });
          const fallbackProducts = normalizeProducts(allRes).filter(hasNotebookTag);
          const byId = new Map(prods.map((p) => [p._id, p]));
          fallbackProducts.forEach((p) => byId.set(p._id, p));
          prods = Array.from(byId.values()).slice(0, NOTEBOOK_COLLECTION_SIZE);
        }

        setProducts(prods);
        setSelected(new Set(prods.map((p) => p._id)));
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookProducts();
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', { content_name: 'Notebook Bundle', content_type: 'product_group' });
    }
  }, []);

  // 72h countdown
  useEffect(() => {
    const getOrCreateEnd = () => {
      try {
        const stored = localStorage.getItem(TIMER_KEY);
        if (stored) { const end = parseInt(stored, 10); if (end > Date.now()) return end; }
      } catch {}
      const newEnd = Date.now() + 72 * 3600 * 1000;
      try { localStorage.setItem(TIMER_KEY, String(newEnd)); } catch {}
      return newEnd;
    };
    let end = getOrCreateEnd();
    const tick = () => {
      const d = Math.max(0, end - Date.now());
      setTimeLeft({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
      if (d === 0) { const ne = Date.now() + 72 * 3600 * 1000; try { localStorage.setItem(TIMER_KEY, String(ne)); } catch {} end = ne; }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Dynamic visitor count
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setVisitorFade(false);
        setTimeout(() => {
          setVisitorCount((prev) => Math.min(140, Math.max(60, prev + Math.floor(Math.random() * 11) - 5)));
          setVisitorFade(true);
          schedule();
        }, 300);
      }, 8000 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  // Bundle section visibility
  useEffect(() => {
    const el = document.getElementById('nb-builder');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setAtBundle(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const selectedProducts = products.filter((p) => selected.has(p._id));
  const selectedTotal = selectedProducts.reduce((s, p) => s + getProductPrice(p).price, 0);
  const selectedOriginal = selectedProducts.reduce((s, p) => s + getProductPrice(p).original, 0);
  const savedAmount = selectedOriginal - selectedTotal;
  const discountPct = selectedOriginal > 0 ? Math.round((savedAmount / selectedOriginal) * 100) : 0;

  const { argentinaProducts, brazilProducts } = splitNotebookProducts(products);

  const toggleNotebook = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(`${product.name} কার্টে যোগ হয়েছে!`);
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: product.name, content_ids: [product._id], content_type: 'product', currency: 'BDT' });
    }
  };

  const handleBundleCheckout = () => {
    let added = 0;
    selectedProducts.forEach((p) => { addItem(p); added++; });
    if (added === 0) { toast.error('পণ্য লোড হচ্ছে...'); return; }
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: 'Notebook Bundle', content_ids: selectedProducts.map((p) => p._id), value: selectedTotal, currency: 'BDT' });
    }
    router.push('/checkout');
  };

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

        /* Problems */
        .nb-problems { display:grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .nb-problem { background: #F1F8F1; border: 1px solid #C8E6C9; border-radius: 18px; padding: 26px; display:flex; flex-direction: column; gap: 12px; position: relative; transition: transform .2s ease, box-shadow .2s ease; }
        .nb-problem:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(7,26,7,0.04), 0 12px 32px -16px rgba(7,26,7,0.16); }
        .nb-problem .nb-ico { width:44px;height:44px;border-radius:12px; background:#C8E6C9;color:#1B6B1B; display:grid;place-items:center; font-size:20px; }
        .nb-problem h3 { font-size: 17px; font-weight: 600; margin: 4px 0 2px; color: #071A07; }
        .nb-problem p { color: #2E4A2E; font-size: 14px; margin: 0; line-height: 1.65; }
        .nb-problem .nb-num-mark { position:absolute;top:22px;right:24px; font-family:"Fraunces",serif; font-style:italic; font-weight:500; color:#A5C8A5; font-size:26px; }
        .nb-problem-cta { margin-top: 26px; background:#C8E6C9; border:1px dashed #1B6B1B; border-radius:14px; padding:18px 22px; display:flex; align-items:center; gap:14px; color:#1B6B1B; font-weight:500; }
        .nb-problem-cta .nb-check { width:28px;height:28px;border-radius:50%;background:#1B6B1B;color:#fff;display:grid;place-items:center;flex-shrink:0; }

        /* Benefits */
        .nb-benefits-band { background: #071A07; color: #E8F5E9; padding: 96px 0; }
        .nb-benefits-band .nb-section-eyebrow { color: rgba(212,175,55,0.8); }
        .nb-benefits-band .nb-section-title { color: #F1F8F1; }
        .nb-benefits-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 920px; margin: 0 auto; }
        .nb-benefit { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; display:flex; align-items:flex-start; gap:14px; transition: background .2s ease; }
        .nb-benefit:hover { background: rgba(255,255,255,0.07); }
        .nb-b-ico { width:36px;height:36px;border-radius:10px; background:rgba(212,175,55,0.18); color:#D4AF37; display:grid;place-items:center;flex-shrink:0; }
        .nb-benefit p { margin:0;font-size:15px;color:#C8E6C9;line-height:1.55; }

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
        .nb-btn-mini-ghost { border:1px solid #A5C8A5; background:transparent; color:#071A07; padding:9px 10px; font-size:12px; border-radius:9px; cursor:pointer; }
        .nb-btn-mini-ghost:hover { background:#E8F5E9; }
        .nb-btn-mini-primary { background:#1B6B1B; color:#fff; padding:9px 10px; font-size:12px; border-radius:9px; cursor:pointer; border:none; }
        .nb-btn-mini-primary:hover { background:#2E7D32; }

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
        .nb-pick { background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.12); border-radius:14px; padding:14px; cursor:pointer; position:relative; transition:all .18s ease; text-align:left; }
        .nb-pick:hover { background:rgba(255,255,255,0.07); }
        .nb-pick.on { background:rgba(212,175,55,0.18); border-color:#D4AF37; }
        .nb-pick .nb-pick-check { position:absolute; top:10px; right:10px; width:22px; height:22px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.3); background:transparent; display:grid; place-items:center; transition:all .18s ease; }
        .nb-pick.on .nb-pick-check { background:#D4AF37; border-color:#D4AF37; }
        .nb-pmini { width:100%; aspect-ratio:2/3; border-radius:2px 4px 4px 2px; margin-bottom:10px; padding:8px 6px; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 8px 14px -6px rgba(0,0,0,0.4); }
        .nb-pmini::before { content:""; position:absolute; left:0;top:0;bottom:0;width:2px; background:rgba(0,0,0,0.2); }
        .nb-pmini .pt { font-family:"Fraunces",serif; font-weight:700; font-size:11px; line-height:1.05; }
        .nb-pmini .pa { font-family:"Inter",sans-serif; font-size:7px; letter-spacing:0.1em; text-transform:uppercase; opacity:0.8; }
        .nb-pick .nb-ptitle { font-family:"Hind Siliguri",sans-serif; font-weight:600; font-size:12px; line-height:1.25; margin-bottom:2px; color:#E8F5E9; }
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

        /* Quality */
        .nb-quality-section { background: #EDF4ED; padding: 96px 0; }
        .nb-qcard { background:#F1F8F1; border:1px solid #C8E6C9; border-radius:16px; padding:24px; position:relative; }
        .nb-qcard .qno { font-family:"Fraunces",serif; font-style:italic; font-weight:500; font-size:14px; color:#4A6B4A; margin-bottom:14px; }
        .nb-qcard .qico { width:44px;height:44px;border-radius:12px; background:#C8E6C9;color:#1B6B1B; display:grid;place-items:center; margin-bottom:16px; }
        .nb-qcard h4 { font-family:"Inter",sans-serif; font-weight:600; font-size:14px; letter-spacing:0.02em; margin:0 0 8px; color:#071A07; }
        .nb-qcard p { font-size:13.5px; color:#2E4A2E; margin:0; line-height:1.5; }
        .nb-promise { margin-top:26px; background:#F1F8F1; border:1px solid #1B6B1B; border-left:4px solid #1B6B1B; border-radius:14px; padding:20px 24px; display:flex; align-items:center; gap:16px; }
        .nb-promise p { margin:0; color:#071A07; font-size:15px; }
        .nb-promise b { color:#1B6B1B; }

        /* Reviews */
        .nb-reviews-section { background: #F1F8F1; padding: 96px 0; }
        .nb-review { background: #EDF4ED; border:1px solid #C8E6C9; border-radius:18px; padding:26px; display:flex; flex-direction:column; gap:14px; }
        .nb-review .nb-quote { font-family:"Fraunces",serif; font-style:italic; font-size:52px; line-height:1; color:#1B6B1B; margin:-8px 0 -18px; }
        .nb-review p { margin:0; color:#071A07; font-size:15px; line-height:1.55; }
        .nb-review .nb-who { display:flex;align-items:center;gap:12px;margin-top:4px; }
        .nb-review .nb-av { width:38px;height:38px;border-radius:50%; display:grid;place-items:center; font-family:"Fraunces",serif; font-weight:600; font-size:16px; color:#fff; }
        .nb-review .nb-who-l { display:flex;flex-direction:column;gap:0; }
        .nb-review .nb-who-l b { font-size:14px;font-weight:600;color:#071A07; }
        .nb-review .nb-who-l span { font-size:12px;color:#4A6B4A; }

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
        .nb-final-cd { display:flex;gap:16px;justify-content:center;margin-bottom:30px; flex-wrap:wrap; }
        .nb-cd-box { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 22px;min-width:80px;text-align:center; }
        .nb-cd-box .n { font-family:"Fraunces",serif;font-weight:600;font-size:34px;line-height:1;color:#F1F8F1; }
        .nb-cd-box .l { font-family:"Inter",sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(212,175,55,0.75);margin-top:6px; }
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
          .nb-problems { grid-template-columns:1fr; }
          .nb-benefits-grid { grid-template-columns:1fr; }
          .nb-builder-head { flex-direction:column; }
          .nb-builder-price { width:100%; text-align:left; min-width:0; }
          .nb-builder { padding:24px; border-radius:20px; }
          .nb-benefits-band { padding:64px 0; }
          section.nb-books-section, .nb-builder-wrap, .nb-quality-section, .nb-reviews-section, .nb-faq-section { padding-top:64px !important; padding-bottom:64px !important; }
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
          .nb-final-cta { padding:64px 0; }
          .nb-value-row > div:nth-child(n+3) { display:none; }
        }
        @media (max-width:1100px) { .nb-book-grid-3 { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      `}</style>

      {/* ── Announcement strip ── */}
      <div className="nb-strip">
        <div className="nb-strip-row">
          <div className="nb-strip-left">
            <span className="nb-pulse" />
            <span>⚽ FIFA World Cup 2026 Collection — <b className="nb-num">৫৩% ছাড়</b></span>
          </div>
          <div className="nb-cd">
            <span style={{ color: 'rgba(200,230,201,0.6)', marginRight: 4, fontFamily: '"Inter",sans-serif', fontSize: 12 }}>অফার শেষ হবে</span>
            <b className="nb-num">{pad(timeLeft.h)}</b><span>:</span>
            <b className="nb-num">{pad(timeLeft.m)}</b><span>:</span>
            <b className="nb-num">{pad(timeLeft.s)}</b>
          </div>
          <div className="nb-strip-right-num nb-strip-left" style={{ opacity: visitorFade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            <span>৪.৯ ★ <b>{visitorCount} রিভিউ</b></span>
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
                  <div className="nb-wc-badge">⚽ FIFA WORLD CUP 2026 — OFFICIAL COLLECTION</div>
                  <span className="nb-eyebrow"><span className="dot" />৬টি নোটবুকের এক্সক্লুসিভ বান্ডেল</span>
                  <h1 className="nb-lede-bn">
                    <em>২০২৬ বিশ্বকাপ</em> আসছে।{' '}
                    <span>ফুটবলের উত্তেজনাকে নোটবুকে ধরে রাখো।</span>
                  </h1>
                  <p className="nb-sub">
                    Messi থেকে Brazil — পৃথিবীর সেরা ফুটবল legends-এর থিমে তৈরি{' '}
                    <b>প্রিমিয়াম নোটবুক কালেকশন।</b>
                  </p>
                  <p className="nb-sub" style={{ fontStyle: 'italic', marginTop: -10 }}>
                    ক্লাস নোট, ডায়েরি, স্বপ্নের তালিকা — সব লিখে রাখো তোমার পছন্দের legend-এর সঙ্গে।
                  </p>
                  <div className="nb-price-row">
                    <span className="nb-price-now nb-num">৳190</span>
                    <span className="nb-price-was nb-num">৳400</span>
                    <span className="nb-save-pill">৫৩% ছাড় · প্রতি পিস</span>
                  </div>
                  <div className="nb-cta-row">
                    <a href="#nb-builder" className="nb-btn nb-btn-primary">
                      ৫৩% ছাড়ে এখনই অর্ডার করুন
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </a>
                    <a href="#nb-books" className="nb-btn nb-btn-ghost">সব নোটবুক দেখুন</a>
                  </div>
                  <div className="nb-trust-mini">
                    <div><Stars size={14} /> <b className="nb-num">4.9</b> <span style={{ color: '#4A6B4A' }}>({visitorCount}+)</span></div>
                    <div>·</div>
                    <div><b>২০০+</b> ফুটবল ফ্যান কিনেছেন</div>
                  </div>
                </div>

                {/* Notebook stack */}
                <div className="nb-stack-wrap" aria-hidden="true">
                  <div className="nb-stack">
                    {(products.length > 0 ? products.slice(0, NOTEBOOK_COLLECTION_SIZE) : Array(NOTEBOOK_COLLECTION_SIZE).fill(null)).map((p: Product | null, i) => {
                      const src = p ? imgUrl(p.images?.[0]) : null;
                      const cls = ['nb-b1','nb-b2','nb-b3','nb-b4','nb-b5','nb-b6'][i];
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
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M5 7l3 3 11-11M5 17l3 3 11-11"/></svg>, label: 'সারা দেশে ক্যাশ অন ডেলিভারি' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>, label: '৪.৯ ★ — ভেরিফাইড রিভিউ' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>, label: 'World Cup 2026 থিম' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/></svg>, label: 'প্রিমিয়াম কোয়ালিটি প্রিন্ট' },
            ].map((v, i) => (
              <div key={i}>{v.icon}<span>{v.label}</span></div>
            ))}
          </div>
        </div>

        {/* ── Problems ── */}
        <section style={{ background: '#EDF4ED', padding: '96px 0' }}>
          <div className="nb-container">
            <div ref={r2} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">তোমার কথা বলছি</div>
                <h2 className="nb-section-title">ফুটবল ভালোবাসো, কিন্তু কিছু একটা মিস করছো?</h2>
              </div>
              <div className="nb-problems">
                {[
                  { num: '01', ico: '📓', title: 'সাদামাটা নোটবুক bore লাগে', body: 'প্রতিদিন একই রকম generic নোটবুক দেখতে দেখতে লেখার উৎসাহই চলে যায়।' },
                  { num: '02', ico: '⚽', title: 'World Cup excitement ধরে রাখার জায়গা নেই', body: '২০২৬ বিশ্বকাপের স্মৃতি, পছন্দের দল, goals — কোথায় লিখবে সেটা?', },
                  { num: '03', ico: '🎁', title: 'ফুটবল fan-দের unique গিফট পাওয়া যায় না', body: 'বন্ধু বা প্রিয়জনকে ফুটবল থিমে কিছু special দিতে চাইলে অপশন নেই।' },
                ].map((c, i) => (
                  <div key={i} className="nb-problem">
                    <div className="nb-num-mark">{c.num}</div>
                    <div className="nb-ico" style={{ fontSize: 20 }}>{c.ico}</div>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                ))}
              </div>
              <div className="nb-problem-cta">
                <div className="nb-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                </div>
                <div>তোমার ফুটবল প্রেম deserve করে এমন একটা নোটবুক যেটা দেখলেই মনে হয় — এটা আমার জন্যই।</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="nb-benefits-band">
          <div className="nb-container">
            <div ref={r3} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">কেন এই কালেকশন</div>
                <h2 className="nb-section-title">এই নোটবুকগুলো তোমাকে যা দেবে—</h2>
              </div>
              <div className="nb-benefits-grid">
                {[
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, text: 'পছন্দের football legend-এর সাথে প্রতিদিন থাকো' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>, text: 'ক্লাস নোট, ডায়েরি, to-do list — সব এক জায়গায়' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D4AF37" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14M12 2a10 10 0 0 1 0 20"/></svg>, text: 'World Cup 2026 collection — limited edition feel' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M20 12V6H4v12h7"/><path d="M16 19l2 2 4-4"/></svg>, text: 'ফুটবল fan বন্ধু বা প্রিয়জনকে পারফেক্ট গিফট' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M4 17l6-6 4 4 8-8M14 7h6v6"/></svg>, text: 'Premium quality — দীর্ঘস্থায়ী, ব্যবহারে আরামদায়ক' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D4AF37" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: '৫৩% ছাড়ে সারা কালেকশন — সর্বোচ্চ সাশ্রয়' },
                ].map((b, i) => (
                  <div key={i} className="nb-benefit">
                    <div className="nb-b-ico">{b.icon}</div>
                    <p>{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Notebook Cards ── */}
        <section id="nb-books" className="nb-books-section">
          <div className="nb-container">
            <div ref={r4} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">কালেকশনে কী আছে</div>
                <h2 className="nb-section-title">ফুটবলের ৬টি অবিস্মরণীয় গল্প — এখন তোমার হাতের নোটবুকে</h2>
                <p className="nb-section-sub">প্রতিটি নোটবুক একটি আলাদা ফুটবল legend বা moment-কে সম্মান জানায়।</p>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#4A6B4A', fontSize: 16 }}>লোড হচ্ছে...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>
                  {/* ── Argentina Column ── */}
                  {([{ team: 'Argentina Fan', flag: '🇦🇷', color: '#74ACDF', prods: argentinaProducts }, { team: 'Brazil Fan', flag: '🇧🇷', color: '#009C3B', prods: brazilProducts }] as const).map(({ team, flag, color, prods }) => (
                    <div key={team}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: color, borderRadius: 14, padding: '12px 18px', marginBottom: 16 }}>
                        <span style={{ fontSize: 24 }}>{flag}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', opacity: 0.8, fontFamily: '"Inter",sans-serif' }}>For</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: '"Hind Siliguri",sans-serif', lineHeight: 1.1 }}>{team}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {prods.map((p, i) => {
                          const src = imgUrl(p.images?.[0]);
                          const { price, original, discountPct: nbDiscPct } = getProductPrice(p);
                          const ratingCount = p?.ratingCount ?? 0;
                          const ratingAvg = ratingCount > 0 ? ((p?.ratingTotal ?? 0) / ratingCount).toFixed(1) : '4.9';
                          const col = NOTEBOOK_COLORS[i % NOTEBOOK_COLORS.length];
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
                                <div className="nb-stars-row"><Stars size={12} /> <span className="nb-num">{ratingAvg}</span>{ratingCount > 0 && <span style={{ fontSize: '0.7rem', color: '#4A6B4A', marginLeft: 4 }}>({ratingCount})</span>}</div>
                                <div className="nb-pline">
                                  <span className="nb-pnow nb-num">৳{price}</span>
                                  <span className="nb-pwas nb-num">৳{original}</span>
                                </div>
                                {(p.stock ?? 0) > 0 && <div className="nb-scarcity">⚡ মাত্র {p.stock} টি বাকি</div>}
                                <div className="nb-actions">
                                  <Link href={`/${p.slug}`} className="nb-btn-mini-ghost">বিস্তারিত</Link>
                                  <button className="nb-btn-mini-primary" onClick={() => handleAddToCart(p)}>কার্টে যোগ</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Bundle Builder ── */}
        <section id="nb-builder" className="nb-builder-wrap">
          <div className="nb-container">
            <div ref={r5} style={fadeStyle}>
              <div className="nb-builder">
                <div className="nb-builder-head">
                  <div>
                    <div className="nb-section-eyebrow" style={{ color: '#D4AF37' }}>বান্ডেল বানাও</div>
                    <h3>নোটবুক বেছে নাও — সরাসরি অর্ডার করো</h3>
                    <p>সব নোটবুক একসাথে নিলে সর্বোচ্চ ছাড়। যত বেশি, তত বেশি সাশ্রয়।</p>
                  </div>
                  <div className="nb-builder-price">
                    <div className="lbl">তোমার মোট</div>
                    <div className="val nb-num">৳{selectedTotal}</div>
                    <div className="save">{savedAmount.toLocaleString()} টাকা সাশ্রয় · {discountPct}% ছাড়</div>
                  </div>
                </div>

                {/* Free shipping banner */}
                <div style={{
                  background: 'linear-gradient(90deg, #D4AF37 0%, #E8C84A 50%, #D4AF37 100%)',
                  borderRadius: 16, padding: '18px 24px', marginBottom: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
                  boxShadow: '0 6px 24px -8px rgba(212,175,55,0.6)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: 28, position: 'relative', zIndex: 1 }}>🚚</span>
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#071A07', fontFamily: '"Hind Siliguri",sans-serif', lineHeight: 1.2 }}>
                      যেকোনো ৩টি নোটবুক কিনলে ফ্রি ডেলিভারি পাবে!
                    </div>
                    <div style={{ fontSize: 12, color: '#2E4A2E', fontFamily: '"Inter",sans-serif', marginTop: 3, fontWeight: 600 }}>
                      🎁 সারাদেশে — ঢাকা ও ঢাকার বাইরে উভয়ই প্রযোজ্য
                    </div>
                  </div>
                </div>

                {([{ team: 'Argentina Fan', flag: '🇦🇷', teamColor: '#74ACDF', prods: argentinaProducts }, { team: 'Brazil Fan', flag: '🇧🇷', teamColor: '#009C3B', prods: brazilProducts }] as const).map(({ team, flag, teamColor, prods }) => (
                  <div key={team} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: 18 }}>{flag}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: teamColor, fontFamily: '"Inter",sans-serif' }}>{team}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12 }}>
                      {prods.map((p, i) => {
                        const src = imgUrl(p.images?.[0]);
                        const isOn = selected.has(p._id);
                        const { price } = getProductPrice(p);
                        const col = NOTEBOOK_COLORS[i % NOTEBOOK_COLORS.length];
                        return (
                          <button key={p._id} className={`nb-pick${isOn ? ' on' : ''}`} onClick={() => toggleNotebook(p._id)}>
                            <div className="nb-pick-check">
                              {isOn && <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#071A07" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>}
                            </div>
                            {src ? (
                              <img src={src} alt={p.name} loading="lazy" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'contain', borderRadius: '2px 4px 4px 2px', marginBottom: 10, boxShadow: '0 8px 14px -6px rgba(0,0,0,0.4)', filter: isOn ? 'none' : 'grayscale(20%)' }} />
                            ) : (
                              <div className="nb-pmini" style={{ background: col.color, color: col.dark ? '#1a1a1a' : '#fff' }}>
                                <div className="pa">⚽</div>
                                <div className="pt">{p.name}</div>
                                <div className="pa">⚽ 2026</div>
                              </div>
                            )}
                            <div className="nb-ptitle">{p.name}</div>
                            <div className="nb-pprice nb-num">৳{price}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="nb-builder-totals">
                  <div className="nb-totals-left">
                    <div><span className="l">নোটবুক</span><span className="v nb-num">{selected.size} টি</span></div>
                    <div><span className="l">আসল দাম</span><span className="v strike nb-num">৳{selectedOriginal}</span></div>
                    <div><span className="l">ছাড়</span><span className="v gold nb-num">{discountPct}%</span></div>
                    <div><span className="l">তুমি দিচ্ছ</span><span className="v nb-num">৳{selectedTotal}</span></div>
                  </div>
                </div>

                <button className="nb-builder-cta" onClick={handleBundleCheckout}>
                  নির্বাচিত {selected.size}টি নোটবুক অর্ডার করো
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <div className="nb-builder-fineprint">
                  <span>✓ ক্যাশ অন ডেলিভারি</span>
                  <span>✓ ৩-৫ দিনে ডেলিভারি</span>
                  <span>✓ পছন্দ না হলে রিটার্ন</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quality ── */}
        <section className="nb-quality-section">
          <div className="nb-container">
            <div ref={r6} style={fadeStyle}>
              <div className="nb-section-head">
                <div className="nb-section-eyebrow">প্রিমিয়াম কোয়ালিটি</div>
                <h2 className="nb-section-title">৬টি নোটবুক একসাথে পাচ্ছো ৫৩% ছাড়ে</h2>
                <p className="nb-section-sub">প্রিমিয়াম প্রিন্ট, smooth কাগজ এবং মজবুত binding সহ। দেশের যেকোনো প্রান্তে হোম ডেলিভারি।</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { n: 'i.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 16h6"/></svg>, title: '৭০ GSM Offset Paper', body: 'Smooth, ম্যাট ফিনিশের কাগজ — লিখতে আরামদায়ক, কালি ব্লিড করে না।' },
                  { n: 'ii.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><path d="M4 4v16h16"/><path d="M4 4h4v16M16 4h4v16"/></svg>, title: 'Perfect Binding', body: 'মজবুত binding — বহু বছর পরও পাতা খুলে যাবে না।' },
                  { n: 'iii.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 3v18"/></svg>, title: '৩০০ GSM Art Cover', body: 'Matte-laminated প্রিমিয়াম কভার — vibrant রঙ, দীর্ঘস্থায়ী।' },
                  { n: 'iv.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1B6B1B" strokeWidth="1.5"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>, title: 'A5 Ruled Pages', body: 'Standard A5 সাইজ, ruled pages — ব্যাগে বহনে সহজ।' },
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

        {/* ── Reviews ── */}
        <section className="nb-reviews-section">
          <div className="nb-container">
            <div ref={r7} style={fadeStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 46 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {REVIEWS.map((r, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: r.color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 14, marginLeft: i === 0 ? 0 : -10, border: '2px solid #F1F8F1' }}>{r.init}</div>
                  ))}
                </div>
                <div><Stars size={18} /> <span style={{ fontFamily: '"Inter",sans-serif', fontWeight: 600, color: '#2E4A2E', fontSize: 14 }}><b className="nb-num">4.9</b>/৫ · {visitorCount}+ ফুটবল ফ্যান</span></div>
              </div>
              <div className="nb-section-head" style={{ marginBottom: 36 }}>
                <h2 className="nb-section-title">ফুটবল ফ্যানরা কী বলছেন</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 18 }}>
                {REVIEWS.map((r, i) => (
                  <div key={i} className="nb-review">
                    <Stars size={14} />
                    <div className="nb-quote">&ldquo;</div>
                    <p>{r.text}</p>
                    <div className="nb-who">
                      <div className="nb-av" style={{ background: r.color }}>{r.init}</div>
                      <div className="nb-who-l">
                        <b>{r.name}</b>
                        <span>ভেরিফাইড ক্রেতা · {r.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="nb-faq-section">
          <div className="nb-container">
            <div ref={r8} style={fadeStyle}>
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
            <div className="nb-section-eyebrow">আজই নাও</div>
            <h2>⚽ World Cup 2026-এর আগেই তোমার কালেকশন সম্পূর্ণ করো</h2>
            <p>Stock সীমিত — একবার শেষ হলে আর পাবে না।</p>
            <div className="nb-final-cd">
              {[{ v: pad(timeLeft.h), l: 'ঘণ্টা' }, { v: pad(timeLeft.m), l: 'মিনিট' }, { v: pad(timeLeft.s), l: 'সেকেন্ড' }].map((c, i) => (
                <div key={i} className="nb-cd-box">
                  <div className="n nb-num">{c.v}</div>
                  <div className="l">{c.l}</div>
                </div>
              ))}
            </div>
            <div className="nb-cta-row" style={{ justifyContent: 'center' }}>
              <a href="#nb-builder" className="nb-btn nb-btn-primary">
                এখনই অর্ডার করো
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#nb-books" className="nb-btn nb-btn-ghost">নোটবুকগুলো আবার দেখো</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* ── Mobile sticky bar ── */}
      {!atBundle && (
        <div className="nb-mobile-bar">
          <div className="mb-price">
            <span className="now nb-num">৳{selectedTotal}</span>
            <span className="was nb-num">৳{selectedOriginal}</span>
          </div>
          <a href="#nb-builder" className="nb-btn nb-btn-primary" style={{ padding: '12px 18px', fontSize: 14 }}>
            এখনই অর্ডার করো
          </a>
        </div>
      )}

    </>
  );
}
