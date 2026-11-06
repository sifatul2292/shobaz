import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Anek_Bangla, Noto_Serif_Bengali, Poppins, Newsreader } from "next/font/google";
import { Suspense } from "react";
import GTMRouteTracker from "@/components/common/GTMRouteTracker";
import FloatingCart from "@/components/common/FloatingCart";
import GlobalFreeGiftModal from "@/components/common/GlobalFreeGiftModal";
import RouteProgress from "@/components/common/RouteProgress";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shobaz.com').replace(/\/$/, '');

export const viewport: Viewport = {
  themeColor: '#0f0f0e',
};

// Bangla UI/body font: Anek Bangla — clean, modern, variable weight (100–800).
const anekBangla = Anek_Bangla({
  subsets: ["latin", "bengali"],
  variable: "--font-bengali",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-english",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "700"],
  variable: "--font-bengali-display",
  display: "swap",
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';


export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${API_BASE}/api/shop-information/get`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const shop = data?.data ?? data;
    const siteName = shop?.siteName || 'Shobaz';
    const shortDescription = shop?.shortDescription || 'জনপ্রিয় সকল বই এক প্ল্যাটফর্ম';
    return {
      metadataBase: new URL(SITE_URL),
      applicationName: siteName,
      title: `${siteName} - ${shortDescription}`,
      description: shortDescription,
      formatDetection: { telephone: false },
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      title: 'Shobaz',
      description: 'জনপ্রিয় সকল বই এক প্ল্যাটফর্ম',
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        {/* Product covers are served from the API host — warm the connection early for faster LCP. */}
        <link rel="preconnect" href={API_BASE} crossOrigin="" />
        <link rel="dns-prefetch" href={API_BASE} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://track.shobaz.com/tagioo-loader/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KW6CXCJK');`,
          }}
        />
      </head>
      <body className={`${anekBangla.variable} ${notoSerifBengali.variable} ${poppins.variable} ${newsreader.variable}`}>
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<iframe src="https://track.shobaz.com/tagioo-loader/ns.html?id=GTM-KW6CXCJK" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
          }}
        />
        <Suspense fallback={null}>
          <GTMRouteTracker />
        </Suspense>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <Toaster position="top-right" />
        {children}
        <FloatingCart />
        <GlobalFreeGiftModal />
      </body>
    </html>
  );
}
