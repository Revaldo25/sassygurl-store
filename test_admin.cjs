const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    console.log("Running MakeAdmin DELETE to wipe old user...");
    await new Promise((resolve, reject) => {
        require('child_process').exec('dotnet run -- DELETE', { cwd: 'scratch/MakeAdmin' }, (err, stdout, stderr) => {
            console.log(stdout);
            resolve();
        });
    });

    console.log("Navigating to register page...");
    await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle2' });
    
    console.log("Filling out register form...");
    await page.click('input[name="name"]', { clickCount: 3 }); await page.keyboard.press('Backspace');
    await page.type('input[name="name"]', 'Puppeteer Admin');
    await page.click('input[name="email"]', { clickCount: 3 }); await page.keyboard.press('Backspace');
    await page.type('input[name="email"]', 'puppeteer@test.com');
    await page.click('input[name="phone"]', { clickCount: 3 }); await page.keyboard.press('Backspace');
    await page.type('input[name="phone"]', '0812345678');
    await page.click('input[name="password"]', { clickCount: 3 }); await page.keyboard.press('Backspace');
    await page.type('input[name="password"]', 'P@ssw0rd123!');
    await page.click('input[name="confirmPassword"]', { clickCount: 3 }); await page.keyboard.press('Backspace');
    await page.type('input[name="confirmPassword"]', 'P@ssw0rd123!');
    
    console.log("Clicking submit...");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 5000)); // wait for API and redirect
    
    await page.screenshot({ path: 'C:/Users/User/.gemini/antigravity/brain/7c798322-6d78-4ea2-b8f9-b4dbe0e7aa1a/debug1_after_register.png', fullPage: true });
    console.log("AFTER REGISTER TEXT:", await page.evaluate(() => document.body.innerText.substring(0, 500)));

    console.log("Running MakeAdmin to setup SUPERADMIN user...");
    await new Promise((resolve, reject) => {
        require('child_process').exec('dotnet run', { cwd: 'scratch/MakeAdmin' }, (err, stdout, stderr) => {
            console.log(stdout);
            resolve();
        });
    });

    console.log("Navigating to login page...");
    
    console.log("Filling out login form...");
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="email"]', 'puppeteer@test.com');
    
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="password"]', 'P@ssw0rd123!');
    
    await page.screenshot({ path: 'C:/Users/User/.gemini/antigravity/brain/7c798322-6d78-4ea2-b8f9-b4dbe0e7aa1a/debug2_before_login.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000)); // wait for NextAuth and soft redirect
    
    await page.screenshot({ path: 'C:/Users/User/.gemini/antigravity/brain/7c798322-6d78-4ea2-b8f9-b4dbe0e7aa1a/debug3_after_login.png', fullPage: true });
    console.log("AFTER LOGIN TEXT:", await page.evaluate(() => document.body.innerText.substring(0, 500)));
    
    console.log("Navigating to Admin Dashboard...");
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
    
    console.log("Waiting for Admin Dashboard to render...");
    await page.waitForSelector('text/System Health', { timeout: 10000 }).catch(()=>console.log("System Health not found"));
    
    // Screenshot 1
    await page.screenshot({ path: 'C:/Users/User/.gemini/antigravity/brain/7c798322-6d78-4ea2-b8f9-b4dbe0e7aa1a/admin_dashboard_proof.png', fullPage: true });
    
    console.log("== EXTRACTING EVIDENCE ==");
    
    // 2. Links Check
    const linksText = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')).map(a => a.innerText.trim());
      return {
        hasCatalogHealth: links.includes('Catalog Health'),
        hasReviewQueue: links.includes('Review Queue'),
        hasClearCache: links.includes('Clear Cache')
      };
    });
    console.log("2. Admin Links Reachable:");
    console.log("   - Catalog Health:", linksText.hasCatalogHealth ? "PASS" : "FAIL");
    console.log("   - Review Queue:", linksText.hasReviewQueue ? "PASS" : "FAIL");
    console.log("   - Fake Clear Cache Button Gone:", !linksText.hasClearCache ? "PASS" : "FAIL");
    
    // 3. Provider Status Check
    const providerStatusCount = await page.evaluate(() => {
      const onlines = document.body.innerText.match(/Online/gi);
      return onlines ? onlines.length : 0;
    });
    console.log("3. Provider Status Rendered:", providerStatusCount > 0 ? `PASS (Found ${providerStatusCount} providers)` : "FAIL");

    // Click Transactions tab to check pagination
    console.log("Clicking Transactions tab...");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const txTab = tabs.find(b => b.innerText.includes('Transaksi'));
      if (txTab) txTab.click();
    });
    await new Promise(r => setTimeout(r, 2000)); // wait for animation
    
    // 1. Pagination Check
    const paginationText = await page.evaluate(() => {
      const el = document.body.innerText.match(/Menampilkan\s+\d+\s+-\s+\d+\s+dari\s+\d+\s+transaksi/i);
      return el ? el[0] : "PAGINATION TEXT NOT FOUND";
    });
    console.log("1. Backend Pagination:", paginationText !== "PAGINATION TEXT NOT FOUND" ? "PASS (" + paginationText + ")" : "FAIL");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
