'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import api, { imgUrl } from '@/lib/api';
import { getCached, setCached } from '@/lib/cache';
import { Product, Category, Author, Publisher, Blog, Tag } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface HomepageSection {
  _id: string;
  name: string;
  slug: string;
  priority?: number;
  image?: string;
  products: Product[];
}

const PRIMARY = '#16a34a';
const AMBER = '#f59e0b';

const CAT_PALETTES = [
  { bg: '#fef3c7', accent: '#92400e' },
  { bg: '#dcfce7', accent: '#166534' },
  { bg: '#dbeafe', accent: '#1e40af' },
  { bg: '#e0e7ff', accent: '#3730a3' },
  { bg: '#fee2e2', accent: '#991b1b' },
  { bg: '#fce7f3', accent: '#9d174d' },
  { bg: '#cffafe', accent: '#155e75' },
  { bg: '#f3e8ff', accent: '#6b21a8' },
];


const STATIC_REVIEWS = [
  {
    name: 'রিফাত আহমেদ',
    city: 'ঢাকা',
    rating: 5,
    quote: 'অর্ডার দেওয়ার পরদিনই বই হাতে পেয়েছি। প্যাকেজিং চমৎকার, দামও সাশ্রয়ী। শবাজ এখন আমার যাওয়ার প্রথম জায়গা।',
    initials: 'রি',
    bg: '#dcfce7',
  },
  {
    name: 'নাবিলা ইসলাম',
    city: 'চট্টগ্রাম',
    rating: 5,
    quote: 'দুর্লভ পুরোনো বই পেয়েছি যা অন্য কোথাও খুঁজে পাইনি। bKash-এ পেমেন্ট দিয়েছি, কোনো ঝামেলা ছাড়াই।',
    initials: 'না',
    bg: '#fef3c7',
  },
  {
    name: 'তানভীর হাসান',
    city: 'সিলেট',
    rating: 4,
    quote: 'কালেকশন বিশাল, ক্যাটাগরি অনুযায়ী খুঁজে পেতে সহজ। শিশুদের বইয়ের সেকশনটা বিশেষ ভালো লেগেছে।',
    initials: 'তা',
    bg: '#fce7f3',
  },
];

const HERO_FALLBACKS = [
  { bg: '#1e3a8a', label: 'শবাজ', rot: -8, left: '8%', top: '6%', z: 2, delay: 0, big: false },
  { bg: '#064e3b', label: 'বই', rot: 4, left: '38%', top: '22%', z: 3, delay: 0.4, big: true },
  { bg: '#7e22ce', label: 'পড়ুন', rot: 9, left: '64%', top: '10%', z: 2, delay: 0.8, big: false },
];

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: AMBER, fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function NewBookCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const authorName = Array.isArray(product.author)
    ? (product.author[0] as any)?.name
    : (product.author as any)?.name || product.author;
  const salePrice = product.salePrice || 0;
  const discount = product.discountAmount || 0;
  const currentPrice = salePrice - discount;
  const discountPct = salePrice > 0 ? Math.round((discount / salePrice) * 100) : 0;
  const coverImg = imgUrl(product.images?.[0]);

  return (
    <div
      className="nh-book-card"
      style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: 18,
        border: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'box-shadow .2s ease, border-color .2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 18px 36px -22px rgba(15,23,42,0.18)';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#f1f5f9';
      }}
    >
      {discountPct > 0 && (
        <div style={{
          position: 'absolute', top: 14, left: 14, width: 44, height: 44,
          borderRadius: '50%', background: '#dc2626', color: 'white',
          fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2,
          boxShadow: '0 6px 14px -6px rgba(220,38,38,0.55)',
          fontFamily: 'var(--sans)',
        }}>
          -{discountPct}%
        </div>
      )}

      <Link href="/wishlist" style={{
        position: 'absolute', top: 14, right: 14, width: 36, height: 36,
        borderRadius: '50%', background: 'white', border: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        textDecoration: 'none',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </Link>

      <Link href={`/products/${product.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          background: '#f8fafc', borderRadius: 10, padding: '20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          {coverImg ? (
            <img
              src={coverImg}
              alt={product.name}
              style={{
                height: 196, width: 140, objectFit: 'cover', borderRadius: 4,
                boxShadow: '0 14px 20px rgba(15,23,42,0.18)',
              }}
            />
          ) : (
            <div style={{
              height: 196, width: 140, borderRadius: 4,
              background: 'linear-gradient(160deg, #1e3a8a, #1e40af)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 14px 20px rgba(15,23,42,0.18)', padding: 10,
            }}>
              <span style={{ color: '#fef3c7', fontFamily: 'var(--bn)', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
                {product.name}
              </span>
            </div>
          )}
        </div>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.35,
          fontFamily: 'var(--bn)', display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40,
        }}>{product.name}</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 8px', fontFamily: 'var(--sans)' }}>
          {authorName as string}
        </p>
      </Link>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14, marginTop: 'auto' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--sans)' }}>
          ৳{currentPrice}
        </span>
        {discount > 0 && (
          <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through', fontFamily: 'var(--sans)' }}>
            ৳{salePrice}
          </span>
        )}
      </div>

      <button
        onClick={() => onAdd(product)}
        style={{
          background: PRIMARY, color: 'white', border: 'none', borderRadius: 10,
          padding: '11px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--bn)',
          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background .15s ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#15803d'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}
      >
        কার্টে যোগ করুন
      </button>
    </div>
  );
}

function SectionHeader({ title, linkHref, linkLabel }: { title: string; linkHref: string; linkLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
      <h2 style={{
        fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#0f172a',
        margin: 0, fontFamily: 'var(--bn)',
      }}>{title}</h2>
      {linkLabel && (
        <Link href={linkHref} style={{ color: PRIMARY, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--bn)' }}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const addItem = useCartStore(state => state.addItem);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product, 1);
    toast.success('কার্টে যোগ হয়েছে');
  }, [addItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedCategories = getCached<Category[]>('categories');
        const cachedAuthors = getCached<Author[]>('authors');
        const cachedPublishers = getCached<Publisher[]>('publishers');

        const [productsRes, categoriesRes, tagsRes, authorsRes, publishersRes, blogsRes, sectionsRes] = await Promise.allSettled([
          api.get('/product/get-all-data'),
          cachedCategories ? Promise.resolve({ data: { data: cachedCategories } }) : api.post('/category/get-all'),
          api.get('/tag/get-all-basic'),
          cachedAuthors ? Promise.resolve({ data: { data: cachedAuthors } }) : api.get('/author/get-all-basic'),
          cachedPublishers ? Promise.resolve({ data: { data: cachedPublishers } }) : api.get('/publisher/get-all-basic'),
          api.get('/blog/get-all-basic'),
          api.get('/tag/get-homepage-sections').catch(() => ({ data: { data: [] } })),
        ]);

        if (productsRes.status === 'fulfilled' && productsRes.value.data?.data) {
          let productsData = productsRes.value.data.data;
          if (productsRes.value.data.data.items) productsData = productsRes.value.data.data.items;
          if (Array.isArray(productsData)) {
            setFeaturedProducts(productsData.filter((p: Product) => (p.discountAmount || 0) > 0).slice(0, 10));
            setNewProducts(productsData.slice(0, 10));
            setAllProducts(productsData);
          }
        }
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.data) {
          let catsData = categoriesRes.value.data.data;
          if (categoriesRes.value.data.data.items) catsData = categoriesRes.value.data.data.items;
          if (Array.isArray(catsData)) {
            if (!cachedCategories) setCached('categories', catsData);
            setCategories(catsData);
          }
        }
        if (tagsRes.status === 'fulfilled' && tagsRes.value.data?.data) {
          setTags(tagsRes.value.data.data.slice(0, 20));
        }
        if (authorsRes.status === 'fulfilled' && authorsRes.value.data?.data) {
          const authorsData = authorsRes.value.data.data;
          if (!cachedAuthors && Array.isArray(authorsData)) setCached('authors', authorsData);
          setAuthors(authorsData.slice(0, 12));
        }
        if (publishersRes.status === 'fulfilled' && publishersRes.value.data?.data) {
          const publishersData = publishersRes.value.data.data;
          if (!cachedPublishers && Array.isArray(publishersData)) setCached('publishers', publishersData);
          setPublishers(publishersData.slice(0, 12));
        }
        if (blogsRes.status === 'fulfilled' && blogsRes.value.data?.data) {
          setBlogs(blogsRes.value.data.data.slice(0, 3));
        }
        if (sectionsRes.status === 'fulfilled') {
          const raw = (sectionsRes.value as any)?.data;
          const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
          setHomepageSections(list);
        }
      } catch (err: any) {
        console.error('Home page fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div style={{ fontFamily: 'var(--bn)', color: '#64748b', fontSize: 18 }}>লোড হচ্ছে...</div>
        </main>
        <Footer />
      </div>
    );
  }

  const activeSections = homepageSections.filter(s => s.products && s.products.length > 0);
  const heroBooks = featuredProducts.slice(0, 3);
  const hasDiscount = featuredProducts.some(p => (p.discountAmount || 0) > 0);

  const HERO_POSITIONS = [
    { rot: -8, left: '8%', top: '6%', z: 2, delay: 0, big: false },
    { rot: 4, left: '38%', top: '22%', z: 3, delay: 0.4, big: true },
    { rot: 9, left: '64%', top: '10%', z: 2, delay: 0.8, big: false },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', color: '#0f172a' }}>
      <Header />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section style={{ background: '#fdf6ec' }}>
          <div
            className="nh-hero"
            style={{
              maxWidth: 1280, margin: '0 auto', padding: '64px 24px',
              display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 48, alignItems: 'center',
            }}
          >
            {/* Left */}
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'white', border: `1px solid ${PRIMARY}33`, color: PRIMARY,
                borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                marginBottom: 20, fontFamily: 'var(--bn)',
              }}>
                ✦ বাংলাদেশের #১ অনলাইন বইয়ের দোকান
              </span>
              <h1 style={{
                fontSize: 'clamp(30px, 4vw, 56px)', lineHeight: 1.15, fontWeight: 800,
                margin: '0 0 18px', color: '#0f172a', letterSpacing: '-0.01em',
                fontFamily: 'var(--bn)',
              }}>
                আপনার পছন্দের বই,<br />
                <span style={{ color: PRIMARY }}>এখন ঘরে বসেই</span>
              </h1>
              <p style={{
                fontSize: 17, color: '#475569', lineHeight: 1.6,
                margin: '0 0 32px', maxWidth: 520, fontFamily: 'var(--bn)',
              }}>
                বাংলাদেশের বিশ্বস্ত অনলাইন বইয়ের দোকান — হাজার হাজার বইয়ের কালেকশন থেকে সারাদেশে দ্রুত ডেলিভারি।
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/products" style={{
                  background: PRIMARY, color: 'white', borderRadius: 10,
                  padding: '14px 28px', fontSize: 15, fontWeight: 700,
                  fontFamily: 'var(--bn)', boxShadow: '0 6px 20px -8px rgba(22,163,74,0.6)',
                  textDecoration: 'none', display: 'inline-block',
                }}>বই কিনুন →</Link>
                <Link href="/offers" style={{
                  background: 'white', color: '#0f172a', border: '1.5px solid #cbd5e1',
                  borderRadius: 10, padding: '13px 26px', fontSize: 15, fontWeight: 600,
                  fontFamily: 'var(--bn)', textDecoration: 'none', display: 'inline-block',
                }}>অফার দেখুন</Link>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
                {[
                  { n: '৫০,০০০+', l: 'বই' },
                  { n: '১০,০০০+', l: 'সন্তুষ্ট পাঠক' },
                  { n: '৬৪ জেলায়', l: 'ডেলিভারি' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--bn)' }}>{s.n}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'var(--sans)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating book covers */}
            <div className="nh-hero-books" style={{ position: 'relative', height: 420 }}>
              <div style={{
                position: 'absolute', inset: '10% 8% 10% 8%', borderRadius: '50%',
                background: `radial-gradient(closest-side, ${PRIMARY}1f, transparent 70%)`,
              }} />

              {heroBooks.length > 0
                ? heroBooks.map((book, i) => {
                    const pos = HERO_POSITIONS[i];
                    const w = pos.big ? 200 : 155;
                    const h = pos.big ? 280 : 215;
                    const cover = imgUrl(book.images?.[0]);
                    return (
                      <div key={book._id} style={{
                        position: 'absolute', left: pos.left, top: pos.top,
                        transform: `rotate(${pos.rot}deg)`, zIndex: pos.z,
                        animation: `floatY 6s ease-in-out ${pos.delay}s infinite alternate`,
                        filter: 'drop-shadow(0 24px 30px rgba(15,23,42,0.22))',
                        borderRadius: 6,
                      }}>
                        {cover
                          ? <img src={cover} alt={book.name} style={{ width: w, height: h, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
                          : (
                            <div style={{
                              width: w, height: h, borderRadius: 4,
                              background: ['#1e3a8a', '#064e3b', '#7e22ce'][i],
                              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
                            }}>
                              <span style={{ color: '#fef3c7', fontFamily: 'var(--bn)', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
                                {book.name}
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  })
                : HERO_FALLBACKS.map((item, i) => (
                    <div key={i} style={{
                      position: 'absolute', left: item.left, top: item.top,
                      transform: `rotate(${item.rot}deg)`, zIndex: item.z,
                      animation: `floatY 6s ease-in-out ${item.delay}s infinite alternate`,
                      filter: 'drop-shadow(0 24px 30px rgba(15,23,42,0.22))',
                    }}>
                      <div style={{
                        width: item.big ? 200 : 155, height: item.big ? 280 : 215,
                        borderRadius: 4, background: item.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fef3c7', fontFamily: 'var(--bn)', fontWeight: 700, fontSize: 16 }}>{item.label}</span>
                      </div>
                    </div>
                  ))
              }

              {hasDiscount && (
                <div style={{
                  position: 'absolute', top: '4%', right: '2%', background: AMBER, color: 'white',
                  borderRadius: 999, padding: '10px 14px', fontWeight: 800, fontSize: 12,
                  boxShadow: '0 8px 20px -8px rgba(245,158,11,0.6)', transform: 'rotate(6deg)',
                  fontFamily: 'var(--bn)', zIndex: 10,
                }}>৪০% পর্যন্ত ছাড়</div>
              )}

              <div style={{
                position: 'absolute', bottom: '6%', left: '2%', background: 'white',
                borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center',
                gap: 10, boxShadow: '0 14px 30px -12px rgba(15,23,42,0.18)',
                border: '1px solid #f1f5f9', zIndex: 10,
              }}>
                <span style={{ fontSize: 22 }}>🚚</span>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--sans)' }}>ডেলিভারি</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--bn)' }}>২৪-৪৮ ঘণ্টায়</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Strip ── */}
        <section style={{ background: '#f0fdf4', borderTop: '1px solid #dcfce7', borderBottom: '1px solid #dcfce7' }}>
          <div
            className="nh-trust"
            style={{
              maxWidth: 1280, margin: '0 auto', padding: '18px 24px',
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20,
            }}
          >
            {[
              { icon: '🚚', label: 'সারাদেশে ডেলিভারি' },
              { icon: '💳', label: 'bKash / Nagad / কার্ড' },
              { icon: '🔄', label: 'সহজ রিটার্ন' },
              { icon: '⭐', label: '১০,০০০+ সন্তুষ্ট পাঠক' },
            ].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <span style={{ fontSize: 24 }}>{it.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#166534', fontFamily: 'var(--bn)' }}>{it.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Category Grid ── */}
        {categories.length > 0 && (
          <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'var(--bn)' }}>
                  📚 বিভাগসমূহ
                </h2>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, fontFamily: 'var(--bn)' }}>
                  যে কোনো বিভাগে ক্লিক করে বইয়ের পুরো কালেকশন দেখুন
                </p>
              </div>
              <Link href="/products" style={{ color: PRIMARY, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--bn)' }}>
                সব বিভাগ দেখুন →
              </Link>
            </div>
            <Swiper
              modules={[]}
              slidesPerView={1.2}
              spaceBetween={14}
              breakpoints={{
                480: { slidesPerView: 2.1, spaceBetween: 16 },
                768: { slidesPerView: 3.1, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 18 },
              }}
            >
              {categories.slice(0, 8).map((cat, i) => {
                const pal = CAT_PALETTES[i % CAT_PALETTES.length];
                const count = (cat as any).productCount;
                const catProducts = allProducts.filter(p => {
                  const catField = (p as any).category;
                  if (Array.isArray(catField)) {
                    return catField.some((c: any) => (typeof c === 'object' ? c?._id : c) === cat._id);
                  }
                  const catId = typeof catField === 'object' ? catField?._id : catField;
                  return catId === cat._id;
                }).slice(0, 4);
                return (
                  <SwiperSlide key={cat._id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      style={{
                        background: pal.bg, borderRadius: 18, padding: '22px 18px 20px',
                        display: 'flex', flexDirection: 'column', textDecoration: 'none',
                        color: pal.accent, border: '1px solid rgba(0,0,0,0.04)',
                        transition: 'transform .15s ease, box-shadow .15s ease',
                        height: '100%',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)';
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 24px 36px -22px rgba(15,23,42,0.18)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, fontFamily: 'var(--bn)' }}>
                        {cat.name}
                      </div>
                      {count > 0 && (
                        <div style={{ fontSize: 13, color: pal.accent, fontWeight: 600, marginTop: 4, fontFamily: 'var(--sans)' }}>
                          {count}+ বই
                        </div>
                      )}
                      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, flex: 1 }}>
                        {catProducts.length > 0
                          ? catProducts.map((cp, ci) => {
                              const cpImg = imgUrl(cp.images?.[0]);
                              return (
                                <div key={ci} style={{ borderRadius: 5, overflow: 'hidden', aspectRatio: '3/4', boxShadow: '0 4px 8px rgba(15,23,42,0.18)' }}>
                                  {cpImg
                                    ? <img src={cpImg} alt={cp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', background: pal.accent, opacity: 0.35 }} />
                                  }
                                </div>
                              );
                            })
                          : Array.from({ length: 4 }).map((_, ci) => (
                              <div key={ci} style={{ borderRadius: 5, aspectRatio: '3/4', background: pal.accent, opacity: 0.2 }} />
                            ))
                        }
                      </div>
                      <div style={{
                        marginTop: 14, fontSize: 13, color: pal.accent, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontFamily: 'var(--bn)',
                      }}>
                        <span>সব বই দেখুন</span>
                        <span>→</span>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </section>
        )}

        {/* ── Book Sections ── */}
        {activeSections.length > 0 ? (
          activeSections.map((section) => (
            <section key={section._id} style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
              <SectionHeader title={section.name} linkHref={`/products?tag=${section.slug}`} linkLabel="সব বই দেখুন →" />
              <Swiper
                modules={[Navigation]}
                navigation
                slidesPerView={2}
                spaceBetween={14}
                breakpoints={{
                  640: { slidesPerView: 3, spaceBetween: 18 },
                  1024: { slidesPerView: 5, spaceBetween: 22 },
                }}
              >
                {section.products.map((product) => (
                  <SwiperSlide key={product._id}>
                    <NewBookCard product={product} onAdd={handleAddToCart} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          ))
        ) : (
          <>
            {featuredProducts.length > 0 && (
              <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
                <SectionHeader title="🔥 হট ডিল" linkHref="/products?sort=discountAmount" linkLabel="সব দেখুন →" />
                <Swiper
                  modules={[Navigation]}
                  navigation
                  slidesPerView={2}
                  spaceBetween={14}
                  breakpoints={{
                    640: { slidesPerView: 3, spaceBetween: 18 },
                    1024: { slidesPerView: 5, spaceBetween: 22 },
                  }}
                >
                  {featuredProducts.map((product) => (
                    <SwiperSlide key={product._id}>
                      <NewBookCard product={product} onAdd={handleAddToCart} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            )}
            {newProducts.length > 0 && (
              <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
                <SectionHeader title="✨ নতুন আগমন" linkHref="/products?sort=createdAt" linkLabel="সব দেখুন →" />
                <Swiper
                  modules={[Navigation]}
                  navigation
                  slidesPerView={2}
                  spaceBetween={14}
                  breakpoints={{
                    640: { slidesPerView: 3, spaceBetween: 18 },
                    1024: { slidesPerView: 5, spaceBetween: 22 },
                  }}
                >
                  {newProducts.map((product) => (
                    <SwiperSlide key={product._id}>
                      <NewBookCard product={product} onAdd={handleAddToCart} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            )}
          </>
        )}

        {/* ── Promo Banner ── */}
        <section style={{ maxWidth: 1280, margin: '24px auto', padding: '0 24px' }}>
          <div
            className="nh-promo"
            style={{
              background: `linear-gradient(95deg, ${AMBER} 0%, #fbbf24 100%)`,
              borderRadius: 20, padding: '32px 40px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 24, flexWrap: 'wrap', position: 'relative', overflow: 'hidden', color: '#422006',
            }}
          >
            <div style={{ position: 'absolute', top: -30, right: -10, width: 220, height: 220, background: 'rgba(255,255,255,0.18)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 180, height: 180, background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--sans)' }}>
                🔥 এই সপ্তাহের বিশেষ অফার
              </div>
              <h3 style={{ margin: 0, fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--bn)' }}>
                সর্বোচ্চ <span style={{ color: '#7c2d12' }}>৪০% ছাড়!</span> — শত শত বইয়ে
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#78350f', fontFamily: 'var(--bn)' }}>
                নির্বাচিত বইয়ে প্রযোজ্য।
              </p>
            </div>
            <Link href="/offers" style={{
              background: '#1c1917', color: 'white', borderRadius: 10,
              padding: '14px 28px', fontWeight: 700, fontFamily: 'var(--bn)',
              fontSize: 15, position: 'relative', zIndex: 1,
              whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block',
            }}>
              অফার দেখুন →
            </Link>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'var(--bn)' }}>
              💬 পাঠকদের অভিজ্ঞতা
            </h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, fontFamily: 'var(--bn)' }}>
              আমাদের কাস্টমারদের সাথে যা শেয়ার করেছেন
            </p>
          </div>
          <div className="nh-reviews" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {STATIC_REVIEWS.map((r, i) => (
              <div key={i} style={{
                background: 'white', border: '1px solid #f1f5f9', borderRadius: 16,
                padding: 26, display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ fontSize: 36, lineHeight: 0.6, color: PRIMARY, fontFamily: 'serif' }}>"</div>
                <p style={{ margin: 0, fontSize: 15, color: '#0f172a', lineHeight: 1.65, fontFamily: 'var(--bn)' }}>{r.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', background: r.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16, fontFamily: 'var(--bn)', color: '#0f172a',
                  }}>{r.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--bn)' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--sans)' }}>{r.city}</div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Authors ── */}
        {authors.length > 0 && (
          <section className="page-section">
            <div className="sec-head">
              <h2><span className="bn">জনপ্রিয় লেখক</span></h2>
              <Link href="/authors" className="see-all">সব দেখুন →</Link>
            </div>
            <Swiper
              slidesPerView={3}
              spaceBetween={16}
              breakpoints={{
                480: { slidesPerView: 4 },
                640: { slidesPerView: 5 },
                768: { slidesPerView: 7 },
                1024: { slidesPerView: 9 },
              }}
              modules={[Navigation]}
            >
              {authors.map((author) => (
                <SwiperSlide key={author._id}>
                  <Link href={`/products?author=${author.slug}`} className="block text-center group py-2">
                    <div
                      style={{
                        width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                        margin: '0 auto 8px', border: '1px solid var(--line-soft)',
                        transition: 'border-color .2s ease',
                      }}
                      className="group-hover:border-[var(--accent)]"
                    >
                      {author.image ? (
                        <img src={imgUrl(author.image)!} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--bn)', fontWeight: 600, color: 'var(--ink-2)' }}>
                          {author.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--bn)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {author.name}
                    </p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* ── Publishers ── */}
        {publishers.length > 0 && (
          <section style={{ borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', background: 'var(--card)' }}>
            <div className="page-section">
              <div className="sec-head">
                <h2><span className="bn">জনপ্রিয় প্রকাশনা</span></h2>
                <Link href="/publishers" className="see-all">সব দেখুন →</Link>
              </div>
              <Swiper
                slidesPerView={3}
                spaceBetween={12}
                breakpoints={{
                  480: { slidesPerView: 4 },
                  640: { slidesPerView: 5 },
                  768: { slidesPerView: 6 },
                  1024: { slidesPerView: 8 },
                }}
                modules={[Navigation]}
              >
                {publishers.map((pub) => (
                  <SwiperSlide key={pub._id}>
                    <Link
                      href={`/products?publisher=${pub.slug}`}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        padding: '12px 8px', border: '1px solid var(--line-soft)', borderRadius: 'var(--radius)',
                        background: 'var(--bg)', transition: 'border-color .15s ease',
                      }}
                    >
                      {pub.image ? (
                        <img src={imgUrl(pub.image)!} alt={pub.name} style={{ height: 36, maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--bn)', fontWeight: 600, color: 'var(--ink-2)' }}>
                          {pub.name?.charAt(0)}
                        </div>
                      )}
                      <p style={{ fontFamily: 'var(--bn)', fontSize: 11, color: 'var(--ink-2)', textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {pub.name}
                      </p>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <section className="page-section">
            <div className="sec-head">
              <h2>জনপ্রিয় ট্যাগ</h2>
            </div>
            <div className="cat-pills">
              {tags.map((tag) => (
                <Link key={tag._id} href={`/products?tag=${tag.slug}`} className="cat-pill">
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Blog ── */}
        {blogs.length > 0 && (
          <section className="page-section">
            <div className="sec-head">
              <h2>ব্লগ</h2>
              <Link href="/blog" className="see-all">সব দেখুন →</Link>
            </div>
            <div className="blog-grid">
              {blogs.slice(0, 3).map((blog) => (
                <Link key={blog._id} href={`/blog/${blog.slug}`} className="blog-card">
                  <div className="blog-card-img">
                    {blog.image ? (
                      <img src={imgUrl(blog.image)!} alt={blog.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HiOutlineBookOpen style={{ width: 40, height: 40, color: 'var(--muted)' }} />
                      </div>
                    )}
                  </div>
                  <span className="blog-card-meta">ব্লগ</span>
                  <h3 className="blog-card-title">{blog.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Newsletter ── */}
        <section style={{ maxWidth: 1280, margin: '24px auto 56px', padding: '0 24px' }}>
          <div
            className="nh-newsletter"
            style={{
              background: '#0f172a', color: 'white', borderRadius: 20, padding: '40px 44px',
              display: 'flex', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap', alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 'clamp(16px, 2vw, 24px)', fontWeight: 800, fontFamily: 'var(--bn)' }}>
                নতুন বইয়ের খবর সবার আগে পান
              </h3>
              <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: 14, fontFamily: 'var(--bn)' }}>
                প্রতি সপ্তাহে নতুন আগমন ও বিশেষ অফার সরাসরি আপনার ইনবক্সে।
              </p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newsletterEmail) {
                  toast.success('সাবস্ক্রাইব হয়েছে!');
                  setNewsletterEmail('');
                }
              }}
              style={{ display: 'flex', gap: 8, flex: '0 1 480px', minWidth: 280 }}
            >
              <input
                type="email"
                placeholder="আপনার ইমেইল লিখুন"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                style={{
                  flex: 1, height: 50, border: 'none', borderRadius: 10, padding: '0 16px',
                  fontSize: 14, fontFamily: 'var(--bn)', background: 'white', color: '#0f172a',
                  outline: 'none',
                }}
              />
              <button type="submit" style={{
                background: PRIMARY, color: 'white', border: 'none', borderRadius: 10,
                padding: '0 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--bn)',
                fontSize: 15, whiteSpace: 'nowrap',
              }}>সাবস্ক্রাইব</button>
            </form>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
