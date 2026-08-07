const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const VENDOR_DIRS = {
  '/vendor/inter/': path.join(__dirname, '..', 'node_modules', '@fontsource-variable', 'inter'),
  '/vendor/phosphor/': path.join(__dirname, '..', 'node_modules', '@phosphor-icons', 'web', 'src'),
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safePath = path.normalize(urlPath).replace(/^\.\.(\/|\\|$)/, '');
    const vendorPrefix = Object.keys(VENDOR_DIRS).find((prefix) => safePath.startsWith(prefix));
    const rootDir = vendorPrefix ? VENDOR_DIRS[vendorPrefix] : PUBLIC_DIR;
    const relativePath = vendorPrefix ? safePath.slice(vendorPrefix.length) : safePath;
    let filePath = path.join(rootDir, relativePath === '/' ? 'index.html' : relativePath);

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('Not found');
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
  })
  .listen(PORT, () => {
    console.log(`Photo Ranker running at http://localhost:${PORT}`);
  });
