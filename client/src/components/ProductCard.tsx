import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProviderStatusBadge } from "@/components/ProviderStatusIndicator";
import { Card } from "@/components/ui/card";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  category: string;
  providerName: string;
  logoUrl?: string;
  isActive: boolean;
  onBuy?: () => void;
}

export function ProductCard({
  id,
  name,
  price,
  category,
  providerName,
  logoUrl,
  isActive,
  onBuy,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10 overflow-hidden hover:border-indigo-400/30 transition-colors">
        <div className="relative p-4">
          {/* Provider Status Badge */}
          <div className="absolute top-4 right-4">
            <ProviderStatusBadge providerName={providerName} />
          </div>

          {/* Product Logo */}
          {logoUrl && (
            <div className="mb-4 h-24 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src={logoUrl}
                alt={name}
                className="w-16 h-16 object-contain"
              />
            </div>
          )}

          {/* Product Info */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-white truncate">
                  {name}
                </h3>
                <p className="text-xs text-white/50 mt-1">{category}</p>
              </div>
              {!isActive && (
                <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs">
                  Offline
                </Badge>
              )}
            </div>

            {/* Price */}
            <p className="text-lg font-bold text-indigo-300">
              Rp {price.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Buy Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onBuy}
              disabled={!isActive}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Beli Sekarang
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
