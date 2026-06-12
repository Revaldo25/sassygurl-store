const fs = require('fs');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log("Downloading Valorant...");
    await download('https://wpassets.playvalorant.com/is/image/riotgames/VALORANT_JETT_Wallpaper_1920x1080_0?wid=1920', 'd:/sassygurlstore/public/images/games/valorant/banner.avif');
    await download('https://wpassets.playvalorant.com/is/image/riotgames/VALORANT_JETT_Wallpaper_1920x1080_0?wid=1920', 'd:/sassygurlstore/public/images/games/valorant/banner.webp');
    console.log("Downloading Arknights...");
    await download('https://endfield.hypergryph.global/assets/images/kv2.jpg', 'd:/sassygurlstore/public/images/games/arknights-endfield/banner.avif');
    await download('https://endfield.hypergryph.global/assets/images/kv2.jpg', 'd:/sassygurlstore/public/images/games/arknights-endfield/banner.webp');
    console.log("Done.");
  } catch(e) {
    console.error(e);
  }
}
main();
