import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getGameProductsAdmin, createProduct, deleteProduct } from "@/app/actions/dashboard";

export default function ProductManagerModal({ game, onClose }: { game: any, onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Product Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    priceSell: 0,
    imageUrl: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getGameProductsAdmin(game.id);
      setProducts(data);
    } catch (e) {
      toast.error("Gagal mengambil data produk");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataObj
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setFormData({ ...formData, imageUrl: json.url });
          toast.success("Gambar berhasil diunggah");
        }
      }
    } catch (e) {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || formData.priceSell <= 0) {
      toast.error("Nama dan Harga harus diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createProduct({
        gameId: game.id,
        name: formData.name,
        sku: formData.sku,
        priceSell: formData.priceSell,
        thumbnail: formData.imageUrl
      });

      if (res.success) {
        toast.success("Produk berhasil ditambahkan");
        setShowForm(false);
        setFormData({ name: "", sku: "", priceSell: 0, imageUrl: "" });
        fetchProducts();
      } else {
        toast.error(res.message || "Gagal menyimpan produk");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        toast.success("Produk berhasil dihapus");
        fetchProducts();
      } else {
        toast.error("Gagal menghapus produk");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-xl font-bold">Kelola Item: {game.name}</h2>
            <p className="text-sm text-zinc-400">Atur produk, harga, dan gambar item.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Daftar Produk</h3>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-lg bg-sakura px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-sakura/90"
            >
              {showForm ? "Batal" : <><Plus size={16} /> Tambah Item</>}
            </button>
          </div>

          {showForm && (
            <div className="rounded-xl border border-sakura/30 bg-sakura/5 p-6 space-y-4 animate-in fade-in zoom-in-95">
              <h4 className="font-semibold text-sakura">Item Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Nama Item</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg bg-black/50 p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sakura"
                    placeholder="Contoh: 86 Diamonds"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={formData.priceSell}
                    onChange={(e) => setFormData({ ...formData, priceSell: Number(e.target.value) })}
                    className="w-full rounded-lg bg-black/50 p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sakura"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Kode SKU (Opsional)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-lg bg-black/50 p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sakura"
                    placeholder="ML-86"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Gambar Item / Icon</label>
                  <div className="flex items-center gap-3">
                    {formData.imageUrl && (
                      <div className="h-10 w-10 relative rounded overflow-hidden bg-black/50">
                        <Image src={formData.imageUrl} alt="Icon" fill className="object-cover" />
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20">
                      <Upload size={16} />
                      {isUploading ? "Mengunggah..." : "Pilih Gambar"}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-sakura px-5 py-2 text-sm font-bold text-zinc-950 transition hover:bg-sakura/90 disabled:opacity-50"
                >
                  <Save size={16} /> {isSaving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </div>
          )}

          {/* Product List Table */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">ITEM</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">HARGA JUAL</th>
                  <th className="px-6 py-4 font-medium text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Memuat data produk...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Belum ada item untuk game ini.</td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 relative rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">?</div>
                            )}
                          </div>
                          <span className="font-medium text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">{p.sku}</td>
                      <td className="px-6 py-4 text-sakura font-medium">
                        Rp {p.priceSell.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-status-danger/20 hover:text-status-danger shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
