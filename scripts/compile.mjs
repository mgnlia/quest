#!/usr/bin/env node
/*
 * Compile contracts/QuestSettlement.sol with solc-js (pinned 0.8.28, optimizer on).
 * Run directly to write contracts/QuestSettlement.json (abi + bytecode); deploy.mjs imports compile().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'contracts', 'QuestSettlement.sol');
const OUT = path.join(ROOT, 'contracts', 'QuestSettlement.json');

export function compile(){
  const solc = require('solc');
  const input = {
    language: 'Solidity',
    sources: { 'QuestSettlement.sol': { content: fs.readFileSync(SRC, 'utf8') } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
      outputSelection: { '*': { QuestSettlement: ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } }
    }
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (out.errors || []).filter(e => e.severity === 'error');
  if (errors.length) throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  for (const w of out.errors || []) console.warn(w.formattedMessage);
  const c = out.contracts['QuestSettlement.sol'].QuestSettlement;
  return {
    contractName: 'QuestSettlement',
    compiler: 'solc ' + solc.version(),
    settings: { optimizer: input.settings.optimizer, evmVersion: input.settings.evmVersion },
    abi: c.abi,
    bytecode: '0x' + c.evm.bytecode.object,
    deployedBytecode: '0x' + c.evm.deployedBytecode.object
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  const art = compile();
  fs.writeFileSync(OUT, JSON.stringify(art, null, 2) + '\n');
  console.log(`compiled ${art.contractName} with ${art.compiler}: ${(art.deployedBytecode.length - 2) / 2} bytes runtime -> ${path.relative(ROOT, OUT)}`);
}
