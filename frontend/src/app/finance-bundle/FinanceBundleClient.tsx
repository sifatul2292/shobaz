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

// ── Static book data ───────────────────────────────────────────────────────────
const BOOKS = [
  {
    slug: 'i-will-teach-you-to-be-rich',
    title: 'I Will Teach You to Be Rich',
    author: 'Ramit Sethi',
    salePrice: 681,
    discountAmount: 282,
    discountPct: 41,
    badge: 'NYT Bestseller',
    description: 'মাত্র ৬ সপ্তাহে আর্থিক জীবন গুছিয়ে নেওয়ার সবচেয়ে practical গাইড — সঞ্চয়, বিনিয়োগ, automatic money system।',
    fallbackColor: '#0369a1',
  },
  {
    slug: 'the-intelligent-investor',
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    salePrice: 924,
    discountAmount: 402,
    discountPct: 44,
    badge: 'Warren Buffett পছন্দের',
    description: 'শেয়ার বাজারে বুদ্ধিমানের মতো বিনিয়োগের কালজয়ী নীতি — ঝুঁকি কমিয়ে সম্পদ বাড়ানোর রোডম্যাপ।',
    fallbackColor: '#14532d',
  },
  {
    slug: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    salePrice: 423,
    discountAmount: 154,
    discountPct: 36,
    badge: '৩.২ কোটি কপি বিক্রি',
    description: 'ধনী ও গরিব মানুষের চিন্তার পার্থক্য — Asset vs Liability বুঝলেই আর্থিক জীবন বদলায়।',
    fallbackColor: '#92400e',
  },
  {
    slug: 'the-psychology-of-money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    salePrice: 402,
    discountAmount: 143,
    discountPct: 36,
    badge: 'Goodreads Choice',
    description: 'টাকার সাথে আবেগের সম্পর্ক — কেন আমরা ভুল সিদ্ধান্ত নিই এবং কীভাবে সেটা বদলাবো।',
    fallbackColor: '#4c1d95',
  },
  {
    slug: 'think-and-grow-rich',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    salePrice: 555,
    discountAmount: 218,
    discountPct: 39,
    badge: '১০ কোটি+ কপি বিক্রি',
    description: 'বিশ্বের ৫০০+ কোটিপতির সাফল্যের রহস্য — চিন্তাশক্তিই সবচেয়ে বড় সম্পদ।',
    fallbackColor: '#7f1d1d',
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
  { name: 'রাহিম মিয়া', location: 'ঢাকা', text: 'Psychology of Money পড়ে টাকার প্রতি দৃষ্টিভঙ্গি পুরোপুরি বদলে গেছে। অসাধারণ বই!' },
  { name: 'সুমাইয়া আক্তার', location: 'চট্টগ্রাম', text: 'Rich Dad Poor Dad আমার জীবনের সেরা বিনিয়োগ। এই বই না পড়লে বুঝতামই না asset কী জিনিস।' },
  { name: 'করিম সাহেব', location: 'সিলেট', text: '৫টি বই একসাথে কিনেছি। দাম অনেক কম, বই অরিজিনাল। Shobaz-এর সার্ভিস অসাধারণ!' },
];

function Stars({ size = 16 }: { size?: number }) {
  return <span style={{ color: '#f59e0b', fontSize: size, letterSpacing: 1 }}>★★★★★</span>;
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return m;
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
  const addItem = useCartStore((s) => s.addItem);
  const isMobile = useIsMobile();

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

  // Countdown to midnight
  useEffect(() => {
    const end = new Date(); end.setHours(23, 59, 59, 0);
    const tick = () => {
      const d = Math.max(0, end.getTime() - Date.now());
      setTimeLeft({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
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

  // Fade refs
  const [r1, r2, r3, r4, r5, r6, r7, r8] = [useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef(), useFadeRef()];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
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
        <span style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#fef9c3', fontWeight: 600 }}>
          🔥 ১৪৭ জন এখন এই পেজ দেখছেন
        </span>
      </div>

      <main style={{ flex: 1 }}>

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section id="top" style={{ background: 'linear-gradient(150deg, #0f4c24 0%, #16a34a 40%, #065f46 100%)', padding: isMobile ? '52px 20px 80px' : '72px 80px 100px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div ref={r1} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '55% 45%', gap: 48, alignItems: 'center' }}>
            <div>
              {/* Trust badge */}
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

              {/* Stat row */}
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

            {/* Book stack */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
                {BOOKS.map((book, i) => {
                  const p = bySlug[book.slug];
                  const src = p ? imgUrl(p.images?.[0]) : null;
                  const rots = [-5, -2, 1, 4, -3];
                  return (
                    <div key={book.slug} style={{ transform: `rotate(${rots[i]}deg)`, transition: 'transform .25s ease', flexShrink: 0 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.08) translateY(-8px)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rots[i]}deg)`; }}>
                      {src ? (
                        <img src={src} alt={book.title} loading="lazy" style={{ width: isMobile ? 56 : 88, height: isMobile ? 84 : 132, objectFit: 'cover', borderRadius: 6, boxShadow: '0 16px 36px rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.25)' }} />
                      ) : (
                        <div style={{ width: isMobile ? 56 : 88, height: isMobile ? 84 : 132, borderRadius: 6, background: book.fallbackColor, boxShadow: '0 16px 36px rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
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
                <div key={i} style={{ background: 'white', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #dc2626', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 40 }}>{c.emoji}</span>
                  <h3 style={{ fontFamily: 'var(--bn)', fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{c.title}</h3>
                  <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.7 }}>{c.body}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac', borderRadius: 18, padding: isMobile ? '18px 20px' : '20px 36px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#14532d', margin: 0 }}>
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
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)', transition: 'background .2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(22,163,74,0.12)'; e.currentTarget.style.border = '1px solid rgba(22,163,74,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontFamily: 'var(--bn)', fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Book Cards ──────────────────────────────────────────────────────── */}
        <section id="books" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '52px 20px' : '72px 48px' }}>
          <div ref={r4} style={fadeBase}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ background: '#fef9c3', color: '#92400e', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--bn)' }}>সীমিত সময়ের অফার</span>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#0f172a', margin: '12px 0 6px' }}>৫টি সেরা ফিন্যান্স বই</h2>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#6b7280', margin: 0 }}>প্রতিটি বই আপনার আর্থিক চিন্তাভাবনা সম্পূর্ণ বদলে দেবে</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
              {BOOKS.map((book, idx) => {
                const p = bySlug[book.slug];
                const src = p ? imgUrl(p.images?.[0]) : null;
                const price = finalPrice(book);
                // Last row: if 5 books in 3-col grid, last 2 are centered
                const isLonelyRow = idx === 3 || idx === 4;
                return (
                  <div
                    key={book.slug}
                    style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .25s ease, box-shadow .25s ease', gridColumn: (!isMobile && isLonelyRow) ? undefined : undefined }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; }}
                  >
                    {/* Cover */}
                    <div style={{ position: 'relative', height: 260, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {src ? (
                        <img src={src} alt={book.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform .3s ease' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.4, fontWeight: 700 }}>{book.title}</span>
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />
                      {/* Discount badge */}
                      <div style={{ position: 'absolute', top: 12, left: 12, background: '#dc2626', color: 'white', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontWeight: 900, fontSize: 15, fontFamily: 'var(--sans)', lineHeight: 1, boxShadow: '0 4px 12px rgba(220,38,38,0.5)' }}>
                        <span>{book.discountPct}%</span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--bn)' }}>ছাড়</span>
                      </div>
                      {/* Book badge */}
                      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                        <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', color: 'white', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--sans)', fontWeight: 700 }}>{book.badge}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>{book.title}</h3>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#9ca3af', margin: 0 }}>{book.author}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Stars size={14} />
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#6b7280' }}>(৪.৯) • ১০০+ রিভিউ</span>
                      </div>
                      <p style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0, flex: 1 }}>{book.description}</p>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 24, fontWeight: 900, color: '#16a34a' }}>৳{price}</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>৳{book.salePrice}</span>
                        <span style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#dc2626', fontWeight: 700, marginLeft: 'auto' }}>৳{book.discountAmount} সাশ্রয়</span>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/${book.slug}`} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e5e7eb', color: '#374151', background: 'transparent', borderRadius: 12, padding: '11px 8px', fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all .15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
                          বিস্তারিত
                        </Link>
                        <button onClick={() => handleAddToCart(book.slug, book.title)} style={{ flex: 2, background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, padding: '11px 8px', fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .15s ease, transform .15s ease' }}
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
            {/* Header */}
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

            {/* Book selector grid */}
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
                      {/* Cover */}
                      <div style={{ height: isMobile ? 110 : 140, background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {src ? (
                          <img src={src} alt={book.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: isSelected ? 'none' : 'grayscale(20%)' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: 9, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.4 }}>{book.title}</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding: '10px 10px 12px' }}>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.3 }}>{book.title}</p>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 10, color: '#9ca3af', margin: '0 0 6px' }}>{book.author}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 900, color: isSelected ? '#16a34a' : '#6b7280' }}>৳{price}</span>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: '#9ca3af', textDecoration: 'line-through' }}>৳{book.salePrice}</span>
                        </div>
                      </div>
                      {/* Checkbox indicator */}
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: isSelected ? '#16a34a' : 'rgba(255,255,255,0.9)', border: `2px solid ${isSelected ? '#16a34a' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                        {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price summary */}
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

              {/* Trust row */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                {['✅ সারা বাংলাদেশে ডেলিভারি', '✅ ১০০% অরিজিনাল', '✅ দ্রুত ডেলিভারি', '✅ নিরাপদ পেমেন্ট'].map((t, i) => (
                  <span key={i} style={{ fontFamily: 'var(--bn)', fontSize: 13, color: '#374151', fontWeight: 600 }}>{t}</span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleBundleCheckout}
                style={{ width: '100%', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 16, padding: '18px 0', fontFamily: 'var(--bn)', fontSize: isMobile ? 16 : 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 28px rgba(22,163,74,0.4)', transition: 'all .15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(22,163,74,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(22,163,74,0.4)'; }}
              >
                <span>🛒</span>
                <span>নির্বাচিত {selected.size}টি বই কার্টে যোগ করুন → চেকআউট</span>
              </button>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '10px 0 0' }}>
                ক্লিক করলে বইগুলো কার্টে যোগ হবে এবং সরাসরি চেকআউটে যাবেন
              </p>
            </div>
          </div>
        </section>

        {/* ── Reviews ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#f8fafc', padding: isMobile ? '52px 20px' : '72px 80px' }}>
          <div ref={r6} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                <Stars size={20} />
              </div>
              <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>পাঠকরা কী বলছেন</h2>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#6b7280', margin: 0 }}>৫০০+ সন্তুষ্ট পাঠকের মধ্যে থেকে কিছু মতামত</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
              {REVIEWS.map((r, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 32, color: '#f0fdf4', fontWeight: 900, fontFamily: 'serif', lineHeight: 1 }}>&ldquo;</div>
                  <Stars size={15} />
                  <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#374151', lineHeight: 1.75, margin: 0 }}>&ldquo;{r.text}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #14532d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontFamily: 'var(--bn)', fontSize: 16, fontWeight: 700 }}>{r.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#9ca3af' }}>✅ যাচাইকৃত ক্রেতা · {r.location}</div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', border: `1.5px solid ${openFaq === i ? '#16a34a' : 'transparent'}`, transition: 'border .2s ease' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--bn)', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{faq.q}</span>
                    <span style={{ color: '#16a34a', fontSize: 22, fontWeight: 900, flexShrink: 0, transition: 'transform .2s ease', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 20px 18px', fontFamily: 'var(--bn)', fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{faq.a}</div>
                  )}
                </div>
              ))}
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
              <a href="#bundle" style={{ display: 'inline-block', background: '#16a34a', color: 'white', fontWeight: 800, fontFamily: 'var(--bn)', borderRadius: 16, padding: '18px 48px', fontSize: 17, textDecoration: 'none', boxShadow: '0 8px 28px rgba(22,163,74,0.45)', transition: 'all .15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'none'; }}>
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
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--bn)', fontSize: 11, color: '#9ca3af' }}>৫টি বই একসাথে</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 900, color: '#16a34a' }}>৳1,786</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>৳2,985</span>
              </div>
            </div>
            <button onClick={handleBundleCheckout} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, padding: '13px 20px', fontFamily: 'var(--bn)', fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              এখনই অর্ডার করুন →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
