const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BATCH_1 = ['hsr', 'zzz', 'hok', 'roblox', 'steam-wallet'];
const BASE_DIR = path.join(__dirname, 'public/images/games');
const FALLBACKS_DIR = path.join(__dirname, 'public/images/fallbacks');
// Make sure scratch/backup_assets/obsolete_batch1 is relative to workspace
const OBSOLETE_DIR = path.join(__dirname, 'scratch/backup_assets/obsolete_batch2');
const MANIFEST_PATH = path.join(__dirname, 'shared/registry/games_manifest.json');

if (!fs.existsSync(OBSOLETE_DIR)) fs.mkdirSync(OBSOLETE_DIR, { recursive: true });
if (!fs.existsSync(FALLBACKS_DIR)) fs.mkdirSync(FALLBACKS_DIR, { recursive: true });

async function processImage(inputPath, outputPath, options) {
  try {
    const s = sharp(inputPath);
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
    console.error(`Error processing ${inputPath} to ${outputPath}:`, err);
  }
}

async function run() {
  let manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  
  manifest['_fallbacks'] = {
    "icon": "/images/fallbacks/game-default-icon.svg",
    "banner": "/images/fallbacks/game-default.webp",
    "og": "/images/fallbacks/og-default.webp"
  };

  let results = { created: [], archived: [], manifestUpdated: [] };

  for (const slug of BATCH_1) {
    console.log(`Processing ${slug}...`);
    const gameDir = path.join(BASE_DIR, slug);
    if (!fs.existsSync(gameDir)) continue;

    const files = fs.readdirSync(gameDir);
    
    let bannerSrc = files.find(f => f.startsWith('banner.') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp')));
    if (files.includes('banner.png')) bannerSrc = 'banner.png'; // PNG priority

    let iconSrc = files.find(f => f.startsWith('icon.') && (f.endsWith('.svg') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp')));
    if (files.includes('icon.svg')) iconSrc = 'icon.svg';
    else if (files.includes('icon.png')) iconSrc = 'icon.png';

    const gameManifest = manifest[slug] || {};

    if (bannerSrc) {
      const srcPath = path.join(gameDir, bannerSrc);
      
      const avifBanner = path.join(gameDir, 'banner.avif');
      if (!fs.existsSync(avifBanner)) {
        await processImage(srcPath, avifBanner, {});
        results.created.push(`games/${slug}/banner.avif`);
      }
      
      const webpBanner = path.join(gameDir, 'banner.webp');
      if (bannerSrc !== 'banner.webp' && !fs.existsSync(webpBanner)) {
        await processImage(srcPath, webpBanner, {});
        results.created.push(`games/${slug}/banner.webp`);
      }

      const avifOg = path.join(gameDir, 'og.avif');
      const webpOg = path.join(gameDir, 'og.webp');
      if (!fs.existsSync(avifOg)) {
        await processImage(srcPath, avifOg, { resize: { width: 1200, height: 630 } });
        results.created.push(`games/${slug}/og.avif`);
      }
      if (!fs.existsSync(webpOg)) {
        await processImage(srcPath, webpOg, { resize: { width: 1200, height: 630 } });
        results.created.push(`games/${slug}/og.webp`);
      }

      gameManifest.banner = `/images/games/${slug}/banner.avif`;
      gameManifest.banner_fallback = `/images/games/${slug}/banner.webp`;
      gameManifest.og = `/images/games/${slug}/og.avif`;
      gameManifest.og_fallback = `/images/games/${slug}/og.webp`;
    }

    if (iconSrc) {
      const srcPath = path.join(gameDir, iconSrc);
      
      if (iconSrc.endsWith('.svg')) {
        gameManifest.icon = `/images/games/${slug}/icon.svg`;
      } else {
        const webpIcon = path.join(gameDir, 'icon.webp');
        if (iconSrc !== 'icon.webp' && !fs.existsSync(webpIcon)) {
           await processImage(srcPath, webpIcon, { resize: { width: 256, height: 256 } });
           results.created.push(`games/${slug}/icon.webp`);
        }
        gameManifest.icon = `/images/games/${slug}/icon.webp`;
      }
    }

    delete gameManifest.thumbnail;
    delete gameManifest.logo;
    delete gameManifest.coverImage;
    delete gameManifest.guideImage;
    delete gameManifest.hero;

    manifest[slug] = gameManifest;
    results.manifestUpdated.push(slug);

    for (const f of files) {
      if (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')) {
        const ext = path.extname(f);
        const name = path.basename(f, ext);
        if (name === 'banner' || name === 'icon') {
            fs.renameSync(path.join(gameDir, f), path.join(OBSOLETE_DIR, `${slug}_${f}`));
            results.archived.push(`games/${slug}/${f}`);
        }
      }
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log("EXECUTION_REPORT:" + JSON.stringify(results));
}

run();
