import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashSaleCardProps {
  productName: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  expiresAt: Date;
  logoUrl: string;
  onBuy: () => void;
}

export function FlashSaleCard({
  productName,
  originalPrice,
  discountedPrice,
  discountPercentage,
  expiresAt,
  logoUrl,
  onBuy,
}: FlashSaleCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const difference = expiresAt.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
      setIsExpired(false);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <motion.div
      className="relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/30 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-red-500/0"
        animate={{
          opacity: isExpired ? 0.3 : [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Flash Sale Badge */}
      <motion.div
        className="absolute top-2 right-2 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
        animate={{
          scale: isExpired ? 1 : [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Zap className="w-3 h-3" />
        FLASH SALE
      </motion.div>

      {/* Content */}
      <div className="relative z-10 space-y-3">
        {/* Product Image */}
        <div className="w-full h-32 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
          <motion.img
            src={logoUrl}
            alt={productName}
            className="w-24 h-24 object-contain"
            whileHover={{ scale: 1.1 }}
          />
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-white text-sm truncate">
          {productName}
        </h3>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300">
              Rp {discountedPrice.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-white/50 line-through">
              Rp {originalPrice.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-xs font-semibold text-orange-300">
            Hemat {discountPercentage}%
          </div>
        </div>

        {/* Countdown Timer */}
        {!isExpired ? (
          <motion.div
            className="bg-white/5 border border-orange-400/30 rounded-lg p-2"
            animate={{
              boxShadow: [
                "0 0 10px rgba(249, 115, 22, 0.2)",
                "0 0 20px rgba(249, 115, 22, 0.4)",
                "0 0 10px rgba(249, 115, 22, 0.2)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="flex items-center gap-1 justify-center text-xs text-white/80">
              <Clock className="w-3 h-3" />
              <span>
                {String(timeLeft.hours).padStart(2, "0")}:
                {String(timeLeft.minutes).padStart(2, "0")}:
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white/5 border border-white/20 rounded-lg p-2 text-center text-xs text-white/50">
            Flash Sale Berakhir
          </div>
        )}

        {/* Buy Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onBuy}
            disabled={isExpired}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExpired ? "Berakhir" : "Beli Sekarang"}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
