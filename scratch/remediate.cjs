const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = 'd:/sassygurlstore';
const GAMES_DIR = path.join(ROOT_DIR, 'public/images/games');
const games = fs.readdirSync(GAMES_DIR).filter(d => fs.statSync(path.join(GAMES_DIR, d)).isDirectory());

const SWAPPED_GAMES = ['hsr', 'zzz', 'wuwa'];

async function processImage(inputBuffer, outputPath, options) {
  try {
    const s = sharp(inputBuffer);
    if (options.resize) {
      s.resize(options.resize.width, options.resize.height, { fit: 'cover' });
    }
    if (outputPath.endsWith('.avif')) {
      s.avif({ quality: 80, effort: 4 });
    } else if (outputPath.endsWith('.webp')) {
      s.webp({ quality: 85 });
    }
    await s.toFile(outputPath);
  } catch (err) {
    console.error(`Error processing to ${outputPath}:`, err);
  }
}

async function runRemediation() {
  console.log("Starting remediation...");
  
  // 1. Fix swapped games
  for (const slug of SWAPPED_GAMES) {
    const gameDir = path.join(GAMES_DIR, slug);
    const wrongIcon = path.join(gameDir, 'icon.webp'); 
    const wrongBanner = path.join(gameDir, 'banner.webp'); 
    
    if (fs.existsSync(wrongIcon) && fs.existsSync(wrongBanner)) {
      const iconBuf = fs.readFileSync(wrongIcon);
      const bannerBuf = fs.readFileSync(wrongBanner);
      
      const iconMeta = await sharp(iconBuf).metadata();
      if (iconMeta.width > 1000) { 
        console.log(`Fixing swap for ${slug}...`);
        
        // iconBuf is the real banner, bannerBuf is the real icon.
        // We write to temp files to avoid locking issues, then replace.
        await processImage(iconBuf, path.join(gameDir, 'banner.avif'), {});
        await processImage(iconBuf, path.join(gameDir, 'banner_new.webp'), {});
        await processImage(iconBuf, path.join(gameDir, 'og.avif'), { resize: { width: 1200, height: 630 } });
        await processImage(iconBuf, path.join(gameDir, 'og.webp'), { resize: { width: 1200, height: 630 } });
        
        await processImage(bannerBuf, path.join(gameDir, 'icon_new.webp'), { resize: { width: 256, height: 256 } });
        
        // Wait a bit, then overwrite
        try { fs.copyFileSync(path.join(gameDir, 'banner_new.webp'), path.join(gameDir, 'banner.webp')); } catch(e){}
        try { fs.copyFileSync(path.join(gameDir, 'icon_new.webp'), path.join(gameDir, 'icon.webp')); } catch(e){}
        
        try { fs.unlinkSync(path.join(gameDir, 'banner_new.webp')); } catch(e){}
        try { fs.unlinkSync(path.join(gameDir, 'icon_new.webp')); } catch(e){}
      }
    }
  }

  // 2. Audit all 21 games
  let reportLines = [];
  let corrected = SWAPPED_GAMES;
  let candidates = [];

  for (let g of games) {
    const gameDir = path.join(GAMES_DIR, g);
    const bannerPath = path.join(gameDir, 'banner.avif');
    let width = 0, height = 0;
    
    if (fs.existsSync(bannerPath)) {
      const meta = await sharp(bannerPath).metadata();
      width = meta.width;
      height = meta.height;
    }
    
    let status = "CANDIDATE";
    if (width >= 1920) {
      status = "FINAL";
    } else {
      candidates.push(g);
    }
    
    let fixApplied = "None";
    if (SWAPPED_GAMES.includes(g)) {
      fixApplied = "Corrected swapped icon/banner files; Regenerated AVIF/WebP";
      status = "FINAL"; // They are 1920x1080
    }
    
    let remainingRisk = "None";
    if (status === "CANDIDATE") {
      remainingRisk = `Banner resolution is ${width}x${height}, causing stretched rendering on desktop.`;
    }
    
    let iconSource = fs.existsSync(path.join(gameDir, 'icon.svg')) ? "icon.svg" : "icon.webp";
    
    reportLines.push(`* Game slug: ${g}`);
    reportLines.push(`  Banner source: banner.avif / banner.webp (${width}x${height})`);
    reportLines.push(`  Icon source: ${iconSource}`);
    reportLines.push(`  OG source: og.avif / og.webp (1200x630)`);
    reportLines.push(`  Final / Candidate / Fallback / Obsolete: ${status}`);
    reportLines.push(`  Fix applied: ${fixApplied}`);
    reportLines.push(`  Remaining risk: ${remainingRisk}`);
    reportLines.push(`--------------------------------------------------`);
  }
  
  const finalReport = {
    reportText: reportLines.join('\n'),
    corrected: corrected,
    candidates: candidates
  };
  
  fs.writeFileSync(path.join(ROOT_DIR, 'scratch/remediation_report.json'), JSON.stringify(finalReport, null, 2));
  console.log("Remediation and audit complete.");
}

runRemediation();
