const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/SassyGurl.Api/sassy_elite.db', sqlite3.OPEN_READONLY);

db.all("SELECT ProviderName, Operation, ResponseBody FROM ProviderSyncLogs ORDER BY Id DESC LIMIT 2", (err, rows) => {
    if (err) {
        console.error("DB Error:", err);
    } else {
        if (rows.length === 0) {
            console.log("No sync logs found");
            return;
        }
        for (const r of rows) {
            console.log(`\n\n--- ${r.ProviderName} (${r.Operation}) ---`);
            const body = r.ResponseBody;
            if (body && body.startsWith("{")) {
                try {
                    const parsed = JSON.parse(body);
                    const items = parsed.data || [];
                    const brands = new Set();
                    items.forEach(i => {
                        const b = i.brand || i.game;
                        if (b) brands.add(b);
                    });
                    console.log(`Found ${items.length} items. Brands:`, Array.from(brands).join(", "));
                    
                    // Show a few samples
                    console.log("\nSample Items:");
                    console.log(items.slice(0, 5).map(i => ({ sku: i.buyer_sku_code || i.code, name: i.product_name || i.name, brand: i.brand || i.game, category: i.category })).slice(0, 3));
                } catch(e) {
                    console.log("Parse error or truncated", e.message);
                }
            } else {
                console.log(body.substring(0, 200) + "...");
            }
        }
    }
});
