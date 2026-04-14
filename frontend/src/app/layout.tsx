import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Hind_Siliguri, Poppins } from "next/font/google";

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
      <body className={`${hindSiliguri.variable} ${poppins.variable}`}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}