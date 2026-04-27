"use client";

import { useState } from "react";

// Tipe Data Simulasi (Sesuai Skema Enterprise)
type Product = {
  id: string;
  name: string;
  priceIDR: number;
  priceRM: number;
  originalPriceIDR?: number | null;
  isFlashSale?: boolean;
};

// Data Simulasi untuk tampilan
const mockProducts: Product[] = [
  { id: "1", name: "Weekly Diamond Pass", priceIDR: 28637, priceRM: 6.58, originalPriceIDR: 30145, isFlashSale: true },
  { id: "2", name: "Weekly Diamond Pass x2", priceIDR: 60292, priceRM: 13.86 },
  { id: "3", name: "Weekly Diamond Pass x2", priceIDR: 60292, priceRM: 13.86 },
  { id: "4", name: "Weekly Diamond Pass x3", priceIDR: 90437, priceRM: 20.79 },
  { id: "5", name: "Weekly Diamond Pass x3", priceIDR: 90437, priceRM: 20.79 },
  { id: "6", name: "Weekly Diamond Pass x4", priceIDR: 120583, priceRM: 27.72 },
  { id: "7", name: "Weekly Diamond Pass x4", priceIDR: 120583, priceRM: 27.72 },
  { id: "8", name: "Weekly Diamond Pass x5", priceIDR: 150729, priceRM: 34.65 },
  { id: "9", name: "Weekly Diamond Pass x5", priceIDR: 150729, priceRM: 34.65 },
];

export default function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("weekly");
  const [selectedProduct, setSelectedProduct] = useState<string>("1"); // Default terpilih 1

  return (
    <div className="w-full max-w-4xl mx-auto font-sans bg-[#112036] p-1 rounded-xl">
      
      {/* HEADER SECTION (Angka 1) */}
      <div className="bg-[#182c4b] border border-[#233e68] rounded-xl p-4 flex items-center gap-4 mb-6 shadow-md">
        <div className="w-8 h-8 rounded-full border-2 border-blue-400 text-white flex items-center justify-center font-bold text-sm bg-[#112036]">
          1
        </div>
        <h2 className="text-white font-bold text-lg">Pilih Kategori & Item</h2>
      </div>

      {/* BANNER KUNING (Statistik Pembelian) */}
      <div className="px-2">
        <div className="bg-gradient-to-r from-[#eab308] to-[#ca8a04] rounded-full py-2.5 px-6 inline-flex items-center text-[#112036] font-bold text-sm mb-8 shadow-lg shadow-yellow-600/20">
          <span className="mr-1">2888</span> item dibeli hari ini!
        </div>

        {/* PILIH PRODUK TOP UP */}
        <h3 className="text-white font-bold mb-3 text-[15px]">Pilih Produk Top Up</h3>
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="flex items-center gap-2 bg-[#1b3153] border border-blue-500 rounded-full px-5 py-2 text-white text-sm font-semibold shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <img src="https://cdn-icons-png.flaticon.com/512/7592/7592881.png" alt="MLBB" className="w-5 h-5 object-contain" />
            Mobile Legends
          </button>
          <button className="flex items-center gap-2 bg-[#16263f] border border-white/5 rounded-full px-5 py-2 text-slate-300 hover:bg-[#1b2d4c] transition text-sm">
            Magic Chess: Go Go
          </button>
          <button className="flex items-center gap-2 bg-[#16263f] border border-white/5 rounded-full px-5 py-2 text-slate-300 hover:bg-[#1b2d4c] transition text-sm">
            Patungan Mobile Legend
          </button>
        </div>

        {/* PILIH REGION */}
        <h3 className="text-white font-bold mb-3 text-[15px]">Pilih Region</h3>
        <div className="bg-white rounded-lg p-3 flex justify-between items-center cursor-pointer mb-8 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-4 bg-red-600 rounded-[2px] overflow-hidden relative border border-slate-200">
              <div className="absolute bottom-0 w-full h-1/2 bg-white"></div>
            </div>
            <span className="text-slate-700 font-medium text-sm">Indonesia</span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>

        {/* KATEGORI TOP UP (Weekly, Diamonds, dll) */}
        <h3 className="text-white font-bold mb-3 text-[15px]">Pilih Kategori Top Up Mobile Legends</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { id: "weekly", label: "Weekly Diamond Pass" },
            { id: "diamonds", label: "Diamonds" },
            { id: "elite", label: "Elite Bundle" },
            { id: "limited", label: "Limited Time Value Pack" },
            { id: "twilight", label: "Twilight Pass" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm ${
                activeCategory === cat.id
                  ? "bg-gradient-to-b from-[#244273] to-[#1c3359] border border-blue-400/50 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  : "bg-[#16263f] text-slate-300 border border-white/5 hover:bg-[#1b2d4c]"
              }`}
            >
              <div className="w-8 h-8 flex-shrink-0">
                <img src="https://cdn-icons-png.flaticon.com/512/7592/7592881.png" alt="icon" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <span className="text-left leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* GRID ITEM (Kartu Produk Sempurna) */}
        <h3 className="text-white font-bold mb-4 text-[15px]">Pilih Item Top Up Mobile Legends</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-8">
          {mockProducts.map((product) => {
            const isSelected = selectedProduct === product.id;

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product.id)}
                className={`relative flex flex-col items-center pt-6 px-3 pb-4 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "bg-[#1f3760] border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                    : "bg-[#16263f] border border-white/5 hover:bg-[#1a2d4c]"
                }`}
              >
                {/* Pita Flash Sale */}
                {product.isFlashSale && (
                  <div className="absolute top-0 left-0 w-full flex justify-between items-start">
                    <div className="bg-[#e11d48] text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">
                      -5%
                    </div>
                    <div className="bg-[#d97706] text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg z-10 italic">
                      Termurah
                    </div>
                  </div>
                )}

                {/* Gambar Produk */}
                <div className="mb-3 w-12 h-12 drop-shadow-xl relative z-0">
                  <img src="https://cdn-icons-png.flaticon.com/512/7592/7592881.png" alt="Weekly Pass" className="w-full h-full object-contain" />
                </div>

                {/* Nama Produk */}
                <h4 className="text-white text-center text-[13px] font-medium h-10 mb-2 leading-tight flex items-center">
                  {product.name}
                </h4>

                {/* Harga Coret */}
                <div className="h-4 flex items-center justify-center w-full mt-auto">
                  {product.originalPriceIDR && (
                    <span className="text-slate-400 text-[11px] line-through decoration-slate-400/70">
                      Rp. {product.originalPriceIDR.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {/* Border Divider */}
                <div className={`w-full border-t my-2 ${isSelected ? 'border-blue-400/30' : 'border-white/10'}`}></div>

                {/* Harga IDR & RM Container */}
                <div className="w-full flex flex-col gap-1.5 pt-1">
                  
                  {/* Harga IDR */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-red-600 rounded-[2px] overflow-hidden relative flex-shrink-0">
                      <div className="absolute bottom-0 w-full h-1/2 bg-white"></div>
                    </div>
                    <span className="text-white font-bold text-[13px]">
                      Rp. {product.priceIDR.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Harga RM */}
                  <div className="flex items-center gap-2 opacity-60">
                    <div className="w-4 h-3 bg-blue-800 rounded-[2px] relative flex-shrink-0 overflow-hidden flex">
                       {/* Simulasi Bendera Malaysia kecil */}
                       <div className="w-1/2 h-1/2 bg-blue-900 absolute top-0 left-0 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                       </div>
                       <div className="w-full h-full flex flex-col justify-between">
                         <div className="w-full h-[1px] bg-red-500"></div><div className="w-full h-[1px] bg-white"></div>
                         <div className="w-full h-[1px] bg-red-500"></div><div className="w-full h-[1px] bg-white"></div>
                       </div>
                    </div>
                    <span className="text-slate-300 font-medium text-[11px]">
                      RM. {product.priceRM.toFixed(2)}
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}