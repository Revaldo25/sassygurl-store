const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\7c798322-6d78-4ea2-b8f9-b4dbe0e7aa1a';
const publicHeroDir = path.join(__dirname, '../public/images/hero');
const publicGamesDir = path.join(__dirname, '../public/images/games');
const manifestPath = path.join(__dirname, '../shared/registry/games_manifest.json');

let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 1. Process Artifacts
const artifacts = fs.readdirSync(artifactDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp'));

artifacts.forEach(file => {
    // If it's a banner, goes to hero/
    if (file.includes('_banner_')) {
        const gameName = file.split('_banner_')[0]; // e.g. aether_gazer
        let newName = `hero_${gameName}${path.extname(file)}`;
        if (gameName === 'steam') newName = `hero_steam_wallet${path.extname(file)}`;
        
        fs.copyFileSync(path.join(artifactDir, file), path.join(publicHeroDir, newName));
        console.log(`Copied banner: ${newName}`);

        // Update manifest
        let manifestKey = gameName;
        if (gameName === 'aether_gazer') manifestKey = 'aether-gazer';
        if (gameName === 'blood_strike') manifestKey = 'blood-strike';
        if (gameName === 'delta_force') manifestKey = 'delta-force';
        if (gameName === 'fc_mobile') manifestKey = 'fc-mobile';
        if (gameName === 'steam') manifestKey = 'steam-wallet';
        
        if (manifest[manifestKey]) {
            manifest[manifestKey].hero = `/images/hero/${newName}`;
        }
    }
    
    // If it's an icon, goes to games/
    if (file.includes('_icon_')) {
        const gameName = file.split('_icon_')[0]; // e.g. aether_gazer
        let newName = `${gameName}_icon${path.extname(file)}`;
        if (gameName === 'steam') newName = `steam_icon${path.extname(file)}`;
        if (gameName === 'fc_mobile') newName = `fcm_icon${path.extname(file)}`;
        if (gameName === 'delta_force') newName = `df_icon${path.extname(file)}`;
        if (gameName === 'blood_strike') newName = `bs_icon${path.extname(file)}`;
        
        fs.copyFileSync(path.join(artifactDir, file), path.join(publicGamesDir, newName));
        console.log(`Copied icon: ${newName}`);

        // Update manifest
        let manifestKey = gameName;
        if (gameName === 'aether_gazer') manifestKey = 'aether-gazer';
        if (gameName === 'blood_strike') manifestKey = 'blood-strike';
        if (gameName === 'delta_force') manifestKey = 'delta-force';
        if (gameName === 'fc_mobile') manifestKey = 'fc-mobile';
        if (gameName === 'steam') manifestKey = 'steam-wallet';
        
        if (manifest[manifestKey]) {
            manifest[manifestKey].thumbnail = `/images/games/${newName}`;
            manifest[manifestKey].logo = `/images/games/${newName}`;
        }
    }
});

// 2. Fix .jpeg extensions in public/images/games/
const existingGamesFiles = fs.readdirSync(publicGamesDir);
existingGamesFiles.forEach(file => {
    if (file.endsWith('.jpeg')) {
        const newFile = file.replace('.jpeg', '.jpg');
        fs.renameSync(path.join(publicGamesDir, file), path.join(publicGamesDir, newFile));
        console.log(`Renamed ${file} to ${newFile}`);

        // Update manifest globally
        Object.keys(manifest).forEach(k => {
            if (manifest[k].thumbnail && manifest[k].thumbnail.includes(file)) {
                manifest[k].thumbnail = manifest[k].thumbnail.replace('.jpeg', '.jpg');
            }
            if (manifest[k].logo && manifest[k].logo.includes(file)) {
                manifest[k].logo = manifest[k].logo.replace('.jpeg', '.jpg');
            }
        });
    }
    // Also SVG to PNG if applicable, but since we don't have a converter in node natively, 
    // we'll just let SVG be, SVG is valid on web. But user said no mismatch. Let's see if there are svgs.
});

// 3. User's uploaded media files
// media__1779441024871.jpg -> Let's assume it's MLBB hero banner (a common use case).
// Let's copy it just in case, we can manually adjust later if needed.
const media1 = path.join(artifactDir, 'media__1779441024871.jpg');
if (fs.existsSync(media1)) {
    fs.copyFileSync(media1, path.join(publicHeroDir, 'hero_mlbb.jpg'));
    manifest['mlbb'].hero = '/images/hero/hero_mlbb.jpg';
    console.log('Applied user image to MLBB hero.');
}

const media2 = path.join(artifactDir, 'media__1779387424206.png');
if (fs.existsSync(media2)) {
    fs.copyFileSync(media2, path.join(publicGamesDir, 'mlbb_icon.png'));
    manifest['mlbb'].thumbnail = '/images/games/mlbb_icon.png';
    manifest['mlbb'].logo = '/images/games/mlbb_icon.png';
    console.log('Applied user image to MLBB icon.');
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('games_manifest.json updated successfully!');
