#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
}catch(error){
  console.error(`[PLAYWRIGHT-RUNTIME-PROBE] Chromium is not executable: ${resolvedExecutable}`);
  process.exit(1);
}

let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto('data:text/html,<title>ghrab-playwright-probe</title><main>ok</main>',{waitUntil:'load'});
  const title=await page.title();
  const text=await page.locator('main').textContent();
  if(title!=='ghrab-playwright-probe'||text!=='ok'){
    throw new Error(`unexpected probe page result title=${title} text=${text}`);
  }
  console.log(JSON.stringify({
    schema:'ghrab-playwright-runtime-probe-v1',
    playwrightVersion:packageJson.version,
    executablePath:resolvedExecutable,
    status:'PASS'
  }));
}catch(error){
  console.error('[PLAYWRIGHT-RUNTIME-PROBE] launch failed:',error?.stack||error);
  process.exitCode=1;
}finally{
  if(browser)await browser.close().catch(()=>{});
}
