#!/usr/bin/env node
/*
 * Publish QuestSettlement's source on Sourcify (no API key) for the address in settlement.json.
 * Sourcify recompiles with the same solc version and settings as compile.mjs and checks the result
 * against the deployed bytecode. Blockscout reads Sourcify directly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://sourcify.dev/server';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'settlement.json'), 'utf8'));
if (!cfg.address) { console.error('settlement.json has no address; run npm run deploy first'); process.exit(1); }

const solc = require('solc');
const stdJsonInput = {
  language: 'Solidity',
  sources: { 'QuestSettlement.sol': { content: fs.readFileSync(path.join(ROOT, 'contracts', 'QuestSettlement.sol'), 'utf8') } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'cancun', outputSelection: { '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata'] } } }
};
const compilerVersion = solc.version().replace(/\.Emscripten.*$/, '');

const res = await fetch(`${API}/v2/verify/${cfg.chainId}/${cfg.address}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stdJsonInput, compilerVersion, contractIdentifier: 'QuestSettlement.sol:QuestSettlement', creationTransactionHash: cfg.deployTx })
});
const body = await res.json().catch(() => ({}));
if (res.status === 409) { console.log('already verified'); }
else if (!res.ok) { console.error('submit failed', res.status, JSON.stringify(body)); process.exit(1); }
else {
  console.log('submitted, job', body.verificationId);
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const job = await fetch(`${API}/v2/verify/${body.verificationId}`).then(r => r.json());
    if (job.isJobCompleted) {
      if (job.error) { console.error('verification failed:', JSON.stringify(job.error)); process.exit(1); }
      console.log('match:', job.contract && (job.contract.match || job.contract.runtimeMatch));
      break;
    }
  }
}
console.log(`Sourcify:   https://repo.sourcify.dev/${cfg.chainId}/${cfg.address}`);
console.log(`Blockscout: https://base-sepolia.blockscout.com/address/${cfg.address}?tab=contract`);
