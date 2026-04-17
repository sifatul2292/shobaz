import { NextRequest, NextResponse } from 'next/server';

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

// In-process cache so we don't hit the API on every single request
let cache: { from: string; to: string }[] = [];
let lastFetched = 0;
const TTL = 60_000; // refresh every 60 seconds

async function getRedirects(): Promise<{ from: string; to: string }[]> {
  if (Date.now() - lastFetched < TTL) return cache;
  try {
    const res = await fetch(`${API}/api/redirect-url/get-all-basic`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        cache = (json.data as any[])
          .filter((r) => r.fromUrl && r.toUrl)
          .map((r) => ({ from: r.fromUrl as string, to: r.toUrl as string }));
        lastFetched = Date.now();
      }
    }
  } catch {
    // API unreachable — keep using the last cached list (or empty)
  }
  return cache;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const redirects = await getRedirects();
  const match = redirects.find((r) => r.from === path);
  if (match) {
    const url = req.nextUrl.clone();
    url.pathname = match.to;
    return NextResponse.redirect(url, { status: 301 });
  }
  return NextResponse.next();
}

// Run only on page navigations — skip _next internals, api routes, and static files
export const config = {
  matcher: ['/((?!_next|api|favicon\\.ico|.*\\..*).*)',],
};
