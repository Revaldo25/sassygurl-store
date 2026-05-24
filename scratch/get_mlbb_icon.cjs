const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'play.google.com',
  port: 443,
  path: '/store/apps/details?id=com.mobile.legends',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => { data += d; });
  res.on('end', () => {
    // Find icon image
    const matches = data.match(/https:\/\/play-lh\.googleusercontent\.com\/[^"']+/g);
    if (matches && matches.length > 0) {
      // The icon is usually smaller dimension or the first few play-lh links
      // App icons often have =w240-h480-rw or similar
      const iconUrl = matches.find(url => url.includes('=s') || url.includes('=w240') || url.length < 150);
      
      if (iconUrl) {
        // We can request a larger size by changing =s... to =s1024
        const highResUrl = iconUrl.replace(/=w\d+-h\d+-rw/, '=s1024-rw').replace(/=s\d+-rw/, '=s1024-rw');
        console.log("Found icon URL: " + highResUrl);
        const file = fs.createWriteStream('public/images/games/mlbb_icon.png');
        https.get(highResUrl, (resp) => {
          resp.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log("Icon Download completed");
          });
        });
      }
    }
  });
});
req.on('error', (e) => { console.error(e); });
req.end();
