const fs = require('fs');

async function runAudit() {
  try {
    const res = await fetch("http://localhost:5009/api/catalog/games");
    if (!res.ok) {
      console.error("Failed to fetch games from API");
      return;
    }
    const data = await res.json();
    const games = data.data;
    
    let report = "CATALOG AUDIT\n==============\n";
    let allProducts = 0;
    
    for (const g of games) {
        report += `\nGAME: ${g.name} (Slug: ${g.slug})\n`;
        const gRes = await fetch(`http://localhost:5009/api/catalog/games/${g.slug}`);
        if (!gRes.ok) continue;
        const gData = await gRes.json();
        const pList = gData.data.products || [];
        allProducts += pList.length;
        report += `Products: ${pList.length}\n`;
        
        // Group by category
        const cats = {};
        for(const p of pList) {
           const c = p.itemCategory || 'UNKNOWN';
           if(!cats[c]) cats[c] = [];
           cats[c].push(p);
        }
        for(const [c, items] of Object.entries(cats)) {
           report += ` - Category [${c}]: ${items.length} items (e.g. ${items[0].name})\n`;
        }
    }
    report += `\nTotal Games: ${games.length}\nTotal Products: ${allProducts}\n`;
    fs.writeFileSync('scratch/catalog_audit_report.txt', report);
    console.log("Audit done");
  } catch (err) {
    console.error(err);
  }
}

runAudit();
