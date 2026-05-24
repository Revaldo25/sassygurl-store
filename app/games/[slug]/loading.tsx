import SiteHeader from "@/components/SiteHeader";

export default function GameLoading() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <SiteHeader />
      
      {/* ═══ Skeleton Hero ═══ */}
      <div className="relative overflow-hidden border-b border-white/5 h-[400px]">
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 h-full flex items-end">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] w-full">
            
            <div className="flex flex-col gap-5">
              <div className="flex gap-2">
                <div className="w-20 h-6 bg-white/10 rounded-full animate-pulse" />
                <div className="w-32 h-6 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="w-3/4 h-14 bg-white/10 rounded-xl animate-pulse mb-4" />
                <div className="w-1/2 h-4 bg-white/10 rounded-md animate-pulse mb-2" />
                <div className="w-2/3 h-4 bg-white/10 rounded-md animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-xl">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="hidden lg:flex justify-end">
              <div className="w-full max-w-sm h-32 rounded-[2.5rem] bg-white/5 animate-pulse" />
            </div>

          </div>
        </div>
      </div>

      {/* ═══ Skeleton Content ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-[500px] rounded-[2.5rem] bg-white/5 animate-pulse" />
          <div className="lg:col-span-8 space-y-6">
             <div className="h-64 rounded-[2rem] bg-white/5 animate-pulse" />
             <div className="h-[400px] rounded-[2rem] bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
