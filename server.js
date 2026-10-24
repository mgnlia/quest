#!/usr/bin/env node
/*
 * Quest Demo web server. Zero dependencies (Node >= 18).
 * Serves ./web as a static PWA. Railway (and most PaaS) set PORT; defaults to 3000 locally.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.join(__dirname, 'web');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};
const COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json)|image\/svg)/;

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

/* Read every file once at startup: the app is ~2.5 MB, so memory is cheap and responses are instant. */
const files = new Map();
function load(dir){
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })){
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()){ load(full); continue; }
    const ext = path.extname(ent.name).toLowerCase();
    const type = MIME[ext]; if (!type) continue;
    const body = fs.readFileSync(full);
    const urlPath = '/' + path.relative(ROOT, full).split(path.sep).join('/');
    const etag = '"' + crypto.createHash('sha1').update(body).digest('base64url').slice(0, 20) + '"';
    const gz = COMPRESSIBLE.test(type) && body.length > 1024 ? zlib.gzipSync(body, { level: 9 }) : null;
    const br = COMPRESSIBLE.test(type) && body.length > 1024 ? zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }) : null;
    files.set(urlPath, { body, gz, br, type, etag, ext });
  }
}
load(ROOT);

function cacheControl(f, urlPath){
  if (f.ext === '.woff2' || urlPath.startsWith('/icons/')) return 'public, max-age=2592000, immutable';
  return 'no-cache';   // html, js, css, sw.js, manifest: always revalidate via ETag so deploys show up at once
}

function send(req, res, status, headers, body){
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers));
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' }, 'Method Not Allowed');
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(req, res, 400, { 'Content-Type': 'text/plain' }, 'Bad Request'); }

  if (urlPath === '/healthz') return send(req, res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, JSON.stringify({ ok: true, files: files.size }));
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const f = files.get(urlPath);
  if (!f){
    // Unknown path without an extension: send to the app (routing is hash-based, so this only catches typos and old links).
    if (!path.extname(urlPath)) return send(req, res, 302, { Location: '/', 'Cache-Control': 'no-cache' }, '');
    return send(req, res, 404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }, 'Not Found');
  }

  const headers = { 'Content-Type': f.type, 'Cache-Control': cacheControl(f, urlPath), ETag: f.etag, Vary: 'Accept-Encoding' };
  if (urlPath === '/sw.js') headers['Service-Worker-Allowed'] = '/';
  if (req.headers['if-none-match'] === f.etag) return send(req, res, 304, headers);

  const ae = String(req.headers['accept-encoding'] || '');
  let body = f.body;
  if (f.br && /\bbr\b/.test(ae)){ body = f.br; headers['Content-Encoding'] = 'br'; }
  else if (f.gz && /\bgzip\b/.test(ae)){ body = f.gz; headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = body.length;
  send(req, res, 200, headers, body);
});

server.keepAliveTimeout = 65000;
server.listen(PORT, HOST, () => console.log(`Quest Demo listening on http://${HOST}:${PORT} (${files.size} files)`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
