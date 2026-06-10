const fs = require('fs');
let content = fs.readFileSync('components/PaymentAccordion.tsx', 'utf8');

// Group Header
content = content.replace(/hover:bg-white\/\[0\.03\]/g, 'hover:bg-obsidian-surface');

// Logo Chip Grid wrapper
content = content.replace(/"relative flex h-14 items-center justify-center overflow-hidden rounded-xl border px-3 transition-all duration-200",/g, '"relative flex h-14 items-center justify-center overflow-hidden rounded-xl border px-3 transition-all duration-300 group",');

// Selected/Unselected State
content = content.replace(/border-sakura\/60 bg-sakura\/10 shadow-\[0_0_16px_rgba\(253,176,192,0\.18\)\]/g, 'border-sakura bg-sakura/10 shadow-[0_0_20px_rgba(253,176,192,0.2)] scale-105 z-10');
content = content.replace(/border-white\/10 bg-white hover:border-white\/30 hover:shadow-md/g, 'border-obsidian-border bg-obsidian-surface/80 backdrop-blur-md hover:border-sakura/30 hover:shadow-[0_4px_15px_rgba(253,176,192,0.1)] hover:-translate-y-1');

// Selected Method Detail Box
content = content.replace(/bg-zinc-950\/60/g, 'bg-obsidian-surface shadow-inner');
content = content.replace(/border-white\/10/g, 'border-obsidian-border');

// Promo Input
content = content.replace(/border-white\/10 bg-zinc-950\/60/g, 'border-obsidian-border bg-obsidian-surface/60 shadow-inner focus:bg-obsidian-surface');

fs.writeFileSync('components/PaymentAccordion.tsx', content);
console.log("PaymentAccordion modified successfully.");
