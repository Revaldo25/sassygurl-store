import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

interface ProductToggleProps {
  productId: number;
  productName: string;
  isActive: boolean;
  onToggle?: (productId: number, isActive: boolean) => Promise<void>;
}

export function ProductToggle({
  productId,
  productName,
  isActive,
  onToggle,
}: ProductToggleProps) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(isActive);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const newState = !active;

      // Call the toggle handler if provided
      if (onToggle) {
        await onToggle(productId, newState);
      }

      setActive(newState);
      toast.success(
        newState
          ? `${productName} diaktifkan`
          : `${productName} dinonaktifkan`
      );
    } catch (error) {
      toast.error("Gagal mengubah status produk");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Switch
          checked={active}
          onCheckedChange={handleToggle}
          disabled={loading}
          className="data-[state=checked]:bg-green-500"
        />
      </motion.div>
      <span className="text-xs text-white/60">
        {active ? "Aktif" : "Nonaktif"}
      </span>
    </motion.div>
  );
}

/**
 * Bulk product toggle for admin dashboard
 */
export function ProductToggleBulk({
  products,
  onToggle,
}: {
  products: Array<{ id: number; name: string; isActive: boolean }>;
  onToggle?: (productId: number, isActive: boolean) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {products.map((product) => (
        <motion.div
          key={product.id}
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-sm text-white/80">{product.name}</span>
          <ProductToggle
            productId={product.id}
            productName={product.name}
            isActive={product.isActive}
            onToggle={onToggle}
          />
        </motion.div>
      ))}
    </div>
  );
}
