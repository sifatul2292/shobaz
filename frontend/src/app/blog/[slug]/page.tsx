import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com';

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

async function getBlog(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/blog/get-by-slug/${slug}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data?.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) return { title: 'ব্লগ | Shobaz' };

  const title = blog.seoTitle || blog.seoMetaTitle || `${blog.name} | Shobaz`;
  const description = stripHtml(blog.seoDescription || blog.shortDesc || blog.description || '');
  const keywords = blog.seoKeywords || blog.seoMetaTag || '';
  const imageUrl = blog.image
    ? blog.image.startsWith('http')
      ? blog.image
      : `${API_BASE}/api/upload/images/${blog.image}`
    : '';
  const pageUrl = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Shobaz',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: blog.name }] : [],
      type: 'article',
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) notFound();

  const imageUrl = blog.image
    ? blog.image.startsWith('http')
      ? blog.image
      : `${API_BASE}/api/upload/images/${blog.image}`
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.name,
    url: `${SITE_URL}/blog/${slug}`,
    description: stripHtml(blog.shortDesc || blog.description || ''),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(blog.authorName ? { author: { '@type': 'Person', name: blog.authorName } } : {}),
    publisher: { '@type': 'Organization', name: 'Shobaz', url: SITE_URL },
    inLanguage: 'bn',
    ...(blog.createdAt ? { datePublished: blog.createdAt } : {}),
    ...(blog.updatedAt ? { dateModified: blog.updatedAt } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
          {imageUrl && (
            <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 bg-gray-100">
              <img src={imageUrl} alt={blog.name} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{blog.name}</h1>
          {blog.authorName && (
            <p className="text-sm text-gray-500 mb-6">লেখক: {blog.authorName}</p>
          )}
          {blog.description && (
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: blog.description }}
            />
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
