import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'uji-coba');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function takeScreenshots() {
  console.log("Menjalankan Puppeteer untuk menguji dan mengambil screenshot...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // 1. Uji Coba Beranda (Homepage)
    console.log("Navigasi ke Beranda...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000)); // Tunggu animasi
    await page.screenshot({ path: path.join(outDir, '1_Beranda_Utama.png'), fullPage: true });
    console.log("✅ Berhasil: 1_Beranda_Utama.png");

    // 2. Uji Coba Halaman Produk (Sebagai Pembeli)
    console.log("Navigasi ke Halaman Produk (Mobile Legends)...");
    await page.goto('http://localhost:3000/games/mccg', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outDir, '2_Halaman_Produk_Pembeli.png'), fullPage: true });
    console.log("✅ Berhasil: 2_Halaman_Produk_Pembeli.png");

    // 3. Uji Coba Halaman Autentikasi
    console.log("Navigasi ke Halaman Login...");
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '3_Halaman_Login.png'), fullPage: true });
    console.log("✅ Berhasil: 3_Halaman_Login.png");

  } catch (error) {
    console.error("Terjadi kesalahan saat pengujian:", error);
  } finally {
    await browser.close();
    console.log(`Pengujian selesai. Silakan periksa folder "uji-coba".`);
  }
}

takeScreenshots();
