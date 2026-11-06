import type { Metadata } from 'next';
import { API_BASE, SITE_URL, stripHtml } from '@/lib/seo';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `${SITE_URL}/page/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(`${API_BASE}/api/additional-page/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const page = json?.data;
    if (!page) return { title: 'Shobaz', alternates: { canonical } };
    const title = `${page.name || page.menuLabel || slug} | Shobaz`;
    const description = stripHtml(page.description || page.content || '', 160);
    return {
      title,
      ...(description ? { description } : {}),
      alternates: { canonical },
      openGraph: { title, ...(description ? { description } : {}), url: canonical, siteName: 'Shobaz', locale: 'bn_BD', type: 'article' },
    };
  } catch {
    return { title: 'Shobaz', alternates: { canonical } };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
