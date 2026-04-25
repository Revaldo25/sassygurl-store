import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import SessionWrapper from "@/components/SessionWrapper"; // <-- Import Jantung Sistem
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SassyGurl Store | Top-Up Game Elite",
  description: "Platform top-up game premium dengan sistem otomatis, aman, dan harga kompetitif.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <body className={`${jakarta.className} bg-zinc-950 text-[#f4f4f5] antialiased min-h-screen flex flex-col`}>
        
        {/* MEMBUNGKUS SELURUH EKOSISTEM DENGAN SESSION PROVIDER */}
        <SessionWrapper>
          
          {/* Navbar Global (Sekarang bisa mendeteksi Login) */}
          <Navbar />

          {/* Konten Halaman */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer Minimalis */}
          <footer className="border-t border-white/5 py-8 text-center bg-zinc-900/30">
            <p className="text-[10px] font-black text-zinc-600 tracking-[0.3em] uppercase">
              © {new Date().getFullYear()} SASSYGURL STORE ELITE. ALL RIGHTS RESERVED.
            </p>
          </footer>

        </SessionWrapper>
        
        {/* SCRIPT MIDTRANS SNAP */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}