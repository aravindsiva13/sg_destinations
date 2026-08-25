// Temporary single-origin host: serves the built `dist/` (SPA) and reverse-proxies
// /api and /health to the local API on port 4000. One origin => no CORS, and the
// frontend can use relative API URLs so a changing tunnel URL needs no rebuild.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./dist', import.meta.url));
const EDGE_PORT = Number(process.env.EDGE_PORT ?? 8080);
const API_TARGET = { host: '127.0.0.1', port: Number(process.env.API_PORT ?? 4000) };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function proxy(req, res) {
  const headers = { ...req.headers, host: `${API_TARGET.host}:${API_TARGET.port}` };
  // Drop Origin so the API treats this as a server-to-server call (its CORS
  // allows no-origin requests), regardless of the public tunnel URL.
  delete headers.origin;
  delete headers.referer;
  const upstream = http.request(
    { host: API_TARGET.host, port: API_TARGET.port, method: req.method, path: req.url, headers },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'API unreachable', detail: err.message }));
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = normalize(join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return send(res, filePath);
  }
  // SPA fallback
  return send(res, join(ROOT, 'index.html'));
}

function send(res, filePath) {
  const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  const stream = createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(404);
      res.end('File not found or being rebuilt');
    }
  });
  stream.pipe(res);
}

http
  .createServer((req, res) => {
    const url = req.url || '/';
    if (url === '/health' || url.startsWith('/api/')) return proxy(req, res);
    return serveStatic(req, res);
  })
  .listen(EDGE_PORT, '127.0.0.1', () => {
    console.log(`✦ Edge server (static dist + /api proxy) on http://127.0.0.1:${EDGE_PORT}`);
  });
