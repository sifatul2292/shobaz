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
    titleShort: 'I Will Teach You to Be Rich',
    tagline: 'আর্থিক স্বাধীনতার ৬-সপ্তাহের রোডম্যাপ',
    author: 'Ramit Sethi', authorShort: 'R. Sethi',
    pages: 352, salePrice: 681, discountAmount: 282, discountPct: 41,
    badge: 'Bestseller', top: 'NYT Bestseller',
    color: '#C5352C', dark: false, stock: 11, popular: false,
  },
  {
    slug: 'the-intelligent-investor',
    title: 'The Intelligent Investor',
    titleShort: 'The Intelligent Investor',
    tagline: 'বিনিয়োগের কালজয়ী বাইবেল',
    author: 'Benjamin Graham', authorShort: 'B. Graham',
    pages: 640, salePrice: 924, discountAmount: 402, discountPct: 44,
    badge: 'Classic', top: 'Classic',
    color: '#6B0F0A', dark: false, stock: 8, popular: false,
  },
  {
    slug: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    titleShort: 'Rich Dad Poor Dad',
    tagline: 'আর্থিক শিক্ষার সবচেয়ে জনপ্রিয় বই',
    author: 'Robert T. Kiyosaki', authorShort: 'R. Kiyosaki',
    pages: 336, salePrice: 423, discountAmount: 154, discountPct: 36,
    badge: '#1 NYT', top: '#1 NYT',
    color: '#E89B2D', dark: true, stock: 9, popular: true,
  },
  {
    slug: 'the-psychology-of-money',
    title: 'The Psychology of Money',
    titleShort: 'The Psychology of Money',
    tagline: 'টাকার মনোবিজ্ঞানের ১৯টি অমূল্য পাঠ',
    author: 'Morgan Housel', authorShort: 'M. Housel',
    pages: 256, salePrice: 402, discountAmount: 143, discountPct: 36,
    badge: 'Best of 2020s', top: 'Best of 2020s',
    color: '#E6DEC7', dark: true, stock: 14, popular: false,
  },
  {
    slug: 'think-and-grow-rich',
    title: 'Think and Grow Rich',
    titleShort: 'Think and Grow Rich',
    tagline: 'সম্পদ তৈরির মানসিক রহস্য',
    author: 'Napoleon Hill', authorShort: 'N. Hill',
    pages: 320, salePrice: 555, discountAmount: 218, discountPct: 39,
    badge: 'Timeless', top: 'Timeless',
    color: '#F2EDDF', dark: true, stock: 13, popular: false,
  },
];

const FAQS = [
  { q: 'ডেলিভারি কতদিনে পাবো?', a: 'অর্ডার কনফার্ম হবার পর ঢাকায় ২-৩ কর্মদিবস, ঢাকার বাইরে ৩-৫ কর্মদিবসের মধ্যে পেয়ে যাবেন। সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।' },
  { q: 'বইগুলো কি ইংরেজিতে?', a: 'হ্যাঁ, সহজ ইংরেজিতে লেখা — যেকেউ পড়তে পারবেন। আমাদের বাংলা অনুবাদও পাওয়া যায়।' },
  { q: 'বই কি অরিজিনাল?', a: '১০০% অরিজিনাল প্রকাশকের বই। কোনো পাইরেটেড বা নকল বই আমরা বিক্রি করি না।' },
  { q: 'রিটার্নের সুযোগ আছে?', a: 'ডেলিভারির সময় বই অক্ষত অবস্থায় না পেলে সাথে সাথে রিটার্ন করতে পারবেন। প্রিন্টে সমস্যা থাকলে ১০০% টাকা ফেরত।' },
  { q: 'পেমেন্ট অপশন কী কী?', a: 'ক্যাশ অন ডেলিভারি, bKash, Nagad, Rocket — সব পেমেন্ট মেথড supported।' },
];

const REVIEWS = [
  { name: 'Md Jubaer Arefin', location: 'ঢাকা', init: 'M', color: '#1E3A2A', text: 'The Psychology of Money পড়ে আমার চিন্তাভাবনা সম্পূর্ণ পাল্টে গেছে। প্রতি বাঙালির এটা পড়া উচিত।' },
  { name: 'Mushfiqur Rahman', location: 'সিলেট', init: 'M', color: '#D2532A', text: 'Rich Dad Poor Dad বইয়ের কপি অসাধারণ — asset আর liability-র পার্থক্য এত পরিষ্কার করে কেউ বুঝায় নি।' },
  { name: 'Taslim', location: 'চট্টগ্রাম', init: 'T', color: '#B8893A', text: '৫টি বই একসাথে এত কম দামে — Shobaz-কে ধন্যবাদ। বাঁধাই আর প্রিন্ট দুর্দান্ত।' },
];

const WA_LINK = 'https://wa.me/8801XXXXXXXXX';

function Stars({ n = 5, size = 14 }: { n?: number; size?: number }) {
  return <span style={{ color: '#B8893A', fontSize: size, letterSpacing: 1 }}>{'★'.repeat(n)}</span>;
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

export default function FinanceBundleClient() {
  const router = useRouter();
  const [bySlug, setBySlug] = useState<Record<string, Product>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set(BOOKS.map((b) => b.slug)));
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [visitorCount, setVisitorCount] = useState(142);
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

  // 72h localStorage countdown
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
          setVisitorCount((prev) => Math.min(180, Math.max(120, prev + Math.floor(Math.random() * 11) - 5)));
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
    const el = document.getElementById('builder');
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
  const discountPct = selectedOriginal > 0 ? Math.round((savedAmount / selectedOriginal) * 100) : 0;

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
    selectedBooks.forEach((book) => { const p = bySlug[book.slug]; if (p) { addItem(p); added++; } });
    if (added === 0) { toast.error('পণ্য লোড হচ্ছে, একটু অপেক্ষা করুন'); return; }
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', { content_name: 'Finance Bundle', content_ids: selectedBooks.map((b) => b.slug), value: selectedTotal, currency: 'BDT' });
    }
    router.push('/checkout');
  };

  const bookGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)';
  const pickGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@400;500;600;700&display=swap');

        .fb-serif { font-family: "Fraunces", Georgia, serif; }
        .fb-ui { font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; }
        .fb-num { font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; font-feature-settings: "tnum" 1; }

        /* Strip */
        .fb-strip {
          background: #161510;
          color: #F2EDDF;
          font-size: 13px;
          letter-spacing: 0.01em;
          font-family: "Inter", sans-serif;
        }
        .fb-strip-row {
          max-width: 1180px; margin: 0 auto; padding: 0 22px;
          display: flex; align-items: center; justify-content: space-between;
          height: 38px; gap: 16px;
        }
        .fb-strip-left { display:flex; align-items:center; gap:10px; }
        .fb-pulse {
          width:8px; height:8px; border-radius:50%;
          background: #D2532A;
          animation: fbPulse2 1.6s infinite;
          flex-shrink:0;
        }
        @keyframes fbPulse2 {
          0% { box-shadow:0 0 0 0 rgba(210,83,42,0.6); }
          70% { box-shadow:0 0 0 8px rgba(210,83,42,0); }
          100% { box-shadow:0 0 0 0 rgba(210,83,42,0); }
        }
        .fb-cd { display:flex; align-items:center; gap:6px; }
        .fb-cd b {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          padding: 2px 7px;
          min-width: 28px;
          text-align: center;
          font-family: "Inter", sans-serif;
          font-weight: 600;
          font-feature-settings: "tnum" 1;
        }

        /* Value strip */
        .fb-value-strip {
          background: #161510;
          color: #E9E2D2;
          padding: 15px 0;
          border-top: 1px solid #2a261d;
          border-bottom: 1px solid #2a261d;
        }
        .fb-value-row {
          max-width: 1180px; margin: 0 auto; padding: 0 22px;
          display:flex; align-items:center; gap: 40px; justify-content: center;
          font-family: "Inter", sans-serif; font-size: 13px; letter-spacing: 0.02em;
          flex-wrap: wrap;
        }
        .fb-value-row > div { display:flex; align-items:center; gap: 10px; opacity: 0.95; }

        /* Eyebrow */
        .fb-eyebrow {
          display:inline-flex; align-items:center; gap:10px;
          font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
          color: #2A5340; font-family: "Inter", sans-serif; font-weight: 600;
          padding: 6px 12px;
          background: #DCE7DC;
          border-radius: 999px;
          margin-bottom: 18px;
        }
        .fb-eyebrow .dot { width:6px; height:6px; border-radius:50%; background: #2A5340; }
        .fb-section-eyebrow {
          display: inline-block;
          font-family: "Inter", sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #6E685D; margin-bottom: 14px;
        }
        .fb-section-eyebrow::before { content:"— "; }

        /* Section head */
        .fb-section-head { text-align:center; max-width: 720px; margin: 0 auto 52px; }
        .fb-section-title {
          font-family: "Hind Siliguri", sans-serif;
          font-weight: 600;
          font-size: clamp(26px, 3.6vw, 40px);
          line-height: 1.18;
          letter-spacing: -0.01em;
          color: #161510;
          margin: 0 0 12px;
        }
        .fb-section-sub { color: #3F3B33; font-size: 16px; max-width: 560px; margin: 0 auto; }

        /* Hero */
        .fb-hero { padding: 72px 0 84px; background: #F4EFE6; position: relative; overflow: hidden; }
        .fb-hero-art { position: absolute; right: -6%; top: -10%; width: 60%; height: 120%; pointer-events: none; z-index: 0; }
        .fb-container { max-width: 1180px; margin: 0 auto; padding: 0 22px; }
        .fb-hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
          position: relative; z-index: 1;
        }
        .fb-lede-bn {
          font-family: "Hind Siliguri", sans-serif;
          font-weight: 700;
          font-size: clamp(30px, 4.6vw, 52px);
          line-height: 1.16;
          letter-spacing: -0.005em;
          margin: 20px 0 16px;
          color: #161510;
        }
        .fb-lede-bn span { color: #1E3A2A; }
        .fb-sub { color: #3F3B33; font-size: 17px; max-width: 480px; margin-bottom: 26px; line-height: 1.65; }
        .fb-sub b { color: #161510; font-weight: 600; }
        .fb-price-row { display:flex; align-items: baseline; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
        .fb-price-now { font-family: "Fraunces", serif; font-size: 42px; font-weight: 600; letter-spacing: -0.02em; color: #161510; }
        .fb-price-was { color: #6E685D; text-decoration: line-through; font-size: 18px; font-family: "Inter", sans-serif; }
        .fb-save-pill {
          background: #D2532A; color: #fff;
          font-family: "Inter", sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 0.04em;
          padding: 5px 10px; border-radius: 4px;
        }
        .fb-cta-row { display:flex; gap:12px; flex-wrap:wrap; }
        .fb-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:10px;
          padding: 15px 24px; border-radius: 12px; font-weight: 600; font-size: 15px;
          border: 1px solid transparent; cursor: pointer;
          transition: transform .12s ease, background .15s ease;
          font-family: "Hind Siliguri", sans-serif; text-decoration: none;
        }
        .fb-btn:hover { transform: translateY(-1px); }
        .fb-btn-primary { background: #1E3A2A; color: #F8F4EB; box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 10px 22px -10px rgba(30,58,42,0.55); }
        .fb-btn-primary:hover { background: #2A5340; }
        .fb-btn-ghost { background: transparent; color: #161510; border-color: #C9BFA8; }
        .fb-btn-ghost:hover { background: #FBF8F2; }
        .fb-trust-mini { margin-top: 24px; display:flex; align-items: center; gap: 20px; color: #6E685D; font-size: 13px; flex-wrap: wrap; }
        .fb-trust-mini b { color: #3F3B33; font-weight: 600; }

        /* Book stack */
        .fb-stack-wrap { position: relative; height: 460px; display:flex; align-items:center; justify-content:center; }
        .fb-stack { position: relative; width: 420px; height: 420px; }
        .fb-book {
          position: absolute; width: 150px; height: 220px;
          border-radius: 3px 6px 6px 3px;
          box-shadow: 0 24px 36px -18px rgba(22,21,16,0.45), 0 6px 14px -6px rgba(22,21,16,0.30);
          overflow: hidden;
          transition: transform .35s cubic-bezier(.2,.7,.2,1);
        }
        .fb-book::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background: linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0)); z-index:1; }
        .fb-book::after { content:""; position:absolute; inset:0; background: linear-gradient(115deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 38%); pointer-events:none; z-index:2; }
        .fb-book .fb-cover { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between; padding:14px 12px; z-index:3; }
        .fb-book .fb-btop { font-family: "Inter", sans-serif; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.7; }
        .fb-book .fb-bttl { font-family: "Fraunces", serif; font-weight: 700; font-size: 18px; line-height: 1.05; letter-spacing: -0.01em; }
        .fb-book .fb-bauth { font-family: "Inter", sans-serif; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.8; }
        .fb-book .fb-ptag {
          position:absolute; top:8px; right:-8px; z-index:4;
          background: #D2532A; color:#fff;
          font-family: "Inter", sans-serif; font-weight:700; font-size:11px;
          padding: 4px 8px; border-radius: 3px;
          box-shadow: 0 4px 10px -4px rgba(210,83,42,.6);
        }
        .fb-stack:hover .fb-b1 { transform: rotate(-13deg) translate(-8px, -6px); }
        .fb-stack:hover .fb-b2 { transform: rotate(-6deg) translate(-4px, -4px); }
        .fb-stack:hover .fb-b3 { transform: rotate(0deg) translate(0, -10px); }
        .fb-stack:hover .fb-b4 { transform: rotate(6deg) translate(4px, -4px); }
        .fb-stack:hover .fb-b5 { transform: rotate(13deg) translate(8px, -6px); }
        .fb-stack-floor {
          position: absolute; left: 10%; right: 10%; bottom: 0;
          height: 24px;
          background: radial-gradient(50% 50% at 50% 50%, rgba(22,21,16,0.18), rgba(0,0,0,0));
          filter: blur(6px);
        }

        /* Problems */
        .fb-problems { display:grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .fb-problem {
          background: #FBF8F2; border: 1px solid #E0D8C7; border-radius: 18px;
          padding: 26px; display:flex; flex-direction: column; gap: 12px;
          position: relative;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .fb-problem:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(22,21,16,0.04), 0 12px 32px -16px rgba(22,21,16,0.16); }
        .fb-problem .fb-ico { width:44px;height:44px;border-radius:12px; background:#F2D6C7;color:#D2532A; display:grid;place-items:center; font-size:20px; }
        .fb-problem h3 { font-size: 17px; font-weight: 600; margin: 4px 0 2px; color: #161510; }
        .fb-problem p { color: #3F3B33; font-size: 14px; margin: 0; line-height: 1.65; }
        .fb-problem .fb-num-mark { position:absolute;top:22px;right:24px; font-family:"Fraunces",serif; font-style:italic; font-weight:500; color:#C9BFA8; font-size:26px; }
        .fb-problem-cta {
          margin-top: 26px; background:#DCE7DC; border:1px dashed #2A5340; border-radius:14px;
          padding:18px 22px; display:flex; align-items:center; gap:14px; color:#1E3A2A; font-weight:500;
        }
        .fb-problem-cta .fb-check { width:28px;height:28px;border-radius:50%;background:#1E3A2A;color:#fff;display:grid;place-items:center;flex-shrink:0; }

        /* Benefits */
        .fb-benefits-band { background: #1E3A2A; color: #EBE4D1; padding: 96px 0; }
        .fb-benefits-band .fb-section-eyebrow { color: rgba(235,228,209,0.7); }
        .fb-benefits-band .fb-section-title { color: #F8F4EB; }
        .fb-benefits-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 920px; margin: 0 auto; }
        .fb-benefit {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
          padding: 18px 20px; display:flex; align-items:flex-start; gap:14px;
          transition: background .2s ease;
        }
        .fb-benefit:hover { background: rgba(255,255,255,0.07); }
        .fb-b-ico { width:36px;height:36px;border-radius:10px; background:rgba(184,137,58,0.18); color:#E8C075; display:grid;place-items:center;flex-shrink:0; }
        .fb-benefit p { margin:0;font-size:15px;color:#E8E1CE;line-height:1.55; }

        /* Book cards */
        .fb-books-section { background: #EEE7DA; padding: 96px 0; }
        .fb-bcard {
          background: #FBF8F2; border-radius: 16px; overflow: hidden;
          border: 1px solid #E0D8C7; display:flex; flex-direction:column;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .fb-bcard:hover { transform: translateY(-3px); box-shadow: 0 1px 0 rgba(22,21,16,0.04), 0 12px 32px -16px rgba(22,21,16,0.16); }
        .fb-bcard .fb-thumb { aspect-ratio: 3/4; position:relative; display:grid;place-items:center; overflow:hidden; }
        .fb-mini-book {
          width: 62%; aspect-ratio: 2/3; border-radius: 2px 4px 4px 2px;
          box-shadow: 0 16px 24px -12px rgba(0,0,0,0.4), 0 4px 8px -4px rgba(0,0,0,0.25);
          padding: 12px 10px; display:flex; flex-direction:column; justify-content:space-between;
          position: relative;
        }
        .fb-mini-book::before { content:""; position:absolute; left:0;top:0;bottom:0;width:3px; background:linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0)); }
        .fb-mini-book::after { content:""; position:absolute;inset:0; background:linear-gradient(115deg,rgba(255,255,255,0.18),rgba(255,255,255,0) 40%); pointer-events:none; }
        .fb-mb-top { font-family:"Inter",sans-serif; font-size:8px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.7; }
        .fb-mb-ttl { font-family:"Fraunces",serif; font-weight:700; font-size:14px; line-height:1.05; }
        .fb-mb-auth { font-family:"Inter",sans-serif; font-size:8px; letter-spacing:0.1em; text-transform:uppercase; opacity:0.8; }
        .fb-bcard .fb-bdg {
          position:absolute; top:10px; left:10px;
          background: #D2532A; color:#fff;
          font-family:"Inter",sans-serif; font-weight:700; font-size:10px;
          padding:4px 8px; border-radius:4px;
        }
        .fb-bcard .fb-popular-badge {
          position:absolute; top:10px; right:10px;
          background: linear-gradient(135deg,#D2532A,#B8893A); color:#fff;
          font-family:"Inter",sans-serif; font-weight:700; font-size:9px;
          padding:3px 8px; border-radius:4px; letter-spacing:0.04em;
        }
        .fb-bcard .fb-body { padding: 14px 16px 16px; display:flex;flex-direction:column;gap:6px;flex:1; }
        .fb-bcard h4 { font-family:"Hind Siliguri",sans-serif; font-size:15px; font-weight:600; margin:0; line-height:1.25; color:#161510; }
        .fb-bcard h4 .en { display:block; font-family:"Fraunces",serif; font-style:italic; font-weight:500; font-size:12px; color:#6E685D; margin-top:2px; }
        .fb-bcard .fb-aline { font-size:12px; color:#6E685D; }
        .fb-bcard .fb-stars-row { display:flex;gap:6px;align-items:center;font-size:11px;color:#6E685D; }
        .fb-bcard .fb-pline { margin-top:auto; display:flex; align-items:baseline; gap:7px; padding-top:8px; }
        .fb-bcard .fb-pnow { font-family:"Inter",sans-serif; font-weight:700; font-size:17px; color:#161510; }
        .fb-bcard .fb-pwas { font-family:"Inter",sans-serif; text-decoration:line-through; color:#6E685D; font-size:12px; }
        .fb-bcard .fb-scarcity { font-size:11px; color:#D2532A; font-weight:600; }
        .fb-bcard .fb-actions { display:flex; gap:6px; margin-top:8px; }
        .fb-btn-mini-ghost { border:1px solid #C9BFA8; background:transparent; color:#161510; padding:9px 10px; font-size:12px; border-radius:9px; }
        .fb-btn-mini-ghost:hover { background:#F4EFE6; }
        .fb-btn-mini-primary { background:#1E3A2A; color:#fff; padding:9px 10px; font-size:12px; border-radius:9px; }
        .fb-btn-mini-primary:hover { background:#2A5340; }

        /* Builder */
        .fb-builder-wrap { background: #F4EFE6; padding: 96px 0; }
        .fb-builder {
          background: linear-gradient(180deg, #1E3A2A 0%, #2A5340 100%);
          color: #F8F4EB; border-radius: 28px; padding: 38px;
          box-shadow: 0 30px 60px -30px rgba(30,58,42,0.5);
        }
        .fb-builder-head { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:26px; }
        .fb-builder-head .fb-section-eyebrow { color:#E8C075; }
        .fb-builder-head h3 { font-family:"Hind Siliguri",sans-serif; font-weight:600; font-size:27px; line-height:1.2; margin:0 0 6px; }
        .fb-builder-head p { margin:0; color:rgba(248,244,235,0.7); font-size:14px; max-width:460px; }
        .fb-builder-price {
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);
          border-radius:14px; padding:14px 18px; text-align:right; min-width:200px;
        }
        .fb-builder-price .lbl { font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(248,244,235,0.6);font-family:"Inter",sans-serif; }
        .fb-builder-price .val { font-family:"Fraunces",serif; font-weight:600; font-size:34px; letter-spacing:-0.02em; line-height:1.1; }
        .fb-builder-price .save { font-family:"Inter",sans-serif; font-size:12px; color:#E8C075; font-weight:600; }
        .fb-pick {
          background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.12); border-radius:14px;
          padding:14px; cursor:pointer; position:relative; transition:all .18s ease; text-align:left;
        }
        .fb-pick:hover { background:rgba(255,255,255,0.07); }
        .fb-pick.on { background:rgba(184,137,58,0.18); border-color:#E8C075; }
        .fb-pick .fb-pick-check {
          position:absolute; top:10px; right:10px;
          width:22px; height:22px; border-radius:50%;
          border:1.5px solid rgba(255,255,255,0.3); background:transparent;
          display:grid; place-items:center; transition:all .18s ease;
        }
        .fb-pick.on .fb-pick-check { background:#E8C075; border-color:#E8C075; }
        .fb-pmini {
          width:100%; aspect-ratio:2/3; border-radius:2px 4px 4px 2px;
          margin-bottom:10px; padding:8px 6px;
          display:flex; flex-direction:column; justify-content:space-between;
          position:relative; box-shadow:0 8px 14px -6px rgba(0,0,0,0.4);
        }
        .fb-pmini::before { content:""; position:absolute; left:0;top:0;bottom:0;width:2px; background:rgba(0,0,0,0.2); }
        .fb-pmini .pt { font-family:"Fraunces",serif; font-weight:700; font-size:11px; line-height:1.05; }
        .fb-pmini .pa { font-family:"Inter",sans-serif; font-size:7px; letter-spacing:0.1em; text-transform:uppercase; opacity:0.8; }
        .fb-pick .fb-ptitle { font-family:"Hind Siliguri",sans-serif; font-weight:600; font-size:12px; line-height:1.25; margin-bottom:2px; color:#F8F4EB; }
        .fb-pick .fb-pprice { font-family:"Inter",sans-serif; font-weight:600; font-size:13px; opacity:0.85; color:#F8F4EB; }
        .fb-builder-totals {
          margin-top:24px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;
          padding-top:20px; border-top:1px solid rgba(255,255,255,0.12);
        }
        .fb-totals-left { display:flex; gap:24px; flex-wrap:wrap; }
        .fb-totals-left > div { display:flex; flex-direction:column; gap:2px; }
        .fb-totals-left .l { font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(248,244,235,0.55);font-family:"Inter",sans-serif; }
        .fb-totals-left .v { font-family:"Inter",sans-serif; font-size:17px; font-weight:600; }
        .fb-totals-left .v.strike { text-decoration:line-through;color:rgba(248,244,235,0.5);font-weight:500; }
        .fb-totals-left .v.gold { color:#E8C075; }
        .fb-builder-cta {
          width:100%; margin-top:20px;
          background:#E8C075; color:#1E3A2A;
          padding:18px 26px; border-radius:14px;
          font-weight:700; font-size:16px;
          display:inline-flex;align-items:center;justify-content:center;gap:10px;
          transition:transform .12s ease, background .15s ease; cursor:pointer; border:none;
          font-family:"Hind Siliguri",sans-serif;
        }
        .fb-builder-cta:hover { background:#F0CF8C; transform:translateY(-1px); }
        .fb-builder-fineprint { margin-top:14px;text-align:center;font-size:12.5px;color:rgba(248,244,235,0.6);display:flex;gap:18px;justify-content:center;flex-wrap:wrap; }

        /* Quality */
        .fb-quality-section { background: #F4EFE6; padding: 96px 0; }
        .fb-qcard { background:#FBF8F2; border:1px solid #E0D8C7; border-radius:16px; padding:24px; position:relative; }
        .fb-qcard .qno { font-family:"Fraunces",serif; font-style:italic; font-weight:500; font-size:14px; color:#6E685D; margin-bottom:14px; }
        .fb-qcard .qico { width:44px;height:44px;border-radius:12px; background:#DCE7DC;color:#1E3A2A; display:grid;place-items:center; margin-bottom:16px; }
        .fb-qcard h4 { font-family:"Inter",sans-serif; font-weight:600; font-size:14px; letter-spacing:0.02em; margin:0 0 8px; color:#161510; }
        .fb-qcard p { font-size:13.5px; color:#3F3B33; margin:0; line-height:1.5; }
        .fb-promise {
          margin-top:26px; background:#FBF8F2; border:1px solid #2A5340;
          border-left:4px solid #1E3A2A; border-radius:14px; padding:20px 24px;
          display:flex; align-items:center; gap:16px;
        }
        .fb-promise p { margin:0; color:#161510; font-size:15px; }
        .fb-promise b { color:#1E3A2A; }

        /* Reviews */
        .fb-reviews-section { background: #FBF8F2; padding: 96px 0; }
        .fb-review {
          background: #F4EFE6; border:1px solid #E0D8C7; border-radius:18px;
          padding:26px; display:flex; flex-direction:column; gap:14px;
        }
        .fb-review .fb-quote { font-family:"Fraunces",serif; font-style:italic; font-size:52px; line-height:1; color:#1E3A2A; margin:-8px 0 -18px; }
        .fb-review p { margin:0; color:#161510; font-size:15px; line-height:1.55; }
        .fb-review .fb-who { display:flex;align-items:center;gap:12px;margin-top:4px; }
        .fb-review .fb-av { width:38px;height:38px;border-radius:50%; display:grid;place-items:center; font-family:"Fraunces",serif; font-weight:600; font-size:16px; color:#F8F4EB; }
        .fb-review .fb-who-l { display:flex;flex-direction:column;gap:0; }
        .fb-review .fb-who-l b { font-size:14px;font-weight:600;color:#161510; }
        .fb-review .fb-who-l span { font-size:12px;color:#6E685D; }

        /* FAQ */
        .fb-faq-section { background: #F4EFE6; padding: 96px 0; }
        .fb-faq-list { max-width:760px; margin:0 auto; display:flex;flex-direction:column;gap:8px; }
        .fb-faq-item { background:#FBF8F2; border:1px solid #E0D8C7; border-radius:14px; overflow:hidden; }
        .fb-faq-item.on { border-color:#2A5340; }
        .fb-faq-q { width:100%;text-align:left;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px; font-weight:600;font-size:15px;color:#161510; font-family:"Hind Siliguri",sans-serif; cursor:pointer; background:none; border:none; }
        .fb-pm { width:26px;height:26px;border-radius:50%; border:1px solid #C9BFA8; display:grid;place-items:center; transition:transform .2s ease,background .15s ease; flex-shrink:0; }
        .fb-faq-item.on .fb-pm { background:#1E3A2A; border-color:#1E3A2A; transform:rotate(45deg); }
        .fb-faq-a { max-height:0; overflow:hidden; transition:max-height .25s ease; border-left:4px solid transparent; }
        .fb-faq-item.on .fb-faq-a { max-height:300px; border-left-color:#1E3A2A; }
        .fb-faq-a-inner { padding:0 24px 20px; color:#3F3B33; font-size:15px; line-height:1.7; }
        .fb-faq-help { margin-top:22px;text-align:center; }
        .fb-faq-help a { display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border:1px solid #C9BFA8;border-radius:999px;background:#FBF8F2;font-size:14px;color:#3F3B33;text-decoration:none; }
        .fb-faq-help a:hover { color:#161510; }
        .fb-wa-dot { width:18px;height:18px;border-radius:50%;background:#25D366;display:grid;place-items:center; }

        /* Final CTA */
        .fb-final-cta {
          background: #161510; color: #F2EDDF;
          text-align:center; padding: 100px 0; position:relative; overflow:hidden;
        }
        .fb-final-cta::before {
          content:""; position:absolute; top:0; left:50%; width:90%; max-width:800px;
          height:1px; background:linear-gradient(90deg,transparent,#B8893A,transparent);
          transform:translateX(-50%);
        }
        .fb-final-cta .fb-section-eyebrow { color:rgba(232,192,117,0.8); }
        .fb-final-cta h2 { font-family:"Hind Siliguri",sans-serif; font-weight:600; font-size:clamp(28px,4vw,46px); margin:0 0 14px; color:#F8F4EB; line-height:1.18; }
        .fb-final-cta p { color:rgba(242,237,223,0.7); max-width:540px; margin:0 auto 26px; }
        .fb-final-cd { display:flex;gap:16px;justify-content:center;margin-bottom:30px; flex-wrap:wrap; }
        .fb-cd-box { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 22px;min-width:80px;text-align:center; }
        .fb-cd-box .n { font-family:"Fraunces",serif;font-weight:600;font-size:34px;line-height:1;color:#F8F4EB; }
        .fb-cd-box .l { font-family:"Inter",sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(232,192,117,0.75);margin-top:6px; }
        .fb-final-cta .fb-btn-ghost { color:#F2EDDF;border-color:rgba(255,255,255,0.2); }
        .fb-final-cta .fb-btn-ghost:hover { background:rgba(255,255,255,0.05); }
        .fb-final-cta .fb-btn-primary { background:#E8C075;color:#1E3A2A; }
        .fb-final-cta .fb-btn-primary:hover { background:#F0CF8C; }

        /* Mobile sticky bar */
        .fb-mobile-bar {
          display:none; position:fixed;bottom:0;left:0;right:0;z-index:50;
          padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));
          background:rgba(244,239,230,0.97); backdrop-filter:blur(10px);
          border-top:1px solid #E0D8C7;
          align-items:center;justify-content:space-between;gap:10px;
        }
        .fb-mobile-bar .mb-price { display:flex;flex-direction:column; }
        .fb-mobile-bar .mb-price .now { font-family:"Fraunces",serif;font-weight:600;font-size:21px;line-height:1;color:#161510; }
        .fb-mobile-bar .mb-price .was { font-family:"Inter",sans-serif;text-decoration:line-through;color:#6E685D;font-size:12px; }

        /* WhatsApp */
        .fb-whatsapp {
          position:fixed;right:18px;bottom:18px;z-index:49;
          background:#25D366;color:#fff;
          padding:12px 18px;border-radius:999px;
          font-family:"Hind Siliguri",sans-serif;font-weight:600;font-size:14px;
          display:flex;align-items:center;gap:8px;text-decoration:none;
          box-shadow:0 10px 22px -10px rgba(37,211,102,0.7);
          transition:transform .15s ease;
        }
        .fb-whatsapp:hover { transform:translateY(-2px); }

        @media (max-width:900px) {
          .fb-hero { padding:40px 0 32px; }
          .fb-hero-grid { grid-template-columns:1fr; gap:28px; }
          .fb-stack-wrap { height:340px; order:-1; }
          .fb-stack { transform:scale(0.82); transform-origin: center center; }
          .fb-lede-bn { font-size:32px; }
          .fb-price-now { font-size:36px; }
          .fb-problems { grid-template-columns:1fr; }
          .fb-benefits-grid { grid-template-columns:1fr; }
          .fb-builder-head { flex-direction:column; }
          .fb-builder-price { width:100%; text-align:left; min-width:0; }
          .fb-builder { padding:24px; border-radius:20px; }
          .fb-benefits-band { padding:64px 0; }
          section.fb-books-section, .fb-builder-wrap, .fb-quality-section, .fb-reviews-section, .fb-faq-section { padding-top:64px !important; padding-bottom:64px !important; }
        }
        @media (max-width:640px) {
          .fb-strip-row .fb-strip-right-num { display:none; }
          .fb-mobile-bar { display:flex; }
          body { padding-bottom: 76px; }
          .fb-whatsapp { bottom:84px; right:14px; padding:10px 14px; font-size:13px; }
          .fb-stack-wrap { height:280px; }
          .fb-stack { transform:scale(0.68); }
          .fb-lede-bn { font-size:27px; }
          .fb-sub { font-size:15px; }
          .fb-cta-row .fb-btn { flex:1 1 100%; }
          .fb-final-cta { padding:64px 0; }
          .fb-value-row > div:nth-child(n+3) { display:none; }
        }
        @media (max-width:1100px) {
          .fb-book-grid-3 { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
        }
      `}</style>

      {/* ── Announcement strip ─────────────────────────────────────── */}
      <div className="fb-strip">
        <div className="fb-strip-row">
          <div className="fb-strip-left">
            <span className="fb-pulse" />
            <span>সীমিত অফার শেষ হচ্ছে — <b className="fb-num">৪৪% ছাড়</b></span>
          </div>
          <div className="fb-cd">
            <span style={{ color: 'rgba(242,237,223,0.6)', marginRight: 4, fontFamily: '"Inter",sans-serif', fontSize: 12 }}>অফার শেষ হবে</span>
            <b className="fb-num">{pad(timeLeft.h)}</b>
            <span>:</span>
            <b className="fb-num">{pad(timeLeft.m)}</b>
            <span>:</span>
            <b className="fb-num">{pad(timeLeft.s)}</b>
          </div>
          <div className="fb-strip-right-num fb-strip-left" style={{ opacity: visitorFade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            <span>৪.৯ ★ <b>{visitorCount} রিভিউ</b></span>
          </div>
        </div>
      </div>

      <Header />

      <main style={{ background: '#F4EFE6' }}>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="fb-hero">
          <div className="fb-hero-art" aria-hidden="true">
            <svg viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice">
              <circle cx="500" cy="280" r="260" fill="none" stroke="#C9BFA8" strokeWidth="1" strokeDasharray="2 6" opacity="0.6"/>
              <circle cx="500" cy="280" r="190" fill="none" stroke="#C9BFA8" strokeWidth="1" opacity="0.4"/>
              <circle cx="500" cy="280" r="120" fill="#E0D8C7" opacity="0.35"/>
            </svg>
          </div>
          <div className="fb-container">
            <div ref={r1} style={{ ...fadeStyle }}>
              <div className="fb-hero-grid">
                <div>
                  <span className="fb-eyebrow"><span className="dot" />৫টি বইয়ের একচেটিয়া বান্ডেল</span>
                  <h1 className="fb-lede-bn">
                    অর্থনৈতিক স্বাধীনতার পথে<br />
                    <span>আপনার ৫ জন সঙ্গী।</span>
                  </h1>
                  <p className="fb-sub">
                    দুনিয়ার সবচেয়ে প্রভাবশালী ফিন্যান্স ক্লাসিকগুলো — এক প্যাকে, <b>৪৪% ছাড়ে</b>। যারা টাকার সাথে নিজের সম্পর্ক বদলাতে চান, তাদের জন্য।
                  </p>
                  <div className="fb-price-row">
                    <span className="fb-price-now fb-num">৳1,786</span>
                    <span className="fb-price-was fb-num">৳3,213</span>
                    <span className="fb-save-pill">SAVE ৳1,427</span>
                  </div>
                  <div className="fb-cta-row">
                    <a href="#builder" className="fb-btn fb-btn-primary">
                      এখনই অর্ডার করুন
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </a>
                    <a href="#books" className="fb-btn fb-btn-ghost">সব বই দেখুন</a>
                  </div>
                  <div className="fb-trust-mini">
                    <div><Stars size={14} /> <b className="fb-num">4.9</b> <span style={{ color: '#6E685D' }}>(১৪২)</span></div>
                    <div>·</div>
                    <div><b>৩০০+</b> পাঠক কিনেছেন</div>
                  </div>
                </div>

                {/* Book stack */}
                <div className="fb-stack-wrap" aria-hidden="true">
                  <div className="fb-stack">
                    {BOOKS.map((book, i) => {
                      const p = bySlug[book.slug];
                      const src = p ? imgUrl(p.images?.[0]) : null;
                      const poses = [
                        { cls: 'fb-b1', left: 0, top: 40, rot: '-9deg' },
                        { cls: 'fb-b2', left: 75, top: 70, rot: '-4deg' },
                        { cls: 'fb-b3', left: 140, top: 90, rot: '0deg' },
                        { cls: 'fb-b4', left: 205, top: 70, rot: '4deg' },
                        { cls: 'fb-b5', left: 270, top: 40, rot: '9deg' },
                      ][i];
                      return (
                        <div key={book.slug}
                          className={`fb-book ${poses.cls}`}
                          style={{ left: poses.left, top: poses.top, transform: `rotate(${poses.rot})`, background: book.color, color: book.dark ? '#1a1a1a' : '#fff', border: book.dark ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                          {src ? (
                            <img src={src} alt={book.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : null}
                          {!src && (
                            <div className="fb-cover" style={{ color: book.dark ? '#1a1a1a' : '#fff' }}>
                              <div className="fb-btop">{book.top}</div>
                              <div className="fb-bttl" style={{ fontSize: i === 2 ? 22 : 18 }}>{book.titleShort}</div>
                              <div className="fb-bauth">{book.authorShort}</div>
                            </div>
                          )}
                          {(i === 0 || i === 2) && <span className="fb-ptag">{book.discountPct}%</span>}
                        </div>
                      );
                    })}
                    <div className="fb-stack-floor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Value strip ─────────────────────────────────────────────── */}
        <div className="fb-value-strip">
          <div className="fb-value-row">
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8893A" strokeWidth="1.6"><path d="M5 7l3 3 11-11M5 17l3 3 11-11"/></svg>, label: 'সারা দেশে ক্যাশ অন ডেলিভারি' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8893A" strokeWidth="1.6"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>, label: '৪.৯ ★ — ১৪২ রিভিউ' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8893A" strokeWidth="1.6"><path d="M4 7h16v12H4zM4 7l8 6 8-6"/></svg>, label: '১০০% অরিজিনাল প্রিন্ট' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8893A" strokeWidth="1.6"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/></svg>, label: 'যত্ন নিয়ে প্যাকেজিং' },
            ].map((v, i) => (
              <div key={i}>{v.icon}<span>{v.label}</span></div>
            ))}
          </div>
        </div>

        {/* ── Problems ────────────────────────────────────────────────── */}
        <section style={{ background: '#F4EFE6', padding: '96px 0' }}>
          <div className="fb-container">
            <div ref={r2} style={fadeStyle}>
              <div className="fb-section-head">
                <div className="fb-section-eyebrow">আপনার পরিচিত সমস্যা</div>
                <h2 className="fb-section-title">আপনি কি এই সমস্যাগুলোর কোনোটায় আছেন?</h2>
                <p className="fb-section-sub">প্রায় প্রত্যেক বাঙালি মধ্যবিত্ত এই তিনটির একটা বা একাধিক সমস্যা প্রতিদিন ভোগেন। আপনি একা নন।</p>
              </div>
              <div className="fb-problems">
                {[
                  { num: '01', ico: '৳', title: 'টাকা কোথায় যায় বুঝতে পারেন না', body: 'মাস শেষে মনে হয় হাত খালি, কিন্তু কোথায় খরচ হলো হিসাব মেলে না। বাজেট, সেভিং, ইনভেস্ট — সবই অস্পষ্ট।' },
                  { num: '02', ico: '↗', title: 'সঞ্চয় শুরু হয় না', body: '"পরের মাস থেকে শুরু করব" — এই অপেক্ষায় বছর কেটে যায়। কোথা থেকে শুরু করবেন সেটাই বুঝে উঠতে পারেন না।' },
                  { num: '03', ico: '⊘', title: 'বিনিয়োগে ভয় লাগে', body: 'স্টক, রিয়েল এস্টেট, ব্যবসা — সবকিছুই ঝুঁকি মনে হয়। ভুল সিদ্ধান্তের ভয়ে কিছুই করা হয় না।' },
                ].map((c, i) => (
                  <div key={i} className="fb-problem">
                    <div className="fb-num-mark">{c.num}</div>
                    <div className="fb-ico" style={{ fontSize: 20 }}>{c.ico}</div>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                ))}
              </div>
              <div className="fb-problem-cta">
                <div className="fb-check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                </div>
                <div>এই ৫টি বই-ই আপনার সব প্রশ্নের উত্তর দেবে — <b>প্রমাণিত।</b></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ────────────────────────────────────────────────── */}
        <section className="fb-benefits-band">
          <div className="fb-container">
            <div ref={r3} style={fadeStyle}>
              <div className="fb-section-head">
                <div className="fb-section-eyebrow">আপনি যা শিখবেন</div>
                <h2 className="fb-section-title">এই বইগুলো পড়ে আপনার জীবন বদলাবে</h2>
              </div>
              <div className="fb-benefits-grid">
                {[
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8C075" strokeWidth="1.6"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.8 1 1.8 1 2.8v.5h6V17.5c0-1 .3-2 1-2.8A7 7 0 0 0 12 2z"/></svg>, text: 'টাকার সাথে নিজের সম্পর্ক নতুনভাবে বুঝতে শিখবেন' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8C075" strokeWidth="1.6"><path d="M3 21V7l9-4 9 4v14M9 21V12h6v9"/></svg>, text: 'লোন আর জাল থেকে বাঁচার বাস্তব রাস্তা পাবেন' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8C075" strokeWidth="1.6"><path d="M4 17l6-6 4 4 8-8M14 7h6v6"/></svg>, text: 'সঠিক financial structures ও decisions নিতে পারবেন' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8C075" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>, text: 'সঠিক বিনিয়োগের কৌশল রপ্ত করতে পারবেন' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8C075" strokeWidth="1.6"><path d="M13 2L4 14h7l-2 8 11-12h-7z"/></svg>, text: 'সহজ habits তৈরি করে দীর্ঘমেয়াদে ধনী হবেন' },
                  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8C075" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6v6H9zM3 15h6M15 15h6"/></svg>, text: 'একটি smart money management system গড়ে তুলবেন' },
                ].map((b, i) => (
                  <div key={i} className="fb-benefit">
                    <div className="fb-b-ico">{b.icon}</div>
                    <p>{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Book Cards ──────────────────────────────────────────────── */}
        <section id="books" className="fb-books-section">
          <div className="fb-container">
            <div ref={r4} style={fadeStyle}>
              <div className="fb-section-head">
                <div className="fb-section-eyebrow">যা যা আছে বান্ডেলে</div>
                <h2 className="fb-section-title">৫টি সেরা ফিন্যান্স বই</h2>
                <p className="fb-section-sub">প্রতিটি বই আন্তর্জাতিক বেস্টসেলার ও সময়ের পরীক্ষায় উত্তীর্ণ।</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: bookGridCols, gap: 16 }}>
                {BOOKS.map((book) => {
                  const p = bySlug[book.slug];
                  const src = p ? imgUrl(p.images?.[0]) : null;
                  const price = finalPrice(book);
                  const tagline = p?.taglineEn ?? book.tagline;
                  return (
                    <div key={book.slug} className="fb-bcard">
                      <div className="fb-thumb" style={{ background: book.dark ? '#EEE7DA' : 'linear-gradient(160deg, #FBF8F2, #EEE7DA)' }}>
                        <span className="fb-bdg">{book.discountPct}% OFF</span>
                        {book.popular && <span className="fb-popular-badge">MOST POPULAR</span>}
                        {src ? (
                          <img src={src} alt={book.title} loading="lazy" style={{ width: '62%', aspectRatio: '2/3', objectFit: 'contain', borderRadius: '2px 4px 4px 2px', boxShadow: '0 16px 24px -12px rgba(0,0,0,0.4)' }} />
                        ) : (
                          <div className="fb-mini-book" style={{ background: book.color, color: book.dark ? '#1a1a1a' : '#fff' }}>
                            <div className="fb-mb-top">{book.top}</div>
                            <div className="fb-mb-ttl">{book.titleShort}</div>
                            <div className="fb-mb-auth">{book.authorShort}</div>
                          </div>
                        )}
                      </div>
                      <div className="fb-body">
                        <h4>{book.title}<span className="en">{tagline}</span></h4>
                        <div className="fb-aline">{book.author} · {book.pages} পেজ</div>
                        <div className="fb-stars-row"><Stars size={12} /> <span className="fb-num">4.9</span></div>
                        <div className="fb-pline">
                          <span className="fb-pnow fb-num">৳{price}</span>
                          <span className="fb-pwas fb-num">৳{book.salePrice}</span>
                        </div>
                        <div className="fb-scarcity">⚡ মাত্র {book.stock} টি বাকি</div>
                        <div className="fb-actions">
                          <Link href={`/${book.slug}`} className="fb-btn fb-btn-mini-ghost">বিস্তারিত</Link>
                          <button className="fb-btn fb-btn-mini-primary" onClick={() => handleAddToCart(book.slug, book.title)}>কার্টে যোগ</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Bundle Builder ───────────────────────────────────────────── */}
        <section id="builder" className="fb-builder-wrap">
          <div className="fb-container">
            <div ref={r5} style={fadeStyle}>
              <div className="fb-builder">
                <div className="fb-builder-head">
                  <div>
                    <div className="fb-section-eyebrow" style={{ color: '#E8C075' }}>বান্ডেল বানান</div>
                    <h3>বই বেছে নিন — সরাসরি অর্ডার করুন</h3>
                    <p>সব বই একসাথে নিলে সর্বোচ্চ ছাড়। পছন্দ করে কিছু বই নিন — যত বেশি, তত বেশি সাশ্রয়।</p>
                  </div>
                  <div className="fb-builder-price">
                    <div className="lbl">আপনার মোট</div>
                    <div className="val fb-num">৳{selectedTotal}</div>
                    <div className="save">{savedAmount.toLocaleString()} টাকা সাশ্রয় · {discountPct}% ছাড়</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: pickGridCols, gap: 12 }}>
                  {BOOKS.map((book) => {
                    const p = bySlug[book.slug];
                    const src = p ? imgUrl(p.images?.[0]) : null;
                    const isOn = selected.has(book.slug);
                    const price = finalPrice(book);
                    return (
                      <button key={book.slug} className={`fb-pick${isOn ? ' on' : ''}`} onClick={() => toggleBook(book.slug)}>
                        <div className="fb-pick-check">
                          {isOn && <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#1E3A2A" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>}
                        </div>
                        {src ? (
                          <img src={src} alt={book.title} loading="lazy" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'contain', borderRadius: '2px 4px 4px 2px', marginBottom: 10, boxShadow: '0 8px 14px -6px rgba(0,0,0,0.4)', filter: isOn ? 'none' : 'grayscale(20%)' }} />
                        ) : (
                          <div className="fb-pmini" style={{ background: book.color, color: book.dark ? '#1a1a1a' : '#fff' }}>
                            <div className="pa">{book.top}</div>
                            <div className="pt">{book.titleShort}</div>
                            <div className="pa">{book.authorShort}</div>
                          </div>
                        )}
                        <div className="fb-ptitle">{book.title}</div>
                        <div className="fb-pprice fb-num">৳{price}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="fb-builder-totals">
                  <div className="fb-totals-left">
                    <div><span className="l">বই</span><span className="v fb-num">{selected.size} টি</span></div>
                    <div><span className="l">আসল দাম</span><span className="v strike fb-num">৳{selectedOriginal}</span></div>
                    <div><span className="l">ছাড়</span><span className="v gold fb-num">{discountPct}%</span></div>
                    <div><span className="l">আপনি দেন</span><span className="v fb-num">৳{selectedTotal}</span></div>
                  </div>
                </div>

                <button className="fb-builder-cta" onClick={handleBundleCheckout}>
                  নির্বাচিত {selected.size}টি বই অর্ডার করুন
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <div className="fb-builder-fineprint">
                  <span>✓ ক্যাশ অন ডেলিভারি</span>
                  <span>✓ ৩-৫ দিনে ডেলিভারি</span>
                  <span>✓ পছন্দ না হলে রিটার্ন</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quality ─────────────────────────────────────────────────── */}
        <section className="fb-quality-section">
          <div className="fb-container">
            <div ref={r6} style={fadeStyle}>
              <div className="fb-section-head">
                <div className="fb-section-eyebrow">মুদ্রণের মান</div>
                <h2 className="fb-section-title">দেশের সেরা কোয়ালিটি</h2>
                <p className="fb-section-sub">প্রতিটি বই হাতে নিলেই বুঝবেন পার্থক্য।</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { n: 'i.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1E3A2A" strokeWidth="1.5"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><path d="M8 12h8M8 16h6"/></svg>, title: '৭০ GSM Offset Paper', body: 'ভারী, ম্যাট ফিনিশের কাগজ — চোখে আরাম, দীর্ঘস্থায়ী।' },
                  { n: 'ii.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1E3A2A" strokeWidth="1.5"><path d="M4 4v16h16"/><path d="M4 4h4v16M16 4h4v16"/></svg>, title: 'Perfect Binding', body: 'মজবুত perfect binding — বহু বছর পরও পাতা খুলে যাবে না।' },
                  { n: 'iii.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1E3A2A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 3v18"/></svg>, title: '৩০০ GSM Art Cover', body: 'প্রিমিয়াম matte-laminated কভার — দেখতে সুন্দর, টেকসই।' },
                  { n: 'iv.', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1E3A2A" strokeWidth="1.5"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>, title: 'দেশের সেরা কোয়ালিটি', body: 'বাংলাদেশের সেরা মুদ্রণ প্রযুক্তি — international standard।' },
                ].map((q, i) => (
                  <div key={i} className="fb-qcard">
                    <div className="qno">{q.n}</div>
                    <div className="qico">{q.icon}</div>
                    <h4>{q.title}</h4>
                    <p>{q.body}</p>
                  </div>
                ))}
              </div>
              <div className="fb-promise">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#1E3A2A" strokeWidth="1.5" style={{ flexShrink: 0 }}><path d="M12 2l9 4v6c0 5-3.8 9-9 10-5.2-1-9-5-9-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
                <p><b>আমাদের প্রতিশ্রুতি:</b> বই পেয়ে যদি প্রিন্টে এতটুকু সমস্যা পান, পুরো টাকা ফেরত — কোনো প্রশ্ন নয়।</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews ─────────────────────────────────────────────────── */}
        <section className="fb-reviews-section">
          <div className="fb-container">
            <div ref={r7} style={fadeStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 46 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {REVIEWS.map((r, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: r.color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: '"Fraunces",serif', fontWeight: 600, fontSize: 14, marginLeft: i === 0 ? 0 : -10, border: '2px solid #FBF8F2' }}>{r.init}</div>
                  ))}
                </div>
                <div><Stars size={18} /> <span style={{ fontFamily: '"Inter",sans-serif', fontWeight: 600, color: '#3F3B33', fontSize: 14 }}><b className="fb-num">4.9</b>/৫ · ১৪২ পাঠক</span></div>
              </div>
              <div className="fb-section-head" style={{ marginBottom: 36 }}>
                <h2 className="fb-section-title">পাঠকরা কী বলছেন</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 18 }}>
                {REVIEWS.map((r, i) => (
                  <div key={i} className="fb-review">
                    <Stars size={14} />
                    <div className="fb-quote">&ldquo;</div>
                    <p>{r.text}</p>
                    <div className="fb-who">
                      <div className="fb-av" style={{ background: r.color }}>{r.init}</div>
                      <div className="fb-who-l">
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

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="fb-faq-section">
          <div className="fb-container">
            <div ref={r8} style={fadeStyle}>
              <div className="fb-section-head">
                <div className="fb-section-eyebrow">প্রশ্ন ও উত্তর</div>
                <h2 className="fb-section-title">সচরাচর জিজ্ঞাসা</h2>
              </div>
              <div className="fb-faq-list">
                {FAQS.map((faq, i) => (
                  <div key={i} className={`fb-faq-item${openFaq === i ? ' on' : ''}`}>
                    <button className="fb-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {faq.q}
                      <span className="fb-pm">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={openFaq === i ? 'white' : '#161510'} strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                      </span>
                    </button>
                    <div className="fb-faq-a">
                      <div className="fb-faq-a-inner">{faq.a}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="fb-faq-help">
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <span className="fb-wa-dot"><WaIcon size={11} /></span>
                  আরও প্রশ্ন আছে? WhatsApp-এ মেসেজ করুন
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="fb-final-cta">
          <div className="fb-container">
            <div className="fb-section-eyebrow">আজই শুরু করুন</div>
            <h2>আজকেই শুরু হোক<br />আপনার আর্থিক যাত্রা</h2>
            <p>৫টি বই, ৪৪% ছাড় — অফার শেষ হবে কাউন্টডাউনে।</p>
            <div className="fb-final-cd">
              {[{ v: pad(timeLeft.h), l: 'ঘণ্টা' }, { v: pad(timeLeft.m), l: 'মিনিট' }, { v: pad(timeLeft.s), l: 'সেকেন্ড' }].map((c, i) => (
                <div key={i} className="fb-cd-box">
                  <div className="n fb-num">{c.v}</div>
                  <div className="l">{c.l}</div>
                </div>
              ))}
            </div>
            <div className="fb-cta-row" style={{ justifyContent: 'center' }}>
              <a href="#builder" className="fb-btn fb-btn-primary">
                এখনই অর্ডার করুন
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#books" className="fb-btn fb-btn-ghost">বইগুলো আবার দেখুন</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* ── Mobile sticky bar ─────────────────────────────────────────── */}
      {!atBundle && (
        <div className="fb-mobile-bar">
          <div className="mb-price">
            <span className="now fb-num">৳{selectedTotal}</span>
            <span className="was fb-num">৳{selectedOriginal}</span>
          </div>
          <a href="#builder" className="fb-btn fb-btn-primary" style={{ padding: '12px 18px', fontSize: 14 }}>
            এখনই অর্ডার করুন
          </a>
        </div>
      )}

      {/* ── WhatsApp float ────────────────────────────────────────────── */}
      <a className="fb-whatsapp" href={WA_LINK} target="_blank" rel="noopener noreferrer">
        <WaIcon size={18} />
        সাহায্য
      </a>
    </>
  );
}
