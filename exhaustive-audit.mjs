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

// Clear old files
fs.readdirSync(outDir).forEach(file => {
  if (file.endsWith('.png')) {
    fs.unlinkSync(path.join(outDir, file));
  }
});

const routes = [
  { name: '01-home', url: 'http://localhost:3000/' },
  { name: '03-catalog', url: 'http://localhost:3000/' }, // Home serves as catalog
  { name: '05-product-detail', url: 'http://localhost:3000/games/mccg' },
  { name: '09-invoice', url: 'http://localhost:3000/invoice/INV-TEST' },
  { name: '11-auth-login', url: 'http://localhost:3000/auth/login' },
  { name: '13-auth-register', url: 'http://localhost:3000/auth/register' },
  { name: '15-auth-forgot-password', url: 'http://localhost:3000/auth/forgot-password' },
  { name: '17-auth-verify-otp', url: 'http://localhost:3000/auth/verify-otp' },
  { name: '19-member-dashboard', url: 'http://localhost:3000/dashboard' },
  { name: '21-admin-login', url: 'http://localhost:3000/admin/login' },
  { name: '23-admin-overview', url: 'http://localhost:3000/admin' },
  { name: '25-admin-catalog-health', url: 'http://localhost:3000/admin/catalog-health' },
  { name: '27-admin-review', url: 'http://localhost:3000/admin/review' },
];

async function captureAll() {
  console.log("🚀 Memulai Exhaustive Audit...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    for (const route of routes) {
      console.log(`📸 Menangkap ${route.name}...`);
      
      // Desktop
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(route.url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(outDir, `${route.name}-desktop.png`), fullPage: true });

      // Mobile
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.goto(route.url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(outDir, `${route.name.replace(/\d+-/, (match) => String(parseInt(match) + 1).padStart(2, '0') + '-')}-mobile.png`), fullPage: true });
    }

    // Capture Specific States on Checkout (Desktop)
    console.log(`📸 Menangkap State Khusus Checkout...`);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/games/mccg', { waitUntil: 'networkidle0' });
    
    // State Loading
    await page.type('input[placeholder="Masukkan User ID"]', '1234'); // type something
    await page.type('input[placeholder="Contoh: 1234"]', '1234');
    // quickly capture loading
    await page.screenshot({ path: path.join(outDir, `29-checkout-loading-state-desktop.png`), fullPage: true });
    
    // State Error ID
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outDir, `30-checkout-error-id-state-desktop.png`), fullPage: true });

    // Fill valid to proceed
    await page.evaluate(() => document.querySelector('input[placeholder="Masukkan User ID"]').value = '');
    await page.type('input[placeholder="Masukkan User ID"]', '12345678');
    await new Promise(r => setTimeout(r, 2000));

    // Select Product and Payment
    await page.evaluate(() => {
      const products = document.querySelectorAll('button[role="radio"]');
      if (products.length > 0) products[0].click();
      const payments = document.querySelectorAll('button[title]');
      if (payments.length > 0) payments[0].click();
    });
    
    // State Error WA
    await page.type('input[placeholder="81234567890"]', '1234');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, `31-checkout-error-wa-state-desktop.png`), fullPage: true });

    // State Modal
    await page.evaluate(() => document.querySelector('input[placeholder="81234567890"]').value = '');
    await page.type('input[placeholder="81234567890"]', '81234567890');
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const buyBtn = buttons.find(b => b.textContent && b.textContent.includes('Beli Sekarang'));
      if (buyBtn && !buyBtn.disabled) buyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, `32-checkout-modal-desktop.png`) }); // not fullpage to focus on modal

  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error);
  } finally {
    await browser.close();
    console.log("Selesai capture screenshots.");
  }
}

captureAll();
