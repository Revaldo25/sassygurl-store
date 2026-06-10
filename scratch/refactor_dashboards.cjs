const fs = require('fs');
const path = require('path');

const memberPath = path.join(__dirname, '../app/dashboard/MemberDashboardClient.tsx');
const adminPath = path.join(__dirname, '../app/admin/AdminDashboardClient.tsx');

function refactorDashboard(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove background decorations
    content = content.replace(/<div className="pointer-events-none fixed[^>]+bg-sakura\/5 blur-\[120px\]"[^>]*\/>/g, '');
    content = content.replace(/<div className="pointer-events-none fixed[^>]+bg-brand-cyan\/5 blur-\[120px\]"[^>]*\/>/g, '');
    content = content.replace(/<div className="pointer-events-none fixed[^>]+bg-sakura\/5 blur-\[150px\]"[^>]*\/>/g, '');
    
    // Add solid bg to main container
    content = content.replace(/className="relative min-h-screen overflow-hidden ([^"]+)"/, 'className="relative min-h-screen overflow-hidden bg-[#050508] $1"');

    // Clean up specific glow shadows
    content = content.replace(/shadow-\[0_0_30px_rgba\([^)]+\)\]/g, '');
    content = content.replace(/shadow-\[0_20px_50px_rgba\([^)]+\)\]/g, 'shadow-sm');
    content = content.replace(/shadow-\[0_0_15px_rgba\([^)]+\)\]/g, '');
    content = content.replace(/shadow-\[0_0_16px_rgba\([^)]+\)\]/g, 'shadow-sm');
    content = content.replace(/shadow-\[0_0_12px_rgba\([^)]+\)\]/g, '');
    content = content.replace(/shadow-\[0_10px_20px_rgba\([^)]+\)\]/g, 'shadow-sm');
    content = content.replace(/shadow-\[0_0_10px_rgba\([^)]+\)\]/g, '');

    // Replace backdrop-blur-3xl and bg-zinc-900/40 with solid dark backgrounds
    content = content.replace(/bg-zinc-900\/40/g, 'bg-zinc-900');
    content = content.replace(/bg-zinc-900\/30/g, 'bg-zinc-900');
    content = content.replace(/bg-zinc-900\/20/g, 'bg-zinc-900');
    content = content.replace(/backdrop-blur-3xl/g, '');
    content = content.replace(/backdrop-blur-2xl/g, '');

    // Simplify typography sizes
    content = content.replace(/text-\[8px\]/g, 'text-[10px]');
    content = content.replace(/text-\[10px\]/g, 'text-xs');
    content = content.replace(/tracking-\[0\.4em\]/g, 'tracking-widest');
    content = content.replace(/tracking-\[0\.3em\]/g, 'tracking-wider');
    content = content.replace(/tracking-\[0\.2em\]/g, 'tracking-wider');

    // Remove glassmorphism header glow
    content = content.replace(/<div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sakura to-brand-cyan opacity-25 blur transition duration-1000 group-hover:opacity-50" \/>/g, '');
    content = content.replace(/<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sakura\/5 blur-\[80px\] group-hover:bg-sakura\/10 transition-all duration-700" \/>/g, '');

    // Flatten StatusBadge
    content = content.replace(/glow: "shadow-\[0_0_12px_rgba\([^)]+\)\]"/g, 'glow: ""');
    
    // Remove animate-pulse on SVG if any
    content = content.replace(/animate-pulse/g, '');
    content = content.replace(/<Star className="h-6 w-6 animate-pulse fill-sakura\/20 text-sakura" \/>/g, '<Star className="h-6 w-6 text-sakura" />');

    // Fix some card borders to be more subtle
    content = content.replace(/border-white\/5/g, 'border-white/10');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored ${filePath}`);
}

refactorDashboard(memberPath);
refactorDashboard(adminPath);
console.log("Done.");
