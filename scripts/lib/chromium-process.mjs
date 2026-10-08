import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readdirSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

function playwrightCandidates(){
  const roots=[
    process.env.PLAYWRIGHT_BROWSERS_PATH&&process.env.PLAYWRIGHT_BROWSERS_PATH!=='0'
      ?process.env.PLAYWRIGHT_BROWSERS_PATH
      :null,
    path.join(os.homedir(),'.cache','ms-playwright'),
    process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'ms-playwright'):null
  ].filter(Boolean);
  const relativePaths=[
    'chrome-win/chrome.exe',
    'chrome-win64/chrome.exe',
    'chrome-linux/chrome',
    'chrome-linux64/chrome',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
    'chrome-headless-shell-win64/chrome-headless-shell.exe',
    'chrome-headless-shell-linux64/chrome-headless-shell',
    'chrome-headless-shell-mac-arm64/chrome-headless-shell'
  ];
  const candidates=[];
  for(const root of roots){
    if(!existsSync(root))continue;
    let versions=[];
    try{versions=readdirSync(root).sort().reverse()}catch{continue}
    for(const version of versions){
      for(const relativePath of relativePaths)candidates.push(path.join(root,version,relativePath));
    }
  }
  return candidates;
}

export function findChromiumExecutable(){
  const programFiles=process.env.ProgramFiles;
  const programFilesX86=process.env['ProgramFiles(x86)'];
  const localAppData=process.env.LOCALAPPDATA;
  const candidates=[
    process.env.CHROMIUM_PATH,
    process.env.CHROME_PATH,
    programFiles&&path.join(programFiles,'Google','Chrome','Application','chrome.exe'),
    programFilesX86&&path.join(programFilesX86,'Google','Chrome','Application','chrome.exe'),
    localAppData&&path.join(localAppData,'Google','Chrome','Application','chrome.exe'),
    programFiles&&path.join(programFiles,'Microsoft','Edge','Application','msedge.exe'),
    programFilesX86&&path.join(programFilesX86,'Microsoft','Edge','Application','msedge.exe'),
    localAppData&&path.join(localAppData,'Microsoft','Edge','Application','msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/lib/chromium/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    ...playwrightCandidates()
  ].filter(Boolean);
  const executable=candidates.find(candidate=>existsSync(candidate));
  if(executable)return executable;
  throw new Error('Chromium není dostupné. Nastavte CHROMIUM_PATH/CHROME_PATH nebo nainstalujte Chrome, Edge či Chromium.');
}

export function createChromiumProfile(prefix='ghrab-chromium'){
  const safe=String(prefix).replace(/[^a-z0-9_.-]+/gi,'-');
  return mkdtempSync(path.join(os.tmpdir(),`${safe}-${process.pid}-`));
}

export function spawnChromium(executable,args,options={}){
  return spawn(executable,args,{
    ...options,
    detached:process.platform!=='win32',
    windowsHide:true
  });
}

function hasExited(child){
  return !child||child.exitCode!==null||child.signalCode!==null;
}

async function waitForExit(child,timeoutMs){
  if(hasExited(child))return;
  await Promise.race([
    new Promise(resolve=>child.once('exit',resolve)),
    sleep(timeoutMs)
  ]);
}

export async function stopChromium(child,{graceMs=1500}={}){
  if(hasExited(child))return;
  if(process.platform==='win32'){
    spawnSync('taskkill.exe',['/pid',String(child.pid),'/t','/f'],{
      stdio:'ignore',
      windowsHide:true
    });
    await waitForExit(child,graceMs);
    if(!hasExited(child)){try{child.kill('SIGKILL')}catch{}}
  }else{
    try{process.kill(-child.pid,'SIGTERM')}catch{try{child.kill('SIGTERM')}catch{}}
    await waitForExit(child,graceMs);
    if(!hasExited(child)){
      try{process.kill(-child.pid,'SIGKILL')}catch{try{child.kill('SIGKILL')}catch{}}
    }
  }
  await waitForExit(child,graceMs);
}

export async function cleanupChromium(child,profile){
  await stopChromium(child);
  if(!profile)return;
  await sleep(300);
  for(let attempt=0;attempt<8;attempt++){
    try{
      rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:150});
      return;
    }catch(error){
      if(attempt===7){
        console.warn(`[chromium] Dočasný profil se nepodařilo odstranit: ${error.message}`);
        return;
      }
      await sleep(200*(attempt+1));
    }
  }
}
