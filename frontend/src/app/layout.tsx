import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Hind_Siliguri, Poppins } from "next/font/google";
import Script from "next/script";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        {/* Stape.io Custom Loader - improves tracking accuracy */}
        <Script
          id="stape-custom-loader"
          src="https://server.shobaz.com/stape-custom-loader.js?id=kpblypwe"
          strategy="beforeInteractive"
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
      </head>
      <body className={`${hindSiliguri.variable} ${poppins.variable}`}>
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://server.shobaz.com/ns.html?id=GTM-KW6CXCJK"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}