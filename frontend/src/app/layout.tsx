import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}