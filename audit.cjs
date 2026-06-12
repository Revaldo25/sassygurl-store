const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, 'uji-coba');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
}

let counter = 1;

async function takeScreenshot(page, name, type = 'desktop') {
    const filename = `${String(counter).padStart(2, '0')}_${type}_${name}.png`;
    await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: true });
    console.log(`[V] Saved: ${filename}`);
    counter++;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    const browser = await puppeteer.launch({ headless: 'new' });
    
    // Desktop Context
    const desktopContext = await browser.createBrowserContext();
    const desktopPage = await desktopContext.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900 });

    // Mobile Context
    const mobileContext = await browser.createBrowserContext();
    const mobilePage = await mobileContext.newPage();
    await mobilePage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    const testPages = [
        { name: 'Home', url: '/' },
        { name: 'Detail_FreeFire', url: '/game/free-fire' },
        { name: 'Detail_MobileLegends', url: '/game/mobile-legends' },
        { name: 'Login', url: '/auth/login' },
        { name: 'Register', url: '/auth/register' }
    ];

    for (const p of testPages) {
        try {
            console.log(`Navigating to ${p.name}...`);
            await desktopPage.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle0' });
            await takeScreenshot(desktopPage, p.name, 'desktop');

            await mobilePage.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle0' });
            await takeScreenshot(mobilePage, p.name, 'mobile');
        } catch (e) {
            console.error(`Error on ${p.name}: ${e.message}`);
        }
    }

    // Try to trigger checkout flow on MLBB
    try {
        console.log("Triggering Checkout Flow...");
        await desktopPage.goto(`${BASE_URL}/game/mobile-legends`, { waitUntil: 'networkidle0' });
        
        // Fill user ID
        await desktopPage.type('input[placeholder*="ID"]', '12345678');
        const zoneIdInput = await desktopPage.$('input[placeholder*="Zone"]');
        if (zoneIdInput) {
             await zoneIdInput.type('1234');
        }
        
        // Take screenshot of filled form
        await takeScreenshot(desktopPage, 'Checkout_Form_Filled', 'desktop');

    } catch (e) {
        console.error("Checkout flow failed: ", e.message);
    }

    // Login for Dashboard
    try {
        console.log("Attempting Login as Admin...");
        await desktopPage.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle0' });
        await desktopPage.type('input[type="email"]', 'sassy@test.com'); // Admin email? Let's hope it works or at least it shows error state
        await desktopPage.type('input[type="password"]', 'Password123!');
        await desktopPage.click('button[type="submit"]');
        await delay(2000);
        await takeScreenshot(desktopPage, 'Post_Login', 'desktop');

        console.log("Navigating to Admin Dashboard...");
        await desktopPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
        await delay(1000);
        await takeScreenshot(desktopPage, 'Admin_Dashboard', 'desktop');
        
        // Mobile dashboards
        await mobilePage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
        await delay(1000);
        await takeScreenshot(mobilePage, 'Admin_Dashboard', 'mobile');

    } catch (e) {
        console.error("Dashboard test failed: ", e.message);
    }

    await browser.close();
    console.log("Audit screenshots complete.");
}

run();
