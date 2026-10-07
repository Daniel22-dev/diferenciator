#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const EXPECTED_PLAYWRIGHT_VERSION='1.61.1';
const packageJson=JSON.parse(fs.readFileSync(new URL('../node_modules/playwright/package.json',import.meta.url),'utf8'));
if(packageJson.version!==EXPECTED_PLAYWRIGHT_VERSION){
  console.error(`[PLAYWRIGHT-RUNTIME-PROBE] unexpected Playwright version ${packageJson.version}; expected ${EXPECTED_PLAYWRIGHT_VERSION}`);
  process.exit(1);
}

const executablePath=chromium.executablePath();
const expectedRoot=path.resolve(os.homedir(),'.cache','ms-playwright')+path.sep;
const resolvedExecutable=path.resolve(executablePath);
if(!resolvedExecutable.startsWith(expectedRoot)){
  console.error(`[PLAYWRIGHT-RUNTIME-PROBE] unexpected Chromium path: ${resolvedExecutable}`);
  process.exit(1);
}

try{
  fs.accessSync(resolvedExecutable,fs.constants.X_OK);
}catch{
  console.error(`[PLAYWRIGHT-RUNTIME-PROBE] Chromium is not executable: ${resolvedExecutable}`);
  process.exit(1);
}

const marker='ghrab-playwright-runtime-probe';
const result=spawnSync(resolvedExecutable,[
  '--headless=new',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-component-update',
  '--no-first-run',
  '--no-default-browser-check',
  '--dump-dom',
  `data:text/html,<main>${marker}</main>`
],{
  encoding:'utf8',
  timeout:15000,
  env:process.env,
  maxBuffer:1024*1024
});

if(result.error){
  console.error('[PLAYWRIGHT-RUNTIME-PROBE] Chromium process error:',result.error.message);
  process.exit(1);
}
if(result.status!==0){
  console.error(`[PLAYWRIGHT-RUNTIME-PROBE] Chromium exited with ${result.status}`);
  if(result.stderr)console.error(result.stderr.slice(-4000));
  process.exit(1);
}
if(!(result.stdout||'').includes(marker)){
  console.error('[PLAYWRIGHT-RUNTIME-PROBE] Chromium started but did not render the deterministic probe page.');
  process.exit(1);
}

console.log(JSON.stringify({
  schema:'ghrab-playwright-runtime-probe-v1',
  playwrightVersion:packageJson.version,
  executablePath:resolvedExecutable,
  launchMode:'exact-executable-headless-new',
  status:'PASS'
}));
