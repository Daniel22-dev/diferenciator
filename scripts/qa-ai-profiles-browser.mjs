#!/usr/bin/env node
import {readFileSync,existsSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';

const ROOT=resolve('.'),BUILD=resolve(process.argv.includes('--school')?'dist-school-server':(process.env.BUILD_DIR||'dist'));
if(!existsSync(join(BUILD,'index.html')))throw new Error(`Chybí ${BUILD}/index.html`);
function chromiumPath(){for(const p of [process.env.CHROMIUM_PATH,'/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean))if(existsSync(p))return p;throw new Error('Chromium není dostupné');}
async function waitJson(url){for(let i=0;i<150;i++){try{const r=await fetch(url);if(r.ok)return r.json()}catch{}await sleep(50)}throw new Error('Chromium debug timeout')}
function inlineHtml(){
  const runtime=readFileSync(join(BUILD,'runtime-config.js'),'utf8').replace(/<\/script/gi,'<\\/script');
  const platform=readFileSync(join(BUILD,'ghrab','ghrab-platform.js'),'utf8')
    .replace(/const scriptUrl = scriptElement && scriptElement\.src \? new URL\(scriptElement\.src, location\.href\) : new URL\('\.\/ghrab\/ghrab-platform\.js', location\.href\);/,"const scriptUrl = new URL('https://qa.invalid/ghrab/ghrab-platform.js');")
    .replace(/<\/script/gi,'<\\/script');
  return readFileSync(join(BUILD,'index.html'),'utf8').replace('data-ghrab-access="checking"','data-ghrab-access="granted"')
    .replace(/<script[^>]*src="\.\/runtime-config\.js"[^>]*><\/script>/i,()=>`<script data-ghrab-runtime-config>${runtime}<\/script>`)
    .replace(/<script[^>]*src="\.\/ghrab\/ghrab-platform\.js"[^>]*><\/script>/i,()=>`<script data-ghrab-platform-loader>${platform}<\/script>`)
    .replace('type="application/ghrab-protected" data-ghrab-protected','type="text/javascript" data-ghrab-test-executable')
    .replace(/<script type="module" data-ghrab-access-bootstrap>[\s\S]*?<\/script>/,'');
}
class Cdp{constructor(url){this.ws=new WebSocket(url);this.seq=0;this.pending=new Map();this.ready=new Promise((r,j)=>{this.ws.onopen=r;this.ws.onerror=j});this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&this.pending.has(m.id)){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}}}async call(method,params={}){await this.ready;return new Promise((resolve,reject)=>{const id=++this.seq;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}async eval(expression){const r=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value}close(){try{this.ws.close()}catch{}}}
async function click(client,selector){await client.eval(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center',inline:'center'})`);await sleep(50);const box=await client.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}})()`);if(!box||box.w<1||box.h<1)throw new Error(`Prvek není klikatelný: ${selector}`);await client.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x,y:box.y});await client.call('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1});await client.call('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1});await sleep(40)}
const port=10100+(process.pid%400),profile=`/tmp/dpl-profile-browser-${process.pid}`,chrome=spawn(chromiumPath(),['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',detached:true});let client;
try{
  await waitJson(`http://127.0.0.1:${port}/json/version`);const pages=await waitJson(`http://127.0.0.1:${port}/json`);client=new Cdp(pages.find(x=>x.type==='page').webSocketDebuggerUrl);await client.call('Runtime.enable');await client.call('Page.enable');const tree=await client.call('Page.getFrameTree');await client.call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html:inlineHtml()});
  let ready=false;for(let i=0;i<160;i++){ready=await client.eval(`typeof setModelProfile==='function'&&typeof callGemini==='function'&&!!window.GHRAB_AI&&!!document.querySelector('[data-model-profile="quality"]')`);if(ready)break;await sleep(50)}if(!ready)throw new Error('Profilové UI se nespustilo');
  await client.eval(`document.querySelectorAll('.overlay.show').forEach(e=>e.classList.remove('show'));window.__profileTrusted=[];document.querySelectorAll('[data-model-profile]').forEach(b=>b.addEventListener('click',e=>window.__profileTrusted.push({profile:b.dataset.modelProfile,trusted:e.isTrusted})));`);
  const mode=await client.eval(`window.__GHRAB_RUNTIME_CONFIG__.ai.defaultMode`);
  await client.eval(`document.querySelector('#apiPanel')?.classList.add('open')`);
  const directHidden=await client.eval(`document.querySelector('#directGeminiSettings')?.hidden===true`);
  const setup=mode==='school-gateway'
    ? `dplEnsureAiCore();window.__profileSeen=[];GHRAB_AI.__testing.setTestHooks({isEnabled:()=>true,schoolGateway:async p=>{window.__profileSeen.push(p.modelProfile);return {schema:GHRAB_AI.responseSchema,requestId:'qa',clientRequestId:p.clientRequestId,result:JSON.parse(TestSystem.sampleStructured()),usage:{providerRequests:1,retryRequests:0,generatedOutputs:1},meta:{latencyMs:0}}}});`
    : `geminiApiKey='qa-test-key';dplEnsureAiCore();window.__profileSeen=[];GHRAB_AI.__testing.setTestHooks({isEnabled:()=>true,directGemini:async ({modelProfile})=>{window.__profileSeen.push(modelProfile);return JSON.parse(TestSystem.sampleStructured())}});`;
  await client.eval(setup);
  const results=[];for(const p of ['economy','balanced','quality']){await click(client,`[data-model-profile="${p}"]`);const state=await client.eval(`({selected:selectedModelProfile,pressed:document.querySelector('[data-model-profile="${p}"]').getAttribute('aria-pressed'),status:document.querySelector('#statusModel .v')?.textContent||''})`);await client.eval(`callGemini([{text:'Profil QA'}],{json:true,operation:'worksheet-generation'})`);results.push({profile:p,...state})}
  const trusted=await client.eval('window.__profileTrusted');const seen=await client.eval('window.__profileSeen');
  const ok=results.every(x=>x.selected===x.profile&&x.pressed==='true')&&trusted.length===3&&trusted.every(x=>x.trusted)&&seen.join(',')==='economy,balanced,quality'&&(mode!=='school-gateway'||directHidden);
  const report={schema:'ghrab-ai-profile-browser-v1',build:BUILD.split('/').pop(),mode,results,trusted,seen,directSettingsHidden:directHidden,status:ok?'passed':'failed'};console.log(JSON.stringify(report,null,2));if(!ok)process.exitCode=1;
}finally{client?.close();if(chrome.exitCode===null){try{process.kill(-chrome.pid,'SIGTERM')}catch{}}await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(1000)]);if(chrome.exitCode===null){try{process.kill(-chrome.pid,'SIGKILL')}catch{}}rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:50})}
