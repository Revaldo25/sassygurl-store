const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'play.google.com',
  port: 443,
  path: '/store/apps/details?id=com.mobile.legends',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => { data += d; });
  res.on('end', () => {
    // Find a banner image (usually high-res)
    const matches = data.match(/https:\/\/play-lh\.googleusercontent\.com\/[^"']+/g);
    if (matches && matches.length > 0) {
      // Find the one that looks like a banner (often has =w...-h...-rw)
      const bannerUrl = matches.find(url => url.includes('w526-h296') || url.includes('w1080-h600') || url.length > 100);
      
      if (bannerUrl) {
        console.log("Found banner URL: " + bannerUrl);
        const file = fs.createWriteStream('public/images/hero/hero_mlbb.jpg');
        https.get(bannerUrl, (resp) => {
          resp.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log("Download completed");
          });
        });
      } else {
        console.log("No suitable banner found in: ", matches.slice(0, 5));
      }
    }
  });
});
req.on('error', (e) => { console.error(e); });
req.end();
