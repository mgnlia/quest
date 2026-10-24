#!/usr/bin/env node
/*
 * Quest Demo web server (Node >= 18).
 * Serves ./web as a static PWA. Railway (and most PaaS) set PORT; defaults to 3000 locally.
 * Also hosts the optional testnet settlement relayer under /api/settle (see relayer.js); without
 * SETTLEMENT_PRIVATE_KEY it reports itself disabled and the app keeps its mock chain records.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { createRelayer, HttpError } = require('./relayer');

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

/* ---------------- settlement API (Base Sepolia testnet relayer) ---------------- */
const relayer = createRelayer(__dirname);
const LIMITS = {
  write: { per: 10 * 60000, ip: Number(process.env.SETTLE_IP_WRITES) || 12, all: Number(process.env.SETTLE_HOURLY_WRITES) || 120, allPer: 3600000 },
  read: { per: 60000, ip: 120 }
};
const hits = new Map();   // "kind|ip" -> timestamps; also "write|*" for the global write budget
function allow(key, max, per){
  const now = Date.now(), list = (hits.get(key) || []).filter(t => now - t < per);
  if (list.length >= max){ hits.set(key, list); return false; }
  list.push(now); hits.set(key, list); return true;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits){ if (!v.length || now - v[v.length - 1] > 3600000) hits.delete(k); } }, 600000).unref();
function clientIp(req){
  // Behind Railway's proxy the nearest hop appends the real client address last.
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : (req.socket.remoteAddress || '?');
}
function sendJson(req, res, status, obj, extra){ send(req, res, status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra || {}), JSON.stringify(obj)); }
function readJson(req){
  return new Promise((resolve, reject) => {
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return reject(new HttpError(415, 'json-required'));
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 2048){ reject(new HttpError(413, 'too-large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; resolve(v); } catch (e) { reject(new HttpError(400, 'bad-json')); } });
    req.on('error', reject);
  });
}
async function settleApi(req, res, urlPath){
  const ip = clientIp(req);
  try {
    if (req.method === 'POST' && (urlPath === '/api/settle/deposit' || urlPath === '/api/settle/release')){
      // Same-origin only: the browser always sends Origin on POST; refuse other sites' pages.
      const origin = req.headers.origin;
      if (origin){ let h = ''; try { h = new URL(origin).host; } catch (e) {} if (h !== req.headers.host) throw new HttpError(403, 'cross-origin'); }
      if (!relayer.enabled) throw new HttpError(503, 'disabled');
      if (!allow('write|' + ip, LIMITS.write.ip, LIMITS.write.per)) throw new HttpError(429, 'rate-limited');
      if (!allow('write|*', LIMITS.write.all, LIMITS.write.allPer)) throw new HttpError(429, 'busy');
      const body = await readJson(req);
      const out = urlPath.endsWith('/deposit') ? await relayer.deposit(body) : await relayer.release(body);
      return sendJson(req, res, 202, out);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(req, res, 405, { error: 'method-not-allowed' }, { Allow: 'GET, HEAD, POST' });
    if (!allow('read|' + ip, LIMITS.read.ip, LIMITS.read.per)) throw new HttpError(429, 'rate-limited');
    if (urlPath === '/api/settle/config') return sendJson(req, res, 200, await relayer.info());
    let m = urlPath.match(/^\/api\/settle\/tx\/([^/]+)$/);
    if (m) return sendJson(req, res, 200, await relayer.tx(m[1]));
    m = urlPath.match(/^\/api\/settle\/([^/]+)$/);
    if (m) return sendJson(req, res, 200, await relayer.read(m[1]));
    throw new HttpError(404, 'not-found');
  } catch (e) {
    if (e instanceof HttpError) return sendJson(req, res, e.status, { error: e.code, detail: e.message !== e.code ? e.message : undefined });
    console.error('settle error:', e && (e.shortMessage || e.message));
    return sendJson(req, res, 502, { error: 'chain-error', detail: String(e && (e.shortMessage || e.message) || e).slice(0, 200) });
  }
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(req, res, 400, { 'Content-Type': 'text/plain' }, 'Bad Request'); }
  if (urlPath.startsWith('/api/')) return settleApi(req, res, urlPath);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' }, 'Method Not Allowed');

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
server.listen(PORT, HOST, () => {
  console.log(`Quest Demo listening on http://${HOST}:${PORT} (${files.size} files)`);
  relayer.info().then(i => console.log(`Settlement: ${i.enabled ? 'on' : 'off (' + i.reason + ')'} · chain ${i.chainId}${i.contract ? ' · ' + i.contract : ''}${i.relayer ? ' · relayer ' + i.relayer : ''}`)).catch(() => {});
});
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
