import { motion } from "framer-motion";
import { Check, Wifi, WifiOff } from "lucide-react";
import { usePaymentStore } from "@/stores/paymentStore";
import { cn } from "@/lib/utils";

interface PaymentMethodCardProps {
  id: number;
  name: string;
  logoUrl: string;
  adminFee: number;
  isOnline: boolean;
  isSelected: boolean;
  productPrice: number;
  onSelect: (id: number, price: number) => void;
}

export function PaymentMethodCard({
  id,
  name,
  logoUrl,
  adminFee,
  isOnline,
  isSelected,
  productPrice,
  onSelect,
}: PaymentMethodCardProps) {
  const totalAmount = productPrice + adminFee;

  return (
    <motion.button
      onClick={() => onSelect(id, productPrice)}
      className={cn(
        "relative group w-full p-4 rounded-xl transition-all duration-300",
        "border border-white/20",
        "hover:border-white/40 hover:shadow-lg",
        isSelected
          ? "bg-white/20 border-indigo-400/60 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
          : "bg-white/10 hover:bg-white/15"
      )}
      style={{
        backdropFilter: "blur(12px)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect on selection */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-3">
        {/* Logo and Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <motion.img
            src={logoUrl}
            alt={name}
            className="w-12 h-12 object-contain flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{name}</p>
            <p className="text-xs text-white/70">
              Fee: Rp {adminFee.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Status and Selection */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Online/Offline indicator */}
          <motion.div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              isOnline
                ? "bg-green-500/30 border border-green-500"
                : "bg-red-500/30 border border-red-500"
            )}
            animate={{ scale: isOnline ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 2, repeat: isOnline ? Infinity : 0 }}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
          </motion.div>

          {/* Selection checkmark */}
          {isSelected && (
            <motion.div
              className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Total amount display on selection */}
      {isSelected && (
        <motion.div
          className="mt-3 pt-3 border-t border-white/20"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <p className="text-xs text-white/60">Total Amount</p>
          <p className="text-lg font-bold text-indigo-300">
            Rp {totalAmount.toLocaleString("id-ID")}
          </p>
        </motion.div>
      )}
    </motion.button>
  );
}
