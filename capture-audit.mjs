import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'audit-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const pagesToTest = [
  { name: 'Homepage', url: 'http://localhost:3000/' },
  { name: 'Detail_Game', url: 'http://localhost:3000/games/mccg' },
  { name: 'Auth_Login', url: 'http://localhost:3000/auth/login' },
  { name: 'Auth_Register', url: 'http://localhost:3000/auth/register' },
];

async function captureScreenshots() {
  const browser = await puppeteer.launch({ headless: "new" });
  
  try {
    const page = await browser.newPage();

    for (const target of pagesToTest) {
      console.log(`Testing ${target.name}...`);
      
      // Desktop
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(target.url, { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(outDir, `${target.name}_Desktop.png`), fullPage: true });

      // Mobile
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.goto(target.url, { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(outDir, `${target.name}_Mobile.png`), fullPage: true });
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
    console.log("Selesai capture screenshots.");
  }
}

captureScreenshots();
