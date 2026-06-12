"use client";

import { useState } from "react";
import GameFormModal from "./GameFormModal";
import { Plus, Search, Edit2, Upload, Database } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

export default function CatalogClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [games, setGames] = useState<any[]>([]); // simplified for demo
  const [search, setSearch] = useState("");

  const handleSeedDitusi = async () => {
    setIsSeeding(true);
    try {
      // In a real scenario, this html string would be posted from a file or fetched by backend.
      // We will simulate the trigger.
      const htmlContent = "<html><h3>Mobile Legends</h3><h3>Free Fire</h3></html>"; // Mock HTML
      const response = await fetch("http://localhost:5009/api/admin/catalog/seed-ditusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Berhasil sinkronisasi ${data.added} game dari Ditusi!`);
      } else {
        alert("Gagal sinkronisasi");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Cari nama game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-sakura"
          />
        </div>
        <button
          onClick={handleSeedDitusi}
          disabled={isSeeding}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
        >
          {isSeeding ? <span className="animate-spin text-xl">⏳</span> : <Database className="w-5 h-5" />}
          Sinkronkan Ditusi
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sakura hover:bg-sakura-hover text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Game
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-white/60 mb-4">Gunakan tombol "Sinkronkan Ditusi" untuk mengambil semua data dari ditusi.co.id</p>
        <p className="text-sm text-white/40">Data akan otomatis masuk ke Database PostgreSQL dan tampil di Beranda.</p>
      </div>

      <GameFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          console.log("Save game:", data);
          setIsModalOpen(false);
          alert("Game berhasil disimpan!");
        }}
      />
    </div>
  );
}
