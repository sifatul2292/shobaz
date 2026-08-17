'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomeProductCard from '@/components/home/HomeProductCard';
import api, { imgUrl } from '@/lib/api';
import { getCached, setCached } from '@/lib/cache';
import { Product, Author, Publisher, Blog, Tag } from '@/types';
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

const IcDelivery = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="m16 8 4 1 3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IcPayment = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IcReturn = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const IcReaders = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>;

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

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: AMBER, fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const tagScrollRef = useRef<HTMLDivElement>(null);

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product, 1);
  }, [addItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedAuthors = getCached<Author[]>('authors');
        const cachedPublishers = getCached<Publisher[]>('publishers');

        const [productsRes, tagsRes, authorsRes, publishersRes, blogsRes, sectionsRes] = await Promise.allSettled([
          api.get('/product/get-all-data'),
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

  useEffect(() => {
    if (loading) return;
    const sections = Array.from(document.querySelectorAll('main > section')).slice(1);
    sections.forEach(s => s.classList.add('reveal-s'));
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06 }
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [loading]);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', color: '#0f172a' }}>
      <Header />

      <main className="flex-1">

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
              { icon: <IcDelivery />, label: 'সারাদেশে ডেলিভারি' },
              { icon: <IcPayment />, label: 'bKash / Nagad / কার্ড' },
              { icon: <IcReturn />, label: 'সহজ রিটার্ন' },
              { icon: <IcReaders />, label: '১০,০০০+ সন্তুষ্ট পাঠক' },
            ].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>{it.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#166534', fontFamily: 'var(--bn)' }}>{it.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Book Sections ── */}
        {activeSections.length > 0 ? (
          activeSections.map((section) => (
            <section key={section._id} style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
              <SectionHeader title={section.name} linkHref={`/products?tag=${section.slug}`} linkLabel="সব বই দেখুন →" />
              <Swiper
                className="home-product-swiper"
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
                  <SwiperSlide key={product._id} className="home-product-slide">
                    <HomeProductCard product={product} onAdd={handleAddToCart} />
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
                  className="home-product-swiper"
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
                    <SwiperSlide key={product._id} className="home-product-slide">
                      <HomeProductCard product={product} onAdd={handleAddToCart} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            )}
            {newProducts.length > 0 && (
              <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
                <SectionHeader title="✨ নতুন আগমন" linkHref="/products?sort=createdAt" linkLabel="সব দেখুন →" />
                <Swiper
                  className="home-product-swiper"
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
                    <SwiperSlide key={product._id} className="home-product-slide">
                      <HomeProductCard product={product} onAdd={handleAddToCart} />
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
              পাঠকদের অভিজ্ঞতা
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
            <div className="sec-head" style={{ alignItems: 'center' }}>
              <h2>জনপ্রিয় ট্যাগ</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['l', 'r'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => tagScrollRef.current?.scrollBy({ left: dir === 'l' ? -200 : 200, behavior: 'smooth' })}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'white',
                      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#374151', flexShrink: 0,
                    }}
                    aria-label={dir === 'l' ? 'Previous' : 'Next'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {dir === 'l' ? <path d="m15 18-6-6 6-6"/> : <path d="m9 18 6-6-6-6"/>}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div ref={tagScrollRef} className="cat-pills" style={{ flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {tags.map((tag) => (
                <Link key={tag._id} href={`/products?tag=${tag.slug}`} className="cat-pill" style={{ flexShrink: 0 }}>
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
