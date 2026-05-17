import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SassyGurl Store Ultra",
  description: "Premium top-up game store dengan alur modular, glassmorphism, dan checkout modern.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <body className={`${jakarta.className} min-h-screen bg-zinc-950 text-white antialiased`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(253,176,192,0.10),transparent_35%),linear-gradient(180deg,#09090b_0%,#09090b_35%,#050505_100%)]" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
