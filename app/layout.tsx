import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sassygurlstore.com'),
  title: {
    default: 'SassyGurl Store — Top Up Game Termurah & Tercepat',
    template: '%s | SassyGurl Store',
  },
  description: 'Top up game premium dengan harga termurah, proses otomatis 1-3 detik, dan pembayaran lengkap. MLBB, Genshin, Free Fire, PUBG, dan lainnya.',
  keywords: ['top up game', 'top up murah', 'top up MLBB', 'top up Genshin', 'top up Free Fire', 'top up diamond', 'SassyGurl Store'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'SassyGurl Store',
    title: 'SassyGurl Store — Top Up Game Termurah & Tercepat',
    description: 'Top up game premium dengan harga termurah, proses otomatis 1-3 detik, dan pembayaran lengkap.',
    images: [{ url: '/images/og-cover.webp', width: 1200, height: 630, alt: 'SassyGurl Store — Top Up Game' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SassyGurl Store — Top Up Game Termurah & Tercepat',
    description: 'Top up game premium dengan harga termurah, proses otomatis 1-3 detik.',
    images: ['/images/og-cover.webp'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  viewportFit: "cover",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${jakarta.className} min-h-screen bg-zinc-950 text-white antialiased`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(253,176,192,0.10),transparent_35%),linear-gradient(180deg,#09090b_0%,#09090b_35%,#050505_100%)]" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
