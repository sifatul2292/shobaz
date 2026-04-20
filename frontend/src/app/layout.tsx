import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Hind_Siliguri, Poppins } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import GTMRouteTracker from "@/components/common/GTMRouteTracker";
import FloatingCart from "@/components/common/FloatingCart";

const hindSiliguri = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-english",
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
      title: `${siteName} - ${shortDescription}`,
      description: shortDescription,
    };
  } catch {
    return {
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
      <head />
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