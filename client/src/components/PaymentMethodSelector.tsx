import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { usePaymentStore } from "@/stores/paymentStore";
import { PaymentCategoryGroup } from "./PaymentCategoryGroup";
import { PaymentMethodSkeleton } from "./PaymentMethodSkeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  productPrice: number;
  productName?: string;
}

interface GroupedMethods {
  [categoryName: string]: Array<{
    id: number;
    name: string;
    logoUrl: string;
    adminFee: number;
    isOnline: boolean;
  }>;
}

export function PaymentMethodSelector({
  productPrice,
  productName = "Product",
}: PaymentMethodSelectorProps) {
  const {
    selectedMethodId,
    searchQuery,
    setSearchQuery,
    selectPaymentMethod,
    deselectPaymentMethod,
    setAllMethods,
    setLoading,
    setError,
    isLoading,
    error,
    totalAmount,
  } = usePaymentStore();

  const [groupedMethods, setGroupedMethods] = useState<GroupedMethods>({});

  // Fetch payment methods
  const { data: paymentData, isLoading: isFetching } =
    trpc.paymentMethods.getAll.useQuery({});

  useEffect(() => {
    if (isFetching) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isFetching, setLoading]);

  // Process and group payment methods
  useEffect(() => {
    if (paymentData?.methods) {
      // Set all methods in store
      setAllMethods(
        paymentData.methods.map((m: any) => ({
          id: m.id,
          name: m.name,
          categoryId: m.categoryId,
          logoUrl: m.logoUrl,
          adminFee: Number(m.adminFee),
          isActive: m.isActive,
          usageCount: m.usageCount,
        }))
      );

      // Group by category
      const grouped: GroupedMethods = {};
      paymentData.methods.forEach((method: any) => {
        const categoryName =
          paymentData.categories.find((c: any) => c.id === method.categoryId)
            ?.name || "Other";

        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }

        grouped[categoryName].push({
          id: method.id,
          name: method.name,
          logoUrl: method.logoUrl,
          adminFee: Number(method.adminFee),
          isOnline: method.providerStatus?.isOnline ?? true,
        });
      });

      setGroupedMethods(grouped);
    }
  }, [paymentData, setAllMethods]);

  // Filter methods based on search
  const filteredGroupedMethods: GroupedMethods = {};
  if (searchQuery.trim() === "") {
    Object.assign(filteredGroupedMethods, groupedMethods);
  } else {
    Object.entries(groupedMethods).forEach(([category, methods]) => {
      const filtered = methods.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        filteredGroupedMethods[category] = filtered;
      }
    });
  }

  const handleCopyVirtualAccount = async () => {
    try {
      const selectedMethod = paymentData?.methods.find(
        (m: any) => m.id === selectedMethodId
      );
      if (!selectedMethod) {
        toast.error("Metode pembayaran tidak dipilih");
        return;
      }

      const vaNumber = `${selectedMethod.id}${Date.now()}`.substring(0, 16);
      await navigator.clipboard.writeText(vaNumber);
      toast.success("Berhasil Disalin", {
        description: `VA: ${vaNumber}`,
      });
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleSaveQR = async () => {
    try {
      const qrData = `SASSYGURL-${selectedMethodId}-${Date.now()}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      const link = document.createElement("a");
      link.href = qrUrl;
      link.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Berhasil Disalin", {
        description: "QR code berhasil disimpan",
      });
    } catch {
      toast.error("Gagal menyimpan QR code");
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Pilih Metode Pembayaran
        </h2>
        <p className="text-white/60 text-sm">
          Produk: <span className="text-indigo-300 font-semibold">{productName}</span>
          {" | "}
          Harga: <span className="text-indigo-300 font-semibold">
            Rp {productPrice.toLocaleString("id-ID")}
          </span>
        </p>
      </div>

      {/* Search Input */}
      <motion.div
        className="mb-6 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <Input
          type="text"
          placeholder="Cari metode pembayaran (e.g., GoPay, BCA)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "pl-10 bg-white/10 border-white/20 text-white",
            "placeholder:text-white/40",
            "focus:bg-white/15 focus:border-indigo-400/60"
          )}
        />
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && <PaymentMethodSkeleton />}

      {/* Payment Methods */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key="methods"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {Object.entries(filteredGroupedMethods).length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-white/60 text-sm">
                  {searchQuery
                    ? "Tidak ada metode pembayaran yang sesuai"
                    : "Tidak ada metode pembayaran tersedia"}
                </p>
              </motion.div>
            ) : (
              Object.entries(filteredGroupedMethods).map(
                ([categoryName, methods], index) => (
                  <motion.div
                    key={categoryName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <PaymentCategoryGroup
                      categoryName={categoryName}
                      methods={methods}
                      selectedMethodId={selectedMethodId}
                      productPrice={productPrice}
                      onSelectMethod={selectPaymentMethod}
                    />
                  </motion.div>
                )
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Selected Summary */}
      <AnimatePresence>
        {selectedMethodId && totalAmount && (
          <motion.div
            className="mt-6 p-4 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/80 text-sm">Ringkasan Pembayaran</p>
              <button
                onClick={deselectPaymentMethod}
                className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                Ubah
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Harga Produk:</span>
                <span className="text-white font-semibold">
                  Rp {productPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/60">Total Pembayaran:</span>
                <span className="text-lg font-bold text-indigo-300">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <motion.button
                onClick={handleCopyVirtualAccount}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/40 text-indigo-200 text-sm font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Copy className="w-4 h-4" />
                Salin VA
              </motion.button>

              <motion.button
                onClick={handleSaveQR}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 text-sm font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                Simpan QR
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
