import { Metadata } from 'next';
import HomeClient, { HomeInitialData } from './HomeClient';
import { API_BASE, SITE_URL, absoluteImage, jsonLdString } from '@/lib/seo';

// Re-render the homepage at most every few minutes; sections change rarely.
const HOME_REVALIDATE = 300;

async function getHomeSeo() {
  try {
    const res = await fetch(`${API_BASE}/api/seoPage/get-by/home_page`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

async function getShopInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/shop-information/get`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.data ?? data ?? null;
  } catch {
    return null;
  }
}

async function getList(endpoint: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/${endpoint}`, { next: { revalidate: HOME_REVALIDATE } });
    const json = await res.json();
    const raw = json?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  } catch {
    return [];
  }
}

// Server-render the homepage collections so crawlers and first paint see real
// products instead of a "loading" placeholder. The client falls back to its
// own fetch when this returns nothing (e.g. API briefly unreachable).
async function getHomeData(): Promise<HomeInitialData | undefined> {
  const [sections, authors, publishers, blogs] = await Promise.all([
    getList('tag/get-homepage-sections'),
    getList('author/get-all-basic'),
    getList('publisher/get-all-basic'),
    getList('blog/get-all-basic'),
  ]);
  if (!sections.some((s) => Array.isArray(s?.products) && s.products.length > 0)) return undefined;
  return {
    sections,
    authors: authors.slice(0, 12),
    publishers: publishers.slice(0, 12),
    blogs: blogs.slice(0, 3),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [seo, shop] = await Promise.all([getHomeSeo(), getShopInfo()]);

  const siteName = shop?.siteName || 'Shobaz';
  const shortDescription = shop?.shortDescription || 'জনপ্রিয় সকল বই এক প্ল্যাটফর্ম';
  const title = `${siteName} - ${shortDescription}`;
  const description =
    seo?.seoDescription || shortDescription;
  const keywords = seo?.keyWord || 'বাংলা বই, অনলাইন বইয়ের দোকান, ইসলামিক বই, shobaz';
  const imageUrl = seo?.image
    ? seo.image.startsWith('http')
      ? seo.image
      : `${API_BASE}/api/upload/images/${seo.image}`
    : '';

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/`,
      siteName: 'Shobaz',
      images: imageUrl ? [{ url: imageUrl, alt: 'Shobaz' }] : [],
      type: 'website',
      locale: 'bn_BD',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function HomePage() {
  const [initialData, shop] = await Promise.all([getHomeData(), getShopInfo()]);
  const logo = absoluteImage(shop?.siteLogo || shop?.navLogo);
  const firstValue = (list: any) => (Array.isArray(list) ? list.find((x) => x?.value)?.value : undefined);
  const phone = firstValue(shop?.phones);
  const email = firstValue(shop?.emails);
  const address = firstValue(shop?.addresses);
  const sameAs = Array.isArray(shop?.socialLinks)
    ? shop.socialLinks.map((s: any) => s?.value).filter((v: unknown) => typeof v === 'string' && v.startsWith('http'))
    : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_URL}/#organization`,
        name: shop?.siteName || 'Shobaz',
        url: `${SITE_URL}/`,
        ...(logo ? { logo } : {}),
        ...(phone ? { telephone: phone } : {}),
        ...(email ? { email } : {}),
        ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'BD' } } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        areaServed: 'BD',
        currenciesAccepted: 'BDT',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: shop?.siteName || 'Shobaz',
        url: `${SITE_URL}/`,
        inLanguage: 'bn',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <HomeClient initialData={initialData} />
    </>
  );
}
