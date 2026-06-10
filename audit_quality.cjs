const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const GAMES_DIR = path.join(__dirname, 'public/images/games');
const games = fs.readdirSync(GAMES_DIR).filter(d => fs.statSync(path.join(GAMES_DIR, d)).isDirectory());

async function runAudit() {
  let report = {
    total_games: games.length,
    banners: [],
    ogs: [],
    icons: [],
    warnings: []
  };

  for (let g of games) {
    const gameDir = path.join(GAMES_DIR, g);
    
    // Check banner.avif
    const bannerPath = path.join(gameDir, 'banner.avif');
    if (fs.existsSync(bannerPath)) {
      const meta = await sharp(bannerPath).metadata();
      report.banners.push({ game: g, width: meta.width, height: meta.height, format: meta.format });
      if (meta.width < 1920) {
        report.warnings.push(`[${g}] Banner width is ${meta.width}px (Target >= 1920px)`);
      }
    }

    // Check og.avif
    const ogPath = path.join(gameDir, 'og.avif');
    if (fs.existsSync(ogPath)) {
      const meta = await sharp(ogPath).metadata();
      report.ogs.push({ game: g, width: meta.width, height: meta.height });
      if (meta.width !== 1200 || meta.height !== 630) {
        report.warnings.push(`[${g}] OG dimensions ${meta.width}x${meta.height} (Target 1200x630)`);
      }
    }

    // Check icon.webp / icon.svg
    const iconWebp = path.join(gameDir, 'icon.webp');
    const iconSvg = path.join(gameDir, 'icon.svg');
    if (fs.existsSync(iconWebp)) {
      const meta = await sharp(iconWebp).metadata();
      report.icons.push({ game: g, type: 'webp', width: meta.width, height: meta.height });
      if (meta.width < 256) {
        report.warnings.push(`[${g}] Icon width is ${meta.width}px (Target >= 256px)`);
      }
    } else if (fs.existsSync(iconSvg)) {
      report.icons.push({ game: g, type: 'svg' });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

runAudit();
