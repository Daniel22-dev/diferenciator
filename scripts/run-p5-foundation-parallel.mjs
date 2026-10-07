#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = path.resolve('.');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const foundationRoot = path.join(os.tmpdir(), `differentiator-garp27-foundation-${process.pid}`);
const evidenceSource = path.join(foundationRoot, 'audit', 'evidence', 'garp27-current');
const evidenceTarget = path.join(ROOT, 'audit', 'evidence', 'garp27-current');

function sync(cmd, args, cwd = ROOT) {
  const result = spawnSync(cmd, args, { cwd, env: process.env, encoding: 'utf8' });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${cmd} ${args.join(' ')} failed with exit ${result.status}`);
  }
  return (result.stdout || '').trim();
}

function run(name, cmd, args, cwd) {
  return new Promise((resolve) => {
    console.log(`[P5-PARALLEL] START ${name}`);
    const child = spawn(cmd, args, { cwd, env: process.env, stdio: 'inherit' });
    child.once('error', (error) => {
      console.error(`[P5-PARALLEL] ${name} spawn error:`, error);
      resolve(127);
    });
    child.once('close', (code, signal) => {
      const exit = Number.isInteger(code) ? code : 128;
      console.log(`[P5-PARALLEL] END ${name} exit=${exit}${signal ? ` signal=${signal}` : ''}`);
      resolve(exit);
    });
  });
}

async function runFoundation() {
  const install = await run(
    'foundation-npm-ci',
    npm,
    ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'],
    foundationRoot,
  );
  if (install !== 0) return install;
  return run('garp27-foundation', npm, ['run', 'qa:garp27:foundation'], foundationRoot);
}

function copyFoundationEvidence() {
  if (!fs.existsSync(evidenceSource)) return false;
  fs.rmSync(evidenceTarget, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(evidenceTarget), { recursive: true });
  fs.cpSync(evidenceSource, evidenceTarget, { recursive: true });
  return true;
}

let coreExit = 127;
let foundationExit = 127;
let sourceSha = '';
let evidenceCopied = false;

try {
  sourceSha = sync('git', ['rev-parse', 'HEAD']);
  if (!/^[0-9a-f]{40}$/i.test(sourceSha)) throw new Error('Unable to resolve exact source SHA.');
  if (process.env.GITHUB_SHA && process.env.GITHUB_SHA.toLowerCase() !== sourceSha.toLowerCase()) {
    throw new Error(`Checked-out HEAD ${sourceSha} does not match GITHUB_SHA ${process.env.GITHUB_SHA}.`);
  }

  fs.rmSync(foundationRoot, { recursive: true, force: true });
  sync('git', ['worktree', 'prune']);
  sync('git', ['worktree', 'add', '--detach', foundationRoot, sourceSha]);

  [coreExit, foundationExit] = await Promise.all([
    run('p5-core', npm, ['run', 'qa:p5:ci'], ROOT),
    runFoundation(),
  ]);

  evidenceCopied = copyFoundationEvidence();
} catch (error) {
  console.error('[P5-PARALLEL] orchestration error:', error?.stack || error);
} finally {
  try {
    if (fs.existsSync(foundationRoot)) sync('git', ['worktree', 'remove', '--force', foundationRoot]);
    sync('git', ['worktree', 'prune']);
  } catch (cleanupError) {
    console.error('[P5-PARALLEL] cleanup error:', cleanupError?.stack || cleanupError);
    if (coreExit === 0 && foundationExit === 0) foundationExit = 126;
  }
}

fs.mkdirSync(path.join(ROOT, 'qa-results'), { recursive: true });
const summary = {
  schema: 'ghrab-p5-parallel-orchestration-v1',
  sourceSha,
  isolation: 'detached-git-worktree',
  core: { command: 'npm run qa:p5:ci', exit: coreExit, pass: coreExit === 0 },
  foundation: { command: 'npm run qa:garp27:foundation', exit: foundationExit, pass: foundationExit === 0 },
  foundationEvidenceCopied: evidenceCopied,
  status: coreExit === 0 && foundationExit === 0 && evidenceCopied ? 'PASS' : 'FAIL',
};
fs.writeFileSync(path.join(ROOT, 'qa-results', 'p5-parallel-orchestration.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));

if (summary.status !== 'PASS') process.exit(1);
