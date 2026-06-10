const fs = require('fs');
let c = fs.readFileSync('components/AccountInput.tsx', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('components/AccountInput.tsx', c);
console.log('Fixed');
