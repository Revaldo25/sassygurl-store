import type { Metadata } from "next";
import { getGameProducts, getGroupedPayments, getRecentTransactions } from "@/lib/api-adapter";
import CheckoutClient from "./CheckoutClient";
import SiteHeader from "@/components/SiteHeader";
import GameHero from "@/components/game/GameHero";
import FAQAccordion from "@/components/game/FAQAccordion";
import RelatedGamesGrid from "@/components/game/RelatedGamesGrid";
import GameSocialProof from "@/components/game/GameSocialProof";
import Image from "next/image";
import { notFound } from "next/navigation";

// ── Dynamic SEO Metadata ─────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { game } = await getGameProducts(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sassygurlstore.com';

  if (!game) {
    return { title: 'Game Tidak Ditemukan' };
  }

  const title = `Top Up ${game.name} Termurah & Tercepat`;
  const description = game.description || `Top up ${game.name} dengan harga termurah, proses otomatis 1-3 detik. Pembayaran lengkap: QRIS, E-Wallet, VA, Minimarket.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: game.banner, width: 1200, height: 630, alt: game.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [game.banner],
    },
    alternates: {
      canonical: `${baseUrl}/games/${slug}`,
    },
  };
}

// ── Page Component ───────────────────────────────────────────────────────────
export default async function GameSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [{ game, groupedByCategory, products }, paymentGroups, recentTransactions] = await Promise.all([
    getGameProducts(slug),
    getGroupedPayments(),
    getRecentTransactions(),
  ]);

  if (!game) return notFound();

  // Filter transactions for this specific game name (case insensitive)
  const gameTransactions = recentTransactions.filter(t => t.gameName && t.gameName.toLowerCase() === game.name.toLowerCase());

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sassygurlstore.com';

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-sakura/40 selection:text-white">
      {/* JSON-LD Structured Data — Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Top Up ${game.name}`,
            description: game.description,
            image: game.banner,
            brand: { '@type': 'Brand', name: 'SassyGurl Store' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'IDR',
              lowPrice: game.priceRange.min,
              highPrice: game.priceRange.max,
              offerCount: game.productCount,
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />
      {/* JSON-LD Structured Data — Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
              { '@type': 'ListItem', position: 2, name: game.name, item: `${baseUrl}/games/${game.slug}` },
            ],
          }),
        }}
      />

      <SiteHeader />

      {/* ═══ Game Hero Section ═══ */}
      <GameHero
        name={game.name}
        publisher={game.publisher}
        icon={game.icon}
        banner={game.banner}
        accent={game.accent}
        currencyName={game.currencyName}
        description={game.description}
        isHot={game.isHot}
        productCount={game.productCount}
      />

      {/* ═══ Main Content ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-32 md:pt-10 lg:pb-24">
        <CheckoutClient
          game={game}
          groupedByCategory={groupedByCategory}
          paymentGroups={paymentGroups}
        />
        
        <div className="mt-16 space-y-12">
          <FAQAccordion />
          <RelatedGamesGrid currentSlug={game.slug} />
        </div>
      </div>
    </div>
  );
}
