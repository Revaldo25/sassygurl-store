import { getGamesForAdmin } from "@/lib/api-adapter";
import CatalogClient from "./CatalogClient";

export const metadata = {
  title: "Admin Catalog Management - SassyGurl",
};

export default async function AdminCatalogPage() {
  // Fetch games via API or Server Action
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Produk & Game</h1>
          <p className="text-white/60">Kelola katalog game, unggah gambar, dan atur produk.</p>
        </div>
      </div>
      <CatalogClient />
    </div>
  );
}
