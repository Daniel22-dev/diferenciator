#!/usr/bin/env node
import {readFileSync,existsSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';

const SCHOOL=process.argv.includes('--school');
const BUILD=resolve(SCHOOL?'dist-school-server':(process.env.BUILD_DIR||'dist'));
if(!existsSync(join(BUILD,'index.html')))throw new Error('Chybí build '+BUILD);

function chromiumPath(){for(const p of [process.env.CHROMIUM_PATH,'/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean))if(existsSync(p))return p;throw new Error('Chromium není dostupné')}
async function waitJson(url){for(let i=0;i<150;i++){try{const r=await fetch(url);if(r.ok)return r.json()}catch{}await sleep(50)}throw new Error('Chromium debug timeout')}
function inlineHtml(){
  const runtime=readFileSync(join(BUILD,'runtime-config.js'),'utf8').replace(/<\/script/gi,'<\\/script');
  const platform=readFileSync(join(BUILD,'ghrab','ghrab-platform.js'),'utf8')
    .replace(/const scriptUrl = scriptElement && scriptElement\.src \? new URL\(scriptElement\.src, location\.href\) : new URL\('\.\/ghrab\/ghrab-platform\.js', location\.href\);/,"const scriptUrl = new URL('https://qa.invalid/ghrab/ghrab-platform.js');")
    .replace(/<\/script/gi,'<\\/script');
  return readFileSync(join(BUILD,'index.html'),'utf8')
    .replace('data-ghrab-access="checking"','data-ghrab-access="granted"')
    .replace(/<script[^>]*src="\.\/runtime-config\.js"[^>]*><\/script>/i,()=>`<script data-ghrab-runtime-config>${runtime}<\/script>`)
    .replace(/<script[^>]*src="\.\/ghrab\/ghrab-platform\.js"[^>]*><\/script>/i,()=>`<script data-ghrab-platform-loader>${platform}<\/script>`)
    .replace('type="application/ghrab-protected" data-ghrab-protected','type="text/javascript" data-ghrab-test-executable')
    .replace(/<script type="module" data-ghrab-access-bootstrap>[\s\S]*?<\/script>/,'');
}
class Cdp{
  constructor(url){this.ws=new WebSocket(url);this.seq=0;this.pending=new Map();this.ready=new Promise((r,j)=>{this.ws.onopen=r;this.ws.onerror=j});this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&this.pending.has(m.id)){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}}}
  async call(method,params={}){await this.ready;return new Promise((resolve,reject)=>{const id=++this.seq;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
  async eval(expression){const r=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value}
  close(){try{this.ws.close()}catch{}}
}

const port=11200+(process.pid%300),profile=`/tmp/dpl-scan-${process.pid}`;
const chrome=spawn(chromiumPath(),['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',detached:true});
let c;
try{
  await waitJson(`http://127.0.0.1:${port}/json/version`);
  const pages=await waitJson(`http://127.0.0.1:${port}/json`);
  c=new Cdp(pages.find(x=>x.type==='page').webSocketDebuggerUrl);
  await c.call('Runtime.enable');await c.call('Page.enable');
  const tree=await c.call('Page.getFrameTree');
  await c.call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html:inlineHtml()});
  let ready=false;
  for(let i=0;i<180;i++){ready=await c.eval(`typeof enhanceVisualForAnalysis==='function'&&typeof rotateVisualAsset==='function'&&typeof appendSupplementalVisualFiles==='function'&&typeof extractionMediaParts==='function'&&typeof handleFiles==='function'`);if(ready)break;await sleep(50)}
  if(!ready)throw new Error('Scan pipeline se nespustila');

  const result=await c.eval(`(async()=>{
    document.querySelectorAll('.overlay.show').forEach(e=>e.classList.remove('show'));
    const makeImage=async(name,w,h,lowContrast)=>{
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');
      x.fillStyle=lowContrast?'rgb(205,205,205)':'white';x.fillRect(0,0,w,h);
      x.fillStyle=lowContrast?'rgb(185,185,185)':'black';x.font=Math.max(24,Math.round(w/24))+'px sans-serif';
      for(let y=80;y<h;y+=90)x.fillText('SCAN TEST 123 H2SO4 3/4',50,y);
      const blob=await new Promise(r=>cv.toBlob(r,'image/png'));return new File([blob],name,{type:'image/png'});
    };
    const photo=await makeImage('scan-page-1.png',1200,800,true);
    const map=await makeImage('map-crop.png',900,650,false);
    const pdf=new File([new TextEncoder().encode('%PDF-1.4\\n% test\\n%%EOF')],'scan.pdf',{type:'application/pdf'});
    await handleFiles([pdf,photo]);
    const mixedUpload=uploaded?.kind==='media'&&uploaded.items.some(i=>i.mime_type==='application/pdf')&&uploaded.items.some(i=>/^image\\//.test(i.mime_type))&&sourceVisualAssets.length===1;
    await new Promise(r=>setTimeout(r,80));
    const qualityWarn=sourceVisualAssets[0]?.quality?.warnings?.includes('nízký kontrast')||false;
    const originalBefore=sourceVisualAssets[0].data;
    const enhanceBtn=[...document.querySelectorAll('[data-visual-id="VISUAL_1"] button')].find(b=>/Vylepšit čitelnost/.test(b.textContent));enhanceBtn?.click();
    for(let i=0;i<80&&!sourceVisualAssets[0].analysis_data;i++)await new Promise(r=>setTimeout(r,25));
    const enhanced=!!sourceVisualAssets[0].analysis_data&&sourceVisualAssets[0].data===originalBefore&&sourceVisualAssets[0].analysis_mime_type==='image/jpeg';
    const enhancedPayload=extractionMediaParts(uploaded).find(p=>p.inline_data&&p.inline_data.mime_type==='image/jpeg')?.inline_data?.data||'';
    const extractionUsesEnhanced=enhancedPayload===sourceVisualAssets[0].analysis_data;
    const rotateBtn=[...document.querySelectorAll('[data-visual-id="VISUAL_1"] button')].find(b=>/↻/.test(b.textContent));rotateBtn?.click();
    for(let i=0;i<80&&sourceVisualAssets[0].width!==800;i++)await new Promise(r=>setTimeout(r,25));
    const rotated=sourceVisualAssets[0].width===800&&sourceVisualAssets[0].height===1200&&!sourceVisualAssets[0].analysis_data;
    const parsed=splitVisualManifest(['Přepis','<<<VISUAL_MANIFEST>>>','VISUAL_1|role=page_scan|type=other|description=fotografie celé stránky','PDF_VISUAL|page=2|role=critical|type=map|description=slepá mapa','SCAN_REPORT|status=fair|pages=2|issues=stín v pravém dolním rohu','<<<END_VISUAL_MANIFEST>>>'].join(String.fromCharCode(10)));
    applyVisualManifest(parsed.entries,parsed.documentEntries,parsed.scanReports);
    const scanReportOk=sourceScanReport?.status==='fair'&&sourceScanReport.pages===2&&/stín/.test(sourceScanReport.issues)&&sourceDocumentVisualNotes[0]?.page==='2';
    const panelText=document.querySelector('#visualSourcePanel')?.textContent||'';
    const reportVisible=/Čitelnost zdroje/.test(panelText)&&/stín/.test(panelText)&&/Přidat snímek/.test(panelText);
    await appendSupplementalVisualFiles([map]);
    const supplement=sourceVisualAssets[sourceVisualAssets.length-1];
    const supplementOk=!!supplement&&supplement.mode==='preserve'&&supplement.role==='critical';
    const firstId=sourceVisualAssets[0].id,lastId=sourceVisualAssets[sourceVisualAssets.length-1].id;
    moveVisualAsset(lastId,-1);
    const reorderOk=sourceVisualAssets[0].id===lastId&&sourceVisualAssets[1].id===firstId;
    const media=extractionMediaParts(uploaded),pdfPartOk=media.some(p=>p.inline_data?.mime_type==='application/pdf'),imageParts=media.filter(p=>p.inline_data&&/^image\\//.test(p.inline_data.mime_type)).length;
    const fig=makeVisualFigure(supplement,false),preservedOriginal=fig?.querySelector('img')?.src===visualDataUrl(supplement);
    const supplementButtonVisible=!document.querySelector('#visualSupplementBtn')?.classList.contains('hide');
    return {mode:window.__GHRAB_RUNTIME_CONFIG__?.ai?.defaultMode||'',mixedUpload,qualityWarn,enhanced,extractionUsesEnhanced,rotated,scanReportOk,reportVisible,supplementOk,supplementDetails:supplement?{mode:supplement.mode,role:supplement.role,source:supplement.source}:null,reorderOk,pdfPartOk,imageParts,preservedOriginal,supplementButtonVisible,sourceCount:sourceVisualAssets.length};
  })()`);

  const ok=result.mixedUpload&&result.qualityWarn&&result.enhanced&&result.extractionUsesEnhanced&&result.rotated&&result.scanReportOk&&result.reportVisible&&result.supplementOk&&result.reorderOk&&result.pdfPartOk&&result.imageParts>=2&&result.preservedOriginal&&result.supplementButtonVisible&&result.sourceCount===2;
  console.log(JSON.stringify({schema:'ghrab-differentiator-scan-browser-v1',build:BUILD.split('/').pop(),result,status:ok?'passed':'failed'},null,2));
  if(!ok)process.exitCode=1;
}finally{
  c?.close();
  if(chrome.exitCode===null){try{process.kill(-chrome.pid,'SIGTERM')}catch{}}
  await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(1000)]);
  if(chrome.exitCode===null){try{process.kill(-chrome.pid,'SIGKILL')}catch{}}
  rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:50});
}
