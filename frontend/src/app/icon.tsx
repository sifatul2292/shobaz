import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default async function Icon() {
  let siteName = 'S';
  try {
    const res = await fetch(`${API_BASE}/api/shop-information/get`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const name: string = data?.data?.siteName || data?.siteName || 'Shobaz';
    siteName = name.charAt(0).toUpperCase();
  } catch {
    siteName = 'S';
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        {siteName}
      </div>
    ),
    { ...size }
  );
}
