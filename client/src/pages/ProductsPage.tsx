import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { SmartSearch } from "@/components/SmartSearch";
import { useState } from "react";

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Sample products data
  const products = [
    {
      id: 1,
      name: "Mobile Legends - 500 Diamonds",
      price: 102500,
      category: "Mobile Game",
      providerName: "Digiflazz",
      logoUrl: "/manus-storage/ml-logo.webp",
      isActive: true,
    },
    {
      id: 2,
      name: "Free Fire - 100 Diamonds",
      price: 98000,
      category: "Mobile Game",
      providerName: "Antigravity",
      logoUrl: "/manus-storage/ff-logo.webp",
      isActive: true,
    },
    {
      id: 3,
      name: "PUBG Mobile - UC 1800",
      price: 299000,
      category: "Mobile Game",
      providerName: "Digiflazz",
      logoUrl: "/manus-storage/pubg-logo.webp",
      isActive: false,
    },
    {
      id: 4,
      name: "Genshin Impact - Genesis Crystals",
      price: 199000,
      category: "Mobile Game",
      providerName: "Agen Pulsa",
      logoUrl: "/manus-storage/genshin-logo.webp",
      isActive: true,
    },
    {
      id: 5,
      name: "Valorant - 1000 VP",
      price: 149000,
      category: "PC Game",
      providerName: "Digiflazz",
      logoUrl: "/manus-storage/valorant-logo.webp",
      isActive: true,
    },
    {
      id: 6,
      name: "Dota 2 - Battle Pass",
      price: 199000,
      category: "PC Game",
      providerName: "Antigravity",
      logoUrl: "/manus-storage/dota-logo.webp",
      isActive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <motion.div
        className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white mb-4">Produk Game</h1>
          <SmartSearch />
        </div>
      </motion.div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard
                {...product}
                onBuy={() => {
                  setSelectedProduct(product.id);
                  console.log(`Buying product: ${product.name}`);
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {products.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-white/60 text-lg">Tidak ada produk tersedia</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
