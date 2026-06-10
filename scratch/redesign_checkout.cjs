const fs = require('fs');
let content = fs.readFileSync('app/games/[slug]/CheckoutClient.tsx', 'utf8');

// Step 1 wrapper (AccountInput handles its own styling now, but its container might have styling)
content = content.replace(/rounded-3xl border border-white\/5 bg-white\/\[0\.02\]/g, 'glass-panel rounded-3xl');

// Step Headers
// Search for: backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}25`
content = content.replace(/backgroundColor:\s*`\$\{accent\}15`,\s*color:\s*accent,\s*border:\s*`1px solid \$\{accent\}25`/g, 
  "backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}40`, boxShadow: `0 0 15px ${accent}20`");

// Product Tabs
content = content.replace(/border-white\/10 bg-white\/5 text-white\/50/g, 'text-zinc-500 hover:text-white');
content = content.replace(/border-\$\{accent\}\/40 bg-\$\{accent\}\/15 text-\$\{accent\}/g, 'bg-white/10 text-${accent} shadow-[0_0_15px_rgba(255,255,255,0.1)]');
content = content.replace(/overflow-x-auto pb-2 scrollbar-hide md:pb-0/g, 'overflow-x-auto pb-2 scrollbar-hide md:pb-0 p-1.5 rounded-2xl bg-obsidian-surface/60 border border-obsidian-border backdrop-blur-md w-max');

// Product Grid Card
content = content.replace(/rounded-2xl border bg-black\/20 p-4 transition-all duration-300 hover:border-white\/20/g, 'glass-card p-4 transition-all duration-300 group');
content = content.replace(/border-\$\{accent\} bg-\$\{accent\}\/10 shadow-\[0_0_15px_rgba/g, 'border-${accent} bg-${accent}/10 shadow-[0_0_20px_rgba');
content = content.replace(/border-white\/5/g, 'border-obsidian-border hover:border-white/20');

// Bottom Action Bar
content = content.replace(/border-t border-white\/10 bg-\[\#09090b\]\/90 backdrop-blur-xl/g, 'border-t border-white/10 bg-obsidian/80 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]');

// Order Confirmation Modal
content = content.replace(/bg-\[\#18181b\] border-white\/10/g, 'glass-panel border-white/10');

fs.writeFileSync('app/games/[slug]/CheckoutClient.tsx', content);
console.log("CheckoutClient modified successfully.");
