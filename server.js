import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

// Verify dist/ exists before accepting requests
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`ERROR: dist/index.html not found at ${DIST}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

  // Strip query strings
  filePath = filePath.split('?')[0];

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('Stream error:', err.message);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
  stream.pipe(res);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LabelQuote running on port ${PORT}`);
  console.log(`Serving from: ${DIST}`);
});
