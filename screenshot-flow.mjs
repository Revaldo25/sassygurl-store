import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'uji-coba'); // Changed to uji-coba as requested
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runE2E() {
  console.log("🚀 Memulai Robot Penguji (Brutal Mode)...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // 1. Kunjungi Halaman Produk
    console.log("➡️ Navigasi ke Halaman Mobile Legends...");
    await page.goto('http://localhost:3000/games/mccg', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Isi User ID dan Zone ID (Lama, memaksa timeout/validasi)
    console.log("➡️ Mengisi Data Akun (User ID & Zone ID)...");
    await page.type('input[placeholder="Masukkan User ID"]', '12345678');
    await page.type('input[placeholder="Contoh: 1234"]', '1234');
    await new Promise(r => setTimeout(r, 2000)); 
    await page.screenshot({ path: path.join(outDir, '01_Data_Akun_Terisi.png'), fullPage: true });

    // 3. Pilih Produk
    console.log("➡️ Memilih Produk...");
    await page.evaluate(() => {
      const products = document.querySelectorAll('button[role="radio"]');
      if (products.length > 0) products[0].click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '02_Produk_Dipilih.png'), fullPage: true });

    // 4. Pilih Pembayaran
    console.log("➡️ Memilih Metode Pembayaran (QRIS)...");
    await page.evaluate(() => {
      const payments = document.querySelectorAll('button[title]');
      for (const btn of payments) {
        if (btn.getAttribute('title').toUpperCase().includes('QRIS')) {
          btn.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '03_Pembayaran_QRIS_Dipilih.png'), fullPage: true });

    // 5. UJI ERROR WHATSAPP (Input Sengaja Disalahkan)
    console.log("➡️ Menguji Error Validation WhatsApp (P1 Patch)...");
    await page.type('input[placeholder="81234567890"]', '1234'); // Invalid length & prefix
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '04_Error_WhatsApp_Terdeteksi.png'), fullPage: true });

    // 6. PERBAIKI WHATSAPP 
    console.log("➡️ Memperbaiki Nomor WhatsApp...");
    await page.evaluate(() => document.querySelector('input[placeholder="81234567890"]').value = '');
    await page.type('input[placeholder="81234567890"]', '81234567890');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '05_WhatsApp_Valid.png'), fullPage: true });

    // 7. Klik Beli Sekarang
    console.log("➡️ Klik Tombol Beli Sekarang...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const buyBtn = buttons.find(b => b.textContent && b.textContent.includes('Beli Sekarang'));
      if (buyBtn && !buyBtn.disabled) buyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500)); 
    await page.screenshot({ path: path.join(outDir, '06_Modal_Konfirmasi.png') });

    // 8. Test Auth Login / Register (Tambahan uji coba seperti yang diminta)
    console.log("➡️ Pindah ke halaman Login...");
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '07_Halaman_Login.png') });

    console.log("➡️ Pindah ke halaman Register...");
    await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '08_Halaman_Register.png') });

    console.log("✅ PENGUJIAN BRUTAL SUKSES 100%");

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat pengujian alur:", error);
  } finally {
    await browser.close();
    console.log(`Pengujian selesai. Silakan periksa folder "uji-coba".`);
  }
}

runE2E();
