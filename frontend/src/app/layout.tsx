import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Hind_Siliguri, Poppins } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import GTMRouteTracker from "@/components/common/GTMRouteTracker";
import FloatingCart from "@/components/common/FloatingCart";

const hindSiliguri = Hind_Siliguri({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-english",
});

export const metadata: Metadata = {
  title: "Shobaz - Online Bookstore",
  description: "Buy books online from Shobaz - Bangladesh's trusted online bookstore",
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function getLogoUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/shop-information/get`, {
      next: { revalidate: 300 }, // cache for 5 minutes server-side
    });
    const data = await res.json();
    const info = data?.data;
    const raw = info?.navLogo || info?.siteLogo || null;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return `${API_BASE}/api/upload/images/${raw}`;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoUrl = await getLogoUrl();

  return (
    <html lang="bn">
      <head>
        {/* Inject logo URL before React hydrates so Header reads it synchronously — no flash */}
        {logoUrl && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__SHOBAZ_LOGO__=${JSON.stringify(logoUrl)};`,
            }}
          />
        )}
      </head>
      <body className={`${hindSiliguri.variable} ${poppins.variable}`}>
        {/* Stape.io Custom Loader */}
        <Script
          id="stape-custom-loader"
          src="https://server.shobaz.com/stape-custom-loader.js?id=ukeecxgx"
          strategy="afterInteractive"
        />
        {/* GTM via server-side container */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://server.shobaz.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KW6CXCJK');`,
          }}
        />
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://server.shobaz.com/ns.html?id=GTM-KW6CXCJK"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Suspense fallback={null}>
          <GTMRouteTracker />
        </Suspense>
        <Toaster position="top-right" />
        {children}
        <FloatingCart />
      </body>
    </html>
  );
}