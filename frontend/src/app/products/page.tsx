import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';
import { API_BASE, SITE_URL } from '@/lib/seo';

async function getProductsSeo() {
  try {
    const res = await fetch(`${API_BASE}/api/seoPage/get-by/products`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

async function getNamedList(endpoint: string): Promise<{ slug?: string; name?: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/api/${endpoint}`, { next: { revalidate: 3600 } });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

/** Resolve the collection a filtered URL represents (tag / category / author / publisher). */
async function resolveCollection(sp: Search) {
  const tag = one(sp.tag);
  const category = one(sp.category);
  const author = one(sp.author);
  const publisher = one(sp.publisher);

  if (tag) {
    const sections = await getNamedList('tag/get-homepage-sections');
    const name = sections.find((s) => s.slug === tag)?.name || decodeURIComponent(tag).replace(/-/g, ' ');
    return { key: 'tag', slug: tag, name, title: `${name} — বই কিনুন | Shobaz` };
  }
  if (category) {
    const name = decodeURIComponent(category).replace(/-/g, ' ');
    return { key: 'category', slug: category, name, title: `${name} — বই কিনুন | Shobaz` };
  }
  if (author) {
    const authors = await getNamedList('author/get-all-basic');
    const name = authors.find((a) => a.slug === author)?.name || decodeURIComponent(author).replace(/-/g, ' ');
    return { key: 'author', slug: author, name, title: `${name}-এর বই | Shobaz` };
  }
  if (publisher) {
    const publishers = await getNamedList('publisher/get-all-basic');
    const name = publishers.find((p) => p.slug === publisher)?.name || decodeURIComponent(publisher).replace(/-/g, ' ');
    return { key: 'publisher', slug: publisher, name, title: `${name} প্রকাশনীর বই | Shobaz` };
  }
  return null;
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Search> }
): Promise<Metadata> {
  const sp = await searchParams;
  const [seo, collection] = await Promise.all([getProductsSeo(), resolveCollection(sp)]);
  const isSearch = Boolean(one(sp.q));

  const title = collection?.title || seo?.name || 'সকল বই | Shobaz';
  const description = collection
    ? `${collection.name} — শবাজে সেরা দামে অর্ডার করুন। সারাদেশে হোম ডেলিভারি, সহজ রিটার্ন ও নিরাপদ পেমেন্ট।`
    : seo?.seoDescription ||
      'শোবাজে সকল বাংলা বই, ইসলামিক বই ও পাঠ্যবইয়ের সংগ্রহ দেখুন। ক্যাটাগরি, লেখক ও প্রকাশনী অনুযায়ী ফিল্টার করুন।';
  const keywords = seo?.keyWord || 'বাংলা বই, সকল বই, বই কিনুন, shobaz';
  const imageUrl = seo?.image
    ? seo.image.startsWith('http')
      ? seo.image
      : `${API_BASE}/api/upload/images/${seo.image}`
    : '';
  // Each collection is its own canonical landing page; sort/price/search
  // variations fold back into it.
  const pageUrl = collection
    ? `${SITE_URL}/products?${collection.key}=${encodeURIComponent(collection.slug)}`
    : `${SITE_URL}/products`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: pageUrl },
    ...(isSearch ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Shobaz',
      images: imageUrl ? [{ url: imageUrl, alt: 'Shobaz Books' }] : [],
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

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsClient />
    </Suspense>
  );
}
