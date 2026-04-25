import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "../public/assets");

async function optimizeImages() {
  console.log("🚀 SassyGurl Asset Optimizer Started...");
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log("⚠️ Folder public/assets belum dibuat. Melewati optimasi.");
    return;
  }

  const files = fs.readdirSync(PUBLIC_DIR);
  for (const file of files) {
    if (file.match(/\.(png|jpe?g)$/i)) {
      const inputPath = path.join(PUBLIC_DIR, file);
      const outputPath = path.join(PUBLIC_DIR, file.replace(/\.(png|jpe?g)$/i, ".webp"));

      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 }) // Kompresi tingkat tinggi
        .toFile(outputPath);

      console.log(`✅ Optimized: ${file} -> ${path.basename(outputPath)}`);
      // Opsi: Hapus file asli untuk menghemat space
      // fs.unlinkSync(inputPath); 
    }
  }
  console.log("✨ All assets optimized for production!");
}

optimizeImages();