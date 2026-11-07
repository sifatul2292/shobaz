'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomeProductCard from '@/components/home/HomeProductCard';
import ProductRail from '@/components/home/ProductRail';
import { useScrollReveal } from '@/components/home/useScrollReveal';
import api, { imgUrl } from '@/lib/api';
import { getCached, setCached } from '@/lib/cache';
import { Product, Author, Publisher, Blog, Tag } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { trackAddToCart } from '@/lib/trackCart';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface HomepageSection {
  _id: string;
  name: string;
  slug: string;
  priority?: number;
  image?: string;
  products: Product[];
}

export interface HomeInitialData {
  sections: HomepageSection[];
  authors: Author[];
  publishers: Publisher[];
  blogs: Blog[];
}

const IcDelivery = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="m16 8 4 1 3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IcPayment = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IcReturn = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const IcReaders = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>;
const IcArrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;

const USPS = [
  { icon: <IcDelivery />, label: 'সারাদেশে ডেলিভারি' },
  { icon: <IcPayment />, label: 'bKash / Nagad / কার্ড' },
  { icon: <IcReturn />, label: 'সহজ রিটার্ন' },
  { icon: <IcReaders />, label: '১০,০০০+ সন্তুষ্ট পাঠক' },
];

function SectionHead({ title, href, linkLabel = 'সব দেখুন' }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="home-head rv">
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="home-viewall">
          {linkLabel} <IcArrow />
        </Link>
      )}
    </div>
  );
}

function ProductSection({
  title, href, products, onAdd, first = false,
}: { title: string; href: string; products: Product[]; onAdd: (p: Product) => void; first?: boolean }) {
  return (
    <section className={`home-section${first ? ' reveal-load' : ''}`} data-reveal={first ? undefined : ''}>
      <div className="home-wrap">
        <SectionHead title={title} href={href} />
        <ProductRail label={title}>
          {products.map((product, i) => (
            <HomeProductCard key={product._id} product={product} onAdd={onAdd} eager={first && i < 6} />
          ))}
        </ProductRail>
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="home-section home-section--tight" data-reveal="">
      <div className="home-wrap">
        <Link href="/offers" className="home-promo rv">
          <span>
            <span className="home-promo-eyebrow">এই সপ্তাহের বিশেষ অফার</span>
            <span className="home-promo-title">সর্বোচ্চ ৪০% ছাড় — শত শত বইয়ে</span>
            <span className="home-promo-sub">নির্বাচিত বইয়ে প্রযোজ্য।</span>
          </span>
          <span className="home-promo-cta">অফার দেখুন <IcArrow /></span>
        </Link>
      </div>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <div className="home-wrap" style={{ paddingTop: 24 }} aria-busy="true" aria-label="লোড হচ্ছে">
      {[0, 1].map((row) => (
        <div key={row} style={{ marginBottom: 36 }}>
          <div className="skeleton" style={{ height: 20, width: 180, borderRadius: 6, marginBottom: 16 }} />
          <div className="home-skeleton-row">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '4 / 5', borderRadius: 10 }} />
                <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 4, marginTop: 10 }} />
                <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 4, marginTop: 6 }} />
                <div className="skeleton" style={{ height: 34, borderRadius: 999, marginTop: 10 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage({ initialData }: { initialData?: HomeInitialData }) {
  const addItem = useCartStore(state => state.addItem);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>(initialData?.authors ?? []);
  const [publishers, setPublishers] = useState<Publisher[]>(initialData?.publishers ?? []);
  const [blogs, setBlogs] = useState<Blog[]>(initialData?.blogs ?? []);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(initialData?.sections ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product, 1);
    trackAddToCart(product, 1);
  }, [addItem]);

  useEffect(() => {
    // Server already rendered the collections — no need to refetch them.
    if (initialData) return;
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

  useScrollReveal(!loading, [loading, homepageSections.length]);

  if (loading) {
    return (
      <div className="home min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HomeSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  const activeSections = homepageSections.filter(s => s.products && s.products.length > 0);
  const fallbackSections = [
    { key: 'hot', title: 'হট ডিল', href: '/products?sort=discountAmount', products: featuredProducts },
    { key: 'new', title: 'নতুন আগমন', href: '/products?sort=createdAt', products: newProducts },
  ].filter(s => s.products.length > 0);
  const rails = activeSections.length > 0
    ? activeSections.map(s => ({ key: s._id, title: s.name, href: `/products?tag=${s.slug}`, products: s.products }))
    : fallbackSections;

  return (
    <div className="home min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <h1 className="sr-only">Shobaz — অনলাইনে জনপ্রিয় বই, নোটবুক ও বুক বান্ডেল কিনুন</h1>

        {/* ── Service highlights: static row on desktop, gentle marquee on phones ── */}
        <section className="home-usp" aria-label="আমাদের সেবা">
          <div className="home-usp-track">
            {[0, 1].map(copy => (
              <ul key={copy} className="home-usp-list" aria-hidden={copy === 1 || undefined}>
                {USPS.map(it => (
                  <li key={it.label}>{it.icon}<span>{it.label}</span></li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        {/* ── Collections ── */}
        {rails.map((rail, idx) => (
          <Fragment key={rail.key}>
            <ProductSection
              title={rail.title}
              href={rail.href}
              products={rail.products}
              onAdd={handleAddToCart}
              first={idx === 0}
            />
            {idx === Math.min(1, rails.length - 1) && <PromoBanner />}
          </Fragment>
        ))}
        {rails.length === 0 && <PromoBanner />}

        {/* ── Authors ── */}
        {authors.length > 0 && (
          <section className="home-section" data-reveal="">
            <div className="home-wrap">
              <SectionHead title="জনপ্রিয় লেখক" href="/authors" />
              <ProductRail label="জনপ্রিয় লেখক" variant="compact">
                {authors.map((author) => (
                  <Link key={author._id} href={`/products?author=${author.slug}`} className="home-author">
                    <span className="home-author-avatar">
                      {author.image ? (
                        <img src={imgUrl(author.image)!} alt="" loading="lazy" />
                      ) : (
                        <span>{author.name?.charAt(0)}</span>
                      )}
                    </span>
                    <span className="home-author-name">{author.name}</span>
                  </Link>
                ))}
              </ProductRail>
            </div>
          </section>
        )}

        {/* ── Publishers ── */}
        {publishers.length > 0 && (
          <section className="home-section" data-reveal="">
            <div className="home-wrap">
              <SectionHead title="জনপ্রিয় প্রকাশনা" href="/publishers" />
              <ProductRail label="জনপ্রিয় প্রকাশনা" variant="compact">
                {publishers.map((pub) => (
                  <Link key={pub._id} href={`/products?publisher=${pub.slug}`} className="home-publisher">
                    {pub.image ? (
                      <img src={imgUrl(pub.image)!} alt="" loading="lazy" />
                    ) : (
                      <span className="home-publisher-initial">{pub.name?.charAt(0)}</span>
                    )}
                    <span className="home-publisher-name">{pub.name}</span>
                  </Link>
                ))}
              </ProductRail>
            </div>
          </section>
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <section className="home-section" data-reveal="">
            <div className="home-wrap">
              <SectionHead title="জনপ্রিয় ট্যাগ" />
              <div className="home-tags rv">
                {tags.map((tag) => (
                  <Link key={tag._id} href={`/products?tag=${tag.slug}`} className="home-tag">
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Blog ── */}
        {blogs.length > 0 && (
          <section className="home-section" data-reveal="">
            <div className="home-wrap">
              <SectionHead title="ব্লগ" href="/blog" />
              <div className="home-blog stagger">
                {blogs.slice(0, 3).map((blog, i) => (
                  <Link key={blog._id} href={`/blog/${blog.slug}`} className="home-blog-card rv" style={{ ['--i' as string]: i }}>
                    <span className="home-blog-img">
                      {blog.image ? (
                        <img src={imgUrl(blog.image)!} alt={blog.title} loading="lazy" />
                      ) : (
                        <HiOutlineBookOpen style={{ width: 32, height: 32, color: '#a3a3a3' }} />
                      )}
                    </span>
                    <span className="home-blog-title">{blog.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Newsletter ── */}
        <section className="home-section home-section--last" data-reveal="">
          <div className="home-wrap">
            <div className="home-news rv">
              <div>
                <h2>নতুন বইয়ের খবর সবার আগে পান</h2>
                <p>প্রতি সপ্তাহে নতুন আগমন ও বিশেষ অফার সরাসরি আপনার ইনবক্সে।</p>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (newsletterEmail) {
                    toast.success('সাবস্ক্রাইব হয়েছে!');
                    setNewsletterEmail('');
                  }
                }}
              >
                <input
                  type="email"
                  placeholder="আপনার ইমেইল লিখুন"
                  aria-label="ইমেইল"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                />
                <button type="submit">সাবস্ক্রাইব</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
