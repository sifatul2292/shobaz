'use client';

import { useState, useEffect, useRef } from 'react';
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

// ── Static book data ──────────────────────────────────────────────────────────
const BOOKS = [
  {
    slug: 'i-will-teach-you-to-be-rich',
    title: 'I Will Teach You to Be Rich',
    author: 'Ramit Sethi',
    salePrice: 681,
    discountAmount: 282,
    discountPct: 41,
    description:
      'এই বইটি আপনাকে শেখাবে কীভাবে মাত্র ৬ সপ্তাহে আপনার আর্থিক জীবন গুছিয়ে নিতে হয়। সঞ্চয়, বিনিয়োগ এবং automatic money system তৈরির সবচেয়ে practical গাইড।',
    fallbackColor: '#0369a1',
  },
  {
    slug: 'the-intelligent-investor',
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    salePrice: 924,
    discountAmount: 402,
    discountPct: 44,
    description:
      'Warren Buffett-এর সবচেয়ে প্রিয় বই। শেয়ার বাজারে কীভাবে বুদ্ধিমানের মতো বিনিয়োগ করতে হয়, ঝুঁকি কমিয়ে সম্পদ বাড়ানোর কালজয়ী নীতি এই বইতে আছে।',
    fallbackColor: '#14532d',
  },
  {
    slug: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    salePrice: 423,
    discountAmount: 154,
    discountPct: 36,
    description:
      'ধনী মানুষ কীভাবে ভাবেন আর গরিব মানুষ কীভাবে ভাবেন — এই পার্থক্যই সব। Asset আর Liability-র মধ্যে পার্থক্য বুঝলে আপনার আর্থিক জীবন বদলে যাবে।',
    fallbackColor: '#92400e',
  },
  {
    slug: 'the-psychology-of-money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    salePrice: 402,
    discountAmount: 143,
    discountPct: 36,
    description:
      'টাকার সাথে আমাদের আবেগের সম্পর্ক কেমন? কেন আমরা ভুল সিদ্ধান্ত নিই? এই বইটি আপনার টাকার প্রতি দৃষ্টিভঙ্গি সম্পূর্ণ বদলে দেবে।',
    fallbackColor: '#4c1d95',
  },
  {
    slug: 'think-and-grow-rich',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    salePrice: 555,
    discountAmount: 218,
    discountPct: 39,
    description:
      'সম্পদ তৈরির পেছনে সবচেয়ে বড় শক্তি হলো আপনার চিন্তা। বিশ্বের ৫০০+ কোটিপতির সাফল্যের রহস্য একত্রিত করে লেখা এই কালজয়ী বই।',
    fallbackColor: '#7f1d1d',
  },
];

const FAQS = [
  {
    q: 'ডেলিভারি কতদিনে পাবো?',
    a: 'ঢাকার ভেতরে ১-২ দিন, ঢাকার বাইরে ৩-৫ কার্যদিবস।',
  },
  {
    q: 'বইগুলো কি ইংরেজিতে?',
    a: 'হ্যাঁ, এই বইগুলো ইংরেজিতে। তবে সহজ ভাষায় লেখা, যেকেউ পড়তে পারবেন।',
  },
  {
    q: 'বই কি অরিজিনাল?',
    a: 'হ্যাঁ, Shobaz শুধুমাত্র ১০০% অরিজিনাল বই বিক্রি করে।',
  },
  {
    q: 'কীভাবে অর্ডার করবো?',
    a: 'কার্টে যোগ করুন → Checkout → পেমেন্ট করুন। মাত্র ৩ ধাপে অর্ডার সম্পন্ন।',
  },
  {
    q: 'রিটার্ন পলিসি কী?',
    a: 'বই ক্ষতিগ্রস্ত অবস্থায় পেলে আমরা বদলে দেবো।',
  },
];

const REVIEWS = [
  {
    name: 'রাহিম মিয়া',
    location: 'ঢাকা',
    text: 'Psychology of Money পড়ে আমার টাকার প্রতি দৃষ্টিভঙ্গি পুরোপুরি বদলে গেছে। অসাধারণ বই!',
  },
  {
    name: 'সুমাইয়া আক্তার',
    location: 'চট্টগ্রাম',
    text: 'Rich Dad Poor Dad আমার জীবনের সেরা বিনিয়োগ। এই বই না পড়লে বুঝতামই না asset কী জিনিস।',
  },
  {
    name: 'করিম সাহেব',
    location: 'সিলেট',
    text: '৫টি বই একসাথে কিনেছি। দাম অনেক কম, বই একদম অরিজিনাল। Shobaz-এর সার্ভিস চমৎকার!',
  },
];

function Stars() {
  return (
    <span style={{ color: '#f59e0b', fontSize: 16, letterSpacing: 1 }}>★★★★★</span>
  );
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

// Scroll-triggered fade-in
function useFadeRef() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

export default function FinanceBundleClient() {
  const [bySlug, setBySlug] = useState<Record<string, Product>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const isMobile = useIsMobile();

  // Fetch products + fire FB ViewContent
  useEffect(() => {
    api
      .get('/product/get-all-data')
      .then((res) => {
        if (res.data?.data) {
          const map: Record<string, Product> = {};
          (res.data.data as Product[]).forEach((p) => {
            if (p.slug) map[p.slug] = p;
          });
          setBySlug(map);
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'Finance Bundle',
        content_category: 'finance-and-wealth',
        content_ids: BOOKS.map((b) => b.slug),
        content_type: 'product_group',
      });
    }
  }, []);

  const finalPrice = (book: typeof BOOKS[0]) => book.salePrice - book.discountAmount;

  const handleAddToCart = (slug: string, title: string) => {
    const product = bySlug[slug];
    if (!product) {
      toast.error('পণ্য লোড হচ্ছে, একটু অপেক্ষা করুন');
      return;
    }
    addItem(product);
    toast.success(`${title} কার্টে যোগ হয়েছে!`);
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: title,
        content_ids: [slug],
        content_type: 'product',
        value: finalPrice(BOOKS.find((b) => b.slug === slug)!),
        currency: 'BDT',
      });
    }
  };

  const handleAddAllToCart = () => {
    let added = 0;
    BOOKS.forEach((book) => {
      const p = bySlug[book.slug];
      if (p) { addItem(p); added++; }
    });
    toast.success(added > 0 ? `${added}টি বই কার্টে যোগ হয়েছে!` : 'পণ্য লোড হচ্ছে, একটু অপেক্ষা করুন');
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: 'Finance Bundle - All 5 Books',
        content_ids: BOOKS.map((b) => b.slug),
        content_type: 'product_group',
        value: 1786,
        currency: 'BDT',
      });
    }
  };

  // Section refs for fade-in
  const s1 = useFadeRef();
  const s2 = useFadeRef();
  const s3 = useFadeRef();
  const s4 = useFadeRef();
  const s5 = useFadeRef();
  const s6 = useFadeRef();
  const s7 = useFadeRef();

  const fadeBase: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(28px)',
    transition: 'opacity 0.55s ease, transform 0.55s ease',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Header />

      <main style={{ flex: 1 }}>

        {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
        <section
          id="top"
          style={{
            background: 'linear-gradient(135deg, #14532d 0%, #16a34a 45%, #065f46 100%)',
            padding: isMobile ? '56px 20px 64px' : '72px 80px 88px',
          }}
        >
          <div ref={s1} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '6px 18px', marginBottom: 20 }}>
                <span style={{ color: '#fef08a', fontSize: 16 }}>⚡</span>
                <span style={{ fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700, color: 'white' }}>সীমিত সময়ের অফার — স্টক শেষ হওয়ার আগেই অর্ডার করুন</span>
              </div>

              <h1 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 28 : 42, fontWeight: 900, color: 'white', lineHeight: 1.25, margin: '0 0 16px' }}>
                অর্থনৈতিক স্বাধীনতার পথে আপনার ৫টি সেরা সঙ্গী
              </h1>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 18, color: 'rgba(255,255,255,0.85)', margin: '0 0 32px', lineHeight: 1.6 }}>
                দুনিয়ার সফল মানুষদের পড়া বই — এখন সর্বোচ্চ ৪৪% ছাড়ে
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
                {[
                  { value: '৪৪%', label: 'সর্বোচ্চ ছাড়' },
                  { value: '৫টি', label: 'বিশ্বমানের বই' },
                  { value: '১০০%', label: 'অরিজিনাল' },
                ].map((chip, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 18px', color: 'white', fontFamily: 'var(--bn)', fontSize: 14 }}>
                    <span style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 20 }}>{chip.value}</span>
                    {' '}{chip.label}
                  </div>
                ))}
              </div>

              <a
                href="#books"
                style={{ display: 'inline-block', background: 'white', color: '#14532d', fontWeight: 800, fontFamily: 'var(--bn)', borderRadius: 14, padding: '16px 40px', fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform .15s ease, box-shadow .15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.28)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
              >
                সবগুলো বই দেখুন ↓
              </a>
            </div>

            {/* Right — book stack */}
            <div style={{ display: 'flex', gap: isMobile ? 8 : 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {BOOKS.map((book, i) => {
                const p = bySlug[book.slug];
                const src = p ? imgUrl(p.images?.[0]) : null;
                const rot = [-4, -1, 2, -2, 4][i] ?? 0;
                return (
                  <div
                    key={book.slug}
                    style={{ transform: isMobile ? 'none' : `rotate(${rot}deg)`, transition: 'transform .2s ease', flexShrink: 0 }}
                    onMouseEnter={(e) => { if (!isMobile) (e.currentTarget as HTMLDivElement).style.transform = `rotate(0deg) scale(1.06)`; }}
                    onMouseLeave={(e) => { if (!isMobile) (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot}deg)`; }}
                  >
                    {src ? (
                      <img src={src} alt={book.title} loading="lazy" style={{ width: isMobile ? 60 : 90, height: isMobile ? 90 : 135, objectFit: 'cover', borderRadius: 6, boxShadow: '0 12px 28px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.2)' }} />
                    ) : (
                      <div style={{ width: isMobile ? 60 : 90, height: isMobile ? 90 : 135, borderRadius: 6, background: book.fallbackColor, boxShadow: '0 12px 28px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.3 }}>{book.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 2: Pain Points ──────────────────────────────────────── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '48px 20px' : '64px 48px' }}>
          <div ref={s2} style={fadeBase}>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', textAlign: 'center' }}>
              আপনি কি এই সমস্যায় আছেন?
            </h2>
            <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#6b7280', textAlign: 'center', margin: '0 0 36px' }}>
              বেশিরভাগ মানুষ এই ৩টি সমস্যায় ভোগেন
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
              {[
                { emoji: '💸', text: 'মাস শেষে টাকা থাকে না, জানেন না কোথায় যায়' },
                { emoji: '📉', text: 'ভালো আয় করেও সঞ্চয় করতে পারছেন না' },
                { emoji: '😰', text: 'বিনিয়োগ করতে চান কিন্তু কোথা থেকে শুরু করবেন বুঝতে পারছেন না' },
              ].map((card, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: '4px solid #dc2626', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 36 }}>{card.emoji}</span>
                  <p style={{ fontFamily: 'var(--bn)', fontSize: 16, color: '#1f2937', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>{card.text}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #86efac', borderRadius: 16, padding: '20px 32px' }}>
              <p style={{ fontFamily: 'var(--bn)', fontSize: 18, fontWeight: 800, color: '#14532d', margin: 0 }}>
                ✅ এই ৫টি বই আপনার সব প্রশ্নের উত্তর দেবে
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: What You Learn ──────────────────────────────────── */}
        <section style={{ background: '#14532d', padding: isMobile ? '48px 20px' : '64px 80px' }}>
          <div ref={s3} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'white', margin: '0 0 36px', textAlign: 'center' }}>
              এই বইগুলো পড়ে আপনি শিখবেন
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
              {[
                'কীভাবে চিন্তা করলে টাকা আসে',
                'কেন ভালো আয় করেও টাকা ধরে রাখা যায় না',
                'কীভাবে emotions ভুল financial decision তৈরি করে',
                'কীভাবে বিনিয়োগ করলে সম্পদ বাড়ে',
                'কীভাবে simple habits আর্থিক জীবন বদলায়',
                'কীভাবে smart money management system তৈরি করতে হয়',
              ].map((point, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>✅</span>
                  <span style={{ fontFamily: 'var(--bn)', fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 1.6 }}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: Books ────────────────────────────────────────────── */}
        <section id="books" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '48px 20px' : '64px 48px' }}>
          <div ref={s4} style={fadeBase}>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', textAlign: 'center' }}>
              ৫টি সেরা ফিন্যান্স বই
            </h2>
            <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#6b7280', textAlign: 'center', margin: '0 0 36px' }}>
              প্রতিটি বই আপনার আর্থিক চিন্তাভাবনা বদলে দেবে
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 28 }}>
              {BOOKS.map((book) => {
                const p = bySlug[book.slug];
                const src = p ? imgUrl(p.images?.[0]) : null;
                const price = finalPrice(book);
                return (
                  <div
                    key={book.slug}
                    style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 0, transition: 'transform .2s ease, box-shadow .2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.13)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; }}
                  >
                    {/* Cover */}
                    <div style={{ position: 'relative', flexShrink: 0, width: isMobile ? '100%' : 140 }}>
                      {src ? (
                        <img src={src} alt={book.title} loading="lazy" style={{ width: isMobile ? '100%' : 140, height: isMobile ? 200 : '100%', objectFit: 'cover', display: 'block', minHeight: 200 }} />
                      ) : (
                        <div style={{ width: isMobile ? '100%' : 140, height: 200, background: book.fallbackColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 1.4 }}>{book.title}</span>
                        </div>
                      )}
                      {/* Discount badge */}
                      <div style={{ position: 'absolute', top: 10, left: 10, background: '#dc2626', color: 'white', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontWeight: 900, fontSize: 13, fontFamily: 'var(--sans)', lineHeight: 1.1, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                        <span>{book.discountPct}%</span>
                        <span style={{ fontSize: 9 }}>ছাড়</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--sans)', fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>{book.title}</h3>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#6b7280', margin: 0 }}>{book.author}</p>
                      </div>

                      <Stars />

                      <p style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                        {book.description}
                      </p>

                      {/* Pricing */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 900, color: '#16a34a' }}>৳{price}</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>৳{book.salePrice}</span>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          href={`/${book.slug}`}
                          style={{ flex: 1, minWidth: 110, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #16a34a', color: '#16a34a', background: 'transparent', borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center', transition: 'all .15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#16a34a'; }}
                        >
                          বিস্তারিত দেখুন
                        </Link>
                        <button
                          onClick={() => handleAddToCart(book.slug, book.title)}
                          style={{ flex: 1, minWidth: 110, background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, padding: '10px 12px', fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#16a34a')}
                        >
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

        {/* ── Section 5: Bundle Offer ──────────────────────────────────────── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 48px 64px' }}>
          <div ref={s5} style={{ ...fadeBase, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2.5px solid #16a34a', borderRadius: 24, padding: isMobile ? '32px 24px' : '48px 56px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#16a34a', borderRadius: 999, padding: '6px 20px', marginBottom: 20 }}>
              <span style={{ color: 'white', fontFamily: 'var(--bn)', fontSize: 13, fontWeight: 700 }}>🎉 সবচেয়ে বেশি সাশ্রয়</span>
            </div>

            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#14532d', margin: '0 0 16px' }}>
              ৫টি বই একসাথে নিন — সর্বোচ্চ সাশ্রয় করুন
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#6b7280' }}>আলাদাভাবে কিনলে</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 22, color: '#9ca3af', textDecoration: 'line-through', fontWeight: 700 }}>৳2,985</div>
              </div>
              <span style={{ fontSize: 28, color: '#16a34a' }}>→</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--bn)', fontSize: 14, color: '#15803d', fontWeight: 700 }}>৫টি বই একসাথে</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 36, color: '#16a34a', fontWeight: 900 }}>৳1,786</div>
              </div>
              <div style={{ background: '#dc2626', color: 'white', borderRadius: 12, padding: '8px 16px', fontFamily: 'var(--bn)', fontSize: 15, fontWeight: 800 }}>
                ৳1,199 সাশ্রয়!
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              {['✅ সারা বাংলাদেশে ডেলিভারি', '✅ ১০০% অরিজিনাল বই', '✅ দ্রুত ডেলিভারি'].map((b, i) => (
                <span key={i} style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#14532d', fontWeight: 600 }}>{b}</span>
              ))}
            </div>

            <button
              onClick={handleAddAllToCart}
              style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 16, padding: isMobile ? '16px 28px' : '18px 48px', fontFamily: 'var(--bn)', fontSize: 17, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(22,163,74,0.4)', transition: 'all .15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'none'; }}
            >
              সবগুলো আলাদা আলাদা কার্টে যোগ করুন
            </button>
          </div>
        </section>

        {/* ── Section 6: Reviews ──────────────────────────────────────────── */}
        <section style={{ background: '#f8fafc', padding: isMobile ? '48px 20px' : '64px 80px' }}>
          <div ref={s6} style={{ ...fadeBase, maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#0f172a', margin: '0 0 36px', textAlign: 'center' }}>
              পাঠকরা কী বলছেন
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
              {REVIEWS.map((r, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Stars />
                  <p style={{ fontFamily: 'var(--bn)', fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#14532d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontFamily: 'var(--bn)', fontSize: 16, fontWeight: 700 }}>{r.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontFamily: 'var(--bn)', fontSize: 12, color: '#9ca3af' }}>{r.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 7: FAQ ──────────────────────────────────────────────── */}
        <section style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '48px 20px' : '64px 48px' }}>
          <div ref={s7} style={fadeBase}>
            <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#0f172a', margin: '0 0 32px', textAlign: 'center' }}>
              সচরাচর জিজ্ঞাসা
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', border: openFaq === i ? '1.5px solid #16a34a' : '1.5px solid transparent', transition: 'border .2s ease' }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
                  >
                    <span style={{ fontFamily: 'var(--bn)', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{faq.q}</span>
                    <span style={{ color: '#16a34a', fontSize: 20, fontWeight: 900, flexShrink: 0, transition: 'transform .2s ease', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 20px 18px', fontFamily: 'var(--bn)', fontSize: 14, color: '#374151', lineHeight: 1.75 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 8: Final CTA ─────────────────────────────────────────── */}
        <section style={{ background: '#0f172a', padding: isMobile ? '56px 20px' : '72px 80px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--bn)', fontSize: isMobile ? 24 : 36, fontWeight: 900, color: 'white', margin: '0 0 12px' }}>
            আজকেই শুরু হোক আপনার আর্থিক যাত্রা
          </h2>
          <p style={{ fontFamily: 'var(--bn)', fontSize: 16, color: 'rgba(255,255,255,0.65)', margin: '0 0 32px' }}>
            সীমিত স্টক — অফার যেকোনো সময় শেষ হতে পারে
          </p>
          <a
            href="#books"
            style={{ display: 'inline-block', background: '#16a34a', color: 'white', fontWeight: 800, fontFamily: 'var(--bn)', borderRadius: 16, padding: '18px 56px', fontSize: 18, textDecoration: 'none', boxShadow: '0 8px 28px rgba(22,163,74,0.45)', transition: 'all .15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'none'; }}
          >
            এখনই অর্ডার করুন
          </a>
        </section>

      </main>

      <Footer />
    </div>
  );
}
