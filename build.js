const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'dist');
const assets = ['index.html', 'style.css', 'app.js', 'engine.js', 'favicon.svg'];
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const asset of assets) fs.copyFileSync(path.join(__dirname, asset), path.join(output, asset));
console.log(`Built ${assets.length} static assets in dist/`);
