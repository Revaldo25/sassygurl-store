import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: number;
  name: string;
  logoUrl: string;
  adminFee: number;
  isOnline: boolean;
}

interface PaymentCategoryGroupProps {
  categoryName: string;
  methods: PaymentMethod[];
  selectedMethodId: number | null;
  productPrice: number;
  onSelectMethod: (id: number, price: number) => void;
}

export function PaymentCategoryGroup({
  categoryName,
  methods,
  selectedMethodId,
  productPrice,
  onSelectMethod,
}: PaymentCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="mb-4 rounded-lg bg-white/5 border border-white/10 overflow-hidden"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Category Header */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between",
          "hover:bg-white/5 transition-colors duration-200",
          "border-b border-white/10"
        )}
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      >
        <h3 className="font-semibold text-white text-sm">{categoryName}</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/60" />
        </motion.div>
      </motion.button>

      {/* Methods List with Layout Animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            className="p-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {methods.map((method, index) => (
              <motion.div
                key={method.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                }}
              >
                <PaymentMethodCard
                  id={method.id}
                  name={method.name}
                  logoUrl={method.logoUrl}
                  adminFee={method.adminFee}
                  isOnline={method.isOnline}
                  isSelected={selectedMethodId === method.id}
                  productPrice={productPrice}
                  onSelect={onSelectMethod}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
