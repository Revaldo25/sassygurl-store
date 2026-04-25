import Image from "next/image";
import Link from "next/link";

interface GameCardProps {
  id: string;
  name: string;
  category: string;
  img: string;
  minPrice: number;
  isHot?: boolean;
}

export default function GameCard({ id, name, category, img, minPrice, isHot }: GameCardProps) {
  return (
    <Link href={`/game/${id}`} className="group relative glass-elite rounded-2xl p-4 transition-all duration-500 hover:-translate-y-2 hover:border-sakura/30 block">
      <div className="absolute inset-0 bg-sakura/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
      
      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-zinc-950">
        <Image 
          src={img || "/placeholder.png"} 
          alt={name} 
          fill 
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
        />
        {isHot && (
          <div className="absolute top-2 right-2 bg-zinc-950/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md text-[9px] font-black text-sakura uppercase tracking-widest shadow-lg">
            HOT
          </div>
        )}
      </div>

      <div className="relative">
        <h3 className="text-sm font-black text-white group-hover:text-sakura transition-colors uppercase tracking-tight truncate">
          {name}
        </h3>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
          {category}
        </p>
        
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-start gap-1">
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Mulai Dari</span>
          <span className="text-xs font-black text-white">Rp {minPrice.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </Link>
  );
}