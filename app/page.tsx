import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gamepad2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import HeroShowcase from "@/components/HeroShowcase";
import { featuredGames, games, liveTransactions, formatIDR } from "@/lib/catalog";

export default function HomePage() {
  const heroGame = games.find((g) => g.slug === "mlbb") ?? games[0];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />
      {heroGame ? <HeroShowcase game={heroGame} /> : null}

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Top Up Cepat", "Proses terasa instan dan rapi."],
            ["Provider Cerdas", "Route terendah dipilih otomatis."],
            ["UI Premium", "Glass, glow, motion, and depth."],
            ["Aset Asli", "Menggunakan folder gambar lokal."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur-3xl">
              <p className="text-xs font-bold tracking-[0.28em] text-sakura/80">{title}</p>
              <p className="mt-3 text-sm leading-7 text-white/65">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">FEATURED GAMES</p>
            <h2 className="mt-1 text-2xl font-black md:text-4xl">Pilih game, masuk ke pengalaman premium</h2>
          </div>
          <Link href="/mlbb" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 md:inline-flex">
            Open MLBB Elite
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featuredGames.map((game) => (
            <Link
              key={game.slug}
              href={game.slug === "mlbb" ? "/mlbb" : `/game/${game.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-sakura/30"
            >
              <div className="relative aspect-[16/11]">
                <Image src={game.icon} alt={game.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-white/75 backdrop-blur-xl">
                  <Gamepad2 className="h-3.5 w-3.5 text-sakura" />
                  {game.shortCode}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-black">{game.name}</h3>
                  <p className="mt-2 text-sm text-white/72">{game.subtitle}</p>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>{game.stats.sold} sold</span>
                  <span>{game.stats.rating} rating</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {game.products.slice(0, 2).map((product) => (
                    <div key={product.sku} className="rounded-2xl border border-white/10 bg-zinc-950/[0.55] p-3">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">{product.label ?? product.kind}</p>
                      <p className="mt-1 text-sm font-bold text-white">{product.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-3xl">
            <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">LIVE TRANSACTIONS</p>
            <h3 className="mt-1 text-2xl font-black">Bukti transaksi terasa hidup</h3>
            <div className="mt-5 grid gap-3">
              {liveTransactions.map((tx) => (
                <div key={`${tx.name}-${tx.product}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/[0.55] px-4 py-4">
                  <div>
                    <p className="font-bold text-white">{tx.name}</p>
                    <p className="text-sm text-white/55">{tx.game} • {tx.product}</p>
                  </div>
                  <span className="text-xs text-sakura/80">{tx.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(253,176,192,0.14),transparent_40%),rgba(255,255,255,0.05)] p-5 backdrop-blur-3xl">
            <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">WHY IT FEELS PREMIUM</p>
            <h3 className="mt-1 text-2xl font-black">Bukan hanya top-up, tapi experience</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Glass cards", "Layer transparan, blur halus, border lembut."],
                ["Motion depth", "Animasi entrance dan hover yang halus."],
                ["Quick validation", "Username muncul setelah input ID."],
                ["Smart payment", "QRIS / VA / e-wallet dengan estimasi."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-zinc-950/[0.55] p-4">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-sakura/20 bg-sakura/10 p-4 text-sm text-white/75">
              Harga mulai dari {formatIDR(1200)} untuk entry item MLBB, lalu naik ke pass dan bundle dengan routing provider paling efisien.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
