/*
 * Settlement relayer tests against a local anvil chain (Foundry). Run: npm test
 * Needs `anvil` on PATH or ANVIL_BIN=/path/to/anvil; the chain tests are skipped otherwise.
 * The fallback test (no key -> disabled, mock mode) always runs.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicClient, createWalletClient, http, defineChain, stringToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { compile } from '../scripts/compile.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANVIL = process.env.ANVIL_BIN || 'anvil';
const hasAnvil = spawnSync(ANVIL, ['--version']).status === 0;
// anvil's well-known dev accounts (public test keys, funded only on the local chain)
const OPERATOR_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const OTHER_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const RPC_PORT = 18545, APP_PORT = 18766, OFF_PORT = 18767;
const children = [];

function start(cmd, args, env, ready){
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: ROOT, env: Object.assign({}, process.env, env), stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(p);
    let log = '';
    const on = d => { log += d; if (ready.test(log)) resolve(p); };
    p.stdout.on('data', on); p.stderr.on('data', on);
    p.on('exit', c => reject(new Error(`${cmd} exited ${c}: ${log}`)));
    setTimeout(() => reject(new Error(`${cmd} not ready: ${log}`)), 20000);
  });
}
const api = (port, p, opt) => fetch(`http://127.0.0.1:${port}${p}`, opt).then(async r => ({ status: r.status, body: await r.json() }));
const post = (port, p, body, headers) => api(port, p, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: JSON.stringify(body) });
async function confirmed(port, hash){
  for (let i = 0; i < 40; i++){ const r = await api(port, '/api/settle/tx/' + hash); if (r.body.status !== 'pending') return r.body; await new Promise(r => setTimeout(r, 250)); }
  throw new Error('tx never confirmed ' + hash);
}

let contract;
const chain = defineChain({ id: 31337, name: 'anvil', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [`http://127.0.0.1:${RPC_PORT}`] } } });
const pub = createPublicClient({ chain, transport: http() });
const art = compile();

before(async () => {
  await start(process.execPath, ['server.js'], { PORT: String(OFF_PORT), HOST: '127.0.0.1', SETTLEMENT_PRIVATE_KEY: '' }, /listening/);
  if (!hasAnvil) return;
  await start(ANVIL, ['--port', String(RPC_PORT), '--block-time', '1'], {}, /Listening on/);
  for (let i = 0; i < 50; i++){ try { await pub.getChainId(); break; } catch (e) { await new Promise(r => setTimeout(r, 200)); } }
  const w = createWalletClient({ chain, transport: http(), account: privateKeyToAccount(OPERATOR_PK) });
  const hash = await w.deployContract({ abi: art.abi, bytecode: art.bytecode, args: [w.account.address] });
  contract = (await pub.waitForTransactionReceipt({ hash })).contractAddress;
  await start(process.execPath, ['server.js'], {
    PORT: String(APP_PORT), HOST: '127.0.0.1', SETTLEMENT_PRIVATE_KEY: OPERATOR_PK, SETTLEMENT_CONTRACT: contract,
    SETTLEMENT_CHAIN_ID: '31337', SETTLEMENT_RPC_URL: `http://127.0.0.1:${RPC_PORT}`, SETTLE_IP_WRITES: '20'
  }, /Settlement: on/);
});
after(() => { for (const c of children) c.kill(); });

test('fallback: without a key settlement is disabled and the app still serves', async () => {
  const h = await api(OFF_PORT, '/healthz'); assert.equal(h.status, 200); assert.equal(h.body.ok, true);
  const c = await api(OFF_PORT, '/api/settle/config'); assert.equal(c.status, 200); assert.equal(c.body.enabled, false); assert.equal(c.body.reason, 'no-key'); assert.equal(c.body.chainId, 84532);
  const d = await post(OFF_PORT, '/api/settle/deposit', { questId: 'Q-1', amount: 1000 }); assert.equal(d.status, 503);
  const page = await fetch(`http://127.0.0.1:${OFF_PORT}/`); assert.equal(page.status, 200);
  assert.equal((await fetch(`http://127.0.0.1:${OFF_PORT}/index.html`, { method: 'POST' })).status, 405);
});

test('deposit then release writes real transactions and state', { skip: !hasAnvil && 'anvil not found' }, async () => {
  const cfg = await api(APP_PORT, '/api/settle/config');
  assert.equal(cfg.body.enabled, true); assert.equal(cfg.body.contract, contract);
  const key = 'Q-2026-0415.TEST01';
  const doc = '0x' + 'ab'.repeat(32);
  const d = await post(APP_PORT, '/api/settle/deposit', { questId: key, amount: 14000000, docHash: doc });
  assert.equal(d.status, 202, JSON.stringify(d.body)); assert.match(d.body.deposit.hash, /^0x[0-9a-f]{64}$/);
  const dc = await confirmed(APP_PORT, d.body.deposit.hash); assert.equal(dc.status, 'confirmed'); assert.ok(dc.blockNumber > 0);
  let s = await api(APP_PORT, '/api/settle/' + key);
  assert.equal(s.body.status, 'deposited'); assert.equal(s.body.amountKrw, 14000000); assert.equal(s.body.depositDoc, doc);
  assert.equal((await post(APP_PORT, '/api/settle/deposit', { questId: key, amount: 14000000 })).status, 409, 'double deposit refused');
  const r = await post(APP_PORT, '/api/settle/release', { questId: key });
  assert.equal(r.status, 202); assert.equal(r.body.deposit, undefined);
  assert.equal((await confirmed(APP_PORT, r.body.release.hash)).status, 'confirmed');
  s = await api(APP_PORT, '/api/settle/' + key); assert.equal(s.body.status, 'released'); assert.ok(s.body.releasedAt >= s.body.depositedAt);
  assert.equal((await post(APP_PORT, '/api/settle/release', { questId: key })).status, 409, 'double release refused');
});

test('release backfills the deposit for quests funded before settlement was on', { skip: !hasAnvil && 'anvil not found' }, async () => {
  const key = 'Q-2026-0412.TEST01';
  assert.equal((await post(APP_PORT, '/api/settle/release', { questId: key })).status, 409, 'no deposit and no amount');
  const r = await post(APP_PORT, '/api/settle/release', { questId: key, amount: 20000000 });
  assert.equal(r.status, 202); assert.ok(r.body.deposit.hash); assert.ok(r.body.release.hash);
  assert.equal((await confirmed(APP_PORT, r.body.deposit.hash)).status, 'confirmed');
  assert.equal((await confirmed(APP_PORT, r.body.release.hash)).status, 'confirmed');
  const s = await api(APP_PORT, '/api/settle/' + key); assert.equal(s.body.status, 'released'); assert.equal(s.body.amountKrw, 20000000);
});

test('input validation and origin check', { skip: !hasAnvil && 'anvil not found' }, async () => {
  for (const b of [{ questId: 'bad id!', amount: 1 }, { questId: 'x'.repeat(33), amount: 1 }, { questId: 'Q-1', amount: 0 }, { questId: 'Q-1', amount: 1.5 }, { questId: 'Q-1', amount: 1e13 }, { questId: 'Q-1', amount: 5, docHash: '0x12' }]){
    assert.equal((await post(APP_PORT, '/api/settle/deposit', b)).status, 400, JSON.stringify(b));
  }
  assert.equal((await post(APP_PORT, '/api/settle/deposit', { questId: 'Q-1', amount: 5 }, { Origin: 'https://evil.example' })).status, 403);
  const txt = await fetch(`http://127.0.0.1:${APP_PORT}/api/settle/deposit`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
  assert.equal(txt.status, 415);
  assert.equal((await api(APP_PORT, '/api/settle/tx/0x1234')).status, 400);
  assert.equal((await api(APP_PORT, '/api/settle/nope!')).status, 400);
});

test('per-IP write rate limit', { skip: !hasAnvil && 'anvil not found' }, async () => {
  let limited = false;
  for (let i = 0; i < 25 && !limited; i++){ const r = await post(APP_PORT, '/api/settle/deposit', { questId: 'bad id', amount: 1 }); limited = r.status === 429; }
  assert.ok(limited, 'expected a 429 after SETTLE_IP_WRITES writes');
});

test('contract: only the operator can write; state machine holds', { skip: !hasAnvil && 'anvil not found' }, async () => {
  const other = createWalletClient({ chain, transport: http(), account: privateKeyToAccount(OTHER_PK) });
  const q = stringToHex('Q-X.TEST', { size: 32 });
  await assert.rejects(pub.simulateContract({ address: contract, abi: art.abi, functionName: 'deposit', args: [q, 1n, '0x' + '00'.repeat(32)], account: other.account }), /NotOperator/);
  const op = privateKeyToAccount(OPERATOR_PK);
  await assert.rejects(pub.simulateContract({ address: contract, abi: art.abi, functionName: 'release', args: [q, '0x' + '00'.repeat(32)], account: op }), /WrongStatus/);
  await assert.rejects(pub.simulateContract({ address: contract, abi: art.abi, functionName: 'deposit', args: [q, 0n, '0x' + '00'.repeat(32)], account: op }), /InvalidAmount/);
  assert.equal((await pub.readContract({ address: contract, abi: art.abi, functionName: 'operator' })).toLowerCase(), op.address.toLowerCase());
});
