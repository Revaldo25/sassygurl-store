const fs = require('fs');
let c = fs.readFileSync('app/games/[slug]/CheckoutClient.tsx', 'utf8');
c = c.replace(/boxShadow:\s*`0 0 15px \$\{accent\}20`,\s*boxShadow:\s*`0 0 0 3px \$\{accent\}10`/g, 'boxShadow: `0 0 15px ${accent}20`');
fs.writeFileSync('app/games/[slug]/CheckoutClient.tsx', c);
