/* Quest demo — real testnet settlement.
   Escrow deposits and payment releases are written to the QuestSettlement contract on Base Sepolia
   through the server's relayer (/api/settle). When the server has no key, the relayer is unfunded,
   the app runs inside the APK, or a call fails, records keep their mock hashes exactly as before. */
'use strict';

const TX_RE = /^0x[0-9a-f]{64}$/i;
const Chain = {
  cfg: null, ready: null,
  off: !!window.QuestNative || location.hostname === 'appassets.androidplatform.net' || !/^https?:$/.test(location.protocol),
  init(){
    if (!this.ready) this.ready = this.off ? Promise.resolve(null) : fetch('/api/settle/config', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(c => (this.cfg = c)).catch(() => null);
    return this.ready;
  },
  on(){ return !!(this.cfg && this.cfg.enabled); },
  explorer(){ return (this.cfg && this.cfg.explorer) || 'https://sepolia.basescan.org'; },
  txUrl(hash){ return TX_RE.test(hash) ? this.explorer() + '/tx/' + hash : ''; },
  addrUrl(){ const a = this.cfg && this.cfg.contract; return /^0x[0-9a-fA-F]{40}$/.test(a || '') ? this.explorer() + '/address/' + a : ''; },
  /* Settlement key = quest id + a per-browser run id, so every demo run gets fresh on-chain slots
     (seed quest ids repeat across visitors and after "reset demo data"). Fits the contract's bytes32. */
  key(q){ if (!App.state.chainRun) App.state.chainRun = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0'); return q.id + '.' + App.state.chainRun; },
  async post(path, body){
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), 20000);
    try {
      const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'http-' + r.status);
      return j;
    } finally { clearTimeout(t); }
  }
};

async function sha256Hex(obj){
  try {
    if (!window.crypto || !crypto.subtle || typeof TextEncoder !== 'function') return undefined;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(obj)));
    return '0x' + Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { return undefined; }
}

function chainRecs(){ const out = []; (App.state.quests || []).forEach(q => (q.records || []).forEach(r => { if (r.real) out.push({ q, r }); })); return out; }
function chainRec(cid){ const hit = chainRecs().find(x => x.r.cid === cid); return hit ? hit.r : null; }

/* Mark a record as being written on-chain (spinner until the relayer answers). */
function chainStart(rec, key){ rec.cid = rec.cid || uid('C'); rec.real = { net: 'base-sepolia', key, status: 'sending' }; return rec; }
function chainAttach(rec, tx){
  rec.real.hash = tx.hash; rec.real.url = Chain.txUrl(tx.hash); rec.real.status = 'pending'; rec.real.mock = rec.tx;
  rec.tx = tx.hash; rec.block = null;
  chainWatch(rec.cid);
}
/* The call failed: go back to the mock record and remember why for the UI. */
function chainDrop(rec, err){ delete rec.real; rec.chainErr = String(err && err.message || err || 'error').slice(0, 40); }

function chainTag(rec){
  const r = rec.real; if (!r) return '';
  const S = { sending: ['st-review', tt('전송 중', 'Sending')], pending: ['st-review', tt('블록 대기', 'Pending')], confirmed: ['st-done', tt('확정', 'Confirmed')], failed: ['chain-fail', tt('실패', 'Failed')] }[r.status] || ['st-review', r.status];
  const spin = r.status === 'sending' || r.status === 'pending' ? '<span class="spinner"></span>' : '';
  const link = r.hash ? (r.url ? `<a class="hash" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${tt('BaseScan에서 보기', 'View on BaseScan')}">${shortHash(r.hash)}${ic('chev')}</a>` : `<span class="hash">${shortHash(r.hash)}</span>`) : '';
  return `<span class="chain-tag" data-chain-rec="${esc(rec.cid)}"><span class="pill plain ${S[0]}">${spin}${S[1]}</span>${link}<span class="caption">Base Sepolia${r.block ? ' · ' + tt('블록', 'Block') + ' #' + num(r.block) : ''}</span></span>`;
}
/* Re-render just the tags in place (works inside open sheets, where App.refresh would close them). */
function chainPaint(rec){ $$(`[data-chain-rec="${rec.cid}"]`).forEach(el => { el.outerHTML = chainTag(rec); }); }

const chainWatching = {};
function chainWatch(cid){
  if (chainWatching[cid]) return; chainWatching[cid] = true;
  let tries = 0;
  const tick = async () => {
    const rec = chainRec(cid);
    if (!rec || !rec.real || !rec.real.hash || rec.real.status === 'confirmed' || rec.real.status === 'failed'){ delete chainWatching[cid]; return; }
    try {
      const r = await fetch('/api/settle/tx/' + rec.real.hash, { cache: 'no-store' }).then(x => x.ok ? x.json() : null);
      if (r && r.status !== 'pending'){
        rec.real.status = r.status; rec.real.block = r.blockNumber || null; if (r.blockNumber) rec.block = r.blockNumber;
        App.save(); chainPaint(rec); delete chainWatching[cid];
        if (r.status === 'confirmed') toast(tt(`Base Sepolia에 기록됐습니다 · 블록 #${num(r.blockNumber)}`, `Recorded on Base Sepolia · block #${num(r.blockNumber)}`), 'ok');
        return;
      }
    } catch (e) { /* network hiccup: keep polling */ }
    if (++tries < 60) setTimeout(tick, tries < 10 ? 1500 : 4000); else delete chainWatching[cid];
  };
  setTimeout(tick, 1200);
}
/* After a reload, keep following transactions that were still pending. */
function chainResume(){ chainRecs().forEach(({ r }) => { if (r.real.status === 'sending') chainDrop(r, 'interrupted'); else if (r.real.status === 'pending') chainWatch(r.cid); }); }

/* Escrow deposit: called once the client has signed and funded. Resolves to the record (real or mock). */
async function chainDeposit(q, rec, amount, terms){
  await Chain.init(); if (!Chain.on()) return rec;
  const key = Chain.key(q); chainStart(rec, key);
  try {
    const out = await Chain.post('/api/settle/deposit', { questId: key, amount: Math.round(amount), docHash: await sha256Hex(terms) });
    chainAttach(rec, out.deposit);
  } catch (e) { chainDrop(rec, e); }
  App.save(); return rec;
}
/* Payment release. If this quest was funded before settlement was on (seed data), the server writes the
   deposit first; that real hash replaces the quest's latest mock escrow record. */
async function chainRelease(q, rec, amount, terms){
  await Chain.init(); if (!Chain.on()) return rec;
  const key = Chain.key(q); chainStart(rec, key);
  const esc0 = (q.records || []).slice().reverse().find(r => r.ev && r.ev.en === EV.escrow.en);
  App.save(); chainPaint(rec);
  try {
    const out = await Chain.post('/api/settle/release', { questId: key, amount: Math.round(amount), docHash: await sha256Hex(terms) });
    if (out.deposit && esc0 && !esc0.real){ chainStart(esc0, key); chainAttach(esc0, out.deposit); }
    chainAttach(rec, out.release);
    addNotif({ aud:'client', icon:'chain', tone:'violet', go:`/u/quest/${q.id}?tab=records`, t:{ ko:`${q.id} 지급 기록이 Base Sepolia에 남았습니다`, en:`${q.id} payout recorded on Base Sepolia` }, s:{ ko:`트랜잭션 ${shortHash(out.release.hash)}`, en:`Transaction ${shortHash(out.release.hash)}` } });
  } catch (e) { chainDrop(rec, e); }
  App.save(); chainPaint(rec); if (esc0) chainPaint(esc0);
  return rec;
}

/* Link to the contract's page on BaseScan: every deposit and release ever written, from any browser. */
function chainScanLink(){
  const u = Chain.addrUrl(); if (!u) return '';
  return `<a class="link-btn mt8" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ic('chain')}${tt('BaseScan에서 전체 온체인 기록 보기', 'View all on-chain records on BaseScan')}${ic('chev')}</a>`;
}

/* Small summary used by the quest records tab and the admin chain page. */
function chainNote(q){
  const n = (q.records || []).filter(r => r.real).length;
  if (n) return `<div class="ai-shield">${ic('chain')}<span>${tt(`결제 기록 ${n}건은 Base Sepolia 테스트넷에 실제 트랜잭션으로 남았습니다. 해시를 누르면 BaseScan에서 확인할 수 있습니다.`, `${n} payment record${n === 1 ? ' is a real transaction' : 's are real transactions'} on the Base Sepolia testnet. Tap a hash to open it on BaseScan.`)}</span></div>`;
  if ((q.records || []).some(r => r.chainErr)) return `<div class="ai-shield" style="background:var(--warn-soft);color:var(--warn)">${ic('alert')}<span>${tt('테스트넷 기록에 실패해 데모 기록으로 남겼습니다.', 'Testnet recording failed, so a demo record was kept instead.')}</span></div>`;
  return '';
}
