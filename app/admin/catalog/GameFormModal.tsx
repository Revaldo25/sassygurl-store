"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GameFormModal({ isOpen, onClose, onSave }: any) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currencyName, setCurrencyName] = useState("Diamonds");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5009/api/admin/catalog/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setThumbnailUrl("http://localhost:5009" + data.url);
      } else {
        alert("Upload gagal: " + data.message);
      }
    } catch (error: any) {
      alert("Error upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!name || !slug) return alert("Nama dan Slug wajib diisi");
    onSave({ name, slug, currencyName, thumbnail: thumbnailUrl });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Tambah Game Baru</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Nama Game</label>
              <input 
                type="text" 
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sakura"
                placeholder="Contoh: Genshin Impact"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Slug (URL)</label>
              <input 
                type="text" 
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sakura"
                placeholder="contoh: genshin-impact"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Nama Mata Uang</label>
              <input 
                type="text" 
                value={currencyName}
                onChange={e => setCurrencyName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sakura"
                placeholder="Contoh: Diamonds / Genesis Crystals"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">Thumbnail / Logo Game</label>
              <div className="flex gap-4 items-center">
                <div 
                  className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                >
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-white/20" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? "Mengunggah..." : "Pilih Gambar Server"}
                  </button>
                  <p className="text-xs text-white/40 mt-2 text-center">Gambar akan disimpan di server Backend (C#)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-semibold transition"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-sakura hover:bg-sakura-hover text-white font-semibold transition"
            >
              Simpan Game
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
