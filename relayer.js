/*
 * Quest settlement relayer: writes escrow deposit / release records to the QuestSettlement
 * contract on Base Sepolia (testnet) and reads them back.
 *
 * Optional by design. Settlement is enabled only when all of these hold:
 *   - the `viem` package is installed,
 *   - SETTLEMENT_PRIVATE_KEY is set (env, or a local gitignored .env),
 *   - a contract address is known (settlement.json, or SETTLEMENT_CONTRACT),
 *   - the relayer wallet has some testnet ETH.
 * Otherwise every endpoint reports `enabled:false` and the app keeps its mock records.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* Local convenience: read KEY=value lines from ./.env without overriding real env vars. */
function loadDotEnv(file){
  let raw; try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { return; }
  for (const line of raw.split(/\r?\n/)){
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;    // settlement key: ASCII, fits in bytes32
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const MAX_KRW = 1e12;                                  // 1조 원: generous upper bound for a demo quest
const MIN_BALANCE_WEI = 20000000000000n;               // 0.00002 ETH: below this, report unfunded
const STATUS = ['none', 'deposited', 'released'];
const ABI_HUMAN = [
  'function operator() view returns (address)',
  'function settlements(bytes32) view returns (uint8 status, uint64 depositedAt, uint64 releasedAt, uint128 amountKrw, bytes32 depositDoc, bytes32 releaseDoc)',
  'function deposit(bytes32 questId, uint128 amountKrw, bytes32 docHash)',
  'function release(bytes32 questId, bytes32 docHash)',
  'event Deposited(bytes32 indexed questId, uint256 amountKrw, bytes32 docHash)',
  'event Released(bytes32 indexed questId, uint256 amountKrw, bytes32 docHash)'
];

class HttpError extends Error { constructor(status, code, msg){ super(msg || code); this.status = status; this.code = code; } }

function createRelayer(rootDir){
  loadDotEnv(path.join(rootDir, '.env'));
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(process.env.SETTLEMENT_CONFIG || path.join(rootDir, 'settlement.json'), 'utf8')); } catch (e) { cfg = {}; }
  const chainId = Number(process.env.SETTLEMENT_CHAIN_ID || cfg.chainId || 84532);
  const rpcUrl = process.env.SETTLEMENT_RPC_URL || cfg.rpcUrl || 'https://sepolia.base.org';
  const explorer = (process.env.SETTLEMENT_EXPLORER || cfg.explorer || 'https://sepolia.basescan.org').replace(/\/$/, '');
  const address = process.env.SETTLEMENT_CONTRACT || cfg.address || null;
  const pk = (process.env.SETTLEMENT_PRIVATE_KEY || '').trim();

  const base = { chainId, network: cfg.network || 'base-sepolia', explorer, contract: address };
  let reason = null, viem, account, pub, wallet, abi;
  if (!pk) reason = 'no-key';
  else if (!address) reason = 'no-contract';
  else if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) reason = 'bad-key';
  else {
    try { viem = require('viem'); } catch (e) { reason = 'viem-missing'; }
  }
  if (!reason){
    const { privateKeyToAccount } = require('viem/accounts');
    const chains = require('viem/chains');
    account = privateKeyToAccount(pk);
    const chain = chainId === 84532 ? chains.baseSepolia : viem.defineChain({ id: chainId, name: 'chain-' + chainId, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } });
    const transport = viem.http(rpcUrl, { timeout: 15000, retryCount: 1 });
    pub = viem.createPublicClient({ chain, transport });
    wallet = viem.createWalletClient({ chain, transport, account });
    abi = viem.parseAbi(ABI_HUMAN);
  }

  /* ---- balance (cached) ---- */
  let bal = { at: 0, wei: null };
  async function balance(){
    if (Date.now() - bal.at < 60000 && bal.wei !== null) return bal.wei;
    try { bal = { at: Date.now(), wei: await pub.getBalance({ address: account.address }) }; } catch (e) { if (bal.wei === null) throw e; }
    return bal.wei;
  }

  async function info(){
    if (reason) return Object.assign({ enabled: false, reason }, base);
    let wei = null; try { wei = await balance(); } catch (e) { return Object.assign({ enabled: false, reason: 'rpc-error', relayer: account.address }, base); }
    const funded = wei >= MIN_BALANCE_WEI;
    return Object.assign({ enabled: funded, reason: funded ? null : 'unfunded', relayer: account.address, balanceEth: viem.formatEther(wei) }, base);
  }

  /* ---- input checks ---- */
  function keyOf(v){ if (typeof v !== 'string' || !KEY_RE.test(v)) throw new HttpError(400, 'bad-quest-id'); return v; }
  function docOf(v, fallback){
    if (v === undefined || v === null || v === '') return '0x' + crypto.createHash('sha256').update(fallback).digest('hex');
    if (typeof v !== 'string' || !HASH_RE.test(v)) throw new HttpError(400, 'bad-doc-hash');
    return v.toLowerCase();
  }
  function amountOf(v){ if (!Number.isSafeInteger(v) || v < 1 || v > MAX_KRW) throw new HttpError(400, 'bad-amount'); return BigInt(v); }
  function k32(key){ return viem.stringToHex(key, { size: 32 }); }
  function ready(){ if (reason) throw new HttpError(503, 'disabled', reason); }

  /* ---- on-chain reads ---- */
  async function readRaw(key){
    const r = await pub.readContract({ address, abi, functionName: 'settlements', args: [k32(key)] });
    return { status: STATUS[Number(r[0])] || 'none', depositedAt: Number(r[1]), releasedAt: Number(r[2]), amountKrw: Number(r[3]), depositDoc: r[4], releaseDoc: r[5] };
  }
  async function read(key){ ready(); keyOf(key); return Object.assign({ questId: key, contract: address, chainId }, await readRaw(key)); }

  async function tx(hash){
    ready();
    if (typeof hash !== 'string' || !HASH_RE.test(hash)) throw new HttpError(400, 'bad-tx-hash');
    const rc = await pub.getTransactionReceipt({ hash }).catch(() => null);
    if (!rc) return { hash, status: 'pending', url: `${explorer}/tx/${hash}` };
    return { hash, status: rc.status === 'success' ? 'confirmed' : 'failed', blockNumber: Number(rc.blockNumber), url: `${explorer}/tx/${hash}` };
  }

  /* ---- writes: one at a time, with a locally tracked nonce ---- */
  let queue = Promise.resolve(), nonce = null;
  function serial(fn){ const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; }
  async function send(functionName, args, gas){
    if (nonce === null) nonce = await pub.getTransactionCount({ address: account.address, blockTag: 'pending' });
    try {
      const hash = await wallet.writeContract({ address, abi, functionName, args, nonce, gas });
      nonce++; bal.at = 0;
      return hash;
    } catch (e) { nonce = null; throw e; }
  }
  const view = hash => ({ hash, status: 'pending', url: `${explorer}/tx/${hash}` });

  async function deposit(body){
    ready();
    const key = keyOf(body.questId), amount = amountOf(body.amount);
    const doc = docOf(body.docHash, `quest-settlement:v1:deposit:${key}:${amount}`);
    if ((await info()).enabled !== true) throw new HttpError(503, 'unfunded');
    return serial(async () => {
      const cur = await readRaw(key);
      if (cur.status !== 'none') throw new HttpError(409, 'already-' + cur.status);
      const hash = await send('deposit', [k32(key), amount, doc], 150000n);
      return { questId: key, deposit: view(hash) };
    });
  }

  /* Release. Quests that were funded before settlement was switched on have no on-chain deposit yet;
     if the caller passes the amount, the deposit is written first (backfill), then the release. */
  async function release(body){
    ready();
    const key = keyOf(body.questId);
    const doc = docOf(body.docHash, `quest-settlement:v1:release:${key}`);
    const amount = body.amount === undefined ? null : amountOf(body.amount);
    if ((await info()).enabled !== true) throw new HttpError(503, 'unfunded');
    return serial(async () => {
      const cur = await readRaw(key);
      const out = { questId: key };
      if (cur.status === 'released') throw new HttpError(409, 'already-released');
      if (cur.status === 'none'){
        if (amount === null) throw new HttpError(409, 'not-deposited');
        const depDoc = docOf(body.depositDocHash, `quest-settlement:v1:deposit:${key}:${amount}`);
        out.deposit = view(await send('deposit', [k32(key), amount, depDoc], 150000n));
      }
      out.release = view(await send('release', [k32(key), doc], 100000n));
      return out;
    });
  }

  return { info, read, tx, deposit, release, get enabled(){ return !reason; } };
}

module.exports = { createRelayer, HttpError, ABI_HUMAN, loadDotEnv };
