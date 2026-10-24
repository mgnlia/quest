#!/usr/bin/env node
/*
 * Compile and deploy QuestSettlement, then record its address in settlement.json.
 *
 *   npm run deploy                         # Base Sepolia (chain 84532) via https://sepolia.base.org
 *   SETTLEMENT_RPC_URL=http://127.0.0.1:8545 SETTLEMENT_CONFIG=settlement.local.json npm run deploy   # local anvil
 *
 * Reads SETTLEMENT_PRIVATE_KEY from the environment or the local, gitignored .env.
 * The deployer becomes the contract's operator, so the same key must run the relayer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createPublicClient, createWalletClient, http, defineChain, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { compile } from './compile.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
require(path.join(ROOT, 'relayer.js')).loadDotEnv(path.join(ROOT, '.env'));

const pk = (process.env.SETTLEMENT_PRIVATE_KEY || '').trim();
if (!/^0x[0-9a-fA-F]{64}$/.test(pk)){ console.error('SETTLEMENT_PRIVATE_KEY is missing or malformed (env or .env).'); process.exit(1); }
const rpcUrl = process.env.SETTLEMENT_RPC_URL || 'https://sepolia.base.org';
const outFile = path.resolve(ROOT, process.env.SETTLEMENT_CONFIG || 'settlement.json');

const probe = createPublicClient({ transport: http(rpcUrl) });
const chainId = await probe.getChainId();
const chain = chainId === 84532 ? baseSepolia : defineChain({ id: chainId, name: 'chain-' + chainId, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } });
if (chainId === 8453 || chainId === 1){ console.error(`Refusing to deploy to mainnet (chain ${chainId}). This contract is for testnets.`); process.exit(1); }

const account = privateKeyToAccount(pk);
const pub = createPublicClient({ chain, transport: http(rpcUrl) });
const wallet = createWalletClient({ chain, transport: http(rpcUrl), account });

const bal = await pub.getBalance({ address: account.address });
console.log(`chain ${chainId} · deployer ${account.address} · balance ${formatEther(bal)} ETH`);
if (bal === 0n){
  console.error(`\nThe deployer has no ETH on chain ${chainId}. Fund ${account.address} from a Base Sepolia faucet`);
  console.error('(e.g. https://docs.base.org/tools/network-faucets) and run this again.');
  process.exit(2);
}

const art = compile();
fs.writeFileSync(path.join(ROOT, 'contracts', 'QuestSettlement.json'), JSON.stringify(art, null, 2) + '\n');
console.log(`compiled with ${art.compiler}`);

const hash = await wallet.deployContract({ abi: art.abi, bytecode: art.bytecode, args: [account.address] });
console.log(`deploy tx ${hash} · waiting for receipt…`);
const rc = await pub.waitForTransactionReceipt({ hash, timeout: 120000 });
if (rc.status !== 'success' || !rc.contractAddress){ console.error('deployment failed', rc.status); process.exit(1); }

const explorer = chainId === 84532 ? 'https://sepolia.basescan.org' : null;
const cfg = {
  network: chainId === 84532 ? 'base-sepolia' : 'chain-' + chainId,
  chainId,
  rpcUrl: chainId === 84532 ? 'https://sepolia.base.org' : rpcUrl,
  explorer,
  address: rc.contractAddress,
  operator: account.address,
  deployTx: hash,
  deployBlock: Number(rc.blockNumber),
  deployedAt: new Date().toISOString(),
  compiler: art.compiler
};
fs.writeFileSync(outFile, JSON.stringify(cfg, null, 2) + '\n');
console.log(`QuestSettlement at ${rc.contractAddress} (block ${rc.blockNumber}) -> ${path.relative(ROOT, outFile)}`);
if (explorer) console.log(`${explorer}/address/${rc.contractAddress}`);
