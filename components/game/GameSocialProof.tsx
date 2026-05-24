import { RecentTransaction } from "@/lib/api-adapter";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Activity } from "lucide-react";

export default function GameSocialProof({ transactions }: { transactions: RecentTransaction[] }) {
  if (!transactions || transactions.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-sakura" />
        <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Aktivitas Terkini</h4>
      </div>
      <div className="space-y-4">
        {transactions.slice(0, 3).map((t, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-bold text-white/90">{t.maskedTarget}</p>
              <p className="text-[10px] text-white/40 uppercase font-semibold">membeli {t.productName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-sakura">Berhasil</p>
              <p className="text-[10px] text-white/30">{formatDistanceToNow(new Date(t.timestamp), { addSuffix: true, locale: id })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
