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

const TIMER_KEY = 'fb_bundle_timer_end';

const BOOKS = [
  {
    slug: 'i-will-teach-you-to-be-rich',
    title: 'I Will Teach You to Be Rich',
    tagline: 'আর্থিক স্বাধীনতার ৬-সপ্তাহের রোডম্যাপ',
    author: 'Ramit Sethi',
    pages: 352,
    salePrice: 681,
    discountAmount: 282,
    discountPct: 41,
    badge: 'NYT Bestseller',
    description: 'মাত্র ৬ সপ্তাহে আর্থিক জীবন গুছিয়ে নেওয়ার সবচেয়ে practical গাইড — সঞ্চয়, বিনিয়োগ, automatic money system।',
    fallbackColor: '#0369a1',
    stock: 11,
    popular: false,
  },
  {
    slug: 'the-intelligent-investor',
    title: 'The Intelligent Investor',
    tagline: 'বিনিয়োগের কালজয়ী বাইবেল',
    author: 'Benjamin Graham',
    pages: 640,
    salePrice: 924,
    discountAmount: 402,
    discountPct: 44,
    badge: 'Warren Buffett পছন্দের',
    description: 'শেয়ার বাজারে বুদ্ধিমানের মতো বিনিয়োগের কালজয়ী নীতি — ঝুঁকি কমিয়ে সম্পদ বাড়ানোর রোডম্যাপ।',
    fallbackColor: '#14532d',
    stock: 8,
    popular: false,
  },
  {
    slug: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    tagline: 'আর্থিক শিক্ষার সবচেয়ে জনপ্রিয় বই',
    author: 'Robert T. Kiyosaki',
    pages: 336,
    salePrice: 423,
    discountAmount: 154,
    discountPct: 36,
    badge: '৩.২ কোটি কপি বিক্রি',
    description: 'ধনী ও গরিব মানুষের চিন্তার পার্থক্য — Asset vs Liability বুঝলেই আর্থিক জীবন বদলায়।',
    fallbackColor: '#92400e',
    stock: 9,
    popular: true,
  },
  {
    slug: 'the-psychology-of-money',
    title: 'The Psychology of Money',
    tagline: 'টাকার মনোবিজ্ঞানের ১৯টি অমূল্য পাঠ',
    author: 'Morgan Housel',
    pages: 256,
    salePrice: 402,
    discountAmount: 143,
    discountPct: 36,
    badge: 'Goodreads Choice',
    description: 'টাকার সাথে আবেগের সম্পর্ক — কেন আমরা ভুল সিদ্ধান্ত নিই এবং কীভাবে সেটা বদলাবো।',
    fallbackColor: '#4c1d95',
    stock: 14,
    popular: false,
  },
  {
    slug: 'think-and-grow-rich',
    title: 'Think and Grow Rich',
    tagline: 'সম্পদ তৈরির মানসিক রহস্য',
    author: 'Napoleon Hill',
    pages: 320,
    salePrice: 555,
    discountAmount: 218,
    discountPct: 39,
    badge: '১০ কোটি+ কপি বিক্রি',
    description: 'বিশ্বের ৫০০+ কোটিপতির সাফল্যের রহস্য — চিন্তাশক্তিই সবচেয়ে বড় সম্পদ।',
    fallbackColor: '#7f1d1d',
    stock: 13,
    popular: false,
  },
];

const FAQS = [
  { q: 'ডেলিভারি কতদিনে পাবো?', a: 'ঢাকার ভেতরে ১-২ দিন, ঢাকার বাইরে ৩-৫ কার্যদিবস।' },
  { q: 'বইগুলো কি ইংরেজিতে?', a: 'হ্যাঁ, সহজ ইংরেজিতে লেখা — যেকেউ পড়তে পারবেন।' },
  { q: 'বই কি অরিজিনাল?', a: 'হ্যাঁ, Shobaz শুধুমাত্র ১০০% অরিজিনাল বই বিক্রি করে।' },
  { q: 'কীভাবে অর্ডার করবো?', a: 'কার্টে যোগ করুন → Checkout → পেমেন্ট। মাত্র ৩ ধাপে অর্ডার সম্পন্ন।' },
  { q: 'রিটার্ন পলিসি কী?', a: 'বই ক্ষতিগ্রস্ত অবস্থায় পেলে বদলে দেওয়া হবে।' },
];

const REVIEWS = [
  { name: 'Md Jubaer Arefin', location: 'ঢাকা', text: 'Psychology of Money পড়ে টাকার প্রতি দৃষ্টিভঙ্গি পুরোপুরি বদলে গেছে। অসাধারণ বই!' },
  { name: 'Mushfiqur Rahman', location: 'চট্টগ্রাম', text: 'Rich Dad Poor Dad আমার জীবনের সেরা বিনিয়োগ। এই বই না পড়লে বুঝতামই না asset কী জিনিস।' },
  { name: 'Taslim', location: 'সিলেট', text: '৫টি বই একসাথে কিনেছি। দাম অনেক কম, বই অরিজিনাল। Shobaz-এর সার্ভিস অসাধারণ!' },
];

const WA_LINK = 'https://wa.me/8801XXXXXXXXX';

function Stars({ size = 16 }: { size?: number }) {
  return <span style={{ color: '#f59e0b', fontSize: size, letterSpacing: 1 }}>★★★★★</span>;
}

function IcWhatsApp({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
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
    }, { threshold: 0.07 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const fadeBase: React.CSSProperties = { opacity: 0, transform: 'translateY(32px)', transition: 'opacity 0.6s ease, transform 0.6s ease' };

export default function FinanceBundleClient() {
  const router = useRouter();
  const [bySlug, setBySlug] = useState<Record<string, Product>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(BOOKS.map((b) => b.slug)));
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [visitorCount, setVisitorCount] = useState(147);
  const [visitorFade, setVisitorFade] = useState(true);
  const [atBundle, setAtBundle] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  useEffect(() => {
    api.get('/product/get-all-data').then((res) => {
      if (res.data?.data) {
        const map: Record<string, Product> = {};
        (res.data.data as Product[]).forEach((p) => { if (p.slug) map[p.slug] = p; });
        setBySlug(map);
      }
    }).catch(() => {});
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', { content_name: 'Finance Bundle', content_ids: BOOKS.map((b) => b.slug), content_type: 'product_group' });
    }
  }, []);

  // 72-hour countdown persisted in localStorage
  useEffect(() => {
    const getOrCreateEnd = () => {
      try {
        const stored = localStorage.getItem(TIMER_KEY);
        if (stored) {
          const end = parseInt(stored, 10);
          if (end > Date.now()) return end;
        }
      } catch {}
      const newEnd = Date.now() + 72 * 3600 * 1000;
      try { localStorage.setItem(TIMER_KEY, String(newEnd)); } catch {}
      return newEnd;
    };
    let end = getOrCreateEnd();
    const tick = () => {
      const d = Math.max(0, end - Date.now());
      setTimeLeft({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
      if (d === 0) {
        const newEnd = Date.now() + 72 * 3600 * 1000;
        try { localStorage.setItem(TIMER_KEY, String(newEnd)); } catch {}
        end = newEnd;
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Dynamic visitor count every 8-12 seconds
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setVisitorFade(false);
        setTimeout(() => {
          setVisitorCount((prev) => {
            const delta = Math.floor(Math.random() * 11) - 5;
            return Math.min(180, Math.max(120, prev + delta));
          });
          setVisitorFade(true);
          schedule();
        }, 300);
      }, 8000 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  // Bundle section visibility for mobile sticky
  useEffect(() => {
    const el = document.getElementById('bundle');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setAtBundle(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const finalPrice = (book: typeof BOOKS[0]) => book.salePrice - book.discountAmount;

  const selectedBooks = BOOKS.filter((b) => selected.has(b.slug));
  const selectedTotal = selectedBooks.reduce((s, b) => s + finalPrice(b), 0);
  const selectedOriginal = selectedBooks.reduce((s, b) => s + b.salePrice, 0);
  const savedAmount = selectedOriginal - selectedTotal;

  const toggleBook = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { if (next.size > 1) next.delete(slug); }
      else next.add(slug);
      return next;
    });
  };

  const handleAddToCart = (slug: string, title: string) => {
    const p = bySlug[slug];
    if (!p) { toast.error('পণ্য লোড হচ্ছে...'); return; }
    addItem(p);
    toast.success(`${title} কার্টে যোগ হয়েছে!`);
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: title, content_ids: [slug], content_type: 'product', currency: 'BDT' });
    }
  };

  const handleBundleCheckout = () => {
    let added = 0;
    selectedBooks.forEach((book) => {
      const p = bySlug[book.slug];
      if (p) { addItem(p); added++; }
    });
    if (added === 0) { toast.error('পণ্য লোড হচ্ছে, একটু অপেক্ষা করুন'); return; }
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: 'Finance Bundle', content_ids: selectedBooks.map((b) => b.slug), value: selectedTotal, currency: 'BDT' });
    }
    router.push('/checkout');
  };

  const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = [
    useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(),
    useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(),
  ];

  const bookGridCols = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <style>{`
        @keyframes fbPulse {
          0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
          70% { box-shadow: 0 0 0 14px rgba(22,163,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
        }
        @keyframes fbBounce {
          0%,20%,53%,80%,100% { transform: translateY(0); }
          40%,43% { transform: translateY(-14px); }
          70% { transform: translateY(-7px); }
          90% { transform: translateY(-3px); }
        }
        @keyframes fbWaBounce {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <Header />

      {/* ── Urgency bar ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#dc2626', padding: '10px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 8 : 20, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: 'white', fontWeight: 700 }}>
          ⚡ অফার শেষ হচ্ছে:
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((v, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ background: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 15, minWidth: 30, textAlign: 'center' }}>{v}</span>
              {i < 2 && <span style={{ color: 'white', fontWeight: 900 }}>:</span>}
            </span>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#fef9c3', fontWeight: 600, opacity: visitorFade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          🔥 {visitorCount} জন এখন এই পেজ দেখছেন
        </span>
      </div>

      <main style={{ flex: 1 }}>

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section id="top" style={{ background: 'linear-gradient(150deg, #0f4c24 0%, #16a34a 40%, #065f46 100%)', padding: isMobile ? '52px 20px 80px' : '72px 80px 100px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div ref={r1} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '55% 45%', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '8px 20px', marginBottom: 24 }}>
                <span style={{ fontSize: 16 }}>🏆</span>
                <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: 'white', fontWeight: 700 }}>বিশ্বের সেরা ৫টি ফিন্যান্স বই — একসাথে</span>
              </div>
              <h1 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 30 : 46, fontWeight: 900, color: 'white', lineHeight: 1.2, margin: '0 0 16px' }}>
                অর্থনৈতিক স্বাধীনতার পথে আপনার ৫টি সেরা সঙ্গী
              </h1>
              <p style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 16 : 19, color: 'rgba(255,255,255,0.85)', margin: '0 0 28px', lineHeight: 1.65 }}>
                দুনিয়ার সফল মানুষদের পড়া বই — এখন <strong style={{ color: '#fef08a' }}>সর্বোচ্চ ৪৪% ছাড়ে</strong>
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
                {[
                  { icon: '📚', val: '৫০০+', label: 'পাঠক এই মাসে' },
                  { icon: '⭐', val: '৪.৯', label: 'গড় রেটিং' },
                  { icon: '🚚', val: 'ফ্রি', label: 'ডেলিভারি ৯৫০ টাকায়' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 16, color: 'white' }}>{s.val}</div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="#books" style={{ display: 'inline-block', background: 'white', color: '#14532d', fontWeight: 800, fontFamily: 'var(--bn)', borderRadius: 14, padding: '16px 36px', fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,0.25)', transition: 'all .15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.32)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'; }}>
                  সব বই দেখুন ↓
                </a>
                <a href="#bundle" style={{ display: 'inline-block', background: 'transparent', color: 'white', fontWeight: 700, fontFamily: 'var(--bn)', borderRadius: 14, padding: '16px 28px', fontSize: 15, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)', transition: 'all .15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  বান্ডেল অফার দেখুন
                </a>
              </div>
            </div>

            {/* Book stack — larger covers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: isMobile ? 8 : 14, justifyContent: 'center', flexWrap: isMobile ? 'nowrap' : 'wrap', alignItems: 'flex-end' }}>
                {BOOKS.map((book, i) => {
                  const p = bySlug[book.slug];
                  const src = p ? imgUrl(p.images?.[0]) : null;
                  const rots = [-5, -2, 1, 4, -3];
                  const w = isMobile ? 64 : 110;
                  const h = isMobile ? 96 : 165;
                  return (
                    <div key={book.slug}
                      style={{ transform: `rotate(${rots[i]}deg)`, transition: 'transform .25s ease', flexShrink: 0 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.1) translateY(-10px)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rots[i]}deg)`; }}>
                      {src ? (
                        <img src={src} alt={book.title} loading="lazy" style={{ width: w, height: h, objectFit: 'contain', borderRadius: 6, boxShadow: '0 20px 44px rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.2)' }} />
                      ) : (
                        <div style={{ width: w, height: h, borderRadius: 6, background: book.fallbackColor, boxShadow: '0 20px 44px rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 8, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.3 }}>{book.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 20px', display: 'inline-block' }}>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 900, color: '#fef08a' }}>৳1,786</span>
                    <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: 'rgba(255,255,255,0.75)', marginLeft: 8 }}>৫টির মোট দাম</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Pain Points ──────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '48px 20px' : '64px 48px' }}>
          <div ref={r2} style={fadeBase}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)' }}>আপনার সমস্যা চিনি আমরা</span>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#0f172a', margin: '12px 0 0' }}>আপনি কি এই সমস্যায় আছেন?</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, marginBottom: 36 }}>
              {[
                { emoji: '💸', title: 'টাকা কোথায় যায় বোঝা যায় না', body: 'মাস শেষে ব্যাংক ব্যালেন্স দেখে অবাক হন — কিন্তু কোথায় গেল?' },
                { emoji: '📉', title: 'সঞ্চয় হয় না', body: 'ভালো আয় করেও মাস শেষে হাতে কিছু থাকে না — সঞ্চয়ের কোনো system নেই।' },
                { emoji: '😰', title: 'বিনিয়োগ করতে ভয় লাগে', body: 'বিনিয়োগ করতে চান, কিন্তু কোথা থেকে শুরু করবেন বুঝতে পারছেন না।' },
              ].map((c, i) => (
                <div key={i}
                  style={{ background: '#faf7f2', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e8e0d0', borderTop: '4px solid #dc2626', display: 'flex', flexDirection: 'column', gap: 10, transition: 'transform .25s ease, box-shadow .25s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.13)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}>
                  <span style={{ fontSize: 40 }}>{c.emoji}</span>
                  <h3 style={{ fontFamily: 'var(--bn)', fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{c.title}</h3>
                  <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.7 }}>{c.body}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac', borderRadius: 18, padding: isMobile ? '18px 20px' : '20px 36px', textAlign: 'center', borderLeft: '6px solid #16a34a' }}>
              <p style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#14532d', margin: 0 }}>
                ✅ এই ৫টি বই আপনার সব প্রশ্নের উত্তর দেবে — গ্যারান্টি
              </p>
            </div>
          </div>
        </section>

        {/* ── Benefits ────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0f172a', padding: isMobile ? '52px 20px' : '72px 80px' }}>
          <div ref={r3} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ background: 'rgba(22,163,74,0.2)', color: '#4ade80', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)' }}>আপনি যা শিখবেন</span>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'white', margin: '12px 0 0' }}>এই বইগুলো পড়ে আপনার জীবন বদলাবে</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
              {[
                { icon: '💡', text: 'কীভাবে চিন্তা করলে টাকা আসে' },
                { icon: '🔍', text: 'কেন ভালো আয় করেও টাকা ধরে রাখা যায় না' },
                { icon: '🧠', text: 'কীভাবে emotions ভুল financial decision তৈরি করে' },
                { icon: '📈', text: 'কীভাবে বিনিয়োগ করলে সম্পদ বাড়ে' },
                { icon: '⚡', text: 'কীভাবে simple habits আর্থিক জীবন বদলায়' },
                { icon: '🏦', text: 'কীভাবে smart money management system তৈরি করতে হয়' },
              ].map((p, i) => (
                <div key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, background: i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', borderLeft: '3px solid #16a34a', transition: 'background .2s ease, border .2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(22,163,74,0.12)'; e.currentTarget.style.border = '1px solid rgba(22,163,74,0.3)'; e.currentTarget.style.borderLeft = '3px solid #4ade80'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; e.currentTarget.style.borderLeft = '3px solid #16a34a'; }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontFamily: 'var(--bn)', fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Book Cards ──────────────────────────────────────────────────────── */}
        <section id="books" style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '52px 20px' : '72px 40px' }}>
          <div ref={r4} style={fadeBase}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ background: '#fef9c3', color: '#92400e', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)' }}>সীমিত সময়ের অফার</span>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#0f172a', margin: '12px 0 6px' }}>৫টি সেরা ফিন্যান্স বই</h2>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#6b7280', margin: 0 }}>প্রতিটি বই আপনার আর্থিক চিন্তাভাবনা সম্পূর্ণ বদলে দেবে</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: bookGridCols, gap: 20, alignItems: 'stretch' }}>
              {BOOKS.map((book, idx) => {
                const p = bySlug[book.slug];
                const src = p ? imgUrl(p.images?.[0]) : null;
                const price = finalPrice(book);
                const isLastTablet = isTablet && idx === 4;
                return (
                  <div
                    key={book.slug}
                    style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .25s ease, box-shadow .25s ease', position: 'relative', gridColumn: isLastTablet ? '1 / -1' : undefined, maxWidth: isLastTablet ? 400 : undefined, margin: isLastTablet ? '0 auto' : undefined, width: isLastTablet ? '100%' : undefined }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; }}
                  >
                    {/* Popular badge */}
                    {book.popular && (
                      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontFamily: 'var(--bn)', fontWeight: 800, boxShadow: '0 4px 12px rgba(234,88,12,0.5)' }}>
                        সবচেয়ে জনপ্রিয়
                      </div>
                    )}

                    {/* Cover */}
                    <div style={{ position: 'relative', height: 240, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {src ? (
                        <img src={src} alt={book.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform .3s ease' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: book.fallbackColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.4, fontWeight: 700 }}>{book.title}</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, background: '#dc2626', color: 'white', borderRadius: '50%', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontWeight: 900, fontSize: 14, fontFamily: 'var(--sans)', lineHeight: 1, boxShadow: '0 4px 12px rgba(220,38,38,0.5)' }}>
                        <span>{book.discountPct}%</span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--bn)' }}>ছাড়</span>
                      </div>
                      <div style={{ position: 'absolute', bottom: 10, left: 12, right: book.popular ? 60 : 12 }}>
                        <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', color: 'white', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--sans)', fontWeight: 700 }}>{book.badge}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.3 }}>{book.title}</h3>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#16a34a', margin: '0 0 2px', fontStyle: 'italic', fontWeight: 600 }}>{bySlug[book.slug]?.taglineEn ?? book.tagline}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#9ca3af', margin: 0 }}>{book.author}</p>
                          <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: '#9ca3af', margin: 0 }}>{book.pages} পেজ</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Stars size={13} />
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: '#6b7280' }}>(৪.৯) • ১০০+ রিভিউ</span>
                      </div>
                      <p style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0, flex: 1 }}>{book.description}</p>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 900, color: '#16a34a' }}>৳{price}</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>৳{book.salePrice}</span>
                        <span style={{ fontFamily: 'var(--bn)', fontSize: 11, color: '#dc2626', fontWeight: 700, marginLeft: 'auto' }}>৳{book.discountAmount} সাশ্রয়</span>
                      </div>

                      {/* Scarcity */}
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#e65c00', fontWeight: 700 }}>
                        ⚡ মাত্র {book.stock} টি বাকি আছে
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/${book.slug}`} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e5e7eb', color: '#374151', background: 'transparent', borderRadius: 12, padding: '10px 8px', fontFamily: 'var(--bn)', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all .15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
                          বিস্তারিত
                        </Link>
                        <button onClick={() => handleAddToCart(book.slug, book.title)} style={{ flex: 2, background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, padding: '10px 8px', fontFamily: 'var(--bn)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .15s ease, transform .15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'none'; }}>
                          কার্টে যোগ করুন
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Bundle Selector ──────────────────────────────────────────────────── */}
        <section id="bundle" style={{ padding: isMobile ? '0 20px 56px' : '0 48px 72px', maxWidth: 1200, margin: '0 auto' }}>
          <div ref={r5} style={{ ...fadeBase, background: 'white', borderRadius: 28, boxShadow: '0 8px 48px rgba(0,0,0,0.10)', overflow: 'hidden', border: '2px solid #bbf7d0' }}>
            <div style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)', padding: isMobile ? '24px 20px' : '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 14px', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--bn)', fontSize: 12, color: 'white', fontWeight: 700 }}>🎉 সবচেয়ে বেশি সাশ্রয়</span>
                </div>
                <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 20 : 26, fontWeight: 900, color: 'white', margin: 0 }}>
                  বই বেছে নিন — তারপর সরাসরি অর্ডার করুন
                </h2>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>নির্বাচিত বইয়ের দাম</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 28, fontWeight: 900, color: '#fef08a' }}>৳{selectedTotal}</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>৳{selectedOriginal}</span>
                </div>
                <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#86efac', fontWeight: 700 }}>৳{savedAmount} সাশ্রয়</div>
              </div>
            </div>

            <div style={{ padding: isMobile ? '20px 16px' : '28px 40px' }}>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#6b7280', margin: '0 0 20px', textAlign: 'center' }}>
                যে বইগুলো চান সেগুলো টিক দিন → তারপর নিচের বোতাম চাপুন
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? 12 : 16, marginBottom: 28 }}>
                {BOOKS.map((book) => {
                  const p = bySlug[book.slug];
                  const src = p ? imgUrl(p.images?.[0]) : null;
                  const price = finalPrice(book);
                  const isSelected = selected.has(book.slug);
                  return (
                    <div
                      key={book.slug}
                      onClick={() => toggleBook(book.slug)}
                      style={{ position: 'relative', cursor: 'pointer', borderRadius: 16, border: `2.5px solid ${isSelected ? '#16a34a' : '#e5e7eb'}`, background: isSelected ? '#f0fdf4' : '#fafafa', transition: 'all .2s ease', overflow: 'hidden', boxShadow: isSelected ? '0 4px 16px rgba(22,163,74,0.2)' : '0 2px 8px rgba(0,0,0,0.04)' }}
                    >
                      <div style={{ height: isMobile ? 110 : 140, background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {src ? (
                          <img src={src} alt={book.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: isSelected ? 'none' : 'grayscale(20%)' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: book.fallbackColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: 9, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.4 }}>{book.title}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '10px 10px 12px' }}>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.3 }}>{book.title}</p>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 9, color: '#16a34a', margin: '0 0 2px', fontStyle: 'italic', lineHeight: 1.3 }}>{bySlug[book.slug]?.taglineEn ?? book.tagline}</p>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 9, color: '#9ca3af', margin: '0 0 4px' }}>{book.author} · {book.pages}p</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 900, color: isSelected ? '#16a34a' : '#6b7280' }}>৳{price}</span>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: '#9ca3af', textDecoration: 'line-through' }}>৳{book.salePrice}</span>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: isSelected ? '#16a34a' : 'rgba(255,255,255,0.9)', border: `2px solid ${isSelected ? '#16a34a' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                        {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 16, padding: isMobile ? '16px' : '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: isMobile ? 12 : 24, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#9ca3af' }}>নির্বাচিত বই</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{selected.size}টি</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#9ca3af' }}>আলাদা দাম</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 700, color: '#9ca3af', textDecoration: 'line-through' }}>৳{selectedOriginal}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#16a34a', fontWeight: 700 }}>আপনার দাম</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 24, fontWeight: 900, color: '#16a34a' }}>৳{selectedTotal}</div>
                  </div>
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: '6px 14px' }}>
                    <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#dc2626', fontWeight: 800 }}>সাশ্রয় হচ্ছে</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 900, color: '#dc2626' }}>৳{savedAmount}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                {['✅ সারা বাংলাদেশে ডেলিভারি', '✅ ১০০% অরিজিনাল', '✅ দ্রুত ডেলিভারি', '✅ নিরাপদ পেমেন্ট'].map((t, i) => (
                  <span key={i} style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#374151', fontWeight: 600 }}>{t}</span>
                ))}
              </div>

              {/* Pulse CTA button */}
              <button
                onClick={handleBundleCheckout}
                style={{ width: '100%', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 16, padding: '20px 40px', fontFamily: 'var(--bn)', fontSize: isMobile ? 16 : 19, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 28px rgba(22,163,74,0.4)', transition: 'all .15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, animation: 'fbPulse 2s infinite' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(22,163,74,0.5)'; e.currentTarget.style.animation = 'none'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(22,163,74,0.4)'; e.currentTarget.style.animation = 'fbPulse 2s infinite'; }}
              >
                <span>🛒</span>
                <span>নির্বাচিত {selected.size}টি বই কার্টে যোগ করুন → চেকআউট</span>
              </button>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '10px 0 0' }}>
                ক্লিক করলে সরাসরি চেকআউটে যাবেন
              </p>
            </div>
          </div>
        </section>

        {/* ── Book Quality ────────────────────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: isMobile ? '52px 20px' : '72px 80px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)', border: '1px solid rgba(251,191,36,0.3)' }}>প্রিমিয়াম মান</span>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'white', margin: '12px 0 8px' }}>দেশের সেরা কোয়ালিটি</h2>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: 0 }}>প্রতিটি বই হাতে নিলেই পার্থক্য বুঝবেন</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { icon: '📄', title: '70 GSM Offset Paper', body: 'চোখের জন্য আরামদায়ক উজ্জ্বল সাদা পেপার — দীর্ঘ সময় পড়লেও চোখ ক্লান্ত হয় না।', color: '#3b82f6' },
                { icon: '📚', title: 'Good Binding', body: 'শক্তিশালী perfect binding — বারবার পড়লেও পেজ খুলে পড়বে না, বছরের পর বছর টেকে।', color: '#16a34a' },
                { icon: '🎨', title: '300 GSM Artcut Cover', body: 'মোটা আর্টকাট কভার — চকচকে lamination-এ দেখতে যেমন সুন্দর, টেকসইও তেমনই।', color: '#ea580c' },
                { icon: '🏆', title: 'দেশের সেরা কোয়ালিটি', body: 'বাংলাদেশের সেরা মুদ্রণ প্রযুক্তি ব্যবহার করে তৈরি — international standard-এ নির্মিত।', color: '#fbbf24' },
              ].map((q, i) => (
                <div key={i}
                  style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '28px 22px', border: `1px solid rgba(255,255,255,0.08)`, display: 'flex', flexDirection: 'column', gap: 14, transition: 'all .2s ease', borderTop: `3px solid ${q.color}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${q.color}20`, border: `1px solid ${q.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{q.icon}</div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.3 }}>{q.title}</h3>
                    <p style={{ fontFamily: 'var(--bn)', fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.75 }}>{q.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 16, padding: isMobile ? '16px 20px' : '18px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <p style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#4ade80', margin: 0, textAlign: 'center' }}>
                প্রতিটি বই হাতে পেয়ে সন্তুষ্ট না হলে আমরা বদলে দেব — এটাই আমাদের প্রতিশ্রুতি
              </p>
            </div>
          </div>
        </section>

        {/* ── Reviews ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#f8fafc', padding: isMobile ? '52px 20px' : '72px 80px' }}>
          <div ref={r6} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto' }}>
            {/* Summary bar */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 999, padding: '10px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20, border: '1px solid #e5e7eb' }}>
                <Stars size={22} />
                <span style={{ fontFamily: 'var(--bn)', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>গড় রেটিং: ৪.৯/৫</span>
                <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#9ca3af' }}>—</span>
                <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#6b7280' }}>৫০০+ পাঠক</span>
              </div>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>পাঠকরা কী বলছেন</h2>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#6b7280', margin: 0 }}>৫০০+ সন্তুষ্ট পাঠকের মধ্যে থেকে কিছু মতামত</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
              {REVIEWS.map((r, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
                  {/* Decorative quote */}
                  <div style={{ position: 'absolute', top: 12, right: 20, fontSize: 72, color: '#c9a84c', opacity: 0.18, fontWeight: 900, fontFamily: 'serif', lineHeight: 1 }}>&ldquo;</div>
                  <Stars size={16} />
                  <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0, position: 'relative', zIndex: 1 }}>&ldquo;{r.text}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #14532d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                      <span style={{ color: 'white', fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 800 }}>{r.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✅ যাচাইকৃত ক্রেতা · {r.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
        <section style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '52px 20px' : '72px 48px' }}>
          <div ref={r7} style={fadeBase}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>সচরাচর জিজ্ঞাসা</h2>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#9ca3af', margin: 0 }}>যেকোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন</p>
            </div>
            <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background .2s ease' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--bn)', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{faq.q}</span>
                    <span style={{ color: '#16a34a', fontSize: 18, fontWeight: 900, flexShrink: 0, transition: 'transform .25s ease', transform: openFaq === i ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
                  </button>
                  <div style={{ maxHeight: openFaq === i ? '200px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease', borderLeft: openFaq === i ? '4px solid #16a34a' : '4px solid transparent' }}>
                    <div style={{ padding: '0 24px 20px', fontFamily: 'var(--bn)', fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* WhatsApp CTA below FAQ */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '14px 28px', textDecoration: 'none', transition: 'all .2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#dcfce7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}>
                <span style={{ color: '#25D366' }}><IcWhatsApp size={20} /></span>
                <span style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#14532d', fontWeight: 700 }}>আরও প্রশ্ন আছে? WhatsApp-এ জিজ্ঞেস করুন →</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #14532d 100%)', padding: isMobile ? '60px 20px' : '80px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', pointerEvents: 'none' }} />
          <div ref={r8} style={{ ...fadeBase, position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--bn)', fontSize: 40, marginBottom: 12 }}>📚</div>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 26 : 40, fontWeight: 900, color: 'white', margin: '0 0 14px', lineHeight: 1.2 }}>
              আজকেই শুরু হোক আপনার আর্থিক যাত্রা
            </h2>
            <p style={{ fontFamily: 'var(--bn)', fontSize: 16, color: 'rgba(255,255,255,0.65)', margin: '0 0 12px' }}>
              সীমিত স্টক — অফার যেকোনো সময় শেষ হতে পারে
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
              {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((v, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, padding: '4px 12px', fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 18 }}>{v}</span>
                  {i < 2 && <span style={{ color: '#fef08a', fontWeight: 900, fontSize: 20 }}>:</span>}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#bundle" style={{ display: 'inline-block', background: '#16a34a', color: 'white', fontWeight: 800, fontFamily: 'var(--bn)', borderRadius: 16, padding: '18px 48px', fontSize: 17, textDecoration: 'none', boxShadow: '0 8px 28px rgba(22,163,74,0.45)', transition: 'all .15s ease', animation: 'fbPulse 2s infinite' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.animation = 'none'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.animation = 'fbPulse 2s infinite'; }}>
                এখনই অর্ডার করুন →
              </a>
              <a href="#books" style={{ display: 'inline-block', background: 'transparent', color: 'white', fontWeight: 700, fontFamily: 'var(--bn)', borderRadius: 16, padding: '18px 32px', fontSize: 16, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', transition: 'all .15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                বইগুলো দেখুন
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* ── Mobile sticky CTA ────────────────────────────────────────────────── */}
      {isMobile && !atBundle && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 998, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--bn)', fontSize: 11, color: '#9ca3af' }}>{selected.size}টি বই নির্বাচিত</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 900, color: '#16a34a' }}>৳{selectedTotal}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>৳{selectedOriginal}</span>
              </div>
            </div>
            <a href="#bundle" style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, padding: '13px 20px', fontFamily: 'var(--bn)', fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block' }}>
              বই বেছে নিন →
            </a>
          </div>
        </div>
      )}

      {/* ── Floating WhatsApp button ─────────────────────────────────────────── */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp-এ অর্ডার করুন"
        style={{ position: 'fixed', bottom: isMobile ? 80 : 28, right: 24, zIndex: 9999, background: '#25D366', color: 'white', borderRadius: isMobile ? 999 : 999, padding: isMobile ? '14px 18px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', boxShadow: '0 6px 24px rgba(37,211,102,0.45)', animation: 'fbWaBounce 2.5s ease-in-out infinite', transition: 'all .2s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.animation = 'none'; e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,211,102,0.6)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.animation = 'fbWaBounce 2.5s ease-in-out infinite'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,211,102,0.45)'; }}
      >
        <IcWhatsApp size={22} />
        {(!isMobile) && <span style={{ fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>অর্ডার করুন WhatsApp-এ</span>}
        {isMobile && <span style={{ fontFamily: 'var(--bn)', fontSize: 12, fontWeight: 700 }}>WhatsApp</span>}
      </a>
    </div>
  );
}
