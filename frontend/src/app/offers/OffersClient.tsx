'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/common/ProductCard';
import api, { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ── Price helpers (same logic as ProductCard) ──────────────────────────────
function getCurrentPrice(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  return discount > 0 ? salePrice - discount : salePrice;
}
function getDiscountPercent(p: Product) {
  const salePrice = p.salePrice || 0;
  const discount = p.discountAmount || 0;
  if (!discount || !salePrice) return 0;
  return Math.round((discount / salePrice) * 100);
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IcTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IcFlame = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const IcGift = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const IcTruck = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <path d="m16 8 4 1 3 3v4h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const IcPercent = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="19" cy="5" r="2"/>
    <circle cx="5" cy="19" r="2"/>
    <line x1="20.5" y1="3.5" x2="3.5" y2="20.5"/>
    <line x1="9" y1="9" x2="15" y2="15" strokeOpacity="0"/>
  </svg>
);
const IcBooks = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <line x1="8" y1="7" x2="16" y2="7"/>
    <line x1="8" y1="11" x2="16" y2="11"/>
  </svg>
);
const IcUsers = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IcWhatsApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);
const IcBrain = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.14A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.14A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);
const IcZap = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcTrendingUp = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcCompass = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IcBriefcase = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="12.01"/>
    <path d="M2 12h20"/>
  </svg>
);
const IcMessageCircle = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcCoin = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v2m0 8v2m-4-6h8"/>
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2.5-5 2.5-5 5a2.5 2.5 0 0 0 5 0"/>
  </svg>
);

// ── Bundle data ──────────────────────────────────────────────────────────────
const BUNDLES = [
  {
    label: 'কম্বো ১',
    name: 'সেলফ-হেল্প ট্রিও',
    books: ['Atomic Habits', 'The Subtle Art of Not Giving a F*ck', 'Deep Focus'],
    slugs: ['atomic-habits', 'the-subtle-art-of-not-giving-a-fck', 'deep-focus'],
    individualTotal: 744,
    bundlePrice: 649,
    save: 95,
    gradients: ['#1e3a8a', '#064e3b', '#7e22ce'],
  },
  {
    label: 'কম্বো ২',
    name: 'ফাইন্যান্স ট্রিও',
    books: ['The Psychology of Money', 'Rich Dad Poor Dad', 'Think and Grow Rich'],
    slugs: ['the-psychology-of-money', 'rich-dad-poor-dad', 'think-and-grow-rich'],
    individualTotal: 869,
    bundlePrice: 749,
    save: 120,
    gradients: ['#0369a1', '#065f46', '#92400e'],
  },
  {
    label: 'কম্বো ৩',
    name: 'লিডারশিপ মাস্টারপ্যাক',
    books: ['The 48 Laws of Power', 'Start with Why', 'Drive'],
    slugs: ['the-48-laws-of-power', 'start-with-why', 'drive'],
    individualTotal: 1047,
    bundlePrice: 899,
    save: 148,
    gradients: ['#1c1917', '#0f172a', '#14532d'],
  },
];

// ── Category data ──────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: 'মার্কেটিং ও লিডারশিপ',
    discount: '৩৫% পর্যন্ত',
    slug: 'marketing-leadership',
    gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    icon: <IcTrendingUp />,
  },
  {
    name: 'ফিলোসফি ও প্রজ্ঞা',
    discount: '৩০% পর্যন্ত',
    slug: 'philosophy-wisdom',
    gradient: 'linear-gradient(135deg, #15803d, #16a34a)',
    icon: <IcCompass />,
  },
  {
    name: 'বিজনেস ও উদ্যোক্তা',
    discount: '৩৮% পর্যন্ত',
    slug: 'business-entrepreneurship',
    gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    icon: <IcBriefcase />,
  },
  {
    name: 'মাইন্ডসেট ও সাইকোলজি',
    discount: '৪০% পর্যন্ত',
    slug: 'mindset-psychology',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    icon: <IcBrain />,
  },
  {
    name: 'পিপল স্কিলস ও কমিউনিকেশন',
    discount: '৪৫% পর্যন্ত',
    slug: 'people-skills-communication',
    gradient: 'linear-gradient(135deg, #9333ea, #c084fc)',
    icon: <IcMessageCircle />,
  },
  {
    name: 'ফিন্যান্স ও ওয়েলথ',
    discount: '৪২% পর্যন্ত',
    slug: 'finance-wealth',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    icon: <IcCoin />,
  },
  {
    name: 'প্রোডাক্টিভিটি ও হ্যাবিট',
    discount: '৫২% পর্যন্ত',
    slug: 'productivity-habits',
    gradient: 'linear-gradient(135deg, #ea580c, #f97316)',
    icon: <IcZap />,
  },
];

// ── Urgency stock (seeded by index so it's stable across renders) ──────────
const STOCK = [4, 7, 3, 9, 5, 6, 3, 8];

// ── Book texture SVG as data URI ───────────────────────────────────────────
const BOOK_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='8' y='6' width='24' height='28' rx='2' fill='none' stroke='white' stroke-width='1.2' opacity='0.12'/%3E%3Cline x1='8' y1='15' x2='32' y2='15' stroke='white' stroke-width='0.8' opacity='0.08'/%3E%3Cline x1='8' y1='20' x2='32' y2='20' stroke='white' stroke-width='0.8' opacity='0.08'/%3E%3Cline x1='8' y1='25' x2='32' y2='25' stroke='white' stroke-width='0.8' opacity='0.08'/%3E%3C/svg%3E")`;

// ── Responsive hook ────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function OffersClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const addItem = useCartStore((s) => s.addItem);
  const isMobile = useIsMobile();

  // Fetch products
  useEffect(() => {
    api
      .get('/product/get-all-data')
      .then((res) => {
        if (res.data?.data) setProducts(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Countdown to midnight
  useEffect(() => {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 0);
    const tick = () => {
      const diff = Math.max(0, endOfDay.getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Sort products by discount % desc
  const sorted = [...products].sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
  const flashDeals = sorted.slice(0, 8);
  const heroBooks = sorted.slice(0, 5);

  // Build slug→product map for bundle covers
  const bySlug: Record<string, Product> = {};
  products.forEach((p) => { if (p.slug) bySlug[p.slug] = p; });

  // Build category→products map for category thumbnails
  // API returns category as array of objects [{slug, name, ...}]
  const byCat: Record<string, Product[]> = {};
  products.forEach((p) => {
    const cats = Array.isArray((p as any).category) ? (p as any).category : [(p as any).category];
    cats.forEach((c: any) => {
      const slug = c?.slug || '';
      if (!slug) return;
      if (!byCat[slug]) byCat[slug] = [];
      if (byCat[slug].length < 3) byCat[slug].push(p);
    });
  });

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleBundleCart = (bundle: typeof BUNDLES[0]) => {
    let added = 0;
    bundle.slugs.forEach((slug) => {
      const p = bySlug[slug];
      if (p) { addItem(p); added++; }
    });
    toast.success(added > 0 ? `${bundle.name} কার্টে যোগ হয়েছে!` : 'পণ্য লোড হয়নি — পরে চেষ্টা করুন');
  };

  // ── Book cover fallback pill ───────────────────────────────────────────
  const CoverFallback = ({ color, size = 60 }: { color: string; size?: number }) => (
    <div style={{ width: size, height: size * 1.5, borderRadius: 4, background: color, flexShrink: 0 }} />
  );

  // ── Hero rotations ────────────────────────────────────────────────────
  const ROTS = [-6, -2, 0, 4, 8];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Header />

      <main style={{ flex: 1 }}>

        {/* ─────────────────────────────────────────────────────────────────
            Section 1 — Hero Banner
        ───────────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: `${BOOK_TEXTURE}, linear-gradient(135deg, #14532d 0%, #16a34a 50%, #15803d 100%)`,
            backgroundSize: '40px 40px, cover',
            padding: isMobile ? '48px 20px 72px' : '60px 80px 90px',
          }}
        >
          <div
            style={{
              maxWidth: 1360,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 48,
              alignItems: 'center',
            }}
          >
            {/* Left */}
            <div>
              {/* Pill badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 18px', marginBottom: 20 }}>
                <span style={{ color: 'white' }}><IcTag /></span>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 600, fontFamily: 'var(--bn)' }}>সীমিত সময়ের অফার</span>
              </div>

              <h1 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 32 : 48, fontWeight: 900, color: 'white', lineHeight: 1.2, margin: '0 0 12px' }}>
                সেরা বইগুলো, সেরা দামে
              </h1>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 18, color: 'rgba(255,255,255,0.80)', margin: '0 0 24px', lineHeight: 1.5 }}>
                প্রতিদিন নতুন ডিল — বই কিনুন, টাকা বাঁচান
              </p>

              {/* Stat chips */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                {[
                  { label: 'সর্বোচ্চ', value: '৫২%', suffix: ' ছাড়' },
                  { label: '', value: '৫০০+', suffix: ' বইয়ে অফার' },
                ].map((chip, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 14,
                      padding: '12px 20px',
                      color: 'white',
                      fontFamily: 'var(--bn)',
                      fontSize: 14,
                    }}
                  >
                    {chip.label && <span>{chip.label} </span>}
                    <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 18 }}>{chip.value}</span>
                    <span>{chip.suffix}</span>
                  </div>
                ))}
              </div>

              <a
                href="#flash-deals"
                style={{
                  display: 'inline-block',
                  background: 'white',
                  color: '#16a34a',
                  fontWeight: 700,
                  fontFamily: 'var(--bn)',
                  borderRadius: 12,
                  padding: '14px 32px',
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'background .15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                সব অফার দেখুন ↓
              </a>
            </div>

            {/* Right — book stack */}
            {isMobile ? (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {heroBooks.slice(0, 3).map((p, i) => {
                  const src = imgUrl(p.images?.[0]);
                  return src ? (
                    <img
                      key={i}
                      src={src}
                      alt={p.name}
                      style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}
                    />
                  ) : (
                    <CoverFallback key={i} color={['#1e3a8a','#064e3b','#7e22ce'][i % 3]} size={80} />
                  );
                })}
              </div>
            ) : (
              <div style={{ position: 'relative', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {heroBooks.map((p, i) => {
                  const src = imgUrl(p.images?.[0]);
                  const rot = ROTS[i] ?? 0;
                  const offset = (i - 2) * 48;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${offset}px)`,
                        transform: `rotate(${rot}deg) translateX(-50%)`,
                        zIndex: i === 2 ? 5 : i < 2 ? 3 - i : i + 1,
                        transformOrigin: 'bottom center',
                        transition: 'transform .2s ease',
                      }}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={p.name}
                          style={{
                            width: 110,
                            height: 165,
                            objectFit: 'cover',
                            borderRadius: 6,
                            boxShadow: '0 16px 32px rgba(0,0,0,0.4)',
                            border: '2px solid rgba(255,255,255,0.15)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 110,
                            height: 165,
                            borderRadius: 6,
                            background: ['#1e3a8a','#064e3b','#7e22ce','#92400e','#0f172a'][i % 5],
                            boxShadow: '0 16px 32px rgba(0,0,0,0.4)',
                            border: '2px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 8,
                          }}
                        >
                          <span style={{ fontFamily: 'var(--bn)', fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.3 }}>{p.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Fallback books when products not loaded */}
                {heroBooks.length === 0 && ['#1e3a8a','#064e3b','#7e22ce','#92400e','#0f172a'].map((bg, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${(i - 2) * 48}px)`,
                      transform: `rotate(${ROTS[i]}deg) translateX(-50%)`,
                      zIndex: i === 2 ? 5 : 3,
                      width: 110,
                      height: 165,
                      borderRadius: 6,
                      background: bg,
                      boxShadow: '0 16px 32px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            Section 2 — Active Promotions Strip
        ───────────────────────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: isMobile ? '0 16px' : '0 48px',
            marginTop: -30,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 24,
            }}
          >
            {[
              {
                bg: 'linear-gradient(135deg, #fef9c3, #fef08a)',
                border: '#fde68a',
                icon: <IcGift />,
                iconColor: '#d97706',
                title: 'ফ্রি নোটবুক পান!',
                body: '৯৫০ টাকার উপরে যেকোনো অর্ডারে একটি প্রিমিয়াম নোটবুক সম্পূর্ণ বিনামূল্যে',
                badge: 'স্বয়ংক্রিয়ভাবে যোগ হবে',
                badgeBg: '#d97706',
              },
              {
                bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                border: '#93c5fd',
                icon: <IcTruck />,
                iconColor: '#1d4ed8',
                title: 'ফ্রি ডেলিভারি!',
                body: '৫০০ টাকার উপরে অর্ডারে সারাদেশে বিনামূল্যে ডেলিভারি',
                badge: 'অটোমেটিক ছাড়',
                badgeBg: '#1d4ed8',
              },
              {
                bg: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
                border: '#f9a8d4',
                icon: <IcPercent />,
                iconColor: '#db2777',
                title: 'সর্বোচ্চ ৫২% ছাড়!',
                body: 'সিলেক্টেড বইগুলোতে এই সপ্তাহে সর্বোচ্চ ছাড় উপভোগ করুন',
                badge: 'সীমিত সময়',
                badgeBg: '#db2777',
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: card.bg,
                  border: `1.5px solid ${card.border}`,
                  borderRadius: 20,
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ color: card.iconColor }}>{card.icon}</div>
                <h3 style={{ fontFamily: 'var(--bn)', fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, textAlign: 'center' }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
                  {card.body}
                </p>
                <span style={{ background: card.badgeBg, color: 'white', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)' }}>
                  {card.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            Section 3 — Flash Deals
        ───────────────────────────────────────────────────────────────── */}
        <section
          id="flash-deals"
          style={{ maxWidth: 1360, margin: '0 auto', padding: isMobile ? '56px 16px 40px' : '64px 48px 40px' }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#ea580c' }}><IcFlame size={28} /></span>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>আজকের সেরা ডিল</h2>
            </div>

            {/* Countdown timer */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      background: '#0f172a',
                      color: 'white',
                      borderRadius: 8,
                      padding: isMobile ? '6px 10px' : '8px 12px',
                      fontSize: isMobile ? 16 : 20,
                      fontWeight: 900,
                      fontFamily: 'var(--sans)',
                      minWidth: isMobile ? 36 : 44,
                      textAlign: 'center',
                      display: 'inline-block',
                    }}>
                      {val}
                    </span>
                    {i < 2 && <span style={{ color: '#ea580c', fontWeight: 900, fontSize: 20, fontFamily: 'var(--sans)' }}>:</span>}
                  </span>
                ))}
              </div>
              <span style={{ fontFamily: 'var(--bn)', fontSize: 11, color: '#9ca3af' }}>পরে শেষ হবে</span>
            </div>
          </div>

          {/* Flash deal grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#16a34a', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: isMobile ? 16 : 24,
                }}
              >
                {flashDeals.map((product, i) => (
                  <div
                    key={product._id}
                    style={{
                      borderRadius: 16,
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderBottom: '3px solid #ea580c',
                      background: 'white',
                      padding: '16px 16px 12px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                    }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={(p) => { addItem(p); toast.success('কার্টে যোগ হয়েছে!'); }}
                    />
                    {/* Urgency text */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <span style={{ color: '#ea580c' }}><IcFlame size={12} /></span>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#ea580c', fontWeight: 600 }}>
                        মাত্র {STOCK[i % STOCK.length]} টি বাকি
                      </span>
                    </div>
                  </div>
                ))}
                {flashDeals.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 16,
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      height: 280,
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: 36 }}>
                <Link
                  href="/products"
                  style={{
                    display: 'inline-block',
                    border: '2px solid #16a34a',
                    color: '#16a34a',
                    background: 'transparent',
                    borderRadius: 12,
                    padding: '12px 32px',
                    fontFamily: 'var(--bn)',
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all .15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#16a34a'; }}
                >
                  আরও ডিল দেখুন →
                </Link>
              </div>
            </>
          )}
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            Section 4 — Bundle Deals
        ───────────────────────────────────────────────────────────────── */}
        <section style={{ background: 'var(--bg-2)', padding: isMobile ? '40px 16px' : '56px 48px' }}>
          <div style={{ maxWidth: 1360, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#16a34a' }}><IcBooks /></span>
                <h2 style={{ fontFamily: 'var(--bn)', fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>কম্বো অফার — একসাথে কিনুন</h2>
              </div>
              <span style={{ background: '#16a34a', color: 'white', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)' }}>
                সর্বোচ্চ সাশ্রয়
              </span>
            </div>

            {/* Bundle cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
              {BUNDLES.map((bundle, bi) => {
                const covers = bundle.slugs.map((slug) => bySlug[slug]);
                return (
                  <div
                    key={bi}
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      padding: 24,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                      borderTop: '4px solid #16a34a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    {/* Combo label */}
                    <span style={{ background: '#f1f5f9', color: '#6b665a', borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)', alignSelf: 'flex-start' }}>
                      {bundle.label}
                    </span>

                    <h3 style={{ fontFamily: 'var(--bn)', fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {bundle.name}
                    </h3>

                    {/* Overlapping book covers */}
                    <div style={{ position: 'relative', height: 90, display: 'flex', alignItems: 'flex-end' }}>
                      {covers.map((p, ci) => {
                        const src = p ? imgUrl(p.images?.[0]) : null;
                        return src ? (
                          <img
                            key={ci}
                            src={src}
                            alt={p?.name}
                            style={{
                              position: 'absolute',
                              left: ci * 28,
                              width: 60,
                              height: 90,
                              objectFit: 'cover',
                              borderRadius: 4,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              border: '2px solid white',
                              zIndex: ci + 1,
                            }}
                          />
                        ) : (
                          <div
                            key={ci}
                            style={{
                              position: 'absolute',
                              left: ci * 28,
                              width: 60,
                              height: 90,
                              borderRadius: 4,
                              background: bundle.gradients[ci] || '#374151',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              border: '2px solid white',
                              zIndex: ci + 1,
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Book titles */}
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {bundle.books.map((title, ti) => (
                        <li key={ti} style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                          {title}
                        </li>
                      ))}
                    </ul>

                    {/* Pricing */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#9ca3af' }}>
                        আলাদাভাবে কিনলে:{' '}
                        <span style={{ textDecoration: 'line-through', fontFamily: 'var(--sans)' }}>৳{bundle.individualTotal}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--bn)', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>কম্বো মূল্য:</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 900, color: '#16a34a' }}>৳{bundle.bundlePrice}</span>
                      </div>
                      <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)', alignSelf: 'flex-start' }}>
                        আপনি বাঁচাচ্ছেন ৳{bundle.save}
                      </span>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleBundleCart(bundle)}
                      style={{
                        width: '100%',
                        background: '#ea580c',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        padding: '14px 0',
                        fontFamily: 'var(--bn)',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background .15s ease',
                        marginTop: 'auto',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#c2410c')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ea580c')}
                    >
                      কম্বো কার্টে যোগ করুন
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            Section 5 — Category Sales
        ───────────────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: isMobile ? '40px 16px' : '56px 48px' }}>
          <h2 style={{ fontFamily: 'var(--bn)', fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 28px' }}>
            ক্যাটাগরি অনুযায়ী ছাড়
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {CATEGORIES.map((cat, ci) => {
              const catBooks = byCat[cat.slug] || [];
              const isLastOdd = ci === CATEGORIES.length - 1 && CATEGORIES.length % 2 !== 0;
              return (
                <Link
                  key={ci}
                  href={`/products?category=${cat.slug}`}
                  style={{
                    borderRadius: 20,
                    overflow: 'hidden',
                    height: isMobile ? 120 : 180,
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    textDecoration: 'none',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    transition: 'transform .2s ease, box-shadow .2s ease',
                    gridColumn: isLastOdd ? 'span 2' : undefined,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; }}
                >
                  {/* Left: gradient + text */}
                  <div style={{ background: cat.gradient, padding: isMobile ? '16px 14px' : '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                    <div style={{ marginBottom: 8 }}>{cat.icon}</div>
                    <div style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 14 : 18, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                      {cat.name}
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: isMobile ? 20 : 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                      {cat.discount}
                    </div>
                  </div>

                  {/* Right: book thumbnails + button */}
                  <div style={{ background: 'white', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', minWidth: isMobile ? 90 : 130 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: -4, position: 'relative', height: isMobile ? 60 : 110, width: 60 }}>
                      {(catBooks.length > 0 ? catBooks : Array(3).fill(null)).map((p: Product | null, ti: number) => {
                        const src = p ? imgUrl(p.images?.[0]) : null;
                        return src ? (
                          <img
                            key={ti}
                            src={src}
                            alt={p?.name}
                            style={{
                              position: 'absolute',
                              top: ti * (isMobile ? 16 : 24),
                              left: ti * 4,
                              width: isMobile ? 36 : 50,
                              height: isMobile ? 52 : 70,
                              objectFit: 'cover',
                              borderRadius: 3,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              border: '1.5px solid white',
                              zIndex: ti + 1,
                            }}
                          />
                        ) : (
                          <div
                            key={ti}
                            style={{
                              position: 'absolute',
                              top: ti * (isMobile ? 16 : 24),
                              left: ti * 4,
                              width: isMobile ? 36 : 50,
                              height: isMobile ? 52 : 70,
                              borderRadius: 3,
                              background: ['#e0e7ff','#dcfce7','#fce7f3'][ti % 3],
                              border: '1.5px solid white',
                              zIndex: ti + 1,
                            }}
                          />
                        );
                      })}
                    </div>
                    <span style={{ background: 'white', border: '1.5px solid #e5e7eb', color: '#374151', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                      দেখুন →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            Section 6 — Referral / Loyalty Nudge
        ───────────────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: isMobile ? '0 16px 48px' : '0 48px 64px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #fef9c3, #fef3c7)',
              border: '1.5px solid #fde68a',
              borderRadius: 24,
              padding: isMobile ? '36px 24px' : '48px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#d97706' }}>
              <IcUsers />
            </div>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
              বন্ধুকে বইয়ের কথা বলুন
            </h2>
            <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#374151', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
              আপনার পরিচিত কেউ বই পড়তে ভালোবাসে? শবাজের অফারগুলো শেয়ার করুন — ভালো বই, ভালো দাম
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
              <a
                href="https://www.facebook.com/sharer/sharer.php?u=https://shobaz.com/offers"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#1877f2',
                  color: 'white',
                  borderRadius: 12,
                  padding: '12px 28px',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity .15s ease',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <IcFacebook />
                Facebook-এ শেয়ার করুন
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('শবাজে দারুণ বই অফার চলছে! দেখো: https://shobaz.com/offers')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#25D366',
                  color: 'white',
                  borderRadius: 12,
                  padding: '12px 28px',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity .15s ease',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <IcWhatsApp />
                WhatsApp-এ শেয়ার করুন
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
