"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Save, X, Search, Gamepad2, AlertCircle, Package, UploadCloud, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory, assignProductsToCategory, getAdminProductsByGame } from "@/app/actions/categories";

type Category = {
  id: string;
  gameId: string;
  name: string;
  icon: string;
  sortOrder: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  itemCategory: string; // the slug / ID of the category
  isActive: boolean;
};

function ImageUploadField({ label, value, onChange, placeholder, aspectRatio = "square" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, aspectRatio?: "square" | "video" }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar. Maksimal 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        onChange(data.url);
        toast.success("Gambar berhasil diunggah");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-black/40 hover:bg-black/60 hover:border-sakura/50 transition-all overflow-hidden ${aspectRatio === "square" ? "aspect-square w-full max-w-[8rem]" : "aspect-video w-full"}`}>
        {value && (value.startsWith('http') || value.startsWith('/')) ? (
          <img src={value} alt="Preview" className="w-full h-full object-contain p-2" />
        ) : value ? (
          <div className="text-3xl flex items-center justify-center h-full w-full">{value}</div>
        ) : (
          <div className="flex flex-col items-center p-4 text-center">
            {isUploading ? (
              <RefreshCw className="h-6 w-6 text-sakura animate-spin" />
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-zinc-600 mb-2" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Click to<br/>Upload</span>
              </>
            )}
          </div>
        )}
        <input 
          type="file" 
          accept="image/*"
          onChange={handleUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      {value && !value.startsWith('http') && !value.startsWith('/') && (
        <p className="text-[10px] text-zinc-500">Currently using text/emoji</p>
      )}
    </div>
  );
}

export default function ProductCategoriesTab({ games }: { games: any[] }) {
  const [selectedGameId, setSelectedGameId] = useState<string>(games?.[0]?.id || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "💎", sortOrder: 0 });

  // Assignment Modal
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (selectedGameId) {
      loadCategories();
      loadProducts();
    }
  }, [selectedGameId]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getProductCategories(selectedGameId);
      if (res.success && res.data) {
        setCategories(res.data.sort((a: Category, b: Category) => a.sortOrder - b.sortOrder));
      } else {
        throw new Error(res.error || "Gagal memuat");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await getAdminProductsByGame(selectedGameId);
      if (res.success && res.data) {
        setProducts(res.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.priceSell,
          itemCategory: p.productCategoryId || "",
          isActive: p.isActive
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) return toast.error("Pilih game terlebih dahulu");
    
    try {
      let res;
      if (editingId) {
        res = await updateProductCategory(selectedGameId, editingId, formData);
      } else {
        res = await createProductCategory(selectedGameId, formData);
      }
      
      if (!res.success) throw new Error(res.error || "Gagal menyimpan");
      
      toast.success(editingId ? "Kategori diperbarui!" : "Kategori dibuat!");
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", icon: "💎", sortOrder: 0 });
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kategori ini? (Produk didalamnya tidak akan dihapus, hanya di set null kategorinya)")) return;
    try {
      const res = await deleteProductCategory(selectedGameId, id);
      if (!res.success) throw new Error(res.error || "Gagal menghapus");
      toast.success("Kategori dihapus");
      loadCategories();
      loadProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEdit = (c: Category) => {
    setEditingId(c.id);
    setFormData({ name: c.name, icon: c.icon, sortOrder: c.sortOrder });
    setShowForm(true);
  };

  const openManageProducts = (c: Category) => {
    setManagingCategory(c);
    // pre-fill selected products
    const initialSelected = new Set<string>();
    products.forEach(p => {
      // Because we mapped ItemCategory to be the category ID in the backend when assigned
      // If it matches c.id, it belongs to this category.
      if (p.itemCategory === c.id) {
        initialSelected.add(p.id);
      }
    });
    setSelectedProducts(initialSelected);
  };

  const toggleProduct = (productId: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(productId)) newSet.delete(productId);
    else newSet.add(productId);
    setSelectedProducts(newSet);
  };

  const saveProductAssignments = async () => {
    if (!managingCategory) return;
    setIsAssigning(true);
    try {
      const productIds = Array.from(selectedProducts);
      const res = await assignProductsToCategory(selectedGameId, managingCategory.id, productIds);
      
      if (!res.success) throw new Error(res.error || "Gagal");
      toast.success("Produk berhasil dimasukkan ke kategori!");
      setManagingCategory(null);
      loadProducts(); // refresh products
    } catch (e: any) {
      toast.error("Terjadi kesalahan saat menetapkan produk");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Package className="w-6 h-6 text-sakura" />
            Kelola Kategori Produk
          </h2>
          <p className="text-white/60 text-sm">Atur kategori per game secara dinamis</p>
        </div>
        
        <select 
          value={selectedGameId} 
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="bg-black/40 border border-white/20 text-white rounded-xl px-4 py-2 w-full md:w-64"
        >
          {games.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Daftar Kategori</h3>
          <button 
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: "", icon: "💎", sortOrder: 0 }); }}
            className="px-4 py-2 bg-sakura text-zinc-950 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>

        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleSubmit}
            className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">Nama Kategori</label>
              <input 
                required
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white" 
                placeholder="e.g. Weekly Pass" 
              />
            </div>
            <div>
              <ImageUploadField
                label="Ikon (Gambar/Emoji)"
                value={formData.icon}
                onChange={(val) => setFormData({ ...formData, icon: val })}
              />
            </div>
            <div className="flex items-center gap-3 bg-black/40 border border-white/20 rounded-lg px-4 py-2 h-[42px]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.sortOrder === 0}
                  onChange={e => setFormData({...formData, sortOrder: e.target.checked ? 0 : 99})}
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sakura"></div>
              </label>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">Sorot Prioritas</span>
                <span className="text-[9px] text-white/50 leading-none mt-0.5">Tampil paling depan</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 w-full flex justify-center items-center">
                Batal
              </button>
              <button type="submit" className="px-4 py-2 bg-sakura rounded-lg text-zinc-950 font-bold hover:brightness-110 w-full flex justify-center items-center transition-colors">
                Simpan
              </button>
            </div>
          </motion.form>
        )}

        {isLoading ? (
          <div className="text-center text-white/50 py-10">Memuat...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-white/40 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 opacity-50" />
            <p>Belum ada kategori untuk game ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                    {c.icon.startsWith("http") || c.icon.startsWith("/") ? (
                      <img src={c.icon} alt={c.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      c.icon
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {c.name}
                      {c.sortOrder === 0 && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                          🌟 Prioritas
                        </span>
                      )}
                    </div>
                    {c.sortOrder !== 0 && <div className="text-xs text-white/50">Kategori Biasa</div>}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                  <button 
                    onClick={() => openManageProducts(c)}
                    className="flex-1 py-1.5 px-3 bg-white/5 text-white/80 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Atur Produk
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {managingCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-sakura" />
                  Atur Produk: {managingCategory.name}
                </h3>
                <button onClick={() => setManagingCategory(null)} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 border-b border-white/10 bg-black/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari nama produk atau SKU..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 outline-none focus:border-sakura"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {products
                  .filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
                  .map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedProducts.has(p.id) 
                          ? "bg-sakura/10 border-sakura/50" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {p.name}
                          {!p.isActive && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">Inactive</span>}
                        </div>
                        <div className="text-xs text-white/50">SKU: {p.sku} | Harga: Rp {p.price.toLocaleString("id-ID")}</div>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedProducts.has(p.id) ? "bg-sakura border-sakura" : "border-white/20"}`}>
                        {selectedProducts.has(p.id) && <div className="w-2.5 h-2.5 bg-zinc-950 rounded-sm" />}
                      </div>
                    </div>
                ))}
                {products.length === 0 && (
                  <div className="text-center py-10 text-white/40">
                    Tidak ada produk ditemukan untuk game ini.
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                <div className="text-white/60 text-sm">
                  {selectedProducts.size} produk dipilih
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setManagingCategory(null)} 
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={saveProductAssignments}
                    disabled={isAssigning}
                    className="px-6 py-2 bg-sakura text-zinc-950 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    {isAssigning ? "Menyimpan..." : "Simpan Pilihan"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
