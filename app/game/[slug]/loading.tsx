import SiteHeader from "@/components/SiteHeader";

export default function GameLoading() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <SiteHeader />

      {/* Hero Banner Skeleton */}
      <div className="relative h-[25vh] sm:h-[30vh] lg:h-[40vh] overflow-hidden bg-zinc-900/60 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/40 to-zinc-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-[2.5rem] bg-zinc-800 animate-pulse mb-6 border border-white/5" />
          <div className="h-8 w-48 sm:w-64 rounded-xl bg-zinc-800 animate-pulse mb-3" />
          <div className="h-4 w-24 rounded-lg bg-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* Trust Badges Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/50 p-5 backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
                <div className="h-2 w-20 rounded bg-zinc-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column Sidebar Skeleton */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-800 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-zinc-800 animate-pulse" />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="h-6 w-6 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
                    <div className="h-3 w-full rounded bg-zinc-800 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column Checkout Form Skeleton */}
          <main className="lg:col-span-8 space-y-6">
            {/* Step 1: Input Account ID Skeleton */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
                <div className="h-6 w-48 rounded bg-zinc-800 animate-pulse" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-12 rounded-2xl bg-zinc-800 animate-pulse" />
                <div className="h-12 rounded-2xl bg-zinc-800 animate-pulse" />
              </div>
            </div>

            {/* Step 2: Nominal Grid Selection Skeleton */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 space-y-6">
              <div className="h-6 w-32 rounded bg-zinc-800 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-3xl border border-white/5 bg-zinc-900/40 p-4 space-y-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
                    <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-zinc-800/80 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
