/* Quest demo — core: store, router, UI primitives, formatting, icons, charts */
'use strict';

/* ---------------- icons ---------------- */
const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  list:'<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 8.5h8M8 12.5h8M8 16.5h5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M16 15h2"/><path d="M6 6V5a2 2 0 0 1 2-2h9"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  chev:'<path d="M9 5l7 7-7 7"/>',
  down:'<path d="M5 9l7 7 7-7"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  unlock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.5-2"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M7 7l10 10M17 7 7 17"/>',
  alert:'<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  send:'<path d="M4 12 20 4l-6 16-3-7z"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m12 8 1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5z"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.1 6.2C3.6 8 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  scan:'<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
  tree:'<rect x="9" y="3" width="6" height="5" rx="1.5"/><rect x="3" y="16" width="6" height="5" rx="1.5"/><rect x="15" y="16" width="6" height="5" rx="1.5"/><path d="M12 8v4M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>',
  badge:'<circle cx="12" cy="9" r="6"/><path d="m9 14.5-1.5 6.5 4.5-2.5 4.5 2.5-1.5-6.5"/><path d="m9.5 9 1.8 1.8L14.8 7.5"/>',
  gavel:'<path d="m14 4 6 6M11 7l6 6M9.5 12.5 4 18a1.4 1.4 0 0 0 2 2l5.5-5.5"/><path d="m12 5 7 7-2 2-7-7z"/>',
  truck:'<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  cert:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 9h10M7 12.5h6"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="m15.5 19.5-.5 2.5 1.5-.8 1.5.8-.5-2.5"/>',
  chain:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  money:'<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
  chart:'<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.3 0 4 1.3 4.5 4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 20v-4h-4"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
  dn:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  building:'<rect x="4" y="3" width="11" height="18" rx="1.5"/><path d="M15 9h4a1 1 0 0 1 1 1v11h-5"/><path d="M8 7h3M8 11h3M8 15h3"/>',
  flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  db:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  box:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  msg:'<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
  doc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  bolt:'<path d="M13 3 4 14h7l-1 7 9-11h-7z"/>',
  hash:'<path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18"/>',
  swap:'<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  mask:'<path d="M3 7c3-1.5 6-2 9-2s6 .5 9 2c0 6-3 10-6 10-1.5 0-2-1.5-3-1.5S10.5 17 9 17c-3 0-6-4-6-10z"/><path d="M7.5 10.5c.8-.6 1.8-.6 2.6 0M13.9 10.5c.8-.6 1.8-.6 2.6 0"/>',
  pause:'<path d="M9 5v14M15 5v14"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>'
};
function ic(name, cls){ return `<svg class="${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||''}</svg>`; }
const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#3A4FF0"/><circle cx="19" cy="19" r="9.2" fill="none" stroke="#fff" stroke-width="3.6"/><path d="M23.6 23.6 30 30" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><path d="M13.6 17.2c1.6-1.1 3.4-1.7 5.4-1.7s3.8.6 5.4 1.7" stroke="#9EA8FF" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`;

/* ---------------- utilities ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DAY = 86400000;
const NOW = Date.now();
function hash32(str){ let h = 2166136261; for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed){ let s = typeof seed === 'number' ? seed : hash32(String(seed)); return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hexOf(seed, len){ const r = rng(seed); let s = ''; for (let i = 0; i < len; i++) s += '0123456789abcdef'[Math.floor(r() * 16)]; return s; }
function txHash(seed){ return '0x' + hexOf('tx' + seed, 64); }
function shortHash(h){ return h.slice(0, 8) + '…' + h.slice(-6); }
function uid(p){ return p + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(); }

/* ---------------- store ---------------- */
const STORE_KEY = 'quest-demo-v1';
const App = {
  state: null, ui: {}, timers: [],
  load(){
    let saved = null;
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) saved = JSON.parse(raw); } catch (e) { saved = null; }
    if (saved && saved.v === SEED_VERSION) this.state = saved;
    else this.state = makeSeed();
    if (!this.state.lang){
      const nav = (navigator.language || 'ko').toLowerCase();
      this.state.lang = nav.startsWith('ko') ? 'ko' : 'en';
    }
  },
  save(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); } catch (e) { /* storage unavailable: demo keeps running in memory */ } },
  reset(){ const lang = this.state.lang, theme = this.state.theme; this.state = makeSeed(); this.state.lang = lang; this.state.theme = theme; this.save(); },
  clearTimers(){ this.timers.forEach(t => { clearInterval(t); clearTimeout(t); }); this.timers = []; },
  every(ms, fn){ const t = setInterval(fn, ms); this.timers.push(t); return t; },
  later(ms, fn){ const t = setTimeout(fn, ms); this.timers.push(t); return t; }
};

/* ---------------- i18n & format ---------------- */
const isKo = () => App.state.lang === 'ko';
function tt(ko, en){ return isKo() ? ko : en; }
function L(o){ if (o && typeof o === 'object' && ('ko' in o || 'en' in o)) return isKo() ? (o.ko ?? o.en) : (o.en ?? o.ko); return o; }
function won(n, opt){
  n = Math.round(n || 0);
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (isKo()){
    if (n >= 1e8){ const eok = Math.floor(n / 1e8), man = Math.round((n % 1e8) / 1e4); s = eok.toLocaleString('ko-KR') + '억' + (man ? ' ' + man.toLocaleString('ko-KR') + '만' : '') + ' 원'; }
    else if (n >= 1e4 && n % 1e4 === 0){ s = (n / 1e4).toLocaleString('ko-KR') + '만 원'; }
    else if (n >= 1e6){ s = Math.round(n / 1e4).toLocaleString('ko-KR') + '만 원'; }
    else if (n >= 1e5){ s = (n / 1e4).toLocaleString('ko-KR', {maximumFractionDigits:1}) + '만 원'; }
    else s = n.toLocaleString('ko-KR') + '원';
    if (opt === 'full') s = n.toLocaleString('ko-KR') + '원';
  } else {
    if (opt === 'full') s = '₩' + n.toLocaleString('en-US');
    else if (n >= 1e9) s = '₩' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    else if (n >= 1e6) s = '₩' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    else if (n >= 1e4) s = '₩' + (n / 1e3).toFixed(0) + 'K';
    else s = '₩' + n.toLocaleString('en-US');
  }
  return (neg ? '−' : '') + s;
}
function shortWon(n){
  n = Math.round(n || 0);
  if (isKo()){ if (n >= 1e8) return (n / 1e8).toLocaleString('ko-KR', {maximumFractionDigits:1}) + '억'; if (n >= 1e4) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만'; return n.toLocaleString('ko-KR'); }
  if (n >= 1e9) return '₩' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'; if (n >= 1e6) return '₩' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (n >= 1e3) return '₩' + Math.round(n / 1e3) + 'K'; return '₩' + n;
}
function niceScale(v, target){ target = target || 4; if (v <= 0) return { max: 1, step: 1, ticks: 1 }; const raw = v / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; const max = Math.ceil(v / step) * step; return { max, step, ticks: Math.round(max / step) }; }
function usd(n){ const v = n / 1400; if (v >= 1e6) return '≈ $' + (v / 1e6).toFixed(2) + 'M'; if (v >= 1e3) return '≈ $' + (v / 1e3).toFixed(1) + 'K'; return '≈ $' + v.toFixed(0); }
function wonHint(n){ return isKo() ? '' : `<span class="caption"> ${usd(n)}</span>`; }
function fmtDate(ts, style){
  const d = new Date(ts);
  if (style === 'full') return d.toLocaleDateString(isKo() ? 'ko-KR' : 'en-US', {year:'numeric', month:'short', day:'numeric'});
  if (style === 'time') return d.toLocaleTimeString(isKo() ? 'ko-KR' : 'en-US', {hour:'numeric', minute:'2-digit'});
  if (style === 'dt') return d.toLocaleDateString(isKo() ? 'ko-KR' : 'en-US', {month:'short', day:'numeric'}) + ' ' + d.toLocaleTimeString(isKo() ? 'ko-KR' : 'en-US', {hour:'numeric', minute:'2-digit'});
  return d.toLocaleDateString(isKo() ? 'ko-KR' : 'en-US', {month:'short', day:'numeric', weekday:'short'});
}
function ago(ts){
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return tt('방금', 'just now');
  const m = Math.round(s / 60); if (m < 60) return tt(`${m}분 전`, `${m}m ago`);
  const h = Math.round(m / 60); if (h < 24) return tt(`${h}시간 전`, `${h}h ago`);
  const d = Math.round(h / 24); return tt(`${d}일 전`, `${d}d ago`);
}
function dday(ts){ const d = Math.ceil((ts - Date.now()) / DAY); if (d > 0) return 'D-' + d; if (d === 0) return 'D-Day'; return 'D+' + (-d); }
function num(n){ return Number(n).toLocaleString(isKo() ? 'ko-KR' : 'en-US'); }

/* ---------------- veil avatar (identicon for anonymous parties) ---------------- */
const VEIL_HUES = [[58, 79, 240], [14, 159, 110], [235, 104, 52], [124, 92, 255], [42, 120, 214], [218, 83, 129], [201, 133, 0], [27, 175, 122]];
function veil(seed, cls){
  const r = rng('veil:' + seed);
  const [cr, cg, cb] = VEIL_HUES[Math.floor(r() * VEIL_HUES.length)];
  const fg = `rgb(${cr},${cg},${cb})`, bg = `rgba(${cr},${cg},${cb},.14)`;
  let cells = '';
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++){
    if (r() > 0.52){
      const px = 4 + x * 6.4, py = 4 + y * 6.4;
      cells += `<rect x="${px}" y="${py}" width="6" height="6" rx="1.6" fill="${fg}"/>`;
      if (x < 2) cells += `<rect x="${4 + (4 - x) * 6.4}" y="${py}" width="6" height="6" rx="1.6" fill="${fg}"/>`;
    }
  }
  return `<svg class="veil ${cls||''}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="${bg}"/>${cells}</svg>`;
}

/* ---------------- router ---------------- */
const Routes = [];
function route(pattern, view, opts){ const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$'); Routes.push({ pattern, re, keys, view, opts: opts || {} }); }
function currentPath(){ const h = location.hash.replace(/^#/, ''); return h || '/login'; }
function parsePath(p){ const [path, qs] = p.split('?'); const q = {}; (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); }); return { path, q }; }
App.go = function(p, replace){ if (replace) location.replace('#' + p); else location.hash = p; };
App.back = function(fallback){ if (history.length > 1 && App.ui.navCount > 0){ history.back(); } else App.go(fallback || (App.state.session && App.state.session.role === 'admin' ? '/a/dashboard' : '/u/home'), true); };
App.ui.navCount = 0;

App.render = function(){
  App.clearTimers();
  closeLayer(true);
  const { path, q } = parsePath(currentPath());
  const sess = App.state.session;
  if (path.startsWith('/u/') && (!sess || sess.role !== 'user')) return App.go('/login', true);
  if (path.startsWith('/a/') && (!sess || sess.role !== 'admin')) return App.go('/login?role=admin', true);
  if (path === '/login' && sess) return App.go(sess.role === 'admin' ? '/a/dashboard' : '/u/home', true);
  let found = null, params = {};
  for (const r of Routes){ const m = path.match(r.re); if (m){ found = r; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); break; } }
  if (!found) return App.go(sess ? (sess.role === 'admin' ? '/a/dashboard' : '/u/home') : '/login', true);
  document.documentElement.lang = App.state.lang;
  const out = found.view(params, q) || {};
  const root = $('#app');
  root.className = (sess && sess.role === 'user' && sess.mode === 'supplier') ? 'mode-supplier' : '';
  if (path.startsWith('/a/')) root.innerHTML = AdminLayout(out, path);
  else if (path.startsWith('/u/')) root.innerHTML = UserLayout(out, path);
  else root.innerHTML = out.html;
  window.scrollTo(0, App.ui.keepScroll ? App.ui.keepScroll : 0);
  App.ui.keepScroll = 0;
  if (out.mount) try { out.mount(); } catch (e) { console.error(e); }
  bindTopbarShadow();
  nativeStatusBar();
};
/* re-render current view without resetting scroll */
App.refresh = function(){ App.ui.keepScroll = window.scrollY; App.render(); };

window.addEventListener('hashchange', () => { App.ui.navCount++; App.render(); });

function bindTopbarShadow(){
  const tb = $('.topbar, .a-top'); if (!tb) return;
  const on = () => tb.classList.toggle('scrolled', window.scrollY > 4);
  window.onscroll = on; on();
}

/* ---------------- theme ---------------- */
function applyTheme(){
  const t = App.state.theme || 'system';
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
function isDark(){ const t = App.state.theme || 'system'; return t === 'dark' || (t === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }

/* ---------------- native bridge (Android WebView) ---------------- */
const Native = window.QuestNative || null;
function haptic(kind){ try { if (Native && Native.haptic) Native.haptic(kind || 'light'); else if (navigator.vibrate) navigator.vibrate(kind === 'success' ? [8, 40, 12] : 8); } catch (e) {} }
function nativeStatusBar(){
  try {
    if (!Native || !Native.setStatusBar) return;
    const sess = App.state.session; const path = parsePath(currentPath()).path;
    const adminLogin = path === '/login' && parsePath(currentPath()).q.role === 'admin';
    const dark = isDark();
    if (adminLogin) Native.setStatusBar('#151A30', false);
    else Native.setStatusBar(dark ? '#0E1020' : '#F4F5FA', !dark);
  } catch (e) {}
}
function shareText(text){
  try { if (Native && Native.share){ Native.share(text); return; } } catch (e) {}
  if (navigator.share) navigator.share({ text }).catch(() => {});
  else copyText(text);
}
function copyText(text){
  try { if (Native && Native.copy){ Native.copy(text); toast(tt('복사했습니다', 'Copied'), 'ok'); return; } } catch (e) {}
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast(tt('복사했습니다', 'Copied'), 'ok')).catch(() => toast(tt('복사했습니다', 'Copied'), 'ok'));
  else toast(tt('복사했습니다', 'Copied'), 'ok');
}

/* Android back button: returns true if handled */
window.__questBack = function(){
  if (App.ui.layerOpen){ closeLayer(); return true; }
  if (App.ui.drawer){ toggleDrawer(false); return true; }
  const { path } = parsePath(currentPath());
  const roots = ['/login', '/u/home', '/a/dashboard'];
  if (roots.includes(path)) return false;
  const tabRoots = ['/u/quests', '/u/wallet', '/u/me', '/u/services', '/u/market'];
  if (tabRoots.includes(path)){ App.go('/u/home'); return true; }
  App.back(); return true;
};

/* ---------------- layer: sheet / modal / toast ---------------- */
function layer(){ let l = $('#layer'); if (!l){ l = document.createElement('div'); l.id = 'layer'; document.body.appendChild(l); } return l; }
function openSheet(html, opts){
  opts = opts || {};
  const l = layer(); l.innerHTML = `<div class="scrim" data-act="layer-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  App.ui.layerOpen = true; App.ui.layerOnClose = opts.onClose || null;
  requestAnimationFrame(() => { l.querySelector('.scrim').classList.add('show'); l.querySelector('.sheet').classList.add('show'); });
  if (opts.mount) setTimeout(() => opts.mount(l.querySelector('.sheet')), 20);
  return l.querySelector('.sheet');
}
function sheetBody(html){ const s = $('#layer .sheet'); if (s){ s.innerHTML = '<div class="grab"></div>' + html; } }
function closeLayer(instant){
  const l = $('#layer'); if (!l || !App.ui.layerOpen){ if (l && instant) l.innerHTML = ''; return; }
  App.ui.layerOpen = false;
  const cb = App.ui.layerOnClose; App.ui.layerOnClose = null;
  if (instant){ l.innerHTML = ''; return; }
  const sc = l.querySelector('.scrim'), sh = l.querySelector('.sheet, .modal');
  if (sc) sc.classList.remove('show'); if (sh) sh.classList.remove('show');
  setTimeout(() => { if (!App.ui.layerOpen) l.innerHTML = ''; }, 260);
  if (cb) cb();
}
function confirmBox(o){
  return new Promise(res => {
    const l = layer();
    l.innerHTML = `<div class="scrim"></div><div class="modal" role="alertdialog" aria-modal="true"><div class="m-title">${o.title}</div>${o.body ? `<div class="m-body">${o.body}</div>` : ''}<div class="m-actions">${o.cancel === false ? '' : `<button class="btn btn-gray" id="m-no">${o.cancel || tt('취소', 'Cancel')}</button>`}<button class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" id="m-ok">${o.ok || tt('확인', 'OK')}</button></div></div>`;
    App.ui.layerOpen = true; App.ui.layerOnClose = () => res(false);
    requestAnimationFrame(() => { l.querySelector('.scrim').classList.add('show'); l.querySelector('.modal').classList.add('show'); });
    const done = v => { App.ui.layerOnClose = null; closeLayer(); res(v); };
    l.querySelector('#m-ok').onclick = () => done(true);
    const no = l.querySelector('#m-no'); if (no) no.onclick = () => done(false);
    l.querySelector('.scrim').onclick = () => done(false);
  });
}
function toast(msg, kind){
  let box = $('#toasts'); if (!box){ box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const noTabs = !$('.tabbar'); box.style.bottom = noTabs ? 'calc(96px + env(safe-area-inset-bottom,0px))' : '';
  const el = document.createElement('div'); el.className = 'toast ' + (kind || '');
  el.innerHTML = (kind === 'ok' ? ic('check') : kind === 'warn' ? ic('alert') : ic('info')) + `<span>${msg}</span>`;
  box.appendChild(el);
  if (kind === 'ok') haptic('success');
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 2600);
}
async function withLoading(btn, ms, fn){ if (btn){ btn.classList.add('loading'); btn.dataset.label = btn.innerHTML; } await sleep(ms); if (btn){ btn.classList.remove('loading'); } return fn ? fn() : null; }

/* ---------------- event delegation ---------------- */
const ACT = {};
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go && !e.target.closest('[data-act]')){ e.preventDefault(); haptic('light'); App.go(go.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const fn = ACT[a.dataset.act];
  if (fn){ e.preventDefault(); fn(a, e); }
});
document.addEventListener('input', e => { const a = e.target.closest('[data-in]'); if (a && ACT[a.dataset.in]) ACT[a.dataset.in](a, e); });
document.addEventListener('change', e => { const a = e.target.closest('[data-ch]'); if (a && ACT[a.dataset.ch]) ACT[a.dataset.ch](a, e); });
ACT['layer-close'] = () => closeLayer();
ACT['back'] = el => App.back(el.dataset.fallback);
ACT['copy'] = el => copyText(el.dataset.text);
ACT['lang'] = el => { App.state.lang = el.dataset.v; App.save(); App.refresh(); };

/* ---------------- charts ---------------- */
function chartTip(wrap){ let t = wrap.querySelector('.tip'); if (!t){ t = document.createElement('div'); t.className = 'tip'; wrap.appendChild(t); } return t; }
function lineChart(el, o){
  if (!el) return;
  const W = Math.max(280, Math.round(el.clientWidth || 640)), H = o.h || 220, pl = 46, pr = 12, pt = 14, pb = 26;
  const all = o.series.flatMap(s => s.values);
  const sc = niceScale(Math.max(...all) * 1.04), max = sc.max, iw = W - pl - pr, ih = H - pt - pb;
  const n = o.labels.length;
  const x = i => pl + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => pt + ih - (v / max) * ih;
  let g = '';
  for (let i = 0; i <= sc.ticks; i++){ const v = sc.step * i; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${o.tick ? o.tick(v) : v}</text>`; }
  const step = Math.ceil(n / Math.max(3, Math.floor(iw / 70)));
  o.labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)">${l}</text>`; });
  o.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    if (si === 0 && o.area !== false) g += `<polygon points="${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}" fill="${s.color}" opacity=".10"/>`;
    g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    const li = n - 1; g += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4.5" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
  });
  g += `<line class="xh" x1="0" x2="0" y1="${pt}" y2="${pt + ih}" stroke="var(--line-2)" stroke-width="1" opacity="0"/>`;
  o.series.forEach((s, si) => g += `<circle class="xd${si}" r="4.5" fill="${s.color}" stroke="var(--surface)" stroke-width="2" opacity="0"/>`);
  g += `<rect x="${pl}" y="${pt}" width="${iw}" height="${ih}" fill="transparent" class="hit"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${g}</svg>` + (o.series.length > 1 ? `<div class="legend">${o.series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>` : '');
  const svg = el.querySelector('svg'), tip = chartTip(el), hit = svg.querySelector('.hit'), xh = svg.querySelector('.xh');
  const move = ev => {
    const r = svg.getBoundingClientRect(); const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (W / r.width);
    const i = clamp(Math.round(((px - pl) / iw) * (n - 1)), 0, n - 1);
    xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('opacity', 1);
    o.series.forEach((s, si) => { const d = svg.querySelector('.xd' + si); d.setAttribute('cx', x(i)); d.setAttribute('cy', y(s.values[i])); d.setAttribute('opacity', 1); });
    tip.innerHTML = `${o.labels[i]} · ` + o.series.map(s => `${o.series.length > 1 ? s.name + ' ' : ''}${o.fmt ? o.fmt(s.values[i]) : s.values[i]}`).join(' / ');
    tip.style.left = (x(i) / W * r.width) + 'px'; tip.style.top = (y(o.series[0].values[i]) / H * r.height) + 'px'; tip.classList.add('show');
  };
  const leave = () => { tip.classList.remove('show'); xh.setAttribute('opacity', 0); o.series.forEach((s, si) => svg.querySelector('.xd' + si).setAttribute('opacity', 0)); };
  hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move, {passive:true}); hit.addEventListener('touchmove', move, {passive:true});
  hit.addEventListener('mouseleave', leave); hit.addEventListener('touchend', () => setTimeout(leave, 1200));
}
function barChart(el, o){
  if (!el) return;
  const W = Math.max(280, Math.round(el.clientWidth || 640)), H = o.h || 220, pl = o.pl || 46, pr = 12, pt = 22, pb = 28;
  const sc = niceScale(Math.max(...o.values) * 1.12), max = sc.max, iw = W - pl - pr, ih = H - pt - pb, n = o.values.length;
  const bw = Math.min(46, (iw / n) * 0.62);
  const y = v => pt + ih - (v / max) * ih;
  let g = '';
  for (let i = 0; i <= sc.ticks; i++){ const v = sc.step * i; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${o.tick ? o.tick(v) : v}</text>`; }
  o.values.forEach((v, i) => {
    const cx = pl + (iw / n) * (i + 0.5), top = y(v), h = y(0) - top, x0 = cx - bw / 2, r = Math.min(4, h);
    const col = (o.colors && o.colors[i]) || o.color || 'var(--s1)';
    g += `<g class="bar-g" data-i="${i}"><rect x="${cx - (iw / n) / 2}" y="${pt}" width="${iw / n}" height="${ih}" fill="transparent"/><path d="M${x0},${y(0)} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + bw - r} Q${x0 + bw},${top} ${x0 + bw},${top + r} V${y(0)} Z" fill="${col}"/>`;
    if (o.showVals) g += `<text x="${cx}" y="${top - 6}" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--ink)">${o.fmt ? o.fmt(v) : v}</text>`;
    g += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)">${o.labels[i]}</text></g>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${g}</svg>`;
  const tip = chartTip(el), svg = el.querySelector('svg');
  $$('.bar-g', svg).forEach(b => {
    const show = () => { const i = +b.dataset.i, r = svg.getBoundingClientRect(); const cx = pl + (iw / n) * (i + 0.5); tip.textContent = `${o.labels[i]} · ${o.fmt ? o.fmt(o.values[i]) : o.values[i]}`; tip.style.left = (cx / W * r.width) + 'px'; tip.style.top = (y(o.values[i]) / H * r.height) + 'px'; tip.classList.add('show'); };
    b.addEventListener('mouseenter', show); b.addEventListener('touchstart', show, {passive:true}); b.addEventListener('mouseleave', () => tip.classList.remove('show'));
  });
}
function niceMax(v){ if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; const s = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10; return s * p; }
function gaugeSvg(score){
  const s = clamp(score, 0, 100);
  const col = s <= 30 ? 'var(--good)' : s <= 60 ? 'var(--warn)' : 'var(--bad)';
  const a = Math.PI * (1 - s / 100);
  const cx = 90, cy = 92, r = 76;
  const ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a);
  const large = 0;
  return `<svg viewBox="0 0 180 104"><path d="M14 92 A76 76 0 0 1 166 92" fill="none" stroke="var(--surface-3)" stroke-width="14" stroke-linecap="round"/>${s > 0 ? `<path d="M14 92 A76 76 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" style="transition:all .5s"/>` : ''}</svg>`;
}
function riskLabel(s){ return s <= 30 ? { t: tt('낮음', 'Low'), c: 'var(--good)' } : s <= 60 ? { t: tt('주의', 'Moderate'), c: 'var(--warn)' } : { t: tt('높음', 'High'), c: 'var(--bad)' }; }

/* ---------------- common bits ---------------- */
const STATUS = {
  draft:   { ko:'작성 중', en:'Draft', cls:'st-draft' },
  open:    { ko:'제안 받는 중', en:'Receiving bids', cls:'st-open' },
  progress:{ ko:'수행 중', en:'In progress', cls:'st-progress' },
  review:  { ko:'검수 중', en:'In review', cls:'st-review' },
  dispute: { ko:'재검수 중', en:'Under re-review', cls:'st-dispute' },
  done:    { ko:'완료', en:'Completed', cls:'st-done' },
  hold:    { ko:'게시 보류', en:'On hold', cls:'st-dispute' }
};
function statusPill(s){ const d = STATUS[s] || STATUS.draft; return `<span class="pill ${d.cls}">${L(d)}</span>`; }
function emptyState(icon, title, sub){ return `<div class="empty">${ic(icon)}<b>${title}</b>${sub ? `<div class="body-s">${sub}</div>` : ''}</div>`; }
function addNotif(n){ App.state.notifs.unshift(Object.assign({ id: uid('N'), ts: Date.now(), read: false }, n)); }
function addChain(q, ev){
  const rec = { ev, ts: Date.now(), tx: txHash(q.id + ev.en + Date.now()), block: App.state.chainHeight++ };
  q.records = q.records || []; q.records.push(rec);
  App.state.admin.pendingAnchors = (App.state.admin.pendingAnchors || 0) + 1;
  return rec;
}
